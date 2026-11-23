import express from 'express';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// База даних SQLite (зберігається локально у файлі feedback.db)
const db = new DatabaseSync(path.join(__dirname, 'feedback.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

app.use(express.json());
// Віддаємо статичні файли (index.html, style.css, script.js)
app.use(express.static(__dirname));

// --- REST API маршрути (CRUD) ---

// READ: отримати всі заявки
app.get('/api/submissions', (req, res) => {
  const rows = db
    .prepare('SELECT id, name, email, created_at FROM submissions ORDER BY id DESC')
    .all();
  res.json(rows);
});

// CREATE: створити нову заявку
app.post('/api/submissions', (req, res) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim();

  if (!name || !email) {
    return res.status(400).json({ error: 'Заповніть ім’я та email.' });
  }
  if (!email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ error: 'Введіть коректний email.' });
  }

  const stmt = db.prepare('INSERT INTO submissions (name, email) VALUES (?, ?)');
  const info = stmt.run(name, email);

  const created = db
    .prepare('SELECT id, name, email, created_at FROM submissions WHERE id = ?')
    .get(info.lastInsertRowid);

  res.status(201).json(created);
});

// UPDATE: оновити ім'я або email заявки за ID
app.put('/api/submissions/:id', (req, res) => {
  const id = Number(req.params.id);
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim();

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Некоректний ID запису.' });
  }
  if (!name || !email || !email.includes('@')) {
    return res.status(400).json({ error: 'Перевірте коректність даних.' });
  }

  const result = db
    .prepare('UPDATE submissions SET name = ?, email = ? WHERE id = ?')
    .run(name, email, id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Запис не знайдено.' });
  }

  const updated = db
    .prepare('SELECT id, name, email, created_at FROM submissions WHERE id = ?')
    .get(id);
  res.json(updated);
});

// DELETE: видалити заявку за ID
app.delete('/api/submissions/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Некоректний ID запису.' });
  }

  const result = db.prepare('DELETE FROM submissions WHERE id = ?').run(id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Запис не знайдено.' });
  }

  res.json({ deleted: true, id });
});

app.listen(PORT, () => {
  console.log(`Сервер запущено: http://localhost:${PORT}`);
});