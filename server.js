const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// Валидация
app.post('/submit', (req, res) => {
    const { date, number, text } = req.body;
    if (!date) {
        return res.status(400).json({ error: "Дата не может быть пустой" });
    }
    if (!/^\d{1,12}$/.test(number)) {
        return res.status(400).json({ error: "Число должно быть максимум 12 цифр" });
    }
    if (!text || text.length > 200) {
        return res.status(400).json({ error: "Текст не должен превышать 200 символов" });
    }
    return res.json({ success: true, message: "Данные успешно приняты!" });
});

// Подключаем React static build
// app.use(express.static(path.join(__dirname, '..', 'client', 'build')));
// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html')); 
// });

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server started at http://localhost:${PORT}`));
