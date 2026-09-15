import { initLoader } from './loader.js';
import { initCanvas3D } from './canvas3d.js';
import { revealHero, initScrollReveals } from './animations.js';
import { api } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize 3D WebGL wireframe scene
  initCanvas3D();

  // 2. Fetch and render projects from REST API
  await loadProjects();

  // 3. Initialize contact form handling
  setupContactForm();

  // 4. Initialize boot loader and hero animations
  initLoader(() => {
    revealHero();
    initScrollReveals();
  });
});

/**
 * Fetch projects from API and render case cards dynamically
 */
async function loadProjects() {
  const container = document.getElementById('projects-container');
  if (!container) return;

  const projects = await api.getProjects();
  if (!projects || projects.length === 0) return;

  // Clear existing static placeholder if any
  container.innerHTML = '';

  projects.forEach((proj, idx) => {
    const glyphNum = String(idx + 1).padStart(2, '0');
    const tagsHtml = (proj.stack || [])
      .map(tag => `<span>${escapeHtml(tag)}</span>`)
      .join('');

    const article = document.createElement('article');
    article.className = 'case';
    article.innerHTML = `
      <div class="case-media"><span class="glyph">${glyphNum}</span></div>
      <div class="case-body">
        <p class="tag mono">${escapeHtml(proj.year || '')} — ${escapeHtml(proj.category || '')}</p>
        <h3 class="display">${escapeHtml(proj.title)}</h3>
        <p>${escapeHtml(proj.description)}</p>
        <div class="stack">
          ${tagsHtml}
        </div>
      </div>
    `;
    container.appendChild(article);
  });
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
    });
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const nameInput = form.name;
    const emailInput = form.email;
    const messageInput = form.message;

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const message = messageInput.value.trim();

    let hasError = false;
    if (!name) {
      nameInput.closest('.form-group')?.classList.add('has-error');
      hasError = true;
    }
    if (!email || !email.includes('@')) {
      emailInput.closest('.form-group')?.classList.add('has-error');
      hasError = true;
    }
    if (!message) {
      messageInput.closest('.form-group')?.classList.add('has-error');
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

      await api.submitContact({ name, email, message });

      // Success State: show dedicated confirmation view and toast
      if (userEmailEl) userEmailEl.textContent = email;
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

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
