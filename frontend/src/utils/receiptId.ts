const CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function generateReceiptId(length = 13) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < length; i++) {
    const idx = bytes[i] & 31; // 0..31
    out += CHARSET[idx % CHARSET.length];
  }
  return out;
}

export default generateReceiptId;
