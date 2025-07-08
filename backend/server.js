const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(session({ secret: 'secret-key', resave: false, saveUninitialized: true }));

const db = new sqlite3.Database('./feedback.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    content TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
});

function authRequired(req, res, next) {
  if (req.session.userId) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  const hashed = bcrypt.hashSync(password, 10);
  const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
  stmt.run(username, hashed, function(err) {
    if (err) return res.status(400).json({ error: 'User exists' });
    res.json({ success: true });
  });
  stmt.finalize();
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT id, password FROM users WHERE username = ?', [username], (err, row) => {
    if (err || !row) return res.status(400).json({ error: 'Invalid credentials' });
    if (bcrypt.compareSync(password, row.password)) {
      req.session.userId = row.id;
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Invalid credentials' });
    }
  });
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.post('/messages', authRequired, (req, res) => {
  const { content } = req.body;
  const stmt = db.prepare('INSERT INTO messages (user_id, content) VALUES (?, ?)');
  stmt.run(req.session.userId, content, function(err) {
    if (err) return res.status(500).json({ error: 'Failed to save message' });
    res.json({ success: true });
  });
  stmt.finalize();
});

app.get('/messages', authRequired, (req, res) => {
  db.all('SELECT m.id, m.content, u.username FROM messages m JOIN users u ON m.user_id = u.id ORDER BY m.id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch messages' });
    res.json(rows);
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));
