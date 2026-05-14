import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export interface AdminCredential {
  email: string;
  username: string;
  password: string;
}

function parseAdminCredentials(): AdminCredential[] {
  const raw = process.env.ADMIN_CREDENTIALS || '';
  if (!raw) return [];

  return raw.split(',').map(entry => {
    const trimmed = entry.trim();
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) {
      throw new Error(`Invalid ADMIN_CREDENTIALS entry: "${entry}". Expected format: email:password`);
    }
    const identifier = trimmed.substring(0, colonIdx);
    const password = trimmed.substring(colonIdx + 1);
    if (!identifier || !password) {
      throw new Error(`Invalid ADMIN_CREDENTIALS entry: "${entry}". Expected format: email:password`);
    }
    // Derive username from email prefix (part before @), lowercased
    const username = identifier.includes('@')
      ? identifier.split('@')[0].toLowerCase()
      : identifier.toLowerCase();

    return { email: identifier.toLowerCase(), username, password };
  });
}

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: required('MONGODB_URI'),
  JWT_SECRET: required('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  ADMIN_CREDENTIALS: parseAdminCredentials(),
};
