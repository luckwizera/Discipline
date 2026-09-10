import { Router } from 'express';
import PDFDocument from 'pdfkit';
import { db } from '../db.js';
import { auth, admin } from '../auth.js';

const router = Router();
router.get('/:period.pdf', auth, admin, (req, res) => {
  const { period } = req.params;
  if (!['monthly','termly','annual'].includes(period)) return res.status(400).json({ error: 'Unsupported report period', code: 'INVALID_PERIOD' });
  const students = db.prepare('SELECT * FROM students ORDER BY marks DESC').all();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${period}-conduct-report.pdf"`);
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);
  doc.fontSize(22).text('Discipline Conduct Report');
  doc.fontSize(11).text(`${period.toUpperCase()} · Generated ${new Date().toLocaleString()}`).moveDown();
  for (const student of students) doc.fontSize(13).text(`${student.name} (${student.id}) — ${student.class_name}: ${student.marks} marks — ${student.status}`).fontSize(10).text(`Parent contact: ${student.parent_email || 'not configured'}`).moveDown(0.7);
  doc.end();
});
export default router;
