import { env } from '../config/env';
import { connectDB } from '../config/db';
import Admin from '../models/Admin';
import { hashPassword } from '../utils/hash';
import mongoose from 'mongoose';

async function seed() {
  await connectDB();

  const credentials = env.ADMIN_CREDENTIALS;
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
