const express = require('express');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const Database = require('better-sqlite3');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const PDFParser = require('pdf2json');
const os = require('os');
const Tesseract = require('tesseract.js');

const app = express();
const PORT = process.env.PORT || 3000;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });
const dbPath = path.join(__dirname, 'jobsphere.db');
const db = new Database(dbPath);

/** First existing path wins: env → default-resume.path (line 1) → default-resume.pdf in project */
function resolveDefaultResumePath() {
  const candidates = [];
  const env = process.env.DEFAULT_RESUME_PATH || process.env.JOBSPHERE_DEFAULT_RESUME;
  if (env && String(env).trim()) candidates.push(String(env).trim());
  const pathFile = path.join(__dirname, 'default-resume.path');
  if (fs.existsSync(pathFile)) {
    try {
      const first = fs
        .readFileSync(pathFile, 'utf8')
        .split(/\r?\n/)
        .map((l) => l.trim())
        .find((l) => l && !l.startsWith('#'));
      if (first) candidates.push(first);
    } catch (_e) {}
  }
  candidates.push(path.join(__dirname, 'default-resume.pdf'));
  for (const p of candidates) {
    try {
      if (p && fs.existsSync(p)) return path.resolve(p);
    } catch (_e) {}
  }
  return null;
}

async function extractResumeTextFromBuffer(buf, filenameLower) {
  const name = String(filenameLower || '').toLowerCase();
  let text = '';
  if (name.endsWith('.pdf') || !name) {
    const buffer = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
    try {
      const parsed = await pdfParse(buffer);
      text = String(parsed.text || '').trim();
    } catch (_err) {
      text = '';
    }
    if (!text) {
      try {
        text = await parsePdfWithPdfJs(buffer);
      } catch (_err) {
        text = '';
      }
    }
    if (!text) {
      try {
        text = await parsePdfWithPdf2Json(buffer);
      } catch (_err) {
        text = '';
      }
    }
    if (!text) {
      try {
        text = await parsePdfWithOcr(buffer);
      } catch (_ocrErr) {
        text = '';
      }
    }
  } else {
    text = Buffer.isBuffer(buf) ? buf.toString('utf8').trim() : String(buf).trim();
  }
  return text;
}

function pdfDistRoot() {
  return path.dirname(require.resolve('pdfjs-dist/package.json'));
}

async function parsePdfWithPdfJs(buffer) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const root = pdfDistRoot();
  const uint8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const baseOpts = { data: uint8, useSystemFonts: true };
  const cmapsDir = path.join(root, 'cmaps');
  if (fs.existsSync(cmapsDir)) {
    baseOpts.cMapUrl = pathToFileURL(path.join(cmapsDir) + path.sep).href;
    baseOpts.cMapPacked = true;
  }
  const stdDir = path.join(root, 'standard_fonts');
  if (fs.existsSync(stdDir)) {
    baseOpts.standardFontDataUrl = pathToFileURL(path.join(stdDir) + path.sep).href;
  }
  let pdf;
  try {
    pdf = await pdfjs.getDocument(baseOpts).promise;
  } catch (_e) {
    pdf = await pdfjs.getDocument({ data: uint8, useSystemFonts: true }).promise;
  }
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += ' ' + content.items.map((item) => item.str || '').join(' ');
  }
  return text.trim();
}

function parsePdfWithPdf2Json(buffer) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, 1);
    pdfParser.on('pdfParser_dataError', (errData) => reject(errData.parserError || errData));
    pdfParser.on('pdfParser_dataReady', (pdfData) => {
      try {
        let text = '';
        (pdfData.Pages || []).forEach((page) => {
          (page.Texts || []).forEach((textItem) => {
            (textItem.R || []).forEach((r) => {
              const t = r.T || '';
              try {
                text += `${decodeURIComponent(t)} `;
              } catch {
                text += `${t} `;
              }
            });
          });
        });
        resolve(text.replace(/\s+/g, ' ').trim());
      } catch (e) {
        reject(e);
      }
    });
    pdfParser.parseBuffer(Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer));
  });
}

/** Scanned PDFs: rasterize pages then OCR (first pages only; can take ~30–60s). */
async function parsePdfWithOcr(buffer) {
  const tmpFile = path.join(
    os.tmpdir(),
    `jobsphere-resume-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`
  );
  fs.writeFileSync(tmpFile, Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer));
  let worker;
  try {
    const { pdf } = await import('pdf-to-img');
    const doc = await pdf(tmpFile, { scale: 2 });
    const parts = [];
    let page = 0;
    const maxPages = 4;
    worker = await Tesseract.createWorker('eng');
    for await (const image of doc) {
      page += 1;
      if (page > maxPages) break;
      const {
        data: { text }
      } = await worker.recognize(image);
      if (text && String(text).trim()) parts.push(String(text).trim());
    }
    return parts.join('\n\n').trim();
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (_e) {}
    }
    try {
      fs.unlinkSync(tmpFile);
    } catch (_e) {}
  }
}

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

app.get('/api/default-resume', async (_req, res) => {
  try {
    const filePath = resolveDefaultResumePath();
    if (!filePath) {
      res.status(404).json({
        ok: false,
        error:
          'No default resume. Set DEFAULT_RESUME_PATH, or add default-resume.path (line 1 = full path), or place default-resume.pdf in the project folder.'
      });
      return;
    }
    const buf = fs.readFileSync(filePath);
    const base = path.basename(filePath).toLowerCase();
    const text = await extractResumeTextFromBuffer(buf, base);
    if (!text) {
      res.status(422).json({
        ok: false,
        error:
          'Default resume file exists but no text could be extracted. Try .txt or run OCR-friendly PDF.'
      });
      return;
    }
    res.json({ ok: true, text, filename: path.basename(filePath) });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post('/api/parse-resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ ok: false, error: 'Resume file is required' });
      return;
    }
    const name = String(req.file.originalname || '').toLowerCase();
    const buf = Buffer.isBuffer(req.file.buffer) ? req.file.buffer : Buffer.from(req.file.buffer);
    const isPdf = req.file.mimetype === 'application/pdf' || name.endsWith('.pdf');
    const text = isPdf
      ? await extractResumeTextFromBuffer(buf, name)
      : buf.toString('utf8').trim();
    if (!text) {
      res.status(422).json({
        ok: false,
        error:
          'No readable text found after text extract and OCR. Try a .txt resume, export PDF as text from Word, or a clearer scan (first pages are OCR’d).'
      });
      return;
    }
    res.json({ ok: true, text });
  } catch (error) {
    res.status(500).json({ ok: false, error: `Failed to parse resume file: ${error.message}` });
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
