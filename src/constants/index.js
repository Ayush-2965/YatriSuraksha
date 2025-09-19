export const API_CONFIG = {
  BASE_URL: 'http://localhost:8001',
  ENDPOINTS: {
    DECODE_QR_STRING: '/decode-qr-string/',
    VERIFY_QR: '/verify-qr/',
    DECODE_QR_IMAGE: '/decode-qr-image/',
  }
};

export const QR_SCAN_MESSAGES = {
  CAMERA_PROMPT: 'Use camera below to scan QR',
  DECODE_ERROR: 'Failed to decode QR',
  VERIFY_ERROR: 'Aadhaar QR code verification failed. Please try again.',
  NO_QR_FOUND: 'No QR code found in image',
  PROCESSING_ERROR: 'Failed to process image',
  NAME_MISMATCH: 'Name in Aadhaar does not match your registered name.',
  MOBILE_MISMATCH: 'Mobile number in Aadhaar does not match your registered mobile number.',
};

export const MODAL_TITLES = {
  AADHAAR_VERIFICATION: 'Aadhaar Verification',
  VERIFICATION_FAILED: 'Aadhaar Verification Failed',
};

export const BUTTON_LABELS = {
  USE_CAMERA: 'Use Camera',
  CLOSE: 'Close',
  SAVE: 'Save',
  CANCEL: 'Cancel',
  ADD_TOUR: 'Add Tour',
  START_TOUR: 'Start Tour',
  LOGOUT: 'Logout',
};

export const VERIFICATION_STATUS = {
  VERIFIED: 'VERIFIED',
  UNVERIFIED: 'UNVERIFIED',
};