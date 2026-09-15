const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'portfolio.sqlite');
const db = new sqlite3.Database(dbPath);

// Promisified query helpers
const query = {
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }
};

function initializeDatabase() {
  db.serialize(async () => {
    // 1. Projects Table
    db.run(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        year TEXT,
        category TEXT,
        description TEXT NOT NULL,
        stack TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Contacts / Messages Table
    db.run(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Profile Table
    db.run(`
      CREATE TABLE IF NOT EXISTS profile (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        title TEXT NOT NULL,
        kicker TEXT,
        bio TEXT,
        manifesto TEXT,
        location TEXT,
        email TEXT,
        socials TEXT
      )
    `);

    // Check and seed initial data if projects table is empty
    db.get('SELECT COUNT(*) as count FROM projects', async (err, row) => {
      if (err) {
        console.error('Error checking projects count:', err);
        return;
      }

      if (row.count === 0) {
        console.log('Seeding initial portfolio data from portfolio.html...');
        const initialProjects = [
          {
            title: 'Nimbus Sync Engine',
            year: '2025',
            category: 'Realtime infrastructure',
            description: 'Rebuilt the collaboration layer for a 40-person design tool from a polling API to a CRDT-backed WebSocket engine. Cut sync latency from ~800ms to under 60ms and made concurrent editing actually pleasant.',
            stack: JSON.stringify(['Rust', 'WebSockets', 'CRDT', 'Redis'])
          },
          {
            title: 'Atlas Analytics',
            year: '2024',
            category: 'Platform migration',
            description: 'Led the migration of a legacy reporting stack to a streaming pipeline, replacing 6-hour nightly batch jobs with sub-minute dashboards, without a single day of downtime for finance.',
            stack: JSON.stringify(['Kafka', 'dbt', 'Snowflake', 'TypeScript'])
          },
          {
            title: 'Drift Components',
            year: '2023',
            category: 'Design systems',
            description: 'Designed and shipped an internal component library adopted across 12 product teams, cutting new-feature build time by roughly a third and finally killing four competing button styles.',
            stack: JSON.stringify(['React', 'Storybook', 'Figma Tokens'])
          }
        ];

        for (const p of initialProjects) {
          await query.run(
            'INSERT INTO projects (title, year, category, description, stack) VALUES (?, ?, ?, ?, ?)',
            [p.title, p.year, p.category, p.description, p.stack]
          );
        }

        // Seed Profile
        await query.run(
          `INSERT INTO profile (name, title, kicker, bio, manifesto, location, email, socials) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            'Deepak GM',
            'Software Engineer',
            'Software Engineer — systems, interfaces, the occasional 3AM incident',
            'I build products that hold up under real traffic — from the database up to the pixel. Ten years turning ambitious roadmaps into software that ships, and occasionally into technical debt I fully intend to pay off.',
            'Good engineering is invisible until it isn\'t. I try to make the boring parts — auth, sync, migrations — disappear, so the interesting parts get the attention.',
            'Bengaluru, India · working worldwide',
            'deeeepakgm@gmail.com',
            JSON.stringify([
              { name: 'GitHub', url: 'https://github.com/deeepakgm-hw' },
              { name: 'LinkedIn', url: 'http://linkedin.com/in/deepak-gm-b85a14348/' },
              { name: 'Instagram', url: 'https://www.instagram.com/deepakgm.official/' }
            ])
          ]
        );
        console.log('Database seeded successfully.');
      }
    });
  });
}

initializeDatabase();

module.exports = {
  db,
  query
};
