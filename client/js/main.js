import { initLoader } from './loader.js';
import { initCanvas3D, triggerCanvas3DEntrance } from './canvas3d.js';
import { revealHero, initScrollReveals } from './animations.js';
import { api } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize 3D WebGL wireframe scene
  initCanvas3D();

  // 2. Fetch and render projects from REST API
  await loadProjects();

  // 3. Initialize contact form handling
  setupContactForm();

  // 4. Initialize mobile navigation drawer
  setupMobileNav();

  // 5. Initialize boot loader, 3D centerpiece entrance, and hero animations
  initLoader(
    () => {
      revealHero();
      initScrollReveals();
    },
    () => {
      triggerCanvas3DEntrance();
    }
  );
});

/**
 * Fetch projects from API and render archival specimen cards dynamically
 */
async function loadProjects() {
  const container = document.getElementById('projects-container');
  if (!container) return;

  let projects = [];
  try {
    projects = await api.getProjects();
  } catch (err) {
    console.warn('API getProjects failed, falling back to existing DOM specimens:', err);
    setupContactSheet();
    return;
  }

  if (!projects || projects.length === 0) {
    setupContactSheet();
    return;
  }

  // Clear existing static placeholder if any
  container.innerHTML = '';

  projects.forEach((proj, idx) => {
    const glyphNum = String(idx + 1).padStart(2, '0');
    const projectId = `project-${proj.id || (idx + 1)}`;
    const tagsHtml = (proj.stack || [])
      .map(tag => `<span>${escapeHtml(tag)}</span>`)
      .join('');

    const mediaHtml = (proj.image || proj.image_url)
      ? `<img src="${escapeHtml(proj.image || proj.image_url)}" alt="Visual overview and system design for ${escapeHtml(proj.title)}" class="case-img" />`
      : `<span class="glyph" aria-hidden="true">${glyphNum}</span>`;

    const taxonomy = escapeHtml(proj.category || 'SYSTEM SPECIMEN').toUpperCase();
    const year = escapeHtml(proj.year || '2025');
    const logRef = `#SPECIMEN-${glyphNum}`;

    const article = document.createElement('article');
    article.id = projectId;
    article.className = `case specimen-card ${idx === 0 ? 'case-hero-moment' : (idx === 1 ? 'case-editorial-split' : '')}`;

    const topBarHtml = `
      <div class="specimen-top-bar">
        <div class="specimen-pin-wrap">
          <span class="specimen-pin" aria-hidden="true"></span>
          <span class="specimen-index-tag mono">SPECIMEN NO. ${glyphNum} // ARCHIVE RECORD</span>
        </div>
        <span class="specimen-taxonomy-tag mono">${taxonomy}</span>
      </div>
    `;

    const metaStripHtml = `
      <div class="specimen-meta-strip mono">
        <span class="meta-item">[INDEX: ${glyphNum}]</span>
        <span class="meta-sep">/</span>
        <span class="meta-item">[YEAR: ${year}]</span>
        <span class="meta-sep">/</span>
        <span class="meta-item">[LOG: ${logRef}]</span>
      </div>
    `;

    if (idx === 0) {
      article.innerHTML = `
        ${topBarHtml}
        <div class="specimen-inner-grid">
          <div class="case-media">${mediaHtml}</div>
          <div class="case-body">
            <div>
              ${metaStripHtml}
              <h3 class="serif">${escapeHtml(proj.title)}</h3>
            </div>
            <div>
              <p>${escapeHtml(proj.description)}</p>
              <div class="stack">
                ${tagsHtml}
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (idx === 1) {
      article.innerHTML = `
        ${topBarHtml}
        <div class="specimen-inner-grid">
          <div class="case-body">
            ${metaStripHtml}
            <h3 class="serif">${escapeHtml(proj.title)}</h3>
            <p>${escapeHtml(proj.description)}</p>
            <div class="stack">
              ${tagsHtml}
            </div>
          </div>
          <div class="case-media">${mediaHtml}</div>
        </div>
      `;
    } else {
      article.innerHTML = `
        ${topBarHtml}
        <div class="specimen-inner-grid">
          <div class="case-media">${mediaHtml}</div>
          <div class="case-body">
            ${metaStripHtml}
            <h3 class="serif">${escapeHtml(proj.title)}</h3>
            <p>${escapeHtml(proj.description)}</p>
            <div class="stack">
              ${tagsHtml}
            </div>
          </div>
        </div>
      `;
    }
    container.appendChild(article);
  });

  // Re-hydrate the contact sheet proofs to match dynamic projects
  setupContactSheet(projects);

  if (window.ScrollTrigger) {
    window.ScrollTrigger.refresh();
  }
}

/**
 * Setup 3D pointer-reactive orbit tilt for the contact sheet widget
 * and handle click-to-scroll navigation to specimen cards
 */
function setupContactSheet(projects) {
  const section = document.getElementById('contact-sheet-section');
  const grid = document.getElementById('contact-sheet-grid');
  if (!section || !grid) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // If dynamic projects are passed, render proofs matching the data
  if (projects && projects.length > 0) {
    grid.innerHTML = '';
    projects.forEach((proj, idx) => {
      const glyphNum = String(idx + 1).padStart(2, '0');
      const targetId = `project-${proj.id || (idx + 1)}`;
      const mediaHtml = (proj.image || proj.image_url)
        ? `<img src="${escapeHtml(proj.image || proj.image_url)}" alt="${escapeHtml(proj.title)}" />`
        : `<span class="proof-glyph">${glyphNum}</span>`;

      const primaryTag = (proj.stack && proj.stack[0]) ? proj.stack[0].toUpperCase() : 'SYSTEM';

      const proof = document.createElement('a');
      proof.href = `#${targetId}`;
      proof.className = 'contact-proof';
      proof.dataset.target = targetId;
      proof.setAttribute('aria-label', `Navigate to Specimen ${glyphNum}: ${proj.title}`);
      proof.innerHTML = `
        <div class="proof-frame-header">
          <span class="proof-num mono">#${glyphNum}A</span>
          <span class="proof-kodak mono">ISO 400</span>
        </div>
        <div class="proof-media">${mediaHtml}</div>
        <div class="proof-footer">
          <div class="proof-title">${escapeHtml(proj.title)}</div>
          <div class="proof-meta">
            <span>${escapeHtml(primaryTag)}</span>
            <span>${escapeHtml(proj.year || '2025')}</span>
          </div>
        </div>
      `;
      grid.appendChild(proof);
    });
  }

  // Smooth scroll handler on proof click
  grid.querySelectorAll('.contact-proof').forEach(proof => {
    proof.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = proof.dataset.target;
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Flash subtle violet highlight border on specimen card
        targetEl.style.borderColor = 'var(--violet)';
        targetEl.style.boxShadow = '0 0 32px rgba(108, 92, 231, 0.45)';
        setTimeout(() => {
          targetEl.style.borderColor = '';
          targetEl.style.boxShadow = '';
        }, 1400);
      }
    });
  });

  // Pointer-reactive 3D orbit tilt
  if (!reduced && !grid.dataset.tiltBound) {
    grid.dataset.tiltBound = 'true';
    let targetTiltX = 0;
    let targetTiltY = 0;
    let currentTiltX = 0;
    let currentTiltY = 0;

    const handlePointerMove = (e) => {
      const rect = section.getBoundingClientRect();
      // Calculate cursor position relative to contact sheet center
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const xDist = (e.clientX - centerX) / (rect.width / 2);
      const yDist = (e.clientY - centerY) / (rect.height / 2);

      // Clamp between -1.2 and 1.2
      const clampedX = Math.max(-1.2, Math.min(1.2, xDist));
      const clampedY = Math.max(-1.2, Math.min(1.2, yDist));

      // Orbit tilt: tilt opposite cursor in perspective
      targetTiltX = -clampedY * 9.5; // degrees rotateX
      targetTiltY = clampedX * 11.5; // degrees rotateY
    };

    const handlePointerLeave = () => {
      targetTiltX = 0;
      targetTiltY = 0;
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    section.addEventListener('mouseleave', handlePointerLeave);

    const updateTilt = () => {
      currentTiltX += (targetTiltX - currentTiltX) * 0.075;
      currentTiltY += (targetTiltY - currentTiltY) * 0.075;

      grid.style.transform = `rotateX(${currentTiltX.toFixed(2)}deg) rotateY(${currentTiltY.toFixed(2)}deg)`;
      requestAnimationFrame(updateTilt);
    };

    updateTilt();
  }
}

/**
 * Interactive contact form submission handler
 */
function setupContactForm() {
  const form = document.getElementById('contact-form');
  const statusEl = document.getElementById('form-status');
  const successEl = document.getElementById('contact-success');
  const userEmailEl = document.getElementById('success-user-email');
  const resetBtn = document.getElementById('btn-reset-form');
  if (!form) return;

  // Clear errors dynamically on typing
  form.querySelectorAll('input, textarea').forEach(input => {
    input.addEventListener('input', () => {
      input.closest('.form-group')?.classList.remove('has-error');
      if (statusEl && statusEl.classList.contains('error')) {
        showStatus('', 'hide');
      }
    });
  });

  // "Send another message" button handler
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      showStatus('', 'hide');
      if (successEl) successEl.style.display = 'none';
      form.style.display = 'block';
      const descEl = successEl ? successEl.querySelector('.success-desc') : null;
      if (descEl) {
        descEl.innerHTML = 'Thank you for reaching out! I\'ve received your note and will get back to you within a couple of days at <span id="success-user-email" class="highlight-email"></span>.';
      }
    });
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const nameInput = form.querySelector('#contact-name') || form.elements?.['name'] || form.name;
    const emailInput = form.querySelector('#contact-email') || form.elements?.['email'] || form.email;
    const messageInput = form.querySelector('#contact-message') || form.elements?.['message'] || form.message;
    const websiteInput = form.querySelector('#contact-website') || form.elements?.['website'] || form.website;

    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const message = messageInput ? messageInput.value.trim() : '';
    const website = websiteInput ? websiteInput.value.trim() : '';

    let hasError = false;
    if (!name) {
      nameInput?.closest('.form-group')?.classList.add('has-error');
      hasError = true;
    }
    if (!email || !email.includes('@')) {
      emailInput?.closest('.form-group')?.classList.add('has-error');
      hasError = true;
    }
    if (!message) {
      messageInput?.closest('.form-group')?.classList.add('has-error');
      hasError = true;
    }

    if (hasError) {
      showStatus('Please fill in your name, a valid email address, and a message.', 'error');
      showToast('Please complete all required fields.', 'error');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.innerText = 'Sending message...';
      showStatus('', 'hide');

      await api.submitContact({ name, email, message, website });

      // Success State: dynamically populate confirmation view with submitted email
      const userEmail = email;
      const descEl = successEl ? successEl.querySelector('.success-desc') : null;
      const emailSpan = document.getElementById('success-user-email');

      if (emailSpan) {
        emailSpan.textContent = userEmail;
      }
      if (descEl) {
        descEl.innerHTML = `Thank you for reaching out! I've received your note and will get back to you within a couple of days at <span id="success-user-email" class="highlight-email">${escapeHtml(userEmail)}</span>.`;
      }

      form.style.display = 'none';
      if (successEl) successEl.style.display = 'block';

      showToast('✓ Message sent! I\'ll get back to you soon.', 'success');
    } catch (err) {
      // Error State: clear user-facing error message with recovery option
      const errorMsg = err.message || 'Server connection failed';
      showStatus(`Unable to deliver message (${errorMsg}). Please retry or email directly at deeeepakgm@gmail.com.`, 'error');
      showToast('Failed to send message. Please retry or email directly.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = 'Send Message →';
    }
  });

  function showStatus(text, type) {
    if (!statusEl) return;
    statusEl.className = 'form-status';
    if (type === 'hide') {
      statusEl.style.display = 'none';
      statusEl.innerText = '';
      return;
    }
    statusEl.innerText = text;
    statusEl.classList.add(type);
    statusEl.style.display = 'block';
  }
}

/**
 * Global toast notification trigger
 */
function showToast(message, type = 'success', duration = 5000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${escapeHtml(message)}</span>
    <button type="button" class="toast-close" aria-label="Dismiss notification">&times;</button>
  `;

  const closeBtn = toast.querySelector('.toast-close');
  const dismiss = () => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px) scale(0.95)';
    setTimeout(() => toast.remove(), 250);
  };

  closeBtn.addEventListener('click', dismiss);
  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(dismiss, duration);
  }
}

/**
 * Setup mobile navigation menu toggle and overlay interactions
 */
function setupMobileNav() {
  const nav = document.querySelector('nav');
  const toggleBtn = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  if (!nav || !toggleBtn || !navLinks) return;

  const closeNav = () => {
    nav.classList.remove('menu-open');
    toggleBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  const openNav = () => {
    nav.classList.add('menu-open');
    toggleBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = nav.classList.contains('menu-open');
    if (isOpen) {
      closeNav();
    } else {
      openNav();
    }
  });

  // Close when clicking any nav link
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      closeNav();
    });
  });

  // Close on Escape key press
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('menu-open')) {
      closeNav();
      toggleBtn.focus();
    }
  });

  // Close when clicking outside of nav
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('menu-open') && !nav.contains(e.target)) {
      closeNav();
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
