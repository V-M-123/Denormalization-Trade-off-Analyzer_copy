import { Router, Request, Response } from 'express';
import { registerUser, loginUser, getUserById } from '../db/supabaseClient';
import { createSessionToken, verifySessionToken } from '../utils/crypto';

export const authRouter = Router();

// Registration
authRouter.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const user = await registerUser(email, password, name || '');
    const token = createSessionToken(user.id, user.email);

    res.status(201).json({
      message: 'User registered successfully.',
      user,
      token
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registration failed.' });
  }
});

// Login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const { user, token: remoteToken } = await loginUser(email, password);
    const token = remoteToken || createSessionToken(user.id, user.email);

    res.json({
      message: 'Login successful.',
      user,
      token
    });
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Invalid credentials.' });
  }
});

// Current User Profile
authRouter.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or malformed Authorization header.' });
    }

    const token = authHeader.substring(7);
    const session = verifySessionToken(token);
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session token.' });
    }

    const user = await getUserById(session.userId);
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve user profile.' });
  }
});
