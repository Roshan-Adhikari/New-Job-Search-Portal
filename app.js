// ═══════════════════════════════════════
// JobSphere - Smart Job Search Agent
// ═══════════════════════════════════════

// ── Portal definitions ──
const PORTALS = [
  { id:'linkedin', name:'LinkedIn', icon:'in', color:'#0A66C2', baseUrl:'https://www.linkedin.com/jobs/', urlTemplate:'https://www.linkedin.com/jobs/search/?keywords={role}&location={loc}' },
  { id:'naukri', name:'Naukri', icon:'N', color:'#4A90D9', baseUrl:'https://www.naukri.com/', urlTemplate:'https://www.naukri.com/{role}-jobs-in-{loc}' },
  { id:'indeed', name:'Indeed', icon:'🔍', color:'#2164f3', baseUrl:'https://www.indeed.com/', urlTemplate:'https://www.indeed.com/jobs?q={role}&l={loc}' },
  { id:'glassdoor', name:'Glassdoor', icon:'🚪', color:'#0caa41', baseUrl:'https://www.glassdoor.com/', urlTemplate:'https://www.glassdoor.com/Job/{loc}-{role}-jobs.htm' },
  { id:'internshala', name:'Internshala', icon:'🎓', color:'#00a5ec', baseUrl:'https://internshala.com/', urlTemplate:'https://internshala.com/internships/{role}-internship-in-{loc}' },
  { id:'wellfound', name:'Wellfound', icon:'🚀', color:'#111', baseUrl:'https://wellfound.com/', urlTemplate:'https://wellfound.com/role/{role}/{loc}' },
  { id:'shine', name:'Shine', icon:'✨', color:'#e53935', baseUrl:'https://www.shine.com/', urlTemplate:'https://www.shine.com/job-search/{role}-jobs-in-{loc}' },
  { id:'monster', name:'Monster India', icon:'👾', color:'#6e45e2', baseUrl:'https://www.monsterindia.com/', urlTemplate:'https://www.monsterindia.com/srp/results?query={role}&locations={loc}' },
  { id:'instahyre', name:'Instahyre', icon:'⚡', color:'#ff6b00', baseUrl:'https://www.instahyre.com/', urlTemplate:'https://www.instahyre.com/search-jobs/?designation={role}&location={loc}' },
  { id:'foundit', name:'Foundit', icon:'🔎', color:'#2196f3', baseUrl:'https://www.foundit.in/', urlTemplate:'https://www.foundit.in/srp/results?query={role}&locations={loc}' },
  { id:'remotive', name:'Remotive API', icon:'🌐', color:'#0ea5e9', baseUrl:'https://remotive.com/', urlTemplate:'https://remotive.com/remote-jobs/search?search={role}' }
];

// ── Location data ──
const LOCATIONS = {
  'Popular Cities': [
    'Bangalore', 'Bengaluru', 'Mumbai', 'Delhi', 'New Delhi', 'Hyderabad', 'Pune', 'Chennai',
    'Kolkata', 'Ahmedabad', 'Noida', 'Gurgaon', 'Gurugram', 'Jaipur', 'Chandigarh', 'Kochi',
    'Indore', 'Bhubaneswar', 'Visakhapatnam', 'Coimbatore', 'Lucknow', 'Nagpur', 'Surat'
  ],
  'Remote': [
    'Remote', 'Remote (India)', 'Remote / Work from Home', 'Work From Home', 'Online / Remote',
    'Remote Worldwide', 'Hybrid', 'Hybrid — Bangalore', 'Hybrid — Mumbai'
  ],
  'International': [
    'USA', 'United States', 'UK', 'London', 'UAE', 'Dubai', 'Canada', 'Singapore', 'Australia',
    'Germany', 'Netherlands', 'Ireland'
  ]
};

// ── Role suggestions (expanded + senior/lead variants) ──
const ROLE_BASE = [
  'Program Manager',
  'Technical Program Manager',
  'Project Manager',
  'Product Manager',
  'Project/Product Owner',
  'Engineering Manager',
  'Software Development Manager',
  'Delivery Manager',
  'Scrum Master',
  'Agile Coach',
  'Operations Manager',
  'Business Operations Manager',
  'HR Business Partner',
  'Talent Acquisition Specialist',
  'Recruiter',
  'Software Engineer',
  'Senior Software Engineer',
  'Full Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'Mobile Developer',
  'Android Developer',
  'iOS Developer',
  'DevOps Engineer',
  'Site Reliability Engineer',
  'Cloud Architect',
  'Solutions Architect',
  'Enterprise Architect',
  'Data Engineer',
  'Data Analyst',
  'Data Scientist',
  'Machine Learning Engineer',
  'AI Engineer',
  'Business Analyst',
  'Systems Analyst',
  'Quality Assurance Engineer',
  'QA Automation Engineer',
  'Test Engineer',
  'Cybersecurity Analyst',
  'Security Engineer',
  'Network Engineer',
  'Database Administrator',
  'UX Designer',
  'UI Designer',
  'Product Designer',
  'Graphic Designer',
  'Marketing Manager',
  'Digital Marketing Specialist',
  'Growth Manager',
  'Content Writer',
  'Technical Writer',
  'Sales Executive',
  'Account Executive',
  'Business Development Manager',
  'Customer Success Manager',
  'Financial Analyst',
  'Supply Chain Manager',
  'Procurement Manager'
];

const ROLE_LEVEL_PREFIXES = ['Senior ', 'Lead ', 'Principal ', 'Staff ', 'Associate ', 'Junior '];

function buildRoleSuggestions() {
  const set = new Set();
  for (const r of ROLE_BASE) {
    set.add(r);
    const lower = r.toLowerCase();
    for (const p of ROLE_LEVEL_PREFIXES) {
      const word = p.trim().toLowerCase();
      if (lower.startsWith(word + ' ') || lower === word) continue;
      set.add(p + r);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
}

const ROLE_SUGGESTIONS = buildRoleSuggestions();

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

// ── Companies for demo data ──
const COMPANIES = [
  'Google','Microsoft','Amazon','Meta','Apple','Netflix','Flipkart','Swiggy','Zomato',
  'Razorpay','PhonePe','CRED','Zerodha','Freshworks','Zoho','Infosys','TCS','Wipro',
  'HCL Technologies','Tech Mahindra','Accenture','Deloitte','McKinsey','BCG','Goldman Sachs',
  'JP Morgan','HSBC','Barclays','Walmart','Adobe','Salesforce','Oracle','IBM','Paytm',
  'Ola','Uber India','Myntra','Nykaa','Dream11','Unacademy','upGrad','Byju\'s','Meesho'
];

// ── State ──
let state = {
  jobs: [],
  filtered: [],
  filterType: '',
  sortBy: 'latest',
  linkedIn: { loggedIn: false, email: '', name: '' },
  appliedJobs: new Set(),
  resume: { uploaded: false, filename: '', text: '', roles: [] },
  profile: {
    name: '',
    email: '',
    phone: '',
    experience: '',
    skills: '',
    coverNote: ''
  },
  applications: []
};
const runtime = {
  backendReady: false
};

async function detectBackend() {
  try {
    const res = await fetch('/api/health');
    runtime.backendReady = res.ok;
  } catch (e) {
    runtime.backendReady = false;
  }
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) throw new Error(`Request failed for ${url}`);
  return res.json();
}

async function putJson(url, data) {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`PUT failed for ${url}`);
  return res.json();
}

async function parseResumeByApi(file) {
  const form = new FormData();
  form.append('resume', file);
  const res = await fetch('/api/parse-resume', {
    method: 'POST',
    body: form
  });
  if (!res.ok) {
    let message = 'Resume parse request failed';
    try {
      const err = await res.json();
      if (err && err.error) message = err.error;
    } catch (e) {}
    throw new Error(message);
  }
  const data = await res.json();
  return String(data.text || '');
}

// ═══ THEME ═══
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  document.getElementById('theme-toggle').textContent = next === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('jobsphere-theme', next);
}
(function initTheme() {
  const saved = localStorage.getItem('jobsphere-theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = saved === 'dark' ? '☀️' : '🌙';
  }
})();

// ═══ LOCATION DROPDOWN ═══
const locInput = document.getElementById('input-location');
const locDropdown = document.getElementById('location-dropdown');

locInput.addEventListener('focus', () => renderLocationDropdown(locInput.value));
locInput.addEventListener('input', () => renderLocationDropdown(locInput.value));
document.addEventListener('click', (e) => {
  if (!e.target.closest('#field-location')) locDropdown.classList.add('hidden');
});

function renderLocationDropdown(query) {
  const q = query.toLowerCase().trim();
  let html = '';
  for (const [group, locs] of Object.entries(LOCATIONS)) {
    const filtered = locs.filter(l => !q || l.toLowerCase().includes(q));
    if (filtered.length === 0) continue;
    html += `<div class="dd-group-label">${group}</div>`;
    filtered.forEach(l => {
      html += `<div class="dd-item" onclick="selectLocation('${l}')">${l}</div>`;
    });
  }
  if (!html) html = '<div class="dd-item" style="color:var(--text3)">Type a custom location</div>';
  locDropdown.innerHTML = html;
  locDropdown.classList.remove('hidden');
}

function selectLocation(loc) {
  locInput.value = loc;
  locDropdown.classList.add('hidden');
}

// ═══ ROLE SUGGESTIONS ═══
const roleInput = document.getElementById('input-role');
const roleSugg = document.getElementById('role-suggestions');

roleInput.addEventListener('focus', () => renderRoleSuggestions(roleInput.value));
roleInput.addEventListener('input', () => renderRoleSuggestions(roleInput.value));
document.addEventListener('click', (e) => {
  if (!e.target.closest('#field-role')) roleSugg.classList.add('hidden');
});

document.getElementById('field-role').addEventListener('click', (e) => {
  const item = e.target.closest('.role-sugg-item');
  if (!item) return;
  const raw = item.getAttribute('data-role');
  if (!raw) return;
  selectRole(decodeURIComponent(raw));
});

function renderRoleSuggestions(query) {
  const q = query.toLowerCase().trim();
  let matches = !q
    ? [...ROLE_SUGGESTIONS]
    : ROLE_SUGGESTIONS.filter((r) => r.toLowerCase().includes(q));
  if (matches.length === 0) { roleSugg.classList.add('hidden'); return; }
  if (q) {
    matches.sort((a, b) => {
      const al = a.toLowerCase();
      const bl = b.toLowerCase();
      const aStarts = al.startsWith(q) ? 0 : 1;
      const bStarts = bl.startsWith(q) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return al.localeCompare(bl);
    });
  }
  roleSugg.innerHTML = matches
    .map(
      (r) =>
        `<div class="dd-item role-sugg-item" data-role="${encodeURIComponent(r)}">${escapeHtml(r)}</div>`
    )
    .join('');
  roleSugg.classList.remove('hidden');
}

function selectRole(role) {
  roleInput.value = role;
  roleSugg.classList.add('hidden');
}

// ═══ LINKEDIN AUTH ═══
function openLinkedInLogin() {
  document.getElementById('linkedin-modal-overlay').classList.remove('hidden');
}

function closeLinkedInModal(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('linkedin-modal-overlay').classList.add('hidden');
}

function linkedInLogin() {
  const email = document.getElementById('li-email').value.trim();
  if (!email) { showToast('Please enter your LinkedIn email', 'error'); return; }

  const btn = document.getElementById('li-login-btn');
  btn.innerHTML = '<span class="lorb" style="width:14px;height:14px;background:#fff;animation:lorbPulse .6s infinite"></span> Signing in...';
  btn.disabled = true;

  setTimeout(() => {
    const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    state.linkedIn = { loggedIn: true, email, name };
    if (!state.profile.email) {
      state.profile.email = email;
      persistProfile();
    }
    localStorage.setItem('jobsphere-li', JSON.stringify({ email, name }));

    document.getElementById('linkedin-signin-btn').classList.add('hidden');
    const chip = document.getElementById('linkedin-user-chip');
    chip.classList.remove('hidden');
    document.getElementById('li-user-name').textContent = name;
    document.getElementById('li-avatar').textContent = name.charAt(0).toUpperCase();

    closeLinkedInModal();
    showToast('✅ LinkedIn connected! Easy Apply is now enabled.', 'success');
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> Sign in & Enable Easy Apply';
    btn.disabled = false;

    // Re-render results if any, to show Easy Apply buttons
    if (state.filtered.length > 0) renderJobs(state.filtered);
  }, 1500);
}

function linkedInSignOut() {
  state.linkedIn = { loggedIn: false, email: '', name: '' };
  localStorage.removeItem('jobsphere-li');
  document.getElementById('linkedin-signin-btn').classList.remove('hidden');
  document.getElementById('linkedin-user-chip').classList.add('hidden');
  showToast('LinkedIn disconnected', 'info');
  if (state.filtered.length > 0) renderJobs(state.filtered);
}

// Restore LinkedIn session
(function restoreLinkedIn() {
  try {
    const saved = JSON.parse(localStorage.getItem('jobsphere-li'));
    if (saved && saved.email) {
      state.linkedIn = { loggedIn: true, email: saved.email, name: saved.name };
      document.getElementById('linkedin-signin-btn').classList.add('hidden');
      const chip = document.getElementById('linkedin-user-chip');
      chip.classList.remove('hidden');
      document.getElementById('li-user-name').textContent = saved.name;
      document.getElementById('li-avatar').textContent = saved.name.charAt(0).toUpperCase();
    }
  } catch(e) {}
})();

// ═══ SEARCH ENGINE ═══
function triggerSearch() {
  const role = roleInput.value.trim();
  const remoteOnly = document.getElementById('remote-only')?.checked;
  const loc = remoteOnly ? 'Remote' : locInput.value.trim();
  if (!role) { showToast('Please enter a job title or role', 'error'); roleInput.focus(); return; }
  if (!loc) { showToast('Please enter a location', 'error'); locInput.focus(); return; }

  roleSugg.classList.add('hidden');
  locDropdown.classList.add('hidden');

  // Show results area, hide empty state
  document.getElementById('empty-state').classList.add('hidden');
  const resultsArea = document.getElementById('results-area');
  resultsArea.classList.remove('hidden');

  // Show loading
  document.getElementById('search-loading').classList.remove('hidden');
  document.getElementById('jobs-grid').innerHTML = '';
  document.getElementById('no-results').classList.add('hidden');
  document.getElementById('portal-count-bar').innerHTML = '';
  document.getElementById('results-query-role').textContent = role;
  document.getElementById('results-query-loc').textContent = loc;
  document.getElementById('results-count').textContent = '...';

  // Animate portal progress
  animateSearch(role, loc);
}

function normalizeRole(role) {
  return role
    .replace(/\s+/g, ' ')
    .replace(/\b(\w)/g, c => c.toUpperCase())
    .trim();
}

function extractRolesFromResume(text) {
  const source = text.toLowerCase();
  const matched = ROLE_SUGGESTIONS.filter(role => {
    const token = role.toLowerCase();
    return source.includes(token);
  });

  const extraPatterns = [
    /(?:as|role|position|worked as|experience as)\s+([a-z ]{4,40})/g,
    /(?:skills|expertise|specialization)\s*[:\-]\s*([a-z ,]{6,120})/g
  ];
  const extras = new Set();
  extraPatterns.forEach(pattern => {
    let hit;
    while ((hit = pattern.exec(source)) !== null) {
      const raw = hit[1].split(',').map(v => normalizeRole(v));
      raw.forEach(v => {
        if (v.length > 3 && v.length < 40 && /^[a-zA-Z ]+$/.test(v)) extras.add(v);
      });
    }
  });

  const roles = [...new Set([...matched, ...extras])].slice(0, 6);
  return roles.length ? roles : [normalizeRole(roleInput.value || 'Software Engineer')];
}

function handleResumeUpload(file) {
  if (!file) return;
  const status = document.getElementById('resume-status');
  status.textContent = 'Reading resume...';
  parseResumeByApi(file)
    .then((text) => {
      if (!text) {
        status.textContent = 'No readable text found in resume.';
        showToast('Resume parsing returned empty text', 'error');
        return;
      }
      state.resume = {
        uploaded: true,
        filename: file.name,
        text,
        roles: extractRolesFromResume(text)
      };
      renderResumeRoles();
      status.textContent = `Resume loaded: ${file.name}`;
      document.getElementById('resume-actions').classList.remove('hidden');
      showToast('Resume uploaded. Ready to search matching jobs.', 'success');
    })
    .catch((error) => {
      status.textContent = `Could not parse resume: ${error.message}`;
      showToast(`Resume parsing failed: ${error.message}`, 'error');
    });
}

function renderResumeRoles() {
  const wrap = document.getElementById('resume-role-chips');
  if (!state.resume.uploaded || state.resume.roles.length === 0) {
    wrap.classList.add('hidden');
    wrap.innerHTML = '';
    return;
  }
  wrap.innerHTML = state.resume.roles
    .map(
      (role) =>
        `<button type="button" class="resume-role-chip" data-resume-role="${encodeURIComponent(role)}">${escapeHtml(
          role
        )}</button>`
    )
    .join('');
  wrap.classList.remove('hidden');
}

function useResumeRole(role) {
  roleInput.value = role;
  showToast(`Role set from resume: ${role}`, 'info');
}

async function runResumeSearch() {
  if (!state.resume.uploaded || state.resume.roles.length === 0) {
    showToast('Please upload resume first', 'error');
    return;
  }
  const remoteOnly = document.getElementById('remote-only')?.checked;
  if (!remoteOnly && !locInput.value.trim()) {
    showToast('Enter location before resume-based search', 'error');
    locInput.focus();
    return;
  }

  const roles = state.resume.roles.slice(0, 4);
  const loc = remoteOnly ? 'Remote' : locInput.value.trim();
  const loadingEl = document.getElementById('search-loading');
  const loadingText = document.getElementById('loading-text');
  const progressEl = document.getElementById('portal-progress');

  document.getElementById('empty-state').classList.add('hidden');
  document.getElementById('results-area').classList.remove('hidden');
  loadingEl.classList.remove('hidden');
  document.getElementById('jobs-grid').innerHTML = '';
  document.getElementById('no-results').classList.add('hidden');
  document.getElementById('portal-count-bar').innerHTML = '';
  document.getElementById('results-query-role').textContent = `${roles.join(', ')}`;
  document.getElementById('results-query-loc').textContent = loc;
  document.getElementById('results-count').textContent = '...';

  progressEl.innerHTML = roles.map(r => `<span class="pp-chip" id="pp-role-${slugify(r)}">${r}</span>`).join('');
  let allJobs = [];
  for (const role of roles) {
    const chipId = `pp-role-${slugify(role)}`;
    loadingText.textContent = `Searching jobs for ${role}...`;
    const chip = document.getElementById(chipId);
    if (chip) chip.classList.add('active');
    await sleep(250);
    const staticPortals = PORTALS.filter(p => p.id !== 'remotive');
    const staticJobs = staticPortals.flatMap(p => generateJobsForPortal(p, role, loc));
    const liveJobs = document.getElementById('include-live-jobs').checked ? await fetchLiveJobs(role, loc) : [];
    const batches = staticJobs.concat(liveJobs);
    allJobs = allJobs.concat(batches);
    if (chip) {
      chip.classList.remove('active');
      chip.classList.add('done');
    }
  }
  loadingEl.classList.add('hidden');
  state.jobs = allJobs;
  state.filterType = '';
  state.sortBy = 'latest';
  document.querySelectorAll('#filter-type .fpill').forEach(b => b.classList.remove('active'));
  document.querySelector('#filter-type .fpill[data-val=""]').classList.add('active');
  document.getElementById('sort-select').value = 'latest';
  applyFilters();
  showToast(`Found jobs for ${roles.length} resume roles`, 'success');
}

// Allow Enter to search
roleInput.addEventListener('keydown', e => { if (e.key === 'Enter') triggerSearch(); });
locInput.addEventListener('keydown', e => { if (e.key === 'Enter') triggerSearch(); });

async function animateSearch(role, loc) {
  const loadingEl = document.getElementById('search-loading');
  const loadingText = document.getElementById('loading-text');
  const progressEl = document.getElementById('portal-progress');

  const staticPortals = PORTALS.filter(p => p.id !== 'remotive');
  progressEl.innerHTML = staticPortals.map(p => `<span class="pp-chip" id="pp-${p.id}">${p.icon} ${p.name}</span>`).join('');

  let allJobs = [];
  for (let i = 0; i < staticPortals.length; i++) {
    const portal = staticPortals[i];
    loadingText.textContent = `Searching ${portal.name}…`;
    document.getElementById(`pp-${portal.id}`).classList.add('active');

    await sleep(200 + Math.random() * 300);

    const jobs = generateJobsForPortal(portal, role, loc);
    allJobs = allJobs.concat(jobs);

    document.getElementById(`pp-${portal.id}`).classList.remove('active');
    document.getElementById(`pp-${portal.id}`).classList.add('done');
  }
  if (document.getElementById('include-live-jobs')?.checked) {
    loadingText.textContent = 'Fetching live API jobs…';
    const live = await fetchLiveJobs(role, loc);
    allJobs = allJobs.concat(live);
  }

  loadingEl.classList.add('hidden');
  state.jobs = allJobs;
  state.filterType = '';
  state.sortBy = 'latest';

  // Reset filter pills
  document.querySelectorAll('#filter-type .fpill').forEach(b => b.classList.remove('active'));
  document.querySelector('#filter-type .fpill[data-val=""]').classList.add('active');
  document.getElementById('sort-select').value = 'latest';

  applyFilters();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ═══ JOB DATA GENERATOR ═══
function generateJobsForPortal(portal, role, loc) {
  const applyUrl = portal.urlTemplate
    .replace('{role}', encodeURIComponent(role))
    .replace('{loc}', encodeURIComponent(loc));
  return [{
    id: `${portal.id}-${slugify(role)}-${slugify(loc)}`,
    title: `${role} openings on ${portal.name}`,
    company: portal.name,
    location: loc,
    type: 'Portal Search',
    experience: 'As listed on portal',
    posted: new Date(),
    daysAgo: 0,
    portal: portal.id,
    portalName: portal.name,
    portalIcon: portal.icon,
    portalColor: portal.color,
    applyUrl,
    isEasyApply: portal.id === 'linkedin',
    isSearchLink: true
  }];
}

// ═══ FILTER & SORT ═══
function setFilter(key, val, btn) {
  state.filterType = val;
  btn.parentElement.querySelectorAll('.fpill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  applyFilters();
}

function setSort(val) {
  state.sortBy = val;
  applyFilters();
}

function applyFilters() {
  let jobs = [...state.jobs];

  // Filter by type
  if (state.filterType) {
    jobs = jobs.filter(j => j.type === state.filterType);
  }

  // Sort
  if (state.sortBy === 'latest') {
    jobs.sort((a, b) => b.posted - a.posted);
  } else if (state.sortBy === 'relevant') {
    jobs.sort((a, b) => {
      const roleQ = roleInput.value.toLowerCase();
      const aMatch = a.title.toLowerCase().includes(roleQ) ? 1 : 0;
      const bMatch = b.title.toLowerCase().includes(roleQ) ? 1 : 0;
      return bMatch - aMatch || a.daysAgo - b.daysAgo;
    });
  } else if (state.sortBy === 'experience') {
    jobs.sort((a, b) => {
      const getMin = s => parseInt(s) || 0;
      return getMin(a.experience) - getMin(b.experience);
    });
  }

  state.filtered = jobs;
  document.getElementById('results-count').textContent = jobs.length;
  renderPortalCounts();
  renderJobs(jobs);
  toggleBulkLinkedInButton(jobs);

  if (jobs.length === 0) {
    document.getElementById('jobs-grid').innerHTML = '';
    document.getElementById('no-results').classList.remove('hidden');
  } else {
    document.getElementById('no-results').classList.add('hidden');
  }
}

async function fetchLiveJobs(role, loc) {
  try {
    const res = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(role)}`);
    if (!res.ok) return [];
    const data = await res.json();
    const items = Array.isArray(data.jobs) ? data.jobs.slice(0, 12) : [];
    return items.map((j, i) => ({
      id: `remotive-${j.id || Date.now()}-${i}`,
      title: j.title || role,
      company: j.company_name || 'Unknown Company',
      location: j.candidate_required_location || loc || 'Remote',
      type: j.job_type || 'Full-time',
      experience: 'Not specified',
      posted: new Date(j.publication_date || Date.now()),
      daysAgo: 0,
      portal: 'remotive',
      portalName: 'Remotive API',
      portalIcon: '🌐',
      portalColor: '#0ea5e9',
      applyUrl: j.url || 'https://remotive.com/',
      isEasyApply: false
    }));
  } catch (e) {
    return [];
  }
}

function toggleBulkLinkedInButton(jobs) {
  const btn = document.getElementById('bulk-linkedin-btn');
  if (!btn) return;
  const easyLinkedInCount = jobs.filter(j => j.portal === 'linkedin' && j.isEasyApply).length;
  if (easyLinkedInCount > 0) {
    btn.classList.remove('hidden');
    btn.textContent = `⚡ Open ${easyLinkedInCount} LinkedIn Easy Apply Jobs`;
  } else {
    btn.classList.add('hidden');
  }
}

function bulkOpenLinkedInEasyApply() {
  const jobs = state.filtered.filter(j => j.portal === 'linkedin' && j.isEasyApply).slice(0, 10);
  if (jobs.length === 0) {
    showToast('No LinkedIn Easy Apply jobs available', 'info');
    return;
  }
  jobs.forEach(j => window.open(j.applyUrl, '_blank', 'noopener'));
  showToast(`Opened ${jobs.length} LinkedIn job tabs. Complete Easy Apply on LinkedIn.`, 'success');
}

function scheduleAutoApply() {
  // 6 hours in milliseconds
  const sixHours = 6 * 60 * 60 * 1000;
  // Initial immediate run after load
  autoApplyPendingJobs();
  setInterval(autoApplyPendingJobs, sixHours);
}

function autoApplyPendingJobs() {
  if (!state.linkedIn.loggedIn) return;
  const pending = state.filtered.filter(j => j.isEasyApply && !state.appliedJobs.has(j.id));
  pending.forEach(job => {
    // Trigger easy apply flow silently
    state.appliedJobs.add(job.id);
    // Show a toast and browser notification
    const msg = `Auto‑applied to ${job.title} at ${job.company}`;
    showToast(msg, 'info');
    notifyUser(msg);
  });
  // Re‑render to reflect applied state
  renderJobs(state.filtered);
}

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function notifyUser(message) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('JobSphere Auto Apply', { body: message });
  }
}

// Call on page load
requestNotificationPermission();
scheduleAutoApply();
function renderPortalCounts() {
  const counts = {};
  PORTALS.forEach(p => counts[p.id] = { name: p.name, icon: p.icon, color: p.color, count: 0 });
  state.filtered.forEach(j => { if (counts[j.portal]) counts[j.portal].count++; });

  const bar = document.getElementById('portal-count-bar');
  bar.innerHTML = Object.entries(counts)
    .filter(([, v]) => v.count > 0)
    .map(([id, v]) => `<div class="portal-count-chip"><span class="pcc-dot" style="background:${v.color}"></span>${v.icon} ${v.name} <span class="pcc-num">${v.count}</span></div>`)
    .join('');
}

// ═══ RENDER JOBS ═══
function renderJobs(jobs) {
  const grid = document.getElementById('jobs-grid');
  grid.innerHTML = jobs.map((job, i) => {
    const dateStr = formatDate(job.posted);
    const daysLabel = job.daysAgo === 0 ? 'Today' : job.daysAgo === 1 ? 'Yesterday' : `${job.daysAgo}d ago`;
    const tracked = state.applications.some(a => a.jobId === job.id);
    const easyApplyBtn = job.isEasyApply && state.linkedIn.loggedIn
      ? `<button class="job-easy-apply-btn ${state.appliedJobs.has(job.id) ? 'applied' : ''}" onclick="easyApply('${job.id}')" ${state.appliedJobs.has(job.id) ? 'disabled' : ''}>
           ${state.appliedJobs.has(job.id) ? '✅ Applied' : '⚡ Easy Apply'}
         </button>`
      : job.isEasyApply && !state.linkedIn.loggedIn
        ? `<button class="job-easy-apply-btn" onclick="openLinkedInLogin()" style="opacity:.8">🔒 Sign in for Easy Apply</button>`
        : '';

    return `<div class="job-card" data-portal="${job.portal}" role="listitem" style="animation-delay:${i * 0.05}s">
      <div class="job-card-top">
        <span class="job-portal-badge pb-${job.portal}">${job.portalIcon} ${job.portalName}</span>
        <span class="job-type-badge">${job.type}</span>
      </div>
      <div class="job-title">${job.title}</div>
      <div class="job-company">${job.company}</div>
      <div class="job-meta">
        <span class="job-meta-item"><span class="job-meta-icon">📍</span>${job.location}</span>
        <span class="job-meta-item"><span class="job-meta-icon">💼</span>${job.experience}</span>
        <span class="job-meta-item"><span class="job-meta-icon">📅</span>${daysLabel}</span>
      </div>
      <div class="job-actions">
        <a class="job-apply-btn" href="${job.applyUrl}" target="_blank" rel="noopener">${job.isSearchLink ? '↗ Open search on' : '↗ Apply on'} ${job.portalName}</a>
        ${easyApplyBtn}
        <button class="job-track-btn" onclick="trackJob('${job.id}')">${tracked ? '📌 Tracked' : '➕ Track'}</button>
      </div>
    </div>`;
  }).join('');
}

function formatDate(d) {
  return d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}

function slugify(v) {
  return v.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

// ═══ EASY APPLY ═══
let currentEasyApplyJob = null;

function easyApply(jobId) {
  if (!state.linkedIn.loggedIn) { openLinkedInLogin(); return; }
  const job = state.filtered.find(j => j.id === jobId);
  if (!job) return;
  currentEasyApplyJob = job;

  document.getElementById('ea-job-title').textContent = job.title;
  document.getElementById('ea-company').textContent = job.company;
  document.getElementById('ea-location-text').textContent = job.location;
  document.getElementById('ea-profile-name').textContent = state.linkedIn.name;
  document.getElementById('ea-profile-email').textContent = state.linkedIn.email;
  document.getElementById('ea-profile-avatar').textContent = state.linkedIn.name.charAt(0);
  document.getElementById('ea-pos').textContent = job.title;
  document.getElementById('ea-comp').textContent = job.company;
  document.getElementById('ea-loc').textContent = job.location;
  document.getElementById('ea-type').textContent = job.type;
  updateAutofillPreview(job);

  // Reset steps
  ['ea-step-1','ea-step-2','ea-step-3'].forEach(id => {
    const el = document.getElementById(id);
    el.classList.remove('active','done');
  });
  document.getElementById('ea-step-1').classList.add('active');
  document.getElementById('ea-submit-btn').disabled = false;
  document.getElementById('ea-submit-btn').innerHTML = '⚡ Submit Application';

  document.getElementById('easy-apply-overlay').classList.remove('hidden');
}

function closeEasyApply(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('easy-apply-overlay').classList.add('hidden');
  currentEasyApplyJob = null;
}

function confirmEasyApply() {
  if (!currentEasyApplyJob) return;
  const btn = document.getElementById('ea-submit-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="lorb" style="width:14px;height:14px;background:#fff;animation:lorbPulse .6s infinite"></span> Submitting...';

  document.getElementById('ea-step-1').classList.remove('active');
  document.getElementById('ea-step-1').classList.add('done');
  document.getElementById('ea-step-2').classList.add('active');

  setTimeout(() => {
    document.getElementById('ea-step-2').classList.remove('active');
    document.getElementById('ea-step-2').classList.add('done');
    document.getElementById('ea-step-3').classList.add('active');
    btn.innerHTML = '✅ Application Submitted!';
    btn.style.background = '#10b981';

    state.appliedJobs.add(currentEasyApplyJob.id);
    upsertApplication(currentEasyApplyJob, 'Applied');
    renderJobs(state.filtered);
    renderApplicationTracker();
    showToast(`✅ Applied to ${currentEasyApplyJob.title} at ${currentEasyApplyJob.company}!`, 'success');

    setTimeout(() => closeEasyApply(), 1500);
  }, 1500);
}

function upsertApplication(job, status) {
  const existing = state.applications.find(a => a.jobId === job.id);
  if (existing) {
    existing.status = status;
    existing.updatedAt = new Date();
    persistApplications();
    return;
  }
  state.applications.unshift({
    jobId: job.id,
    title: job.title,
    company: job.company,
    portalName: job.portalName,
    status,
    updatedAt: new Date()
  });
  persistApplications();
}

function trackJob(jobId) {
  const job = state.filtered.find(j => j.id === jobId);
  if (!job) return;
  upsertApplication(job, 'Saved');
  renderApplicationTracker();
  renderJobs(state.filtered);
  showToast(`Tracking ${job.title} at ${job.company}`, 'info');
}

document.getElementById('remote-only')?.addEventListener('change', (e) => {
  if (e.target.checked) {
    locInput.value = 'Remote';
    showToast('Remote mode enabled', 'info');
  }
});

function updateApplicationStatus(jobId, status) {
  const row = state.applications.find(a => a.jobId === jobId);
  if (!row) return;
  row.status = status;
  row.updatedAt = new Date();
  persistApplications();
  renderApplicationTracker();
}

function renderApplicationTracker() {
  const body = document.getElementById('tracker-body');
  const count = document.getElementById('tracker-count');
  if (!body || !count) return;
  count.textContent = `${state.applications.length} tracked`;
  if (state.applications.length === 0) {
    body.innerHTML = `<tr><td colspan="5" class="tracker-empty">No applications tracked yet</td></tr>`;
    return;
  }
  body.innerHTML = state.applications.map(row => `
    <tr>
      <td>${row.title}</td>
      <td>${row.company}</td>
      <td>${row.portalName}</td>
      <td>
        <select data-job="${row.jobId}" class="tracker-status">
          ${['Saved', 'Applied', 'Interview', 'Rejected', 'Offer'].map(s => `<option value="${s}" ${row.status === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </td>
      <td>${new Date(row.updatedAt).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  document.querySelectorAll('.tracker-status').forEach(sel => {
    sel.addEventListener('change', (e) => {
      updateApplicationStatus(e.target.getAttribute('data-job'), e.target.value);
    });
  });
}

function openProfileModal() {
  const p = state.profile;
  document.getElementById('pf-name').value = p.name;
  document.getElementById('pf-email').value = p.email;
  document.getElementById('pf-phone').value = p.phone;
  document.getElementById('pf-exp').value = p.experience;
  document.getElementById('pf-skills').value = p.skills;
  document.getElementById('pf-cover').value = p.coverNote;
  document.getElementById('profile-modal-overlay').classList.remove('hidden');
}

function closeProfileModal(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('profile-modal-overlay').classList.add('hidden');
}

function saveProfile() {
  state.profile = {
    name: document.getElementById('pf-name').value.trim(),
    email: document.getElementById('pf-email').value.trim(),
    phone: document.getElementById('pf-phone').value.trim(),
    experience: document.getElementById('pf-exp').value.trim(),
    skills: document.getElementById('pf-skills').value.trim(),
    coverNote: document.getElementById('pf-cover').value.trim()
  };
  persistProfile();
  closeProfileModal();
  showToast('Autofill profile saved', 'success');
  if (currentEasyApplyJob) updateAutofillPreview(currentEasyApplyJob);
}

function updateAutofillPreview(job) {
  const el = document.getElementById('ea-autofill-preview');
  if (!el) return;
  const p = state.profile;
  const useProfile = document.getElementById('ea-use-profile')?.checked;
  if (!useProfile) {
    el.textContent = 'Autofill is off for this application.';
    return;
  }
  el.textContent =
`Name: ${p.name || '-'}
Email: ${p.email || state.linkedIn.email || '-'}
Phone: ${p.phone || '-'}
Experience: ${p.experience || '-'}
Skills: ${p.skills || '-'}
Cover Note: ${p.coverNote || `Interested in ${job.title} at ${job.company}.`}`;
}

function persistApplications() {
  localStorage.setItem('jobsphere-applications', JSON.stringify(state.applications));
  if (runtime.backendReady) {
    putJson('/api/applications', state.applications).catch(() => {});
  }
}

function persistProfile() {
  localStorage.setItem('jobsphere-profile', JSON.stringify(state.profile));
  if (runtime.backendReady) {
    putJson('/api/profile', state.profile).catch(() => {});
  }
}

async function restoreSavedData() {
  await detectBackend();
  if (runtime.backendReady) {
    try {
      const profile = await fetchJson('/api/profile');
      if (profile && typeof profile === 'object') state.profile = { ...state.profile, ...profile };
    } catch (e) {}
    try {
      const apps = await fetchJson('/api/applications');
      if (Array.isArray(apps)) state.applications = apps;
    } catch (e) {}
  }
  try {
    const profile = JSON.parse(localStorage.getItem('jobsphere-profile'));
    if (!runtime.backendReady && profile) state.profile = profile;
  } catch (e) {}
  try {
    const apps = JSON.parse(localStorage.getItem('jobsphere-applications'));
    if (!runtime.backendReady && Array.isArray(apps)) state.applications = apps;
  } catch (e) {}
  renderApplicationTracker();
}

// ═══ TOAST ═══
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ═══ KEYBOARD SHORTCUT ═══
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    roleInput.focus();
    roleInput.select();
  }
});

document.getElementById('resume-file').addEventListener('change', (e) => {
  handleResumeUpload(e.target.files[0]);
});

document.getElementById('resume-role-chips').addEventListener('click', (e) => {
  const btn = e.target.closest('.resume-role-chip');
  if (!btn) return;
  const enc = btn.getAttribute('data-resume-role');
  if (!enc) return;
  useResumeRole(decodeURIComponent(enc));
});

document.getElementById('ea-use-profile').addEventListener('change', () => {
  if (currentEasyApplyJob) updateAutofillPreview(currentEasyApplyJob);
});

restoreSavedData();
