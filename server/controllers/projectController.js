const { query } = require('../config/db');

exports.getProjects = async (req, res, next) => {
  try {
    const rows = await query.all('SELECT * FROM projects ORDER BY id ASC');
    const projects = rows.map(r => ({
      ...r,
      stack: r.stack ? JSON.parse(r.stack) : []
    }));
    res.json(projects);
  } catch (err) {
    next(err);
  }
};

exports.getProjectById = async (req, res, next) => {
  try {
    const row = await query.get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    if (!row) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({
      ...row,
      stack: row.stack ? JSON.parse(row.stack) : []
    });
  } catch (err) {
    next(err);
  }
};

exports.createProject = async (req, res, next) => {
  try {
    const { title, year, category, description, stack } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const stackJson = Array.isArray(stack) ? JSON.stringify(stack) : JSON.stringify([]);
    const result = await query.run(
      'INSERT INTO projects (title, year, category, description, stack) VALUES (?, ?, ?, ?, ?)',
      [title, year || '', category || '', description, stackJson]
    );

    res.status(201).json({
      id: result.id,
      title,
      year,
      category,
      description,
      stack: Array.isArray(stack) ? stack : []
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const result = await query.run('DELETE FROM projects WHERE id = ?', [req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    next(err);
  }
};
