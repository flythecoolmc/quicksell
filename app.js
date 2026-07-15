// ── THEME ──
function initTheme() {
  const saved = localStorage.getItem('qs_theme') || 'dark';
  setTheme(saved);
}
function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('qs_theme', t);
  document.querySelectorAll('.theme-btn i').forEach(i => {
    i.className = t === 'dark' ? 'ti ti-sun' : 'ti ti-moon';
  });
  document.querySelector('meta[name=theme-color]').content = t === 'dark' ? '#0d0d0d' : '#f5f5f0';
}
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  setTheme(cur === 'dark' ? 'light' : 'dark');
}

// ── ONBOARDING ──
function dismissOnboarding() {
  localStorage.setItem('qs_onboarded', '1');
  document.getElementById('onboarding').classList.add('hidden');
}
function initOnboarding() {
  if (localStorage.getItem('qs_onboarded')) {
    document.getElementById('onboarding').classList.add('hidden');
  }
}

// ── MULTI PHOTO ──
const MAX_PHOTOS = 3;
let photos = [null, null, null]; // {base64, dataUrl}

function initPhotoGrid() {
  const grid = document.getElementById('photoGrid');
  grid.innerHTML = '';
  photos.forEach((p, i) => {
    const slot = document.createElement('div');
    slot.className = 'photo-slot' + (p ? ' filled' : '');
    slot.id = `slot-${i}`;
    if (p) {
      slot.innerHTML = `
        <img src="${p.dataUrl}" alt="Photo ${i+1}">
        <button class="photo-remove" onclick="removePhoto(${i}, event)">&#x2715;</button>`;
    } else {
      const isMain = i === 0;
      slot.innerHTML = `
        <input type="file" accept="image/*" capture="environment" onchange="addPhoto(${i}, this)">
        <div class="photo-slot-icon ${isMain ? '' : 'small'}">
          <i class="ti ti-camera-plus"></i>
          <span>${isMain ? 'Main photo' : 'Add photo'}</span>
        </div>`;
    }
    grid.appendChild(slot);
  });
  updatePhotoCount();
}

function addPhoto(index, input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    photos[index] = { base64: ev.target.result.split(',')[1], dataUrl: ev.target.result };
    initPhotoGrid();
    document.getElementById('scanBtn').disabled = !photos[0];
  };
  reader.readAsDataURL(file);
}

function removePhoto(index, e) {
  e.stopPropagation();
  photos[index] = null;
  // Shift photos left
  photos = photos.filter(Boolean);
  while (photos.length < MAX_PHOTOS) photos.push(null);
  initPhotoGrid();
  document.getElementById('scanBtn').disabled = !photos[0];
}

function updatePhotoCount() {
  const count = photos.filter(Boolean).length;
  const el = document.getElementById('photoCount');
  if (count === 0) { el.innerHTML = ''; return; }
  const warn = count > 1 ? ' · <span style="color:var(--lime)">same item only</span>' : '';
  el.innerHTML = `<strong>${count}</strong> of ${MAX_PHOTOS} photos added — more angles = better estimate${warn}`;
}

// ── PLATFORMS BY REGION ──
const PLATFORM_REGIONS = {
  'SI': { primary: ['Bolha.com', 'Facebook Marketplace'], secondary: ['Mimovrste', 'eBay'] },
  'HR': { primary: ['Njuškalo', 'Facebook Marketplace'], secondary: ['OLX', 'eBay'] },
  'RS': { primary: ['KupujemProdajem', 'Facebook Marketplace'], secondary: ['OLX', 'eBay'] },
  'DE': { primary: ['eBay Kleinanzeigen', 'Facebook Marketplace'], secondary: ['eBay', 'Vinted'] },
  'GB': { primary: ['eBay', 'Facebook Marketplace'], secondary: ['Gumtree', 'Depop'] },
  'US': { primary: ['eBay', 'Facebook Marketplace'], secondary: ['Craigslist', 'Depop'] },
  'default': { primary: ['eBay', 'Facebook Marketplace'], secondary: ['Craigslist', 'Depop'] }
};

let userRegion = localStorage.getItem('qs_region') || 'default';

async function detectRegion() {
  if (localStorage.getItem('qs_region')) return;
  try {
    const r = await fetch('https://ipapi.co/country/');
    const country = await r.text();
    userRegion = PLATFORM_REGIONS[country] ? country : 'default';
    localStorage.setItem('qs_region', userRegion);
  } catch { userRegion = 'default'; }
}

function getPlatforms() {
  return PLATFORM_REGIONS[userRegion] || PLATFORM_REGIONS['default'];
}

// ── LOADING ──
const STEPS = [
  { icon: 'ti-search',       text: 'Identifying item' },
  { icon: 'ti-shield-check', text: 'Assessing condition' },
  { icon: 'ti-chart-line',   text: 'Searching sold listings' },
  { icon: 'ti-file-text',    text: 'Building your report' },
];

function showLoadingScreen() {
  document.getElementById('mainNav').style.display = 'none';
  document.querySelectorAll('.scr').forEach(s => s.classList.add('hidden'));
  document.getElementById('scrLoading').classList.remove('hidden');
  renderSteps(-1); setProgress(0);
}
function hideLoadingScreen() {
  document.getElementById('scrLoading').classList.add('hidden');
  document.getElementById('mainNav').style.display = '';
}
function renderSteps(activeIndex) {
  document.getElementById('stepList').innerHTML = STEPS.map((s, i) => {
    const isDone = i < activeIndex, isActive = i === activeIndex;
    return `<div class="step">
      <div class="step-dot ${isDone?'done':isActive?'active':''}"></div>
      <div class="step-text ${isDone?'done':isActive?'active':''}">${s.text}</div>
      <i class="ti ti-check step-check ${isDone?'show':''}"></i>
    </div>`;
  }).join('');
}
function setProgress(pct) {
  const ring = document.getElementById('progressRing');
  const lbl  = document.getElementById('progressPct');
  const c = Math.min(pct, 1);
  if (ring) ring.style.strokeDashoffset = 408 - 408 * c;
  if (lbl)  lbl.textContent = Math.round(c * 100) + '%';
}
function runLoadingAnimation() {
  return new Promise(resolve => {
    let step = 0; renderSteps(0); setProgress(0.1);
    const iv = setInterval(() => {
      step++;
      if (step >= STEPS.length) { clearInterval(iv); setProgress(0.95); renderSteps(STEPS.length); resolve(); return; }
      renderSteps(step); setProgress((step + 1) / STEPS.length * 0.95);
    }, 650);
  });
}

// ── MOCK DATA ──
const MOCK = {
  item_name: "Nike Air Max 90 Sneakers",
  condition: "Good",
  condition_note: "Minor creasing on the toe box, soles show light wear, no major scuffs or damage.",
  price_low: 55, price_high: 90, sweet_spot: 70,
  reasoning: "Air Max 90s in Good condition sell between $55–$90 on eBay depending on colorway and size. This neutral colorway has steady year-round demand. Facebook Marketplace moves them faster locally at a slight discount.",
  listing_description: "Nike Air Max 90s in good used condition — still plenty of life left in them. Minor creasing on the toe, soles are solid. Great everyday sneaker, selling because I upgraded. Pick up or shipping available.",
  price_trend: [52, 58, 55, 63, 70, 68, 75],
  price_history_months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Now"],
  comparable_listings: [
    { title: "Nike Air Max 90 White/Grey", platform: "eBay", price: 68, sold: true, days_ago: 2 },
    { title: "Nike Air Max 90 Size 10", platform: "Facebook", price: 60, sold: true, days_ago: 4 },
    { title: "Nike Air Max 90 Neutral", platform: "eBay", price: 75, sold: true, days_ago: 7 },
  ],
  sell_faster_tips: [
    { title: "Photo angles matter", tip: "Include 6+ photos — both sides, sole, toe box and heel. Listings with more photos sell 2x faster." },
    { title: "List on Sunday evening", tip: "eBay bidding peaks Sunday 7–9pm. Listings ending then consistently get higher final prices." },
    { title: "Keywords in title", tip: "Add size, colorway and condition to your title: \"Nike Air Max 90 Size 10 White Good Condition\"." },
  ]
};

// ── ANALYZE ──
async function analyzeImage() {
  if (!photos[0]) return;
  document.getElementById('scanBtn').disabled = true;
  showLoadingScreen();

  const plats = getPlatforms();
  const platformList = [...plats.primary, ...plats.secondary].join(', ');

  const prompt = `You are an expert resale pricer with deep knowledge of sold listings on eBay, Facebook Marketplace, and local resale platforms.

Analyze this image and return a realistic secondhand price estimate.

Respond ONLY with valid JSON — no markdown, no code fences:
{
  "item_name": "specific descriptive item name",
  "condition": "Good",
  "condition_note": "one sentence describing visible wear or condition",
  "price_low": 18,
  "price_high": 42,
  "sweet_spot": 28,
  "reasoning": "2-3 sentences explaining the price range based on what you see",
  "listing_description": "ready-to-post 2-3 sentence marketplace listing, casual honest tone",
  "price_trend": [8, 10, 9, 11, 12, 11, 13],
  "price_history_months": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Now"],
  "comparable_listings": [
    { "title": "similar item title", "platform": "eBay", "price": 65, "sold": true, "days_ago": 3 },
    { "title": "similar item title", "platform": "Facebook Marketplace", "price": 58, "sold": true, "days_ago": 6 },
    { "title": "similar item title", "platform": "eBay", "price": 72, "sold": true, "days_ago": 9 }
  ],
  "sell_faster_tips": [
    { "title": "Tip title", "tip": "Specific actionable tip for this exact item." },
    { "title": "Tip title", "tip": "Specific actionable tip for this exact item." },
    { "title": "Tip title", "tip": "Specific actionable tip for this exact item." }
  ]
}

Rules:
- condition must be exactly: Excellent / Good / Fair / Poor
- price_trend: 7 numbers showing relative demand over 7 months (scale to match sweet_spot)
- price_history_months: 7 labels, last one always "Now"
- If item is antique/vintage (>20 years old), adjust months to years e.g. ["2018","2019","2020","2021","2022","2023","Now"]
- If you cannot determine price history, return price_trend as empty array []
- comparable_listings: 3 realistic recently sold similar items
- Preferred platforms for this user: ${platformList}
- Base all prices on realistic US/EU market sold listings`;

  // Build messages — include all uploaded photos
  const imageContents = photos.filter(Boolean).map(p => ({
    type: 'image',
    source: { type: 'base64', media_type: 'image/jpeg', data: p.base64 }
  }));
  imageContents.push({ type: 'text', text: prompt });

  try {
    const [response] = await Promise.all([
      fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          max_tokens: 1500,
          messages: [{ role: 'user', content: imageContents }]
        })
      }),
      runLoadingAnimation()
    ]);

    if (!response.ok) throw new Error(`Server error ${response.status}`);
    const data = await response.json();
    if (data.error) throw new Error(data.error);

    const raw = data.content[0].text.trim().replace(/```json|```/g, '').trim();
    const result = JSON.parse(raw);

    // Inject local platforms
    result.best_platforms = plats.primary;
    result.other_platforms = plats.secondary;

    consumeScan();
    addHistory({
      name: result.item_name,
      range: `$${result.price_low}–$${result.price_high}`,
      img: photos[0].dataUrl,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    });

    setProgress(1);
    await new Promise(r => setTimeout(r, 300));
    hideLoadingScreen();
    showResultScreen(result);

  } catch (err) {
    console.error('QuickSell error:', err);
    hideLoadingScreen();
    document.querySelectorAll('.scr').forEach(s => s.classList.add('hidden'));
    document.getElementById('scrScan').classList.remove('hidden');
    document.getElementById('scanBtn').disabled = false;
    showToast(err.message || "Couldn't analyze. Try again.", 'error');
  }
}

// ── CONDITION GRADIENT ──
const COND_MAP = { 'Excellent': 6.25, 'Good': 31.25, 'Fair': 62.5, 'Poor': 93.75 };
const COND_CLASS = { 'Excellent': 'cond-excellent', 'Good': 'cond-good', 'Fair': 'cond-fair', 'Poor': 'cond-poor' };

function renderCondition(condition, note) {
  const pct = COND_MAP[condition] || 50;
  const cls = COND_CLASS[condition] || 'cond-good';
  return `
    <span class="cond-badge ${cls}"><i class="ti ti-circle-filled" style="font-size:8px"></i> ${condition}</span>
    <div class="cond-gradient-bar">
      <div class="cond-marker" style="left:${pct}%"></div>
    </div>
    <div class="cond-labels">
      <span>Excellent</span><span>Good</span><span>Fair</span><span>Poor</span>
    </div>
    <div class="wear-desc"><strong>${condition}:</strong> ${note || ''}</div>`;
}

// ── COMPARABLE LISTINGS ──
function renderComparables(items) {
  if (!items || !items.length) return '';
  return `<div class="comp-list">${items.map(item => `
    <div class="comp-item">
      <div class="comp-left">
        <div class="comp-title">${item.title}</div>
        <div class="comp-meta">${item.platform} · ${item.days_ago}d ago</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
        <div class="comp-price">$${item.price}</div>
        ${item.sold ? '<span class="comp-sold-badge">SOLD</span>' : ''}
      </div>
    </div>`).join('')}</div>`;
}

// ── SELL FASTER TIPS ──
function renderTips(tips) {
  if (!tips || !tips.length) return '';
  return `<div class="tips-list">${tips.map((t, i) => `
    <div class="tip-item">
      <div class="tip-num">${i+1}</div>
      <div class="tip-text"><strong>${t.title}:</strong> ${t.tip}</div>
    </div>`).join('')}</div>`;
}

// ── CHART ──
function renderChart(trend, months) {
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const lineColor = isDark ? '#d4ff3c' : '#1a6600';
  const fillColor = isDark ? 'rgba(212,255,60,0.18)' : 'rgba(26,102,0,0.12)';
  if (!trend || trend.length < 2) {
    return `<div class="chart-wrap"><div class="chart-no-data">Not enough historical data available for this item.</div></div>`;
  }
  const n = trend.length;
  const xLabels = months && months.length === n ? months : trend.map((_, i) => { const ago = n-1-i; return ago===0?'Now':`${ago}mo`; });
  const W=300, H=90, PL=4, PR=4, PT=6, PB=4;
  const max=Math.max(...trend), min=Math.min(...trend), range=max-min||1;
  const pts = trend.map((v,i) => [PL+(i/(n-1))*(W-PL-PR), PT+(1-(v-min)/range)*(H-PT-PB)]);
  const poly = pts.map(([x,y])=>`${x},${y}`).join(' ');
  const fill = `M${pts[0][0]},${H} `+pts.map(([x,y])=>`L${x},${y}`).join(' ')+` L${pts[n-1][0]},${H} Z`;
  const [lx,ly]=pts[n-1];
  const xShow=[0,Math.floor((n-1)/2),n-1];
  return `<div class="chart-wrap"><div class="chart-inner">
    <div class="chart-y"><span>$${Math.round(max)}</span><span>$${Math.round((max+min)/2)}</span><span>$${Math.round(min)}</span></div>
    <div class="chart-right">
      <svg class="chart-svg" viewBox="0 0 ${W} ${H}" height="${H}" preserveAspectRatio="none">
        <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${lineColor}" stop-opacity="${isDark?0.2:0.15}"/>
          <stop offset="100%" stop-color="${lineColor}" stop-opacity="0"/>
        </linearGradient></defs>
        <line x1="${PL}" y1="${PT}" x2="${W-PR}" y2="${PT}" stroke="#232323" stroke-width="0.7"/>
        <line x1="${PL}" y1="${PT+(H-PT-PB)/2}" x2="${W-PR}" y2="${PT+(H-PT-PB)/2}" stroke="#1e1e1e" stroke-width="0.7"/>
        <line x1="${PL}" y1="${H-PB}" x2="${W-PR}" y2="${H-PB}" stroke="#232323" stroke-width="0.7"/>
        <path d="${fill}" fill="url(#cg)"/>
        <polyline points="${poly}" fill="none" stroke="${lineColor}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
        <circle cx="${lx}" cy="${ly}" r="4.5" fill="${lineColor}"/>
        <circle cx="${lx}" cy="${ly}" r="8" fill="none" stroke="${lineColor}" stroke-opacity="0.3" stroke-width="1.5"/>
      </svg>
      <div class="chart-x">${xShow.map(i=>`<span>${xLabels[i]}</span>`).join('')}</div>
    </div>
  </div></div>`;
}

// ── RESULT SCREEN ──
let currentResult = null;
function showResultScreen(r) {
  currentResult = r;
  document.querySelectorAll('.scr').forEach(s => s.classList.add('hidden'));
  document.getElementById('scrResult').classList.remove('hidden');
  const c2 = document.getElementById('creditChipLabel2');
  const c1 = document.getElementById('creditChipLabel');
  if (c2 && c1) c2.textContent = c1.textContent;

  const best  = (r.best_platforms||[]).map(p=>`<div class="plat-chip plat-primary"><i class="ti ti-circle-check"></i>${p}</div>`).join('');
  const other = (r.other_platforms||[]).map(p=>`<div class="plat-chip plat-secondary">${p}</div>`).join('');
  const heroImg = photos[0]?.dataUrl || '';

  document.getElementById('resultArea').innerHTML = `
    <div class="result-card">
      <div class="r-hero">
        <img class="r-hero-img" src="${heroImg}" alt="${r.item_name}">
        <div class="r-hero-overlay"></div>
        <button class="r-hero-share" onclick="shareReport()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg></button>
        <div class="r-hero-content">
          <div class="r-hero-eyebrow">Identified item</div>
          <div class="r-hero-name">${r.item_name}</div>
          <div class="r-hero-price-row">
            <div class="r-hero-price">$${r.price_low}<span class="r-hero-price-sep">–</span>$${r.price_high}</div>
            <div class="r-hero-list">
              <div class="r-hero-list-label">List at</div>
              <div class="r-hero-list-val">$${r.sweet_spot}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="r-card">
        <div class="r-card-label">Condition</div>
        ${renderCondition(r.condition, r.condition_note)}
      </div>

      <div class="r-card">
        <div class="r-card-label">Why this price</div>
        <div class="r-why-text">${r.reasoning}</div>
      </div>

      <div class="r-card">
        <div class="r-card-label">Comparable sold listings</div>
        ${renderComparables(r.comparable_listings)}
      </div>

      <div class="r-card">
        <div class="r-card-label">Best platforms</div>
        <div class="plat-chips">${best}${other}</div>
      </div>

      <div class="r-card">
        <div class="r-card-label">Sell faster tips</div>
        ${renderTips(r.sell_faster_tips)}
      </div>

      <div class="r-card">
        <div class="r-card-label">Price history</div>
        ${renderChart(r.price_trend, r.price_history_months)}
      </div>

      <div class="r-card">
        <div class="r-card-label">Ready-to-post description</div>
        <div class="desc-box" id="descBox">${r.listing_description}</div>
        <div class="desc-actions">
          <button class="regen-btn" id="regenBtn" onclick="regenerateDescription()">
            <i class="ti ti-refresh"></i> Regenerate
          </button>
          <button class="copy-btn" onclick="copyDescription()">
            <i class="ti ti-copy"></i> Copy
          </button>
        </div>
      </div>
    </div>
    <button class="rescan-btn" onclick="resetScan()">
      <i class="ti ti-refresh"></i> Price another item
    </button>`;
}

// ── SHARE ──
async function shareReport() {
  if (navigator.share) {
    try {
      await navigator.share({
        title: `${currentResult.item_name} — $${currentResult.price_low}–$${currentResult.price_high}`,
        text: `Just priced my ${currentResult.item_name} on QuickSell — worth $${currentResult.sweet_spot}. ${currentResult.listing_description}`,
      });
    } catch {}
  } else {
    navigator.clipboard.writeText(`${currentResult.item_name}: $${currentResult.price_low}–$${currentResult.price_high}\n\n${currentResult.listing_description}`)
      .then(() => showToast('Report copied to clipboard', 'success'));
  }
}

// ── REGEN ──
async function regenerateDescription() {
  const btn = document.getElementById('regenBtn');
  const box = document.getElementById('descBox');
  btn.classList.add('regenerating');
  btn.innerHTML = '<div class="spinner-sm"></div> Regenerating';

  try {
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Write a fresh marketplace listing description for: "${currentResult.item_name}", condition: ${currentResult.condition}, listing price ~$${currentResult.sweet_spot}.

Write 2-3 sentences. Casual, honest tone. Different angle and wording from this previous version: "${currentResult.listing_description}"

Respond with ONLY the description text. No quotes, no preamble.`
        }]
      })
    });
    if (!response.ok) throw new Error('error');
    const data = await response.json();
    const newDesc = data.content[0].text.trim();
    currentResult.listing_description = newDesc;
    box.textContent = newDesc;
  } catch {
    showToast("Couldn't regenerate, try again", 'error');
  } finally {
    btn.classList.remove('regenerating');
    btn.innerHTML = '<i class="ti ti-refresh"></i> Regenerate';
  }
}

function copyDescription() {
  navigator.clipboard.writeText(document.getElementById('descBox').textContent)
    .then(() => showToast('Copied!', 'success'))
    .catch(() => showToast("Couldn't copy", 'error'));
}

// ── RESET ──
function resetScan() {
  photos = [null, null, null];
  currentResult = null;
  initPhotoGrid();
  document.getElementById('scanBtn').disabled = true;
  document.getElementById('resultArea').innerHTML = '';
  document.querySelectorAll('.scr').forEach(s => s.classList.add('hidden'));
  document.getElementById('scrScan').classList.remove('hidden');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('navScan').classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── TOAST ──
function showToast(msg, type = 'error') {
  const t = document.getElementById('toast');
  t.className = `toast ${type === 'success' ? 'success' : ''}`;
  t.innerHTML = type === 'error' ? `<i class="ti ti-alert-circle"></i>${msg}` : msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initOnboarding();
  initPhotoGrid();
  detectRegion();
});
