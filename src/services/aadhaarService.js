const API_BASE_URL = 'http://localhost:8001';

export const decodeQRString = async (qrString) => {
  const response = await fetch(`${API_BASE_URL}/decode-qr-string/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ qr_string: qrString }),
  });
  
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || 'Failed to decode QR');
  }
  
  return result;
};

export const verifyQR = async (qrString) => {
  const response = await fetch(`${API_BASE_URL}/verify-qr/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ qr_string: qrString }),
  });
  
  return await response.json();
};

export const decodeQRImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE_URL}/decode-qr-image/`, {
    method: 'POST',
    body: formData,
  });
  
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || 'Failed to decode QR');
  }
  
  return result;
};