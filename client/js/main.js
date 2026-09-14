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
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();

    if (!name || !email || !message) {
      showStatus('Please complete all required fields.', 'error');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.innerText = 'Sending...';
      showStatus('', 'hide');

      await api.submitContact({ name, email, message });

      showStatus('✓ Message received. Thanks for reaching out!', 'success');
      form.reset();
    } catch (err) {
      showStatus(`Error: ${err.message}`, 'error');
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
      return;
    }
    statusEl.innerText = text;
    statusEl.classList.add(type);
    statusEl.style.display = 'block';
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
