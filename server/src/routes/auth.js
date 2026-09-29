import { Router } from 'express';
import bcrypt from 'bcryptjs';
import * as userRepo from '../repositories/userRepo.js';
import { signToken } from '../middleware/auth.js';

const router = Router();

router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, goals } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
    if (password.length < 6) return res.status(400).json({ error: 'password must be at least 6 characters' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = userRepo.createUser({ email: email.toLowerCase().trim(), passwordHash });
    if (Array.isArray(goals) && goals.length) {
      userRepo.setGoals(user._id, goals);
    }
    const token = signToken(user._id);
    res.status(201).json({ token, user: publicUser(userRepo.findUserById(user._id)) });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

    const user = userRepo.findUserByEmail(email.toLowerCase().trim());
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    const token = signToken(user._id);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

function publicUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

export default router;
