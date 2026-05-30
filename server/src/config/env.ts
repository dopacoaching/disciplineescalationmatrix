import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}


export const env = {
  PORT:           parseInt(process.env.PORT || '5000', 10),
  NODE_ENV:       process.env.NODE_ENV || 'development',
  MONGODB_URI:    required('MONGODB_URI'),
  JWT_SECRET:     required('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  // Guard against empty string producing NaN; enforce minimum of 10 rounds
  BCRYPT_ROUNDS:  Math.max(10, parseInt(process.env.BCRYPT_ROUNDS || '12', 10) || 12),
  // ADMIN_CREDENTIALS is intentionally NOT exposed here.
  // It is parsed only inside seedAdmin.ts (a one-time script) so the plaintext
  // password never lives in the main server process at runtime.
};
