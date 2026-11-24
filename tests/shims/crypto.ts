import { createHash, randomBytes } from 'node:crypto';
export enum CryptoDigestAlgorithm { SHA256 = 'SHA-256' }
export const digestStringAsync = async (_a: string, data: string) => createHash('sha256').update(data).digest('hex');
export const getRandomBytes = (n: number) => new Uint8Array(randomBytes(n));
