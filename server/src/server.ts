import { env } from './config/env';
import { connectDB } from './config/db';
import app from './app';

async function main() {
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
}

main().catch(err => {
  console.error('Startup error:', err);
  process.exit(1);
});
