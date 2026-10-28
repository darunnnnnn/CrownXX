/* ===================================================================
   REGION SWITCHER — one domain, two practices.

   This file is IDENTICAL in the CrownX (global) and CrownX-DM
   (domestic) repos except for the two CONFIG lines directly below.
   =================================================================== */

/* ---------- CONFIG ---------- */

// Which site is this build? In the CrownX-DM repo set this to 'domestic'.
const THIS_SITE = 'global';

// Where the *other* site lives. In the CrownX-DM repo set this to your
// main domain, e.g. 'https://crownx.in/'.
const OTHER_URL = 'https://crownx-dm.onrender.com/';

// Send returning visitors straight to the site they picked last time.
// Off by default: it would also hijack shared links to this site.
const AUTO_REDIRECT = false;

/* ---------- SITE METADATA ---------- */

const SITES = {
  global: {
    label: 'Global',
    kicker: 'International',
    title: 'Creative Agency',
    blurb: 'Podcast growth, video editing and social strategy for brands and creators worldwide.',
    icon: 'language',
  },
  domestic: {
    label: 'India',
    kicker: 'Domestic',
    title: 'Digital Marketing',
    blurb: 'Full-service digital marketing for Indian brands — more sales, more reach, more impact.',
    icon: 'place',
  },
};

const ORDER = ['global', 'domestic'];
const OTHER_SITE = THIS_SITE === 'global' ? 'domestic' : 'global';
const STORE_KEY = 'crownx:region';
const DISMISS_KEY = 'crownx:region-dismissed';

const urlFor = id => (id === THIS_SITE ? '/' : OTHER_URL);

/* ---------- STORAGE (safe in private mode) ---------- */

function read(store, key) {
  try { return window[store].getItem(key); } catch { return null; }
}
function write(store, key, value) {
  try { window[store].setItem(key, value); } catch { /* ignore */ }
}

/* ---------- CHOICE ---------- */

// Record the pick. Navigation is left to the anchor's own href.
function remember(id) {
  write('localStorage', STORE_KEY, id);
}

function dismiss() {
  write('sessionStorage', DISMISS_KEY, '1');
  closeModal();
}

/* ---------- NAVBAR PILL ---------- */

function renderPills() {
  const saved = read('localStorage', STORE_KEY);
  const suggested = saved && saved !== THIS_SITE ? saved : null;

  document.querySelectorAll('[data-region-pill]').forEach(slot => {
    const pill = document.createElement('div');
    pill.className = 'region-pill';
    pill.setAttribute('role', 'group');
    pill.setAttribute('aria-label', 'Choose your region');

    ORDER.forEach(id => {
      const site = SITES[id];
      const active = id === THIS_SITE;
      const el = document.createElement(active ? 'span' : 'a');

      el.className = 'region-opt';
      if (active) el.classList.add('active');
      if (id === suggested) el.classList.add('suggested');
      el.textContent = site.label;

      if (active) {
        el.setAttribute('aria-current', 'true');
      } else {
        el.href = urlFor(id);
        el.title = `${site.kicker} — ${site.title}`;
        el.addEventListener('click', () => remember(id));
      }
      pill.appendChild(el);
    });

    slot.replaceChildren(pill);
  });
}

/* ---------- FIRST-VISIT MODAL ---------- */

let modal = null;
let lastFocus = null;

function buildModal() {
  const card = ORDER.map(id => {
    const site = SITES[id];
    return `
      <a class="region-choice${id === THIS_SITE ? ' is-current' : ''}" href="${urlFor(id)}" data-region-choose="${id}">
        <span class="region-choice-top">
          <span class="material-symbols-outlined">${site.icon}</span>
          <span class="region-choice-kicker">${site.kicker}</span>
        </span>
        <span class="region-choice-title">${site.title}</span>
        <span class="region-choice-blurb">${site.blurb}</span>
        <span class="region-choice-cta">
          Continue <span class="material-symbols-outlined">arrow_forward</span>
        </span>
      </a>`;
  }).join('');

  const el = document.createElement('div');
  el.className = 'region-modal';
  el.id = 'regionModal';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-labelledby', 'regionModalTitle');
  el.innerHTML = `
    <div class="region-modal-backdrop" data-region-dismiss></div>
    <div class="region-modal-card">
      <span class="region-modal-eyebrow">CrownX</span>
      <h2 class="region-modal-title" id="regionModalTitle">Where are you based?</h2>
      <p class="region-modal-sub">We run two practices. Pick the one that fits and we'll take you there.</p>
      <div class="region-modal-grid">${card}</div>
      <button type="button" class="region-modal-skip" data-region-dismiss>Not sure — keep browsing</button>
    </div>`;

  el.querySelectorAll('[data-region-dismiss]').forEach(node => {
    node.addEventListener('click', dismiss);
  });
  el.querySelectorAll('[data-region-choose]').forEach(node => {
    node.addEventListener('click', event => {
      const id = node.dataset.regionChoose;
      remember(id);
      // Staying put: no navigation needed, just close.
      if (id === THIS_SITE) {
        event.preventDefault();
        closeModal();
        renderPills();
      }
    });
  });

  return el;
}

function openModal() {
  if (modal) return;
  lastFocus = document.activeElement;
  modal = buildModal();
  document.body.appendChild(modal);
  document.body.classList.add('region-modal-open');
  requestAnimationFrame(() => modal.classList.add('open'));
  modal.querySelector('.region-choice')?.focus();
  document.addEventListener('keydown', onKeydown);
}

function closeModal() {
  if (!modal) return;
  const node = modal;
  modal = null;
  document.removeEventListener('keydown', onKeydown);
  node.classList.remove('open');
  document.body.classList.remove('region-modal-open');
  node.addEventListener('transitionend', () => node.remove(), { once: true });
  setTimeout(() => node.remove(), 500);
  lastFocus?.focus?.();
}

function onKeydown(event) {
  if (event.key === 'Escape') { dismiss(); return; }
  if (event.key !== 'Tab' || !modal) return;

  // Keep focus inside the dialog.
  const stops = modal.querySelectorAll('.region-choice, .region-modal-skip');
  if (!stops.length) return;
  const first = stops[0];
  const last = stops[stops.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/* ---------- INIT ---------- */

export function initRegion() {
  renderPills();

  const saved = read('localStorage', STORE_KEY);

  if (saved) {
    if (AUTO_REDIRECT && saved === OTHER_SITE) window.location.replace(OTHER_URL);
    return;
  }
  if (read('sessionStorage', DISMISS_KEY)) return;

  // Let the page's entrance animation land first.
  setTimeout(openModal, 900);
}

// Exposed so a "switch region" link anywhere on the site can reopen it.
export function openRegionPicker() {
  openModal();
}
