import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { schemaRouter } from './routes/schemaRouter';
import { authRouter } from './routes/authRouter';
import { savedSchemaRouter } from './routes/savedSchemaRouter';
import { quizRouter } from './routes/quizRouter';

export const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Denormalization Schema Analysis Engine' });
});

// Auth & User Management
app.use('/api/v1/auth', authRouter);

// Main Schema Analysis Route
app.use('/api/v1/schema', schemaRouter);

// Saved Schemas, Drift Detection & Change Management
app.use('/api/v1/saved-schemas', savedSchemaRouter);

// Interactive AI Quiz & Competitive Examination Question Bank
app.use('/api/v1/quiz', quizRouter);

// Start server if run directly
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[SERVER] Schema Analysis Backend running on http://localhost:${PORT}`);
  });
}
