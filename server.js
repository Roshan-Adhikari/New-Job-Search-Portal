const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');
const multer = require('multer');
const pdfParse = require('pdf-parse');

const app = express();
const PORT = process.env.PORT || 3000;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });
const dbPath = path.join(__dirname, 'jobsphere.db');
const db = new Database(dbPath);

db.exec(`
CREATE TABLE IF NOT EXISTS user_profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  experience TEXT DEFAULT '',
  skills TEXT DEFAULT '',
  cover_note TEXT DEFAULT '',
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS applications (
  job_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  portal_name TEXT NOT NULL,
  status TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`);

app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'jobsphere-api' });
});

app.post('/api/parse-resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ ok: false, error: 'Resume file is required' });
      return;
    }
    const name = String(req.file.originalname || '').toLowerCase();
    let text = '';
    if (req.file.mimetype === 'application/pdf' || name.endsWith('.pdf')) {
      const parsed = await pdfParse(req.file.buffer);
      text = String(parsed.text || '').trim();
    } else {
      text = req.file.buffer.toString('utf8').trim();
    }
    if (!text) {
      res.status(422).json({ ok: false, error: 'No readable text found in resume file' });
      return;
    }
    res.json({ ok: true, text });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Failed to parse resume file' });
  }
});

app.get('/api/profile', (_req, res) => {
  const row = db.prepare('SELECT * FROM user_profile WHERE id = 1').get();
  if (!row) {
    res.json({
      name: '',
      email: '',
      phone: '',
      experience: '',
      skills: '',
      coverNote: ''
    });
    return;
  }
  res.json({
    name: row.name || '',
    email: row.email || '',
    phone: row.phone || '',
    experience: row.experience || '',
    skills: row.skills || '',
    coverNote: row.cover_note || ''
  });
});

app.put('/api/profile', (req, res) => {
  const payload = req.body || {};
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO user_profile (id, name, email, phone, experience, skills, cover_note, updated_at)
    VALUES (1, @name, @email, @phone, @experience, @skills, @coverNote, @updatedAt)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      email = excluded.email,
      phone = excluded.phone,
      experience = excluded.experience,
      skills = excluded.skills,
      cover_note = excluded.cover_note,
      updated_at = excluded.updated_at
  `).run({
    name: String(payload.name || ''),
    email: String(payload.email || ''),
    phone: String(payload.phone || ''),
    experience: String(payload.experience || ''),
    skills: String(payload.skills || ''),
    coverNote: String(payload.coverNote || ''),
    updatedAt: now
  });
  res.json({ ok: true });
});

app.get('/api/applications', (_req, res) => {
  const rows = db.prepare('SELECT * FROM applications ORDER BY datetime(updated_at) DESC').all();
  res.json(
    rows.map((row) => ({
      jobId: row.job_id,
      title: row.title,
      company: row.company,
      portalName: row.portal_name,
      status: row.status,
      updatedAt: row.updated_at
    }))
  );
});

app.put('/api/applications', (req, res) => {
  const apps = Array.isArray(req.body) ? req.body : [];
  const now = new Date().toISOString();
  const insert = db.prepare(`
    INSERT INTO applications (job_id, title, company, portal_name, status, updated_at)
    VALUES (@jobId, @title, @company, @portalName, @status, @updatedAt)
    ON CONFLICT(job_id) DO UPDATE SET
      title = excluded.title,
      company = excluded.company,
      portal_name = excluded.portal_name,
      status = excluded.status,
      updated_at = excluded.updated_at
  `);
  const tx = db.transaction((records) => {
    for (const record of records) {
      if (!record || !record.jobId) continue;
      insert.run({
        jobId: String(record.jobId),
        title: String(record.title || ''),
        company: String(record.company || ''),
        portalName: String(record.portalName || ''),
        status: String(record.status || 'Saved'),
        updatedAt: String(record.updatedAt || now)
      });
    }
  });
  tx(apps);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`JobSphere server running at http://localhost:${PORT}`);
});
