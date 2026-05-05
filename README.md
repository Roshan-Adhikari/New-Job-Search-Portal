# JobSphere – Smart Job Search Agent

Search for jobs across **10 major job portals** simultaneously from one clean dashboard.

## Features

- **Multi-Portal Search** – LinkedIn, Indeed, Naukri, Glassdoor, Internshala, Wellfound, Shine, Monster India, Instahyre, Foundit
- **Smart Filters** – Filter by Full-time, Part-time, Contract, Internship
- **Sorting** – Latest, Most Relevant, Experience Level
- **Portal Count Summary** – See how many jobs found per portal
- **LinkedIn Easy Apply** – Connect your LinkedIn account and apply with one click
- **Dark/Light Mode** – Toggle theme with full dark mode support
- **Responsive** – Works on desktop, tablet, and mobile
- **Direct Apply Links** – Each job opens the original portal in a new tab

## Tech Stack

- HTML5, CSS3 (Vanilla), JavaScript (Vanilla)
- No frameworks or dependencies
- Google Fonts (Inter, DM Sans, DM Mono)

## How to Use

1. Open `index.html` in any browser
2. Enter a job role (e.g., "Product Manager")
3. Select a location (e.g., "Bangalore")
4. Click **Search Jobs**
5. Browse results, filter by type, sort as needed
6. Click **Apply** to open the job on the original portal

### LinkedIn Easy Apply

1. Click **Connect LinkedIn** in the header
2. Enter your LinkedIn credentials (stored locally only)
3. Jobs with Easy Apply badge will show an **⚡ Easy Apply** button
4. Click to auto-apply directly from JobSphere

## Architecture

The app is designed with a modular `generateJobsForPortal()` function that can be replaced with real API integrations when available. The portal definitions in `PORTALS` array make it easy to add or remove job sources.

## Future Roadmap

- [ ] Real API integrations for each portal
- [ ] LinkedIn Easy Apply automation via OAuth
- [ ] Resume upload and auto-fill
- [ ] Job alerts and saved searches
- [ ] Application tracking dashboard

## License

MIT
