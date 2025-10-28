import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';

async function testAnalyze() {
  try {
    const imagePath = './food.jpg'; // 👉 заміни на шлях до свого фото
    if (!fs.existsSync(imagePath)) {
      console.error('❌ Фото не знайдено:', imagePath);
      console.log(
        'Будь ласка, поклади файл pizza.jpg поруч із test_request.js',
      );
      return;
    }

    const form = new FormData();
    form.append('image', fs.createReadStream(imagePath));

    console.log('📤 Відправляю фото на сервер...');
    const response = await axios.post('http://localhost:3000/analyze', form, {
      headers: form.getHeaders(),
      timeout: 60000,
    });

    console.log('\n✅ Отримано відповідь від сервера:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.error('❌ Помилка від сервера:', error.response.status);
      console.error(error.response.data);
    } else {
      console.error('❌ Помилка запиту:', error.message);
    }
  }
}

testAnalyze();
