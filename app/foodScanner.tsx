import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StyleSheet,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function FoodScanner() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [visionResult, setVisionResult] = useState<string[] | null>(null);
  const [logmealResult, setLogmealResult] = useState<
    { name: string; confidence: number | null }[] | null
  >(null);

  // 📸 Вибрати фото з галереї
  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!res.canceled) setImageUri(res.assets[0].uri);
  };

  // 📷 Зробити фото
  const takePhoto = async () => {
    const res = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });
    if (!res.canceled) setImageUri(res.assets[0].uri);
  };

  // 🚀 Відправити фото на сервер
  const uploadForRecognition = async () => {
    if (!imageUri) {
      alert('Спочатку зробіть фото або виберіть з галереї');
      return;
    }

    setLoading(true);
    setVisionResult(null);
    setLogmealResult(null);

    try {
      const uploadUrl = 'http://172.31.202.146:3000/analyze'; // 🔹 твій локальний IP

      const form = new FormData();
      const filename = imageUri.split('/').pop() || 'photo.jpg';
      const extMatch = /\.(\w+)$/.exec(filename);
      const ext = extMatch ? extMatch[1] : 'jpg';
      const type = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

      let fileToUpload: any;

      if (Platform.OS === 'web') {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        fileToUpload = new File([blob], filename, { type });
      } else {
        fileToUpload = { uri: imageUri, name: filename, type };
      }

      form.append('image', fileToUpload);

      const resp = await fetch(uploadUrl, {
        method: 'POST',
        body: form as any,
      });

      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(`Server error: ${resp.status} ${t}`);
      }

      const data = await resp.json();

      // ✅ Оновлюємо стани
      setVisionResult(data.vision || []);
      setLogmealResult(data.logmeal || []);
    } catch (e) {
      console.error(e);
      alert('Помилка при надсиланні зображення');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={true}
    >
      <View style={styles.container}>
        <Text style={styles.title}>
          Зробіть фото їжі або виберіть з галереї
        </Text>

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.btn} onPress={takePhoto}>
            <Text style={styles.btnText}>📸 Зробити фото</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={pickImage}>
            <Text style={styles.btnText}>🖼️ Вибрати з галереї</Text>
          </TouchableOpacity>
        </View>

        {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}

        {imageUri && !loading && (
          <TouchableOpacity
            style={styles.analyzeBtn}
            onPress={uploadForRecognition}
          >
            <Text style={styles.analyzeText}>🔍 Розпізнати</Text>
          </TouchableOpacity>
        )}

        {loading && (
          <ActivityIndicator
            size="large"
            color="#007AFF"
            style={{ marginTop: 20 }}
          />
        )}

        {visionResult && visionResult.length > 0 && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>🔹 Google Vision:</Text>
            {visionResult.map((label, idx) => (
              <Text key={idx} style={styles.resultItem}>
                • {label}
              </Text>
            ))}
          </View>
        )}

        {logmealResult && logmealResult.length > 0 && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>🍽️ LogMeal:</Text>
            {logmealResult.map((item, idx) => (
              <Text key={idx} style={styles.resultItem}>
                • {item.name}
                {item.confidence !== null
                  ? ` (${(item.confidence * 100).toFixed(1)}%)`
                  : ''}
              </Text>
            ))}
          </View>
        )}

        {visionResult?.length === 0 &&
          logmealResult?.length === 0 &&
          !loading && (
            <Text style={{ marginTop: 20, color: '#fff' }}>
              Продукти не знайдено
            </Text>
          )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#111',
  },
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    marginTop: 40,
    textAlign: 'center',
    color: '#fff',
  },
  buttons: { flexDirection: 'row', gap: 10 },
  btn: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  btnText: { color: 'white', fontWeight: '600' },
  image: { width: 250, height: 250, borderRadius: 10, marginTop: 20 },
  analyzeBtn: {
    marginTop: 15,
    backgroundColor: '#34C759',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  analyzeText: { color: 'white', fontSize: 16, fontWeight: '600' },
  resultBox: {
    marginTop: 25,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 40,
  },
  resultTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  resultItem: { fontSize: 16, color: '#333', marginVertical: 2 },
});
