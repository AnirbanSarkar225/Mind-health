import { Router } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../config/db.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';
import { generateOTP, sendOTPEmailAsync } from '../services/email.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const BCRYPT_ROUNDS = 10;

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const cleanUsername = String(username).trim();
    const cleanEmail = String(email).trim().toLowerCase();

    if (!cleanEmail.includes('@') || cleanEmail.length < 5) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters.' });
    }

    const existing = await query(
      'SELECT * FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)',
      [cleanUsername, cleanEmail]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email or username already exists. Please Sign In.' });
    }

    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const userId = uuidv4();
    await query(
      `INSERT INTO users (id, username, email, password_hash, email_verified)
       VALUES (?, ?, ?, ?, 0)`,
      [userId, cleanUsername, cleanEmail, hash]
    );

    const user = { id: userId, username: cleanUsername, email: cleanEmail, email_verified: 0 };

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const otpId = uuidv4();
    await query(
      `INSERT INTO otp_codes (id, user_id, code, purpose, expires_at)
       VALUES (?, ?, ?, 'email_verify', ?)`,
      [otpId, userId, otp, expiresAt.toISOString()]
    );
    sendOTPEmailAsync(cleanEmail, otp, cleanUsername);

    const token = generateToken(user);
    res.status(201).json({ user, token, needsVerification: true });
  } catch (e) {
    console.error('Register error:', e);
    res.status(500).json({ error: 'Registration failed: ' + (e.message || 'Server error') });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const identifier = String(email).trim();

    const result = await query(
      `SELECT id, username, email, password_hash, email_verified, created_at
       FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)`,
      [identifier, identifier]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'No account found with this email or username. Please create an account first.' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    const { password_hash, ...safeUser } = user;
    const token = generateToken(safeUser);

    if (!user.email_verified) {
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      const otpId = uuidv4();
      await query(`UPDATE otp_codes SET used = 1 WHERE user_id = ? AND used = 0`, [user.id]);
      await query(`INSERT INTO otp_codes (id, user_id, code, expires_at) VALUES (?, ?, ?, ?)`, [otpId, user.id, otp, expiresAt.toISOString()]);
      sendOTPEmailAsync(user.email, otp, user.username);
      return res.json({ user: safeUser, token, needsVerification: true });
    }

    res.json({ user: safeUser, token, needsVerification: false });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Login failed: ' + (e.message || 'Server error') });
  }
});

router.post('/verify-otp', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;

    if (!code) {
      return res.status(400).json({ error: 'Verification code is required.' });
    }

    const cleanCode = String(code).trim();

    // Universal bypass testing codes
    if (cleanCode === '000000' || cleanCode === '999999') {
      await query(`UPDATE users SET email_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [userId]);
      const userResult = await query(
        `SELECT id, username, email, email_verified, created_at FROM users WHERE id = ?`,
        [userId]
      );
      return res.json({ user: userResult.rows[0], verified: true });
    }

    const result = await query(
      `SELECT id, expires_at FROM otp_codes
       WHERE user_id = ? AND code = ? AND used = 0
       ORDER BY created_at DESC LIMIT 1`,
      [userId, cleanCode]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid verification code. (Hint: you can also use test code 000000)' });
    }

    const otpRecord = result.rows[0];
    if (new Date(otpRecord.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ error: 'Verification code has expired. Please click Resend OTP.' });
    }

    await query(`UPDATE otp_codes SET used = 1 WHERE id = ?`, [otpRecord.id]);
    await query(`UPDATE users SET email_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [userId]);

    const userResult = await query(
      `SELECT id, username, email, email_verified, created_at FROM users WHERE id = ?`,
      [userId]
    );

    res.json({ user: userResult.rows[0], verified: true });
  } catch (e) {
    console.error('OTP verify error:', e);
    res.status(500).json({ error: 'Verification failed.' });
  }
});

router.post('/resend-otp', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    await query(`UPDATE otp_codes SET used = 1 WHERE user_id = ? AND used = 0`, [userId]);

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const otpId = uuidv4();
    await query(`INSERT INTO otp_codes (id, user_id, code, expires_at) VALUES (?, ?, ?, ?)`, [otpId, userId, otp, expiresAt.toISOString()]);
    sendOTPEmailAsync(req.user.email, otp, req.user.username);

    res.json({ sent: true });
  } catch (e) {
    console.error('Resend OTP error:', e);
    res.status(500).json({ error: 'Failed to resend OTP.' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, username, email, email_verified, created_at FROM users WHERE id = ?`,
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ user: result.rows[0] });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
});

export default router;
