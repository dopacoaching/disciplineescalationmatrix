import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import batchesRoutes from './routes/batches.routes';
import studentsRoutes from './routes/students.routes';
import entriesRoutes from './routes/entries.routes';
import staffRoutes from './routes/staff.routes';
import adminsRoutes from './routes/admins.routes';
import dashboardRoutes from './routes/dashboard.routes';

const app = express();

app.use(helmet());

const allowedOrigins = [
  'http://localhost:3000',
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
];

app.use(cors({
  origin(origin, callback) {
    // Allow requests with no Origin header (Next.js proxy, server-to-server)
    // and any explicitly listed origin
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: ${origin} not allowed`));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/batches', batchesRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/entries', entriesRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/admins', adminsRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(errorHandler);

export default app;
