import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { fileURLToPath } from 'url';
import axios from 'axios';
import FormData from 'form-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

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

// ---- LogMeal helper ----
async function callLogMeal(filePath) {
  const apiKey = process.env.LOGMEAL_KEY;
  if (!apiKey) throw new Error('Missing LOGMEAL_KEY in env');

  const form = new FormData();
  form.append('image', fs.createReadStream(filePath));

  const url =
    process.env.LOGMEAL_URL || 'https://api.logmeal.es/v2/recognition/dish';

  const headers = {
    ...form.getHeaders(),
    Authorization: `Bearer ${apiKey}`,
  };

  const resp = await axios.post(url, form, { headers, timeout: 30000 });
  return resp.data;
}

// ---- Тестовий маршрут ----
app.get('/', (req, res) => res.send('✅ Сервер працює'));

// ---- Основний маршрут аналізу ----
app.post('/analyze', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const filePath = req.file.path;
  console.log('📸 Отримано файл:', filePath);

  try {
    // --- 1. Аналіз через Google Vision ---
    const [labelsResult] = await client.labelDetection(filePath);
    const [objectsResult] = await client.objectLocalization(filePath);

    const labelNames =
      labelsResult.labelAnnotations?.map((l) => l.description) || [];
    const objectNames =
      objectsResult.localizedObjectAnnotations?.map((o) => o.name) || [];

    const combined = Array.from(new Set([...objectNames, ...labelNames]));

    // Фільтруємо лише потенційно їстівні об'єкти
    const foodRelated = combined.filter((item) =>
      /food|dish|meal|cuisine|fruit|vegetable|meat|drink|snack|breakfast|lunch|dinner|salad|soup|cake|pizza|rice|egg|bread|cheese|chicken|fish|burger/i.test(
        item,
      ),
    );

    const visionLabels = foodRelated.length ? foodRelated : combined;
    console.log('🔹 Об’єкти знайдено:', combined);
    console.log('🍽️ Їстівні об’єкти:', visionLabels);

    // --- 2. Виклик LogMeal лише один раз ---
    let logmealItems = [];
    try {
      const logmealResult = await callLogMeal(filePath);

      if (logmealResult && Array.isArray(logmealResult.recognition_results)) {
        logmealItems = logmealResult.recognition_results.map((r) => ({
          name: r.name || r.label || r.class,
          confidence: r.probability ?? r.confidence ?? null,
        }));
      }

      console.log(
        '🔹 LogMeal items:',
        logmealItems.map((i) => i.name),
      );
    } catch (err) {
      console.warn('⚠️ LogMeal error:', err.response?.status || err.message);
    }

    // --- 3. Відповідь клієнту ---
    res.json({
      vision: visionLabels,
      logmeal: logmealItems,
    });
  } catch (error) {
    console.error('❌ Vision API error:', error);
    res.status(500).json({
      error: 'Vision API error',
      details: error.message || error,
    });
  } finally {
    // --- Видаляємо тимчасовий файл ---
    fs.unlink(filePath, (err) => {
      if (err)
        console.warn('⚠️ Не вдалося видалити тимчасовий файл:', err.message);
    });
  }
});

// ---- Запуск сервера ----
app.listen(port, '0.0.0.0', () =>
  console.log(`🚀 Сервер запущено на http://0.0.0.0:${port}`),
);
