import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database('strategic_brain.db');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    constraints TEXT, -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS strategies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goal_id INTEGER,
    name TEXT NOT NULL,
    data TEXT NOT NULL, -- JSON string containing the roadmap, decision tree, etc.
    score REAL,
    risk REAL,
    probability REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(goal_id) REFERENCES goals(id)
  );

  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    strategy_id INTEGER,
    rating INTEGER,
    comments TEXT,
    outcome_met BOOLEAN,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(strategy_id) REFERENCES strategies(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/goals', (req, res) => {
    const goals = db.prepare('SELECT * FROM goals ORDER BY created_at DESC').all();
    res.json(goals);
  });

  app.post('/api/goals', (req, res) => {
    const { title, description, constraints } = req.body;
    const info = db.prepare('INSERT INTO goals (title, description, constraints) VALUES (?, ?, ?)')
      .run(title, description, JSON.stringify(constraints));
    res.json({ id: info.lastInsertRowid });
  });

  app.get('/api/goals/:id/strategies', (req, res) => {
    const strategies = db.prepare('SELECT * FROM strategies WHERE goal_id = ? ORDER BY score DESC').all(req.params.id);
    res.json(strategies.map((s: any) => ({ ...s, data: JSON.parse(s.data) })));
  });

  app.post('/api/strategies', (req, res) => {
    const { goal_id, name, data, score, risk, probability } = req.body;
    const info = db.prepare('INSERT INTO strategies (goal_id, name, data, score, risk, probability) VALUES (?, ?, ?, ?, ?, ?)')
      .run(goal_id, name, JSON.stringify(data), score, risk, probability);
    res.json({ id: info.lastInsertRowid });
  });

  app.post('/api/feedback', (req, res) => {
    const { strategy_id, rating, comments, outcome_met } = req.body;
    db.prepare('INSERT INTO feedback (strategy_id, rating, comments, outcome_met) VALUES (?, ?, ?, ?)')
      .run(strategy_id, rating, comments, outcome_met ? 1 : 0);
    res.json({ success: true });
  });

  // Get historical data for "learning" (context for AI)
  app.get('/api/learning-context', (req, res) => {
    const context = db.prepare(`
      SELECT g.title, g.constraints, s.name, s.score, s.risk, f.rating, f.outcome_met
      FROM feedback f
      JOIN strategies s ON f.strategy_id = s.id
      JOIN goals g ON s.goal_id = g.id
      WHERE f.rating >= 4 OR f.outcome_met = 1
      ORDER BY f.created_at DESC
      LIMIT 5
    `).all();
    res.json(context);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
