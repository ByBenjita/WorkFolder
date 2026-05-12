import crypto from 'crypto';
// @ts-ignore
import type {} from 'node';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

// Función para encriptar un buffer usando AES-256-GCM
export const encryptBuffer = (buffer: Buffer, keyString: string): Buffer => {
  const key = crypto.createHash('sha256').update(String(keyString)).digest('base64').substring(0, 32);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key), iv);
  
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  return Buffer.concat([iv, authTag, encrypted]);
};

// Función para desencriptar un buffer usando AES-256-GCM
export const decryptBuffer = (buffer: Buffer, keyString: string): Buffer => {
  const key = crypto.createHash('sha256').update(String(keyString)).digest('base64').substring(0, 32);
  
  const iv = buffer.subarray(0, IV_LENGTH);
  const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + 16);
  const encryptedData = buffer.subarray(IV_LENGTH + 16);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key), iv);
  decipher.setAuthTag(authTag);
  
  return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
};