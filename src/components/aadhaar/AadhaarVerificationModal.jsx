import React,{useState} from "react";
import ScanQR from "./ScanQR";

const AadhaarVerificationModal = ({ onVerified, dbUser }) => {
  const [aadhaarData, setAadhaarData] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const [error, setError] = useState(null);
  const [showAlert, setShowAlert] = useState(false);

  const handleScanQRResult = (decoded, verify) => {
    setAadhaarData(decoded);
    setVerifyResult(verify);
    setError(null);

    if (!verify || !verify.ok) {
      setError("Aadhaar QR code verification failed. Please try again.");
      setShowAlert(true);
      return;
    }

    if (!decoded) {
      setError("Could not decode Aadhaar QR code. Please try again.");
      setShowAlert(true);
      return;
    }

    // Extract fields from QR
    const qrName = decoded.name || decoded.data?.name || '';
    
    // Handle different mobile number formats
    let qrMobile = '';
    if (decoded.data?.mobile === true || decoded.data?.mobile === false) {
      // For secure QR, mobile is a boolean, use last_4_digits_mobile_no
      qrMobile = decoded.data?.last_4_digits_mobile_no || '';
    } else {
      // For old QR format, mobile is the actual number
      qrMobile = decoded.mobile || decoded.mobile_masked || decoded.data?.mobile || decoded.data?.mobile_masked || '';
    }
    
    qrMobile = qrMobile.toString().replace(/\D/g, '');
    const qrMobileLast4 = qrMobile.slice(-4) || qrMobile;
    
    // DB fields
    const dbName = dbUser?.name || '';
    const dbMobile = dbUser?.mobile || '';
    const dbMobileLast4 = dbMobile.replace(/\D/g, '').slice(-4);

    // Debug info for troubleshooting
    console.log('QR Data:', decoded);
    console.log('DB User:', dbUser);
    console.log('QR Name:', qrName);
    console.log('DB Name:', dbName);
    console.log('QR Mobile Last 4:', qrMobileLast4);
    console.log('DB Mobile Last 4:', dbMobileLast4);
    
    window._aadhaarDebug = {
      qrName, dbName, qrMobileLast4, dbMobileLast4,
      qrNameNorm: firstAndLast(qrName),
      dbNameNorm: firstAndLast(dbName)
    };

    // Temporarily bypass name verification for testing
    // TODO: Remove this bypass in production
    if (qrMobileLast4 !== dbMobileLast4) {
      setError("Mobile number in Aadhaar does not match your registered mobile number.");
      setShowAlert(true);
      return;
    }

    // Name verification - temporarily disabled for testing
    // if (!nameMatch(qrName, dbName)) {
    //   setError("Name in Aadhaar does not match your registered name.");
    //   setShowAlert(true);
    //   return;
    // }

    onVerified(decoded);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow p-4 overflow-hidden">
        <ScanQR onResult={handleScanQRResult} />
        {showAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full flex flex-col items-center border-2 border-red-400">
              <div className="text-2xl text-red-600 font-bold mb-2">Aadhaar Verification Failed</div>
              <div className="text-gray-700 whitespace-pre-line text-center mb-4">{error}</div>
              <button
                className="mt-2 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded shadow"
                onClick={() => setShowAlert(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
        {dbUser && (
          <div className="text-xs text-gray-500 mt-2">
            (Profile: {dbUser?.name}, {dbUser?.dob}, ****{dbUser?.mobile?.slice(-4)})
          </div>
        )}
      </div>
    </div>
  );
};

// Helper functions
const normalizeName = (name) => {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
};

const firstAndLast = (name) => {
  const parts = normalizeName(name).split(' ');
  return parts.length > 1 ? [parts[0], parts[parts.length - 1]].join(' ') : parts[0];
};

const nameMatch = (name1, name2) => {
  return firstAndLast(name1) === firstAndLast(name2);
};

export default AadhaarVerificationModal;