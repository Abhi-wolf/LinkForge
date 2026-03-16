// we are using base62 instead of base64 because we can't use (+ and /)
// from base64 beacause they have special meanings

const BASE62_CHARS =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function toBase62(num: number): string {
  if (num === 0) return "0";

  let result = "";

  let n = num;

  while (n > 0) {
    const remainder = n % 62;
    result = BASE62_CHARS[remainder] + result;
    n = Math.floor(n / 62);
  }
  return result;
}
