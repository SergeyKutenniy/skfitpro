import express from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// ---- CORS для веб/мобільного ----
app.use(cors());

// ---- Папка для завантажених файлів ----
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const upload = multer({ dest: uploadDir });

// ---- Підключення до Google Vision API ----
const keyPath = path.join(__dirname, 'key.json');
if (!fs.existsSync(keyPath)) {
  console.error('❌ Файл key.json не знайдено!');
  process.exit(1);
}

const client = new ImageAnnotatorClient({
  keyFilename: keyPath,
});

// ---- Тестовий маршрут ----
app.get('/', (req, res) => res.send('✅ Сервер працює'));

// ---- Маршрут для аналізу фото ----
app.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    console.log('req.file:', req.file);

    const [result] = await client.labelDetection(req.file.path);

    if (!result.labelAnnotations) {
      return res
        .status(500)
        .json({ error: 'Vision API did not return labels' });
    }

    const labels = result.labelAnnotations.map((l) => l.description);
    res.json({ labels });
  } catch (error) {
    console.error('Vision API error:', error.message || error);
    res.status(500).json({ error: 'Vision API error', details: error.message });
  }
});

// ---- Запуск сервера ----
app.listen(port, '0.0.0.0', () =>
  console.log(`🚀 Сервер запущено на http://0.0.0.0:${port}`),
);
