// src/js/utils/notify.js

let containerEl = null;

function ensureContainer() {
  if (containerEl) return containerEl;
  containerEl = document.createElement('div');
  containerEl.id = 'toast-container-top-right';
  containerEl.style.cssText = `
    position: fixed;
    top: 16px;
    right: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 99999;
    pointer-events: none;
  `;
  document.body.appendChild(containerEl);
  return containerEl;
}

function makeToast({ id, text, type = 'info', spinning = false }) {
  const el = document.createElement('div');
  el.dataset.toastId = id;
  el.style.cssText = `
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 240px;
    max-width: 360px;
    padding: 10px 14px;
    border-radius: 10px;
    box-shadow: 0 6px 16px rgba(0,0,0,0.15);
    color: ${fgFor(type)};
    background: ${bgFor(type)};
    pointer-events: auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    transform: translateX(24px);
    opacity: 0;
    transition: transform .25s ease, opacity .25s ease, background .2s ease, border-color .2s ease, color .2s ease;
  `;
  const iconWrap = document.createElement('div');
  iconWrap.className = 'toast-icon';
  iconWrap.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;';
  if (spinning) {
    const spinner = document.createElement('div');
    spinner.className = 'toast-spinner';
    spinner.style.cssText = 'width:16px;height:16px;border-radius:50%;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;animation: toast-spin .8s linear infinite;';
    iconWrap.appendChild(spinner);
  } else {
    iconWrap.innerHTML = svgFor(type);
  }
  el.appendChild(iconWrap);
  const textEl = document.createElement('div');
  textEl.textContent = text || '';
  textEl.style.cssText = 'font-size: 13px; font-weight: 500;';
  el.appendChild(textEl);
  // animate in from right
  requestAnimationFrame(() => {
    el.style.transform = 'translateX(0)';
    el.style.opacity = '1';
  });
  return el;
}

function bgFor(type) {
  switch (type) {
    case 'success': return 'rgba(34,197,94,0.95)';
    case 'warning': return 'rgba(250,204,21,0.95)';
    case 'error': return 'rgba(239,68,68,0.95)';
    case 'info':
    default: return 'rgba(96,165,250,0.95)';
  }
}

function borderFor(type) {
  switch (type) {
    case 'success': return 'rgba(22,163,74,0.9)';
    case 'warning': return 'rgba(202,138,4,0.9)';
    case 'error': return 'rgba(220,38,38,0.9)';
    case 'info':
    default: return 'rgba(37,99,235,0.9)';
  }
}

function fgFor(type) {
  switch (type) {
    case 'warning': return '#111';
    default: return '#ffffff';
  }
}

function findToast(id) {
  return ensureContainer().querySelector(`[data-toast-id="${id}"]`);
}

export function showLoadingToast(id, text) {
  const existing = findToast(id);
  if (existing) existing.remove();
  const el = makeToast({ id, text, type: 'info', spinning: true });
  ensureContainer().appendChild(el);
}

export function updateToast(id, { text, type }) {
  const el = findToast(id);
  if (!el) return;
  if (type) {
    el.style.background = bgFor(type);
    el.style.borderColor = borderFor(type);
    el.style.color = fgFor(type);
    // replace spinner/icon when status berubah dari loading ke final
    const iconWrap = el.querySelector('.toast-icon');
    if (iconWrap) {
      iconWrap.innerHTML = svgFor(type);
    }
  }
  if (text) {
    const textEl = el.querySelector('div:nth-child(2)') || el.lastChild;
    if (textEl) textEl.textContent = text;
  }
}

export function successToast(id, text, timeoutMs = 2000) {
  updateToast(id, { text, type: 'success' });
  setTimeout(() => removeToast(id), timeoutMs);
}

export function warningToast(id, text, timeoutMs = 3000) {
  updateToast(id, { text, type: 'warning' });
  setTimeout(() => removeToast(id), timeoutMs);
}

export function errorToast(id, text, timeoutMs = 3500) {
  updateToast(id, { text, type: 'error' });
  setTimeout(() => removeToast(id), timeoutMs);
}

export function removeToast(id) {
  const el = findToast(id);
  if (el && el.parentNode) {
    // animate out upwards
    el.style.transform = 'translateY(-10px)';
    el.style.opacity = '0';
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 250);
  }
}

// Inject spinner keyframes once (guard SSR)
(() => {
  if (typeof document === 'undefined') return;
  const styleId = 'toast-keyframes-style';
  if (document.getElementById(styleId)) return;
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `@keyframes toast-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`;
  document.head.appendChild(style);
})();

function svgFor(type) {
  const common = 'width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  switch(type){
    case 'success':
      return `<svg ${common}><polyline points="20 6 9 17 4 12"/></svg>`;
    case 'warning':
      return `<svg ${common}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12" y2="17"/></svg>`;
    case 'error':
      return `<svg ${common}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    case 'info':
    default:
      return `<svg ${common}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="8"/></svg>`;
  }
}


