// ── CREDITS SYSTEM ──
const KEYS = { credits: 'quicksell_credits', freeScans: 'quicksell_free', history: 'quicksell_history' };
const FREE_TOTAL = 3;
const COST_PER_SCAN = 5;
const PACKS = {
  starter: { credits: 50, bonus: 10, price: 2.99 },
  value:   { credits: 150, bonus: 20, price: 6.99 },
  power:   { credits: 400, bonus: 75, price: 14.99 },
};

function getCredits() { return parseInt(localStorage.getItem(KEYS.credits) || '0', 10); }
function setCredits(n) { localStorage.setItem(KEYS.credits, String(Math.max(0, n))); refreshUI(); }
function getFreeLeft() { const used = parseInt(localStorage.getItem(KEYS.freeScans) || '0', 10); return Math.max(0, FREE_TOTAL - used); }
function canScan() { return getFreeLeft() > 0 || getCredits() >= COST_PER_SCAN; }

function consumeScan() {
  const free = getFreeLeft();
  if (free > 0) {
    const used = parseInt(localStorage.getItem(KEYS.freeScans) || '0', 10);
    localStorage.setItem(KEYS.freeScans, String(used + 1));
    refreshUI(); return true;
  }
  const c = getCredits();
  if (c >= COST_PER_SCAN) { setCredits(c - COST_PER_SCAN); return true; }
  return false;
}

function buyPack(id) {
  const p = PACKS[id];
  if (!p) return;
  setCredits(getCredits() + p.credits + p.bonus);
  showToast(`+${p.credits + p.bonus} credits added`);
}

function getHistory() { try { return JSON.parse(localStorage.getItem(KEYS.history) || '[]'); } catch { return []; } }
function addHistory(entry) {
  const h = getHistory();
  h.unshift(entry);
  localStorage.setItem(KEYS.history, JSON.stringify(h.slice(0, 50)));
  renderHistoryList();
  renderCreditHistList();
}

function refreshUI() {
  const credits = getCredits();
  const free = getFreeLeft();

  const chip = document.getElementById('creditChipLabel');
  if (chip) chip.textContent = free > 0 ? `${free} free` : `${credits} cr`;

  const bal = document.getElementById('balanceLarge');
  if (bal) bal.textContent = credits;

  const banner = document.getElementById('freeBanner');
  const freeEl = document.getElementById('freeLeft');
  if (banner && freeEl) {
    if (free > 0) { banner.style.display = 'block'; freeEl.textContent = free; }
    else { banner.style.display = 'none'; }
  }
}

function historyRowHTML(item) {
  return `
    <div class="h-item">
      <div class="h-item-inner">
        <img class="h-thumb" src="${item.img || ''}" onerror="this.style.background='var(--bg3)'" alt="">
        <div class="h-body">
          <div class="h-name">${item.name}</div>
          <div class="h-meta">${item.date}</div>
        </div>
        <div class="h-right">
          <div class="h-price">${item.range}</div>
          <i class="ti ti-chevron-right h-arrow"></i>
        </div>
      </div>
    </div>`;
}

function renderHistoryList() {
  const el = document.getElementById('histList');
  if (!el) return;
  const h = getHistory();
  if (!h.length) {
    el.innerHTML = `<div class="h-empty"><i class="ti ti-camera-off"></i><div class="h-empty-title">No scans yet</div><div class="h-empty-sub">Snap something and see<br>what it's worth.</div></div>`;
    return;
  }
  el.innerHTML = h.map(historyRowHTML).join('');
}

function renderCreditHistList() {
  const el = document.getElementById('creditHistList');
  if (!el) return;
  const h = getHistory();
  if (!h.length) {
    el.innerHTML = `<div class="h-empty" style="padding:30px 0"><i class="ti ti-receipt-off" style="font-size:36px"></i><div class="h-empty-sub" style="margin-top:8px">No scans yet</div></div>`;
    return;
  }
  el.innerHTML = h.map(historyRowHTML).join('');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2600);
}

function showScreen(id) {
  document.querySelectorAll('.scr').forEach(s => s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  refreshUI();
  if (id === 'scrHistory') renderHistoryList();
  if (id === 'scrCredits') renderCreditHistList();
}

function switchTab(screenId, navId) {
  showScreen(screenId);
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(navId).classList.add('active');
}

function closePaywall() { document.getElementById('paywallOverlay').classList.remove('show'); }
function openPaywall() { document.getElementById('paywallOverlay').classList.add('show'); }

document.addEventListener('DOMContentLoaded', refreshUI);
