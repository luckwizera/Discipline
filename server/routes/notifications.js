import { Router } from 'express';
import nodemailer from 'nodemailer';
import { auth, admin } from '../auth.js';
import { notificationSchema, validate } from '../validation.js';

const router = Router();
router.post('/test', auth, admin, validate(notificationSchema), async (req, res, next) => {
  if (!process.env.SMTP_HOST) return res.status(503).json({ error: 'SMTP is not configured', code: 'SMTP_NOT_CONFIGURED' });
  try {
    const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === 'true', auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
    await transporter.sendMail({ from: process.env.SMTP_FROM, to: req.body.to, subject: 'Discipline parent update', text: req.body.message });
    res.json({ ok: true });
  } catch (error) { next(error); }
});
export default router;
