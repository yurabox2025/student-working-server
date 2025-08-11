const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Создание таблицы при старте (можно 1 раз)
const init = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS form_data (
      id SERIAL PRIMARY KEY,
      submitted_at TIMESTAMP DEFAULT NOW(),
      date TEXT,
      number TEXT,
      text TEXT
    )
  `);
};
init();

app.post('/submit', async (req, res) => {
  const { date, number, text } = req.body;
  if (!date) return res.status(400).json({ error: "Дата не может быть пустой" });
  if (!/^\d{1,12}$/.test(number)) return res.status(400).json({ error: "Число должно быть максимум 12 цифр" });
  if (!text || text.length > 200) return res.status(400).json({ error: "Текст не должен превышать 200 символов" });

  await pool.query(
    'INSERT INTO form_data(date, number, text) VALUES ($1, $2, $3)',
    [date, number, text]
  );
  res.json({ success: true, message: "Данные успешно сохранены!" });
});

// Получить все записи (для проверки)
app.get('/data', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM form_data ORDER BY submitted_at DESC');
  res.json(rows);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server started at http://localhost:${PORT}`));
