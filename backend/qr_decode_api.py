# Entrypoint to run with: python qr_decode_api.py
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("qr_decode_api:app", host="0.0.0.0", port=8001, reload=True)
from fastapi import FastAPI, File, UploadFile, Body, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import sys
import os
import base64
from typing import Optional
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import utils

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/decode-qr-string/")
async def decode_qr_string(body: dict = Body(...)):
    try:
        qr_string = body.get("qr_string")
        print("[DEBUG] API received QR string request")

        if not qr_string:
            print("[DEBUG] No QR string provided")
            return JSONResponse({"error": "QR string is required"}, status_code=400)

        # If it's bytes or bytearray, decode to string
        if isinstance(qr_string, (bytes, bytearray)):
            try:
                qr_string = qr_string.decode("utf-8")
            except UnicodeDecodeError:
                try:
                    qr_string = qr_string.decode("latin1")
                except Exception:
                    qr_string = base64.b64encode(qr_string).decode("ascii")

        # Convert to string if it's not already
        if not isinstance(qr_string, str):
            qr_string = str(qr_string)

        # Trim whitespace and validate
        qr_string = qr_string.strip()
        print(f"[DEBUG] QR string length after strip: {len(qr_string)}")

        if not qr_string:
            print("[DEBUG] Empty string after strip")
            return JSONResponse({"error": "Empty QR string provided"}, status_code=400)

        result = utils.decode_qr_string(qr_string)
        return JSONResponse({"data": result, "qr_string": qr_string})
    except ValueError as e:
        print(f"[BACKEND] Value error in QR decode: {str(e)}")
        return JSONResponse({"error": f"Invalid QR code format: {str(e)}"}, status_code=400)
    except Exception as e:
        print(f"[BACKEND] Unexpected error in QR decode: {str(e)}")
        return JSONResponse({"error": str(e)}, status_code=400)

@app.post("/decode-qr-image/")
async def decode_qr_image(file: UploadFile = File(...)):
    try:
        if not file.content_type.startswith('image/'):
            return JSONResponse(
                {"error": "Invalid file type. Please upload an image."}, 
                status_code=400
            )
            
        contents = await file.read()
        temp_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "temp_qr_img.png")
        try:
            with open(temp_path, "wb") as f:
                f.write(contents)
            
            print(f"[BACKEND] Scanning image for QR codes: {file.filename}")
            qr_strings = utils.scan_qr_from_image(temp_path)
            
            if not qr_strings:
                return JSONResponse(
                    {"error": "No QR code found in image. Please ensure the image is clear and contains a valid Aadhaar QR code."}, 
                    status_code=400
                )
            
            results = []
            for qr_string in qr_strings:
                try:
                    result = utils.decode_qr_string(qr_string)
                    results.append({"data": result, "qr_string": qr_string})
                except Exception as e:
                    results.append({"error": str(e)})
            
            return JSONResponse({"results": results})
        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
    except Exception as e:
        return JSONResponse(
            {"error": str(e)}, 
            status_code=400
        )

@app.post("/verify-email/")
async def verify_email(qr_string: str = Body(...), email: str = Body(...)):
    try:
        result = utils.verify_email(qr_string, email)
        return JSONResponse({"verified": result})
    except Exception as e:
        return JSONResponse(
            {"error": str(e)}, 
            status_code=400
        )

@app.post("/verify-mobile/")
async def verify_mobile(qr_string: str = Body(...), mobile: int = Body(...)):
    try:
        result = utils.verify_mobile(qr_string, mobile)
        return JSONResponse({"verified": result})
    except Exception as e:
        return JSONResponse(
            {"error": str(e)}, 
            status_code=400
        )

@app.post("/verify-qr/")
async def verify_qr(body: dict = Body(...)):
    """Verify a QR code using available checks.

    Body:
    - qr_string: required
    - email: optional, to verify against secure QR
    - mobile: optional, to verify against secure QR
    """
    try:
        qr_string = body.get("qr_string")
        email = body.get("email")
        mobile = body.get("mobile")
        if qr_string is None or (isinstance(qr_string, str) and not qr_string.strip()):
            return JSONResponse({"error": "qr_string is required"}, status_code=400)
        result = utils.verify_qr(qr_string, email=email, mobile=mobile)
        return JSONResponse(result)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=400)
