document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  loadMessages();
  loadProjects();
  setupAddProjectForm();
});

function initTabs() {
  const tabs = document.querySelectorAll('.admin-tab');
  const panels = document.querySelectorAll('.admin-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetPanel = document.getElementById(`panel-${target}`);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });
}

async function loadMessages() {
  const list = document.getElementById('messages-list');
  const countBadge = document.getElementById('msg-count');

  try {
    const res = await fetch('/api/contact');
    if (!res.ok) throw new Error('Failed to fetch messages');
    const messages = await res.json();

    countBadge.innerText = messages.length;

    if (messages.length === 0) {
      list.innerHTML = '<p class="mono" style="color:var(--muted-dark);">No messages received yet.</p>';
      return;
    }

    list.innerHTML = messages.map(msg => `
      <div class="data-card">
        <div class="data-card-header">
          <div>
            <h3>${escapeHtml(msg.name)}</h3>
            <span class="data-card-meta"><a href="mailto:${escapeHtml(msg.email)}" style="color:var(--violet);">${escapeHtml(msg.email)}</a></span>
          </div>
          <span class="data-card-meta">${new Date(msg.created_at).toLocaleString()}</span>
        </div>
        <div class="data-card-body">
          <p style="white-space: pre-wrap;">${escapeHtml(msg.message)}</p>
        </div>
        <div class="data-card-footer">
          <span class="mono" style="color:var(--muted-dark); font-size:11px;">ID: #${msg.id}</span>
          <button class="btn-danger" onclick="deleteMessage(${msg.id})">Delete Message</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    list.innerHTML = `<p class="mono" style="color:#e74c3c;">Failed to load messages: ${err.message}</p>`;
  }
}

async function loadProjects() {
  const list = document.getElementById('projects-list');
  const countBadge = document.getElementById('proj-count');

  try {
    const res = await fetch('/api/projects');
    if (!res.ok) throw new Error('Failed to fetch projects');
    const projects = await res.json();

    countBadge.innerText = projects.length;

    if (projects.length === 0) {
      list.innerHTML = '<p class="mono" style="color:var(--muted-dark);">No projects found.</p>';
      return;
    }

    list.innerHTML = projects.map(proj => `
      <div class="data-card">
        <div class="data-card-header">
          <div>
            <h3>${escapeHtml(proj.title)}</h3>
            <span class="data-card-meta">${escapeHtml(proj.year)} — ${escapeHtml(proj.category)}</span>
          </div>
          <button class="btn-danger" onclick="deleteProject(${proj.id})">Delete Project</button>
        </div>
        <div class="data-card-body">
          <p>${escapeHtml(proj.description)}</p>
        </div>
        <div class="data-card-footer">
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            ${(proj.stack || []).map(t => `<span class="mono" style="font-size:11px; border:1px solid var(--hair-dark); padding:2px 8px; border-radius:12px;">${escapeHtml(t)}</span>`).join('')}
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    list.innerHTML = `<p class="mono" style="color:#e74c3c;">Failed to load projects: ${err.message}</p>`;
  }
}

function setupAddProjectForm() {
  const form = document.getElementById('add-project-form');
  const statusEl = document.getElementById('project-form-status');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const title = form.title.value.trim();
    const year = form.year.value.trim();
    const category = form.category.value.trim();
    const description = form.description.value.trim();
    const stack = form.stack.value.split(',').map(s => s.trim()).filter(Boolean);

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, year, category, description, stack })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to create project');

      statusEl.className = 'form-status success';
      statusEl.innerText = '✓ Project published successfully!';
      statusEl.style.display = 'block';
      form.reset();

      loadProjects();
    } catch (err) {
      statusEl.className = 'form-status error';
      statusEl.innerText = `Error: ${err.message}`;
      statusEl.style.display = 'block';
    }
  });
}

window.deleteMessage = async function(id) {
  if (!confirm('Are you sure you want to delete this message?')) return;
  try {
    const res = await fetch(`/api/contact/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
    loadMessages();
  } catch (err) {
    alert(err.message);
  }
};

window.deleteProject = async function(id) {
  if (!confirm('Are you sure you want to delete this project?')) return;
  try {
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
    loadProjects();
  } catch (err) {
    alert(err.message);
  }
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
