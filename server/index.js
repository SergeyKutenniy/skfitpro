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
app.use(express.json());

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

// ---- Основний маршрут для аналізу фото ----
app.post('/analyze', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const filePath = req.file.path;
  console.log('req.file:', req.file);

  try {
    // --- Запускаємо три типи аналізу ---
    const [labelsResult] = await client.labelDetection(filePath);
    const [objectsResult] = await client.objectLocalization(filePath);
    const [webResult] = await client.webDetection(filePath);

    // --- 1. Labels (загальні описи, але часто точні назви страв) ---
    const labelNames =
      labelsResult.labelAnnotations?.map((l) => l.description) || [];

    // --- 2. Objects (реальні предмети, які Vision бачить) ---
    const objectNames =
      objectsResult.localizedObjectAnnotations?.map((o) => o.name) || [];

    // --- 3. Web entities (Vision шукає схожі зображення в Інтернеті — часто конкретні страви) ---
    const webNames =
      webResult.webEntities
        ?.filter((e) => e.description)
        .map((e) => e.description) || [];

    // --- Об'єднуємо всі результати ---
    const combined = Array.from(
      new Set([...objectNames, ...labelNames, ...webNames]),
    );

    // --- Якщо хочеш тільки "їжу", фільтруємо ---
    const foodRelated = combined.filter((item) =>
      /food|dish|meal|cuisine|fruit|vegetable|meat|drink|snack|breakfast|lunch|dinner|salad|soup|cake|pizza|rice|egg|bread|cheese|chicken|fish|burger/i.test(
        item,
      ),
    );

    res.json({
      labels: foodRelated.length ? foodRelated : combined,
    });
  } catch (error) {
    console.error('Vision API error:', error);
    res.status(500).json({
      error: 'Vision API error',
      details: error.message || error,
    });
  } finally {
    // --- Видаляємо тимчасовий файл ---
    fs.unlink(filePath, (err) => {
      if (err)
        console.warn('Не вдалося видалити тимчасовий файл:', err.message);
    });
  }
});

// ---- Запуск сервера ----
app.listen(port, '0.0.0.0', () =>
  console.log(`🚀 Сервер запущено на http://0.0.0.0:${port}`),
);
