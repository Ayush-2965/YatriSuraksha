import React, { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import QrScanner from "../lib/qr-scanner-lib";

const ScanQR = () => {
  const [decodedData, setDecodedData] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const [error, setError] = useState(null);

  const handleQrString = async (qrString) => {
    try {
      console.log("[FRONTEND] Raw QR string:", qrString);
  const response = await fetch("http://localhost:8001/decode-qr-string/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_string: qrString }),
      });
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to decode QR');
      }

      console.log("[FRONTEND] Decoded data:", result.data);
      setDecodedData(result.data);
      try {
  const vRes = await fetch("http://localhost:8001/verify-qr/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qr_string: result.qr_string }),
        });
        const vJson = await vRes.json();
        setVerifyResult(vJson);
      } catch (vErr) {
        console.warn("[FRONTEND] Verify failed:", vErr);
        setVerifyResult(null);
      }
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to decode QR");
      console.error("[FRONTEND] Error:", err);
    }
  };

  const handleScan = (results) => {
    if (!results || results.length === 0) return;
    console.log("[FRONTEND] QR detected from camera:", results[0].rawValue);
    handleQrString(results[0].rawValue);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        const img = document.createElement("img");
        img.src = url;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        try {
          const result = await QrScanner.scanImage(img);
          console.log("[FRONTEND] Browser QR scan result:", result);
          await handleQrString(result);
        } catch (scanErr) {
          console.log("[FRONTEND] Browser scan failed, trying backend:", scanErr);
          const formData = new FormData();
          formData.append('file', file);
          
          const response = await fetch('http://localhost:8001/decode-qr-image/', {
            method: 'POST',
            body: formData,
          });
          const result = await response.json();
          
          if (!response.ok) {
            throw new Error(result.error || 'Failed to decode QR');
          }

          if (result.results && result.results.length > 0) {
            const firstResult = result.results[0];
            if (firstResult.error) {
              throw new Error(firstResult.error);
            }
            setDecodedData(firstResult.data);
            try {
              const vRes = await fetch("http://localhost:8001/verify-qr/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ qr_string: firstResult.qr_string }),
              });
              const vJson = await vRes.json();
              setVerifyResult(vJson);
            } catch (vErr) {
              console.warn("[FRONTEND] Verify failed:", vErr);
              setVerifyResult(null);
            }
            setError(null);
          } else {
            throw new Error('No QR code found in image');
          }
        }
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError(err.message || 'Failed to process image');
      console.error('[FRONTEND] File processing error:', err);
    }
  };

  const renderDecodedData = (payload) => {
    if (!payload) return null;

    const best = payload.data || payload.data_parsed || {};
  const hasImage = payload.has_image || best.has_image || Boolean(best.image_base64 || best.image_jpeg2000_base64 || payload.image_base64 || payload.image_jpeg2000_base64);
  const imageB64 = payload.image_base64 || best.image_base64 || payload.image_jpeg2000_base64 || best.image_jpeg2000_base64;
  const imageMime = payload.image_format || best.image_format || (imageB64 ? 'image/png' : 'image/jp2');

    const displayFields = {
      name: "Name",
      dob: "Date of Birth",
      gender: "Gender",
      version: "Version",
      type: "Type",
      reference_id: "Reference ID",
      vtc: "Town/City",
      district: "District",
      state: "State",
      pincode: "PIN Code",
      mobile_masked: "Masked Mobile",
    };

    return (
      <div className="mt-4 p-4 bg-white rounded shadow">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Aadhaar Details</h3>
            {payload.qr_type && (
              <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">{payload.qr_type.toUpperCase()}</span>
            )}
          </div>
          {verifyResult && (
            <span
              className={`text-xs px-2 py-1 rounded ${verifyResult.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
              title={verifyResult.message}
            >
              {verifyResult.ok ? 'VERIFIED' : 'UNVERIFIED'}
            </span>
          )}
        </div>

        {payload.note && (
          <p className="mt-2 text-xs text-amber-700 bg-amber-50 p-2 rounded">{payload.note}</p>
        )}

        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(displayFields).map(([key, label]) => (
            best[key] && (
              <div key={key} className="mb-2">
                <span className="font-medium">{label}: </span>
                <span>{best[key]}</span>
              </div>
            )
          ))}
        </div>

        {best.address && (
          <div className="mt-3">
            <div className="font-medium">Address:</div>
            <div className="text-sm text-gray-800">{best.address}</div>
          </div>
        )}

        {Array.isArray(best.address_lines) && best.address_lines.length > 0 && (
          <div className="mt-2">
            <div className="font-medium">Address lines:</div>
            <ul className="list-disc ml-6 text-sm text-gray-700">
              {best.address_lines.map((line, idx) => (
                <li key={idx}>{line}</li>
              ))}
            </ul>
          </div>
        )}

        {Array.isArray(best.locality_hints) && best.locality_hints.length > 0 && (
          <div className="mt-2">
            <div className="font-medium">Locality hints:</div>
            <div className="flex flex-wrap gap-2 mt-1">
              {best.locality_hints.map((l, i) => (
                <span key={i} className="text-xs px-2 py-1 bg-gray-100 rounded">{l}</span>
              ))}
            </div>
          </div>
        )}

        {hasImage && (
          <div className="mt-4">
            <p className="text-green-600">✓ Photo available in QR</p>
            {imageB64 && (
              <div className="mt-2">
                <img
                  alt="Aadhaar Photo"
                  className="max-h-64 border rounded"
                  src={`data:${imageMime};base64,${imageB64}`}
                />
                {imageMime === 'image/jp2' && (
                  <p className="mt-2 text-xs text-amber-700 bg-amber-50 p-2 rounded">
                    Your browser may not support JPEG2000. If the image doesn't render, try another browser or ask the admin to enable PNG conversion.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Scan Aadhaar QR</h2>

      <Scanner
        onScan={handleScan}
        onError={(err) => console.error("Camera error:", err)}
        constraints={{ facingMode: "environment" }}
        styles={{ container: { width: "100%" } }}
      />

      <hr />

      <h3>Or Upload Aadhaar QR Image</h3>
      <input type="file" accept="image/*" onChange={handleFileUpload} />

      {error && <p className="text-red-600 mt-4">{error}</p>}
      {decodedData && renderDecodedData(decodedData)}
    </div>
  );
};

export default ScanQR;
