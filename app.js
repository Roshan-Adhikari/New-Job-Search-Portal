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
  { id:'foundit', name:'Foundit', icon:'🔎', color:'#2196f3', baseUrl:'https://www.foundit.in/', urlTemplate:'https://www.foundit.in/srp/results?query={role}&locations={loc}' }
];

// ── Location data ──
const LOCATIONS = {
  'Popular Cities': ['Bangalore','Mumbai','Delhi','Hyderabad','Pune','Chennai','Kolkata','Ahmedabad','Noida','Gurgaon','Jaipur'],
  'Remote': ['Remote (India)','Remote / Work from Home'],
  'International': ['USA','UK','UAE','Canada','Singapore','Australia','Germany']
};

// ── Role suggestions ──
const ROLE_SUGGESTIONS = [
  'Operations Manager','Product Manager','HR Business Partner','Software Engineer',
  'Data Analyst','Marketing Manager','UX Designer','DevOps Engineer','Full Stack Developer',
  'Business Analyst','Project Manager','Sales Executive','Content Writer','Digital Marketing',
  'Frontend Developer','Backend Developer','Cloud Architect','Machine Learning Engineer',
  'Financial Analyst','Supply Chain Manager','Quality Assurance','Cybersecurity Analyst'
];

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
  appliedJobs: new Set()
};

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

function renderRoleSuggestions(query) {
  const q = query.toLowerCase().trim();
  if (!q) { roleSugg.classList.add('hidden'); return; }
  const matches = ROLE_SUGGESTIONS.filter(r => r.toLowerCase().includes(q)).slice(0, 8);
  if (matches.length === 0) { roleSugg.classList.add('hidden'); return; }
  roleSugg.innerHTML = matches.map(r => `<div class="dd-item" onclick="selectRole('${r}')">${r}</div>`).join('');
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

function togglePasswordVisibility() {
  const pw = document.getElementById('li-password');
  pw.type = pw.type === 'password' ? 'text' : 'password';
}

function linkedInLogin() {
  const email = document.getElementById('li-email').value.trim();
  const pass = document.getElementById('li-password').value;
  if (!email || !pass) { showToast('Please enter both email and password', 'error'); return; }

  const btn = document.getElementById('li-login-btn');
  btn.innerHTML = '<span class="lorb" style="width:14px;height:14px;background:#fff;animation:lorbPulse .6s infinite"></span> Signing in...';
  btn.disabled = true;

  setTimeout(() => {
    const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    state.linkedIn = { loggedIn: true, email, name };
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
  const loc = locInput.value.trim();
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

// Allow Enter to search
roleInput.addEventListener('keydown', e => { if (e.key === 'Enter') triggerSearch(); });
locInput.addEventListener('keydown', e => { if (e.key === 'Enter') triggerSearch(); });

async function animateSearch(role, loc) {
  const loadingEl = document.getElementById('search-loading');
  const loadingText = document.getElementById('loading-text');
  const progressEl = document.getElementById('portal-progress');

  progressEl.innerHTML = PORTALS.map(p => `<span class="pp-chip" id="pp-${p.id}">${p.icon} ${p.name}</span>`).join('');

  let allJobs = [];
  for (let i = 0; i < PORTALS.length; i++) {
    const portal = PORTALS[i];
    loadingText.textContent = `Searching ${portal.name}…`;
    document.getElementById(`pp-${portal.id}`).classList.add('active');

    await sleep(200 + Math.random() * 300);

    const jobs = generateJobsForPortal(portal, role, loc);
    allJobs = allJobs.concat(jobs);

    document.getElementById(`pp-${portal.id}`).classList.remove('active');
    document.getElementById(`pp-${portal.id}`).classList.add('done');
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
  const count = 3 + Math.floor(Math.random() * 8); // 3-10 jobs per portal
  const types = ['Full-time','Full-time','Full-time','Part-time','Contract','Internship'];
  const expLevels = ['0-1 years','1-3 years','2-5 years','3-7 years','5-10 years','8+ years'];
  const days = [0,0,1,1,2,3,4,5,7,10,14,21,30];
  const jobs = [];

  // Title variations
  const titleVariations = [
    role,
    `Senior ${role}`,
    `Junior ${role}`,
    `Lead ${role}`,
    `${role} - Remote`,
    `Associate ${role}`,
    `${role} (Contract)`,
    `${role} Specialist`,
    `Head of ${role.replace('Manager','').trim()}`,
    `VP ${role.replace('Manager','').trim()}`
  ];

  for (let i = 0; i < count; i++) {
    const title = titleVariations[Math.floor(Math.random() * titleVariations.length)];
    const company = COMPANIES[Math.floor(Math.random() * COMPANIES.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const exp = expLevels[Math.floor(Math.random() * expLevels.length)];
    const daysAgo = days[Math.floor(Math.random() * days.length)];
    const posted = new Date(Date.now() - daysAgo * 86400000);
    const isEasyApply = portal.id === 'linkedin' && Math.random() > 0.3;

    const applyUrl = portal.urlTemplate
      .replace('{role}', encodeURIComponent(role))
      .replace('{loc}', encodeURIComponent(loc));

    jobs.push({
      id: `${portal.id}-${Date.now()}-${i}`,
      title,
      company,
      location: loc,
      type,
      experience: exp,
      posted,
      daysAgo,
      portal: portal.id,
      portalName: portal.name,
      portalIcon: portal.icon,
      portalColor: portal.color,
      applyUrl,
      isEasyApply
    });
  }
  return jobs;
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

  if (jobs.length === 0) {
    document.getElementById('jobs-grid').innerHTML = '';
    document.getElementById('no-results').classList.remove('hidden');
  } else {
    document.getElementById('no-results').classList.add('hidden');
  }
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
        <a class="job-apply-btn" href="${job.applyUrl}" target="_blank" rel="noopener">↗ Apply on ${job.portalName}</a>
        ${easyApplyBtn}
      </div>
    </div>`;
  }).join('');
}

function formatDate(d) {
  return d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
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
    renderJobs(state.filtered);
    showToast(`✅ Applied to ${currentEasyApplyJob.title} at ${currentEasyApplyJob.company}!`, 'success');

    setTimeout(() => closeEasyApply(), 1500);
  }, 1500);
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
