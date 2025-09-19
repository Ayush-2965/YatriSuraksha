export const normalizeName = (name) => {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
};

export const firstAndLast = (name) => {
  const parts = normalizeName(name).split(' ');
  return parts.length > 1 ? [parts[0], parts[parts.length - 1]].join(' ') : parts[0];
};

export const nameMatch = (name1, name2) => {
  return firstAndLast(name1) === firstAndLast(name2);
};

export const extractAadhaarData = (decoded) => {
  return {
    name: decoded.name || decoded.data?.name || '',
    mobile: (decoded.mobile || decoded.mobile_masked || decoded.data?.mobile || decoded.data?.mobile_masked || '').replace(/\D/g, ''),
    dob: decoded.dob || decoded.data?.dob || '',
    gender: decoded.gender || decoded.data?.gender || '',
  };
};