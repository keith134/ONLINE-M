/**
 * App.js - Shared helpers for all pages
 * Toast system, mobile nav, FAQ accordion, scroll reveal, utilities
 */

// ========================================================================
// TOAST SYSTEM
// ========================================================================
const Toast = (function() {
  let container = null;
  const queue = [];
  let isProcessing = false;

  function init() {
    if (container) return;
    container = document.createElement('div');
    container.className = 'toast-container';
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', 'Notifications');
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }

  function createToast(message, type = 'default') {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');

    const dismissBtn = document.createElement('button');
    dismissBtn.className = 'btn btn--ghost btn--sm';
    dismissBtn.style.marginLeft = 'var(--space-3)';
    dismissBtn.textContent = 'Dismiss';
    dismissBtn.onclick = () => dismiss(toast);
    toast.appendChild(dismissBtn);

    return toast;
  }

  function dismiss(toast) {
    toast.style.animation = 'slideIn 0.2s ease reverse';
    setTimeout(() => toast.remove(), 200);
  }

  function processQueue() {
    if (isProcessing || queue.length === 0) return;
    isProcessing = true;

    const { message, type, duration } = queue.shift();
    const toast = createToast(message, type);
    container.appendChild(toast);

    setTimeout(() => {
      dismiss(toast);
      isProcessing = false;
      processQueue();
    }, duration || 4000);
  }

  function show(message, type = 'default', duration = 4000) {
    init();
    queue.push({ message, type, duration });
    processQueue();
  }

  return { show };
})();

// Convenience methods
function toastSuccess(message) { Toast.show(message, 'success'); }
function toastError(message) { Toast.show(message, 'error'); }
function toastGold(message) { Toast.show(message, 'gold'); }

// ========================================================================
// MOBILE NAVIGATION
// ========================================================================
function initMobileNav() {
  const toggle = document.querySelector('.mobile-nav-toggle');
  const nav = document.querySelector('.nav');

  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', !expanded);
    nav.setAttribute('data-visible', !expanded);
    document.body.style.overflow = expanded ? '' : 'hidden';
  });

  // Close on link click
  nav.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      toggle.setAttribute('aria-expanded', 'false');
      nav.setAttribute('data-visible', 'false');
      document.body.style.overflow = '';
    });
  });

  // Close on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.getAttribute('data-visible') === 'true') {
      toggle.setAttribute('aria-expanded', 'false');
      nav.setAttribute('data-visible', 'false');
      document.body.style.overflow = '';
      toggle.focus();
    }
  });
}

// ========================================================================
// FAQ ACCORDION
// ========================================================================
function initFaqAccordion() {
  const accordions = document.querySelectorAll('.accordion');

  accordions.forEach(accordion => {
    const triggers = accordion.querySelectorAll('.accordion-trigger');

    triggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
        const item = trigger.closest('.accordion-item');
        const isOpen = item.getAttribute('data-open') === 'true';

        // Close all items in this accordion
        accordion.querySelectorAll('.accordion-item').forEach(i => {
          i.setAttribute('data-open', 'false');
          i.querySelector('.accordion-trigger').setAttribute('aria-expanded', 'false');
        });

        // Open clicked if it wasn't open
        if (!isOpen) {
          item.setAttribute('data-open', 'true');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });

      // Keyboard support
      trigger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          trigger.click();
        }
      });
    });
  });
}

// ========================================================================
// SCROLL REVEAL (IntersectionObserver)
// ========================================================================
function initScrollReveal() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ========================================================================
// UTILITIES
// ========================================================================

// Format date as "the 14th of June, 2025"
function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  const day = d.getDate();
  const suffix = day % 10 === 1 && day !== 11 ? 'st' :
                 day % 10 === 2 && day !== 12 ? 'nd' :
                 day % 10 === 3 && day !== 13 ? 'rd' : 'th';
  const month = d.toLocaleDateString('en-US', { month: 'long' });
  const year = d.getFullYear();
  return `the ${day}${suffix} of ${month}, ${year}`;
}

// Copy text to clipboard
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    toastSuccess('Copied to clipboard! Now go brag to your group chat.');
    return true;
  } catch (e) {
    // Fallback for non-secure contexts (file://)
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      toastSuccess('Copied to clipboard! Now go brag to your group chat.');
      return true;
    } catch (err) {
      toastError('Could not copy. Your browser is being difficult.');
      return false;
    } finally {
      textarea.remove();
    }
  }
}

// Generate shareable certificate summary
function generateCertificateSummary(ceremony) {
  const date = formatDate(ceremony.sealedAt || ceremony.createdAt);
  return `💍 ${ceremony.partner1.name} & ${ceremony.partner2.name} got married online!
📅 ${date}
🆔 Certificate: ${ceremony.id}
💌 "We checked. Your 3am is their 3pm. Love finds a way."

Made with ♥ at the Long Distance Romance Registry`;
}

// Ensure draft exists or redirect to start
function ensureDraftOrRedirect() {
  const draft = CeremonyStore.getDraft();
  const hasNames = draft.partner1?.name?.trim() && draft.partner2?.name?.trim();

  // Allow access to start.html always
  if (window.location.pathname.includes('start.html')) return true;

  if (!hasNames) {
    toastError('You skipped the part where you enter your names. Cute, but no.');
    setTimeout(() => { window.location.href = 'start.html'; }, 1500);
    return false;
  }

  return true;
}

// Update progress bar based on current step
function updateProgressBar(currentStep) {
  const steps = document.querySelectorAll('.progress-step');
  steps.forEach((step, index) => {
    const stepNum = index + 1;
    step.setAttribute('data-active', stepNum === currentStep);
    step.setAttribute('data-complete', stepNum < currentStep);
  });
}

// Confetti burst (CSS-based, no library)
function burstConfetti(container = document.body) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const confettiContainer = document.createElement('div');
  confettiContainer.className = 'confetti-container';
  confettiContainer.setAttribute('aria-hidden', 'true');
  container.appendChild(confettiContainer);

  const colors = ['#D98C8C', '#C9A24B', '#C6FF00', '#7BAE7F', '#3A2E2A', '#FFFFFF'];
  const pieceCount = 50;

  for (let i = 0; i < pieceCount; i++) {
    const piece = document.createElement('div');
    piece.className = `confetti-piece ${Math.random() > 0.5 ? 'confetti-piece--rect' : 'confetti-piece--circle'}`;
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.width = `${6 + Math.random() * 8}px`;
    piece.style.height = piece.style.width;
    piece.style.setProperty('--confetti-duration', `${1.5 + Math.random() * 1.5}s`);
    piece.style.animationDelay = `${Math.random() * 0.5}s`;
    confettiContainer.appendChild(piece);
  }

  setTimeout(() => confettiContainer.remove(), 4000);
}

// Debounce utility
function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Escape HTML for safe insertion
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ========================================================================
// INIT ON DOM READY
// ========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initFaqAccordion();
  initScrollReveal();

  // Update active nav link
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === 'index.html' && href === 'index.html')) {
      link.setAttribute('aria-current', 'page');
    }
  });
});

// Export for use in page scripts
window.App = {
  toast: Toast.show,
  toastSuccess,
  toastError,
  toastGold,
  copyToClipboard,
  formatDate,
  generateCertificateSummary,
  ensureDraftOrRedirect,
  updateProgressBar,
  burstConfetti,
  debounce,
  escapeHtml
};