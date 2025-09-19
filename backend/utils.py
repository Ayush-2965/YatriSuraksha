from pyaadhaar.decode import AadhaarSecureQr, AadhaarOldQr
from pyaadhaar.utils import Qr_img_to_text, isSecureQr
import traceback  # For better error reporting
from typing import Dict, Any, List, Optional
import cv2
from PIL import Image
import os
import logging
import zlib
import io
import base64
import numpy as np

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def scan_qr_from_image(image_path: str) -> List[str]:
    """
    Scan QR codes from an image using multiple methods as fallback
    """
    qr_strings = []
    
    # Try PyAadhaar's Qr_img_to_text first
    try:
        print(f"Attempting to scan QR code from image: {image_path}")
        # Check if file exists
        if not os.path.exists(image_path):
            raise ValueError(f"Image file not found: {image_path}")
            
        # Try to open with PIL first to validate image
        try:
            with Image.open(image_path) as img:
                img.verify()
        except Exception as e:
            print(f"Invalid image file: {str(e)}")
            raise ValueError("Invalid image file")
            
        qr_strings = Qr_img_to_text(image_path)
        if qr_strings:
            print(f"Successfully found {len(qr_strings)} QR codes using PyAadhaar")
            return qr_strings
    except Exception as e:
        print(f"PyAadhaar QR scanning failed: {str(e)}")

    # Fallback to OpenCV QR detection
    try:
        print("Trying OpenCV QR detection as fallback")
        # Read image with OpenCV
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError("Could not read image with OpenCV")

        # Try to improve image quality
        img = cv2.resize(img, None, fx=2, fy=2)  # Double the size
        img = cv2.GaussianBlur(img, (5,5), 0)    # Slight blur to reduce noise

        # Initialize QR Code detector
        qr_detector = cv2.QRCodeDetector()
        
        # Detect and decode QR code
        data, bbox, straight_qrcode = qr_detector.detectAndDecode(img)
        if data:
            print("Successfully detected QR code with OpenCV")
            qr_strings.append(data)
        else:
            print("OpenCV could not detect any QR code")
    except Exception as e:
        print(f"OpenCV QR scanning failed: {str(e)}")

    if not qr_strings:
        print("Warning: No QR codes could be detected in the image")
    return qr_strings

def _init_decoder_with_fallback(decoder_cls, qr_str: str):
    """Try initializing decoder with multiple encodings.

    Order:
    1) Pass the raw string
    2) Encode latin-1 (preserves code points 0-255)
    3) Encode utf-8
    4) Base64-decode (strict) then pass bytes
    """
    errors = []
    # Prefer bytes-based initializations first
    # 1) latin-1 bytes
    try:
        return decoder_cls(qr_str.encode("latin-1", errors="strict"))
    except Exception as e1:
        errors.append(e1)
    # 2) utf-8 bytes
    try:
        return decoder_cls(qr_str.encode("utf-8", errors="strict"))
    except Exception as e2:
        errors.append(e2)
    # 3) base64 -> bytes
    try:
        import base64
        b = base64.b64decode(qr_str, validate=True)
        return decoder_cls(b)
    except Exception as e3:
        errors.append(e3)
    # 4) Raw string last
    try:
        return decoder_cls(qr_str)
    except Exception as e4:
        errors.append(e4)
    # If all failed, raise the first error for clarity
    raise errors[0]

def _decode_with_cls(decoder_cls, qr_str: str):
    """Initialize decoder with preferred encodings and run decodeddata with a retry on str->bytes issues."""
    # Try bytes-first init
    last_err = None
    # Candidates to try for init
    candidates = []
    try:
        candidates.append(qr_str.encode("latin-1", errors="strict"))
    except Exception:
        pass
    try:
        candidates.append(qr_str.encode("utf-8", errors="strict"))
    except Exception:
        pass
    try:
        import base64
        candidates.append(base64.b64decode(qr_str, validate=True))
    except Exception:
        pass
    # Append raw string as last resort
    candidates.append(qr_str)

    for cand in candidates:
        try:
            obj = decoder_cls(cand)
            try:
                data = obj.decodeddata()
                if data:
                    return obj, data
            except Exception as e:
                # If object constructed with str and decodeddata expects bytes internally
                # retry by ensuring bytes cand if cand was str
                if isinstance(cand, str):
                    try:
                        obj2 = decoder_cls(cand.encode("latin-1", errors="strict"))
                        data = obj2.decodeddata()
                        if data:
                            return obj2, data
                    except Exception as e2:
                        last_err = e2
                        continue
                last_err = e
        except Exception as e:
            last_err = e
            continue
    if last_err:
        raise last_err
    raise ValueError("Decoder failed with all candidate encodings")

def decode_qr_string(qr_string: str) -> Dict[str, Any]:
    """
    Decode an Aadhaar QR code string and return the data.
    """
    if not qr_string or not isinstance(qr_string, str):
        print("Error: Invalid QR code data type")
        raise ValueError("Invalid QR code data")

    try:
        # Clean the QR string (remove any whitespace/newlines)
        qr_string = qr_string.strip()
        print(f"Processing QR string of length: {len(qr_string)}")

        # Decide by isSecureQr (numeric -> secure)
        if isSecureQr(qr_string):
            print("Trying Secure QR format...")
            try:
                base10 = int(qr_string)
                qr_obj = AadhaarSecureQr(base10)
                data = qr_obj.decodeddata()
                response = {
                    "qr_type": "secure",
                    "data": data,
                    "has_image": False,
                }
                try:
                    response["has_image"] = bool(qr_obj.isImage())
                except Exception:
                    pass
                # Try to attach image regardless of has_image flag; some versions don't expose it reliably
                try:
                    img_b64, img_mime = _try_get_secure_image(qr_obj)
                    if not img_b64:
                        # Fallback: attempt extraction from decompressed raw (JPEG2000 codestream)
                        raw_text_for_img = _decompress_base10_secure_qr(qr_string)
                        rb = raw_text_for_img.encode('latin-1', errors='ignore')
                        start = rb.find(b'\xff\x4f')
                        end = rb.rfind(b'\xff\xd9')
                        if start != -1 and end != -1 and end > start:
                            img_bytes = rb[start:end+2]
                            img_b64 = base64.b64encode(img_bytes).decode('ascii')
                            img_mime = 'image/jp2'
                    if img_b64:
                        response['has_image'] = True
                        response['image_base64'] = img_b64
                        response['image_format'] = img_mime or 'image/jp2'
                        # legacy key for frontend compatibility
                        if response['image_format'] == 'image/jp2':
                            response['image_jpeg2000_base64'] = img_b64
                except Exception as _img_err:
                    print(f"[SECURE-IMG] attach failed: {_img_err}")
                print("Successfully decoded as Secure QR")
                return response
            except Exception as secure_err:
                print(f"Secure QR decode failed: {secure_err}")
                # Attempt raw decompress for newer secure QR formats
                try:
                    raw_text = _decompress_base10_secure_qr(qr_string)
                    parsed = _parse_secure_raw_text(raw_text)
                    print("Returning raw decompressed secure QR text with best-effort parsed fields")
                    return {
                        "qr_type": "secure",
                        "data_raw": raw_text,
                        "data_parsed": parsed,
                        "note": "Secure QR parsed via fallback; fields are best-effort and may be incomplete.",
                    }
                except Exception as decompress_err:
                    print(f"Secure QR raw decompress failed: {decompress_err}")
                # Fallback attempt: try Old
                print("Falling back to Old QR format...")
                try:
                    qr_obj = AadhaarOldQr(qr_string)
                    data = qr_obj.decodeddata()
                    response = {"qr_type": "old", "data": data}
                    print("Successfully decoded as Old QR (fallback)")
                    return response
                except Exception as old_err:
                    print(f"Old QR decode (fallback) failed: {old_err}")
        else:
            print("Trying Old QR format...")
            try:
                qr_obj = AadhaarOldQr(qr_string)
                data = qr_obj.decodeddata()
                response = {"qr_type": "old", "data": data}
                print("Successfully decoded as Old QR")
                return response
            except Exception as old_err:
                print(f"Old QR decode failed: {old_err}")
                # Fallback: try Secure if numeric-like failure conditions change
                try:
                    base10 = int(qr_string)
                    qr_obj = AadhaarSecureQr(base10)
                    data = qr_obj.decodeddata()
                    response = {"qr_type": "secure", "data": data}
                    print("Successfully decoded as Secure QR (fallback)")
                    return response
                except Exception as secure_err:
                    print(f"Secure QR decode (fallback) failed: {secure_err}")

        # If all formats fail
        print("All decode attempts failed")
        raise ValueError("Could not decode QR code in any format (secure/old)")
        
    except Exception as e:
        print(f"Failed to decode QR: {str(e)}")
        print("Full traceback:")
        print(traceback.format_exc())
        raise ValueError(f"Failed to decode QR: {str(e)}")

def verify_email(qr_string: str, email: str) -> bool:
    """
    Verify if the given email matches the QR data.
    """
    try:
        # Decode first to determine type
        response = decode_qr_string(qr_string)
        if response.get("qr_type") == "secure" and "data" in response:
            qr_obj = AadhaarSecureQr(int(qr_string))
            return bool(qr_obj.verifyEmail(email))
        return False
    except Exception as e:
        print(f"verify_email error: {e}")
        return False

def verify_mobile(qr_string: str, mobile: int) -> bool:
    """
    Verify if the given mobile number matches the QR data.
    """
    try:
        response = decode_qr_string(qr_string)
        if response.get("qr_type") == "secure" and "data" in response:
            qr_obj = AadhaarSecureQr(int(qr_string))
            return bool(qr_obj.verifyMobileNumber(mobile))
        return False
    except Exception as e:
        print(f"verify_mobile error: {e}")
        return False

def check_email_registered(qr_string: str, email: str) -> bool:
    """
    Check if the email is registered in the Aadhaar data.
    """
    try:
        response = decode_qr_string(qr_string)
        if response.get("qr_type") == "secure" and "data" in response:
            qr_obj = AadhaarSecureQr(int(qr_string))
            return bool(qr_obj.isEmailRegistered(email))
        return False
    except Exception as e:
        print(f"check_email_registered error: {e}")
        return False

def check_mobile_registered(qr_string: str, mobile: int) -> bool:
    """
    Check if the mobile number is registered in the Aadhaar data.
    """
    try:
        response = decode_qr_string(qr_string)
        if response.get("qr_type") == "secure" and "data" in response:
            qr_obj = AadhaarSecureQr(int(qr_string))
            return bool(qr_obj.isMobileNoRegistered(mobile))
        return False
    except Exception as e:
        print(f"check_mobile_registered error: {e}")
        return False


def _decompress_base10_secure_qr(qr_string: str) -> str:
    """Convert base10-encoded secure QR string to raw decompressed text for newer formats.

    Mirrors the library's approach: cast to int, convert to minimal big-endian bytes, zlib-decompress,
    then decode to text.
    """
    s = qr_string.strip()
    if not s.isdigit():
        raise ValueError("Secure QR string must be numeric")
    n = int(s)
    if n <= 0:
        raise ValueError("Invalid base10 value")
    b_big = n.to_bytes((n.bit_length() + 7) // 8, 'big')
    b_lit = n.to_bytes((n.bit_length() + 7) // 8, 'little')

    candidates: List[bytes] = []
    # Start with big-endian minimal
    candidates.append(b_big)
    # Add a few zero-padded versions (1..4 bytes) at the front (common in some encodings)
    for pad in range(1, 5):
        candidates.append(b"\x00" * pad + b_big)
    # Little-endian minimal
    candidates.append(b_lit)
    # Little-endian with front padding (though less likely)
    for pad in range(1, 3):
        candidates.append(b"\x00" * pad + b_lit)

    def try_decompress(data: bytes) -> Optional[bytes]:
        # Try zlib with header
        try:
            return zlib.decompress(data)
        except zlib.error:
            pass
        # Try raw DEFLATE
        try:
            return zlib.decompress(data, wbits=-15)
        except zlib.error:
            pass
        # Try gzip
        try:
            import gzip
            return gzip.decompress(data)
        except Exception:
            pass
        return None

    raw: Optional[bytes] = None
    for cand in candidates:
        raw = try_decompress(cand)
        if raw is not None:
            break
    if raw is None:
        # Could not decompress with known strategies
        raise zlib.error("secure QR decompress failed with known strategies (zlib, raw, gzip)")
    # Try a few decodings
    for enc in ("utf-8", "utf-16", "latin-1", "ascii"):
        try:
            return raw.decode(enc)
        except Exception:
            continue
    # As last resort, return Latin-1 which preserves bytes
    return raw.decode("latin-1", errors="replace")


def _parse_secure_raw_text(raw_text: str) -> Dict[str, Any]:
    """Best-effort parser for secure QR raw Latin-1 text.

    Heuristics:
    - Split by 0xFF (ÿ), stop before obvious binary/image marker (e.g., 'Created by: JJ2000').
    - Clean control characters; keep printable.
    - Map common fields: version, reference_id, name, dob, gender, masked_mobile, pincode, state, address.
    """
    import re

    # Split by 0xFF delimiter (UIDAI secure QR often uses 0xFF as field separator)
    parts = raw_text.split('ÿ')
    cleaned: List[str] = []
    for p in parts:
        # Skip obvious image/binary markers but do not stop entirely; later fields may still appear
        if 'Created by: JJ2000' in p:
            continue
        # Remove non-printable controls (except basic whitespace)
        cp = ''.join(ch for ch in p if ch.isprintable())
        cp = cp.replace('\u0000', '').strip()
        if cp:
            cleaned.append(cp)

    data: Dict[str, Any] = {}
    if not cleaned:
        return data

    # Basic positions if present
    def get(i: int) -> Optional[str]:
        return cleaned[i] if i < len(cleaned) else None

    # Version
    v = get(0)
    if v and v.upper().startswith('V'):
        data['version'] = v

    # Type code or format code (often numeric)
    t = get(1)
    if t and t.isdigit():
        data['type'] = t

    # Reference ID (long digits)
    ref = get(2)
    if ref and re.fullmatch(r'\d{10,}', ref):
        data['reference_id'] = ref

    # Name, DOB, Gender
    name = get(3)
    if name:
        data['name'] = name
    dob = get(4)
    if dob and re.fullmatch(r'\d{2}-\d{2}-\d{4}', dob):
        data['dob'] = dob
    gender = get(5)
    if gender and gender.upper() in {'M','F','T'}:
        data['gender'] = gender.upper()

    # Find masked mobile (e.g., XXXXXX1234)
    masked_mobile = next((p for p in cleaned if re.fullmatch(r'X{2,}\d{2,}', p)), None)
    if masked_mobile:
        data['mobile_masked'] = masked_mobile

    # Pincode (6 digits)
    pincode = next((p for p in cleaned if re.fullmatch(r'\d{6}', p)), None)
    if pincode:
        data['pincode'] = pincode

    # State detection from a list
    states = {
        'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh',
        'Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
        'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
        'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir',
        'Ladakh','Lakshadweep','Puducherry'
    }
    state = next((p for p in cleaned if p in states), None)
    if state:
        data['state'] = state

    # Build address lines:
    # heuristics: take tokens after gender (index 6) up to masked_mobile (if present),
    # exclude known markers (state exactly, pincode exactly), keep order, dedupe consecutive duplicates.
    addr_start = 6
    addr_end = len(cleaned)
    if masked_mobile:
        try:
            addr_end = cleaned.index(masked_mobile)
        except ValueError:
            addr_end = len(cleaned)
    address_tokens_all = [tok for tok in cleaned[addr_start:addr_end] if tok]
    # Remove single-letter stray markers often seen (e.g., 'O', 'Q')
    address_tokens_all = [t for t in address_tokens_all if not (len(t) == 1 and t.isalpha())]
    # Exclude exact state/pincode tokens in the concatenated address (but keep them as separate fields above)
    address_tokens = []
    for t in address_tokens_all:
        if state and t == state:
            continue
        if pincode and t == pincode:
            continue
        if address_tokens and address_tokens[-1] == t:
            continue
        address_tokens.append(t)
    if address_tokens:
        data['address_lines'] = address_tokens
        data['address'] = ', '.join(address_tokens)

    # Derive additional address granularity from the broader token set
    # VTC (city/town with parentheses often present)
    vtc_candidates = [t for t in address_tokens_all if '(' in t and ')' in t]
    if vtc_candidates:
        data['vtc'] = vtc_candidates[-1]

    # District: often immediately before VTC when present
    if 'vtc' in data:
        try:
            idx_vtc = address_tokens_all.index(data['vtc'])
            if idx_vtc > 0:
                cand = address_tokens_all[idx_vtc - 1]
                if cand and cand != data.get('state') and cand != data.get('pincode'):
                    data['district'] = cand
        except ValueError:
            pass

    # Locality/landmark hints
    locality_markers = (
        'HOUSING','MISSION','NAGAR','COLONY','APARTMENT','ENCLAVE','BLOCK','SECTOR','LAYOUT','PHASE','ROAD','STREET','LANE','MARG','BAZAR','CHOWK','MARKET','COMPLEX'
    )
    locality = [t for t in address_tokens_all if any(k in t.upper() for k in locality_markers)]
    if locality:
        # Keep unique order
        seen = set()
        uniq = []
        for t in locality:
            if t not in seen:
                seen.add(t)
                uniq.append(t)
        data['locality_hints'] = uniq

    # Image presence: if JPEG2000 markers present in raw bytes
    try:
        rb = raw_text.encode('latin-1', errors='ignore')
        has_soc = (rb.find(b'\xff\x4f') != -1)  # JPEG2000 SOC
        has_cod = (rb.find(b'\xff\x52') != -1)  # JPEG2000 COD
        if has_soc and has_cod:
            data['has_image'] = True
            # Attempt to extract JPEG2000 codestream and return base64 (optional)
            start = rb.find(b'\xff\x4f')
            end = rb.rfind(b'\xff\xd9')
            if start != -1 and end != -1 and end > start:
                img_bytes = rb[start:end+2]
                import base64
                b64 = base64.b64encode(img_bytes).decode('ascii')
                data['image_jpeg2000_base64'] = b64
                # Also expose a generic key the frontend can use directly
                data['image_base64'] = b64
                data['image_format'] = 'image/jp2'
    except Exception:
        pass

    return data


from typing import Tuple

def _ensure_web_image_base64(img_bytes: bytes, mime_hint: Optional[str] = None) -> Tuple[str, str]:
    """Return (base64, mime) ensuring browser-friendly format if possible.

    If the bytes are JPEG2000 (often not supported by browsers), try converting to PNG
    using Pillow first, then OpenCV as a fallback. If conversion fails, return original
    with provided mime_hint or 'application/octet-stream'.
    """
    # Quick signature check for JPEG2000 codestream or JP2
    is_jp2_like = False
    if img_bytes.startswith(b"\xff\x4f\xff\x51") or b"jP  \r\n\x87\n" in img_bytes[:16]:
        is_jp2_like = True

    if is_jp2_like:
        # Try Pillow conversion
        try:
            bio = io.BytesIO(img_bytes)
            with Image.open(bio) as im:
                # Some JP2 images may be grayscale; ensure a compatible mode
                if im.mode not in ("RGB", "RGBA"):
                    im = im.convert("RGB")
                out = io.BytesIO()
                im.save(out, format="PNG")
                png_b = out.getvalue()
                return base64.b64encode(png_b).decode("ascii"), "image/png"
        except Exception:
            pass
        # Try imagecodecs (if available)
        try:
            import imagecodecs  # type: ignore
            dec = None
            for fn in ("jpeg2k_decode", "jp2k_decode"):
                if hasattr(imagecodecs, fn):
                    try:
                        dec = getattr(imagecodecs, fn)(img_bytes)
                        break
                    except Exception:
                        dec = None
            if dec is not None:
                # Ensure uint8 array for PNG encoding
                arr = np.asarray(dec)
                if arr.dtype != np.uint8:
                    # Normalize/convert if necessary
                    arr = arr.astype(np.uint8)
                ok, enc = cv2.imencode('.png', arr)
                if ok:
                    return base64.b64encode(enc.tobytes()).decode('ascii'), 'image/png'
        except Exception:
            pass
        # Try OpenCV conversion
        try:
            arr = np.frombuffer(img_bytes, dtype=np.uint8)
            img = cv2.imdecode(arr, cv2.IMREAD_UNCHANGED)
            if img is not None:
                ok, enc = cv2.imencode('.png', img)
                if ok:
                    return base64.b64encode(enc.tobytes()).decode('ascii'), 'image/png'
        except Exception:
            pass
        # Could not convert; return original JP2
        return base64.b64encode(img_bytes).decode('ascii'), mime_hint or 'image/jp2'

    # Not JP2-like; return as-is
    return base64.b64encode(img_bytes).decode('ascii'), (mime_hint or 'application/octet-stream')

def _try_get_secure_image(qr_obj) -> Tuple[Optional[str], Optional[str]]:
    """Attempt to read image bytes from AadhaarSecureQr object and return base64 + mime.

    PyAadhaar versions vary; try a few common attribute/method names.
    """
    try:
        # 0) image() may return bytes, PIL Image, or ndarray in some forks
        if hasattr(qr_obj, 'image'):
            try:
                result = qr_obj.image()
                # Bytes-like
                if isinstance(result, (bytes, bytearray)) and len(result) > 16:
                    return _ensure_web_image_base64(bytes(result), None)
                # PIL Image
                if isinstance(result, Image.Image):
                    out = io.BytesIO()
                    result.save(out, format='PNG')
                    return base64.b64encode(out.getvalue()).decode('ascii'), 'image/png'
                # NumPy array (OpenCV-like)
                if isinstance(result, np.ndarray):
                    ok, enc = cv2.imencode('.png', result)
                    if ok:
                        return base64.b64encode(enc.tobytes()).decode('ascii'), 'image/png'
            except Exception:
                pass
        # 1) getImage() -> bytes
        if hasattr(qr_obj, 'getImage'):
            img = qr_obj.getImage()
            if isinstance(img, (bytes, bytearray)) and len(img) > 16:
                return _ensure_web_image_base64(bytes(img), 'image/jp2')
        # 2) photo or image attribute
        for attr in ('photo', 'image', 'img'):
            if hasattr(qr_obj, attr):
                val = getattr(qr_obj, attr)
                if isinstance(val, (bytes, bytearray)) and len(val) > 16:
                    return _ensure_web_image_base64(bytes(val), 'image/jp2')
        # 3) getPhotoBytes()
        if hasattr(qr_obj, 'getPhotoBytes'):
            val = qr_obj.getPhotoBytes()
            if isinstance(val, (bytes, bytearray)) and len(val) > 16:
                return _ensure_web_image_base64(bytes(val), 'image/jp2')
    except Exception:
        pass
    return None, None


def verify_qr(qr_string: str, email: Optional[str] = None, mobile: Optional[int] = None) -> Dict[str, Any]:
    """End-to-end QR verification helper.

    Returns a dict with:
    - ok: overall boolean
    - qr_type: 'secure' | 'old' | 'unknown'
    - checks: { parsed: bool, email_match?: bool, mobile_match?: bool, signature_verified?: bool }
    - data?: minimal parsed fields for UI
    - message: summary string
    """
    out: Dict[str, Any] = {"ok": False, "qr_type": "unknown", "checks": {}, "message": ""}
    try:
        decoded = decode_qr_string(qr_string)
        out["qr_type"] = decoded.get("qr_type", "unknown")
        # If we got anything meaningful, parsed = True
        parsed_ok = bool(decoded.get("data") or decoded.get("data_parsed") or decoded.get("data_raw"))
        out["checks"]["parsed"] = parsed_ok

        # Basic minimal fields for UI
        best = decoded.get("data") or decoded.get("data_parsed") or {}
        minimal = {k: v for k, v in best.items() if k in ("name","dob","gender","reference_id","pincode","state")}
        if minimal:
            out["data"] = minimal

        # Optional checks only for secure QR with structured data
        if out["qr_type"] == "secure" and decoded.get("data"):
            try:
                qr_obj = AadhaarSecureQr(int(qr_string))
                if email:
                    try:
                        out["checks"]["email_match"] = bool(qr_obj.verifyEmail(email))
                    except Exception:
                        out["checks"]["email_match"] = False
                if mobile:
                    try:
                        out["checks"]["mobile_match"] = bool(qr_obj.verifyMobileNumber(mobile))
                    except Exception:
                        out["checks"]["mobile_match"] = False
            except Exception:
                # Ignore, still can be valid without these checks
                pass

        out["checks"]["signature_verified"] = None

        # Aggregate ok
        ok_bits = [out["checks"]["parsed"]]
        if "email_match" in out["checks"]:
            ok_bits.append(out["checks"]["email_match"])
        if "mobile_match" in out["checks"]:
            ok_bits.append(out["checks"]["mobile_match"])
        out["ok"] = all(b is True for b in ok_bits)
        out["message"] = "Verified" if out["ok"] else "Parsed with warnings or mismatches"
        return out
    except Exception as e:
        return {"ok": False, "qr_type": "unknown", "checks": {"parsed": False}, "message": str(e)}
