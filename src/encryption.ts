import * as CryptoJS from 'crypto-js';

export function encrypt(content: string, password: string): string {
  return CryptoJS.AES.encrypt(content, password).toString();
}

export function decrypt(encryptedContent: string, password: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedContent, password);
  return bytes.toString(CryptoJS.enc.Utf8);
}
