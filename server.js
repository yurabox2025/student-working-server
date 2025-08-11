const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// доверяем X-Forwarded-For от Render/прокси
app.set("trust proxy", true);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// миграция: добавить столбец ip
const init = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS form_data (
      id SERIAL PRIMARY KEY,
      submitted_at TIMESTAMP DEFAULT NOW(),
      date TEXT,
      number TEXT,
      text TEXT,
      ip TEXT
    );
  `);
  // на всякий случай, если таблица уже была без ip:
  await pool.query(`ALTER TABLE form_data ADD COLUMN IF NOT EXISTS ip TEXT;`);
};
init();

// хелпер получения IP
function getClientIp(req) {
  // благодаря trust proxy, req.ip уже корректный
  // но возьмём первый из X-Forwarded-For, если есть
  const hdr = req.headers["x-forwarded-for"];
  if (hdr && typeof hdr === "string") {
    return hdr.split(",")[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || "";
}

app.post("/submit", async (req, res) => {
  const { date, number, text } = req.body;
  if (!date)
    return res.status(400).json({ error: "Дата не может быть пустой" });
  if (!/^\d{1,12}$/.test(number))
    return res
      .status(400)
      .json({ error: "Число должно быть максимум 12 цифр" });
  if (!text || text.length > 200)
    return res
      .status(400)
      .json({ error: "Текст не должен превышать 200 символов" });

  const ip = getClientIp(req);

  await pool.query(
    "INSERT INTO form_data(date, number, text, ip) VALUES ($1, $2, $3, $4)",
    [date, number, text, ip]
  );

  res.json({ success: true, message: "Данные успешно сохранены!" });
});

app.get("/data", async (_req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM form_data ORDER BY submitted_at DESC"
  );
  res.json(rows);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`Server started at http://localhost:${PORT}`)
);
