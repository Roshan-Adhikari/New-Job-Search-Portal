# JobSphere – Smart Job Search Agent

Search for jobs across major portals from one dashboard, now with an Express + SQLite backend for syncing profile and application tracker data.

## Features

- **Multi-Portal Search** – LinkedIn, Indeed, Naukri, Glassdoor, Internshala, Wellfound, Shine, Monster India, Instahyre, Foundit
- **Smart Filters** – Filter by Full-time, Part-time, Contract, Internship
- **Sorting** – Latest, Most Relevant, Experience Level
- **Portal Count Summary** – See how many jobs found per portal
- **Resume Upload (.txt/.pdf)** – Server-side text extract; if the PDF has no text layer (scanned), **OCR** runs on the first few pages (can take up to ~1 minute). Requires native **`canvas`** (installed with `pdf-to-img`).
- **Resume-Based Search** – Search multiple matching roles from your resume in one action
- **Live Jobs API** – Optional live remote jobs from Remotive API
- **LinkedIn Easy Apply Helper** – Open LinkedIn Easy Apply jobs in bulk tabs
- **Application Tracker** – Track each job through Saved, Applied, Interview, Rejected, Offer
- **Profile Autofill** – Save profile fields and reuse in Easy Apply preview
- **Dark/Light Mode** – Toggle theme with full dark mode support
- **Responsive** – Works on desktop, tablet, and mobile
- **Direct Apply Links** – Each job opens the original portal in a new tab

## Tech Stack

- Frontend: HTML5, CSS3 (Vanilla), JavaScript (Vanilla)
- Backend: Node.js, Express, SQLite (`better-sqlite3`), PDF parsing (`pdf-parse`, `pdfjs-dist`, `pdf2json`, `pdf-to-img` + `tesseract.js` for OCR)
- Google Fonts (Inter, DM Sans, DM Mono)

## How to Use

1. Install dependencies:
   - `npm install`
2. Start the app server:
   - `npm start`
3. Open `http://localhost:3000`
4. Enter a job role (e.g., "Product Manager")
5. Select a location (e.g., "Bangalore")
6. Click **Search Jobs**
7. Browse results, filter by type, sort as needed
8. Click **Apply** to open the job on the original portal

### Resume + Easy Apply Flow

1. Upload a resume file (`.txt` or `.pdf`). For PDFs, wait if you see the OCR message—first upload may download language data.
2. App extracts top role matches from your resume
3. Click **Search Jobs From Resume** to search all portals for those roles
4. Connect LinkedIn in the header (local demo session)
5. Click **⚡ Open LinkedIn Easy Apply Jobs** to open job tabs
6. Complete Easy Apply steps on LinkedIn pages
7. Track progress in the in-app Application Tracker

## Backend APIs

- `GET /api/health` – health check
- `POST /api/parse-resume` – parse uploaded PDF/TXT resume text
- `GET /api/profile` – fetch saved autofill profile
- `PUT /api/profile` – save autofill profile
- `GET /api/applications` – fetch application tracker rows
- `PUT /api/applications` – upsert application tracker rows

## Architecture

The frontend still uses modular `generateJobsForPortal()` for static portal simulation and optional live Remotive API jobs. Profile and tracker states are synced to SQLite through Express APIs, so your history persists on the server.

## Future Roadmap

- [ ] Real API integrations for each portal
- [ ] Real OAuth integration for LinkedIn (official APIs where available)
- [x] Resume upload and auto-fill
- [ ] Job alerts and saved searches
- [x] Application tracking dashboard

## License

MIT
