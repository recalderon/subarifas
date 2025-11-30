import crypto from 'crypto';
const CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
// length of 13 -> ~65 bits of entropy (13 * 5)
export function generateReceiptId(length = 13) {
    const bytes = crypto.randomBytes(length);
    const chars = new Array(length);
    for (let i = 0; i < length; i++) {
        // Map byte to 0..31
        const idx = bytes[i] & 31; // 0-31
        chars[i] = CHARSET[idx % CHARSET.length];
    }
    return chars.join('');
}
export default generateReceiptId;
//# sourceMappingURL=generateReceiptId.js.map