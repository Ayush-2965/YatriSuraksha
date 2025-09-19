import React, { useState } from "react";
import QrScanner from "qr-scanner";
import { Scanner } from "@yudiel/react-qr-scanner";

const ScanQR = ({ onResult }) => {
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
      
      try {
        const vRes = await fetch("http://localhost:8001/verify-qr/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qr_string: result.qr_string }),
        });
        const vJson = await vRes.json();
        setVerifyResult(vJson);
        onResult(result.data, vJson);
      } catch (vErr) {
        console.warn("[FRONTEND] Verify failed:", vErr);
        setVerifyResult(null);
        onResult(result.data, null);
      }
    } catch (err) {
      setError(err.message || "Failed to decode QR");
      console.error("[FRONTEND] Error:", err);
      onResult(null, null);
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
            await handleQrString(firstResult.qr_string);
          } else {
            throw new Error('No QR code found in image');
          }
        }
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError(err.message || 'Failed to process image');
      console.error('[FRONTEND] File processing error:', err);
      onResult(null, null);
    }
  };

  return (
    <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-xl border border-gray-100 w-full max-w-full">
      <div className="mb-3 sm:mb-4 text-center">
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2">
          Scan Aadhaar QR Code
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 px-1">
          Use your camera or upload an image to verify your Aadhaar.
        </p>
      </div>

      <div className="mb-3 sm:mb-4">
        <div className="relative border-2 sm:border-4 border-gray-300 rounded-xl sm:rounded-2xl overflow-hidden w-full h-48 sm:h-56 md:h-64">
          <Scanner
            onScan={handleScan}
            onError={(err) => setError(`Camera error: ${err}`)}
            constraints={{ facingMode: "environment" }}
            styles={{
              container: { 
                width: "100%", 
                height: "100%",
                position: "relative"
              },
              video: {
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              },
            }}
          />
        </div>
      </div>

      <div className="text-center mb-3 sm:mb-4">
        <p className="text-gray-500 text-xs sm:text-sm">OR</p>
      </div>

      <div className="text-center">
        <label
          htmlFor="qr-upload"
          className="cursor-pointer bg-purple-600 text-white font-bold py-2 px-4 sm:px-6 rounded-lg hover:bg-purple-700 transition-colors duration-300 inline-block text-xs sm:text-sm"
        >
          Upload QR Code Image
        </label>
        <input
          id="qr-upload"
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {error && (
        <div className="mt-3 sm:mt-4 text-center text-red-600 font-semibold text-xs sm:text-sm px-1">
          {error}
        </div>
      )}
      {verifyResult && (
        <div
          className={`mt-3 sm:mt-4 text-center font-semibold text-xs sm:text-sm ${
            verifyResult.ok ? "text-green-600" : "text-red-600"
          }`}
        >
          {verifyResult.ok ? "Aadhaar Verified" : "Aadhaar Not Verified"}
        </div>
      )}
    </div>
  );
};

export default ScanQR;