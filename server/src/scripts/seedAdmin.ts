import { connectDB } from '../config/db';
import Admin from '../models/Admin';
import { hashPassword } from '../utils/hash';
import mongoose from 'mongoose';

// Parse here (seed script only) so plaintext passwords never exist in the main server process
function parseAdminCredentials(): Array<{ email: string; username: string; password: string }> {
  const raw = process.env.ADMIN_CREDENTIALS || '';
  if (!raw) return [];
  return raw.split(',').map(entry => {
    const trimmed = entry.trim();
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) throw new Error(`Invalid ADMIN_CREDENTIALS entry: "${entry}". Format: email:password`);
    const identifier = trimmed.substring(0, colonIdx);
    const password   = trimmed.substring(colonIdx + 1);
    if (!identifier || !password) throw new Error(`Invalid ADMIN_CREDENTIALS entry: "${entry}". Format: email:password`);
    const username = identifier.includes('@') ? identifier.split('@')[0].toLowerCase() : identifier.toLowerCase();
    return { email: identifier.toLowerCase(), username, password };
  });
}

async function seed() {
  await connectDB();

  const credentials = parseAdminCredentials();
  if (credentials.length === 0) {
    console.error('No admin credentials found. Set ADMIN_CREDENTIALS in .env');
    console.error('Format: ADMIN_CREDENTIALS=email1:password1,email2:password2');
    await mongoose.disconnect();
    process.exit(1);
  }

  let created = 0;
  let updated = 0;

  for (const cred of credentials) {
    const passwordHash = await hashPassword(cred.password);
    const existing = await Admin.findOne({
      $or: [{ email: cred.email }, { username: cred.username }],
    });

    if (existing) {
      // Update password and ensure active
      await Admin.updateOne(
        { _id: existing._id },
        { $set: { passwordHash, isActive: true } }
      );
      console.log(`  UPDATED  ${cred.email} → username: ${cred.username}`);
      updated++;
    } else {
      await Admin.create({
        email: cred.email,
        username: cred.username,
        passwordHash,
        createdBy: null,
      });
      console.log(`  CREATED  ${cred.email} → username: ${cred.username}`);
      created++;
    }
  }

  console.log(`\nSeed complete: ${created} created, ${updated} updated.`);
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
