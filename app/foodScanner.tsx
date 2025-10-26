import React, { useState } from 'react';
import {
  View,
  Text,
  Button,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

export default function CameraScreen({ navigation }: any) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Потрібен доступ до галереї');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      const processed = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
      );
      setImageUri(processed.uri);
    }
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Потрібен доступ до камери');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      const processed = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
      );
      setImageUri(processed.uri);
    }
  }

  async function uploadForRecognition() {
    if (!imageUri) {
      Alert.alert('Спочатку зробіть фото або виберіть з галереї');
      return;
    }

    setLoading(true);

    try {
      // Вказуємо IP/порт твого сервера
      const uploadUrl = 'http://172.31.202.146:3000/analyze'; // заміни на свій IP, якщо потрібно

      const form = new FormData();
      const filename = imageUri.split('/').pop() || 'photo.jpg';
      const extMatch = /\.(\w+)$/.exec(filename);
      const ext = extMatch ? extMatch[1] : 'jpg';

      // @ts-ignore
      form.append('image', {
        uri: imageUri,
        name: filename,
        type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
      });

      const resp = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          // Не вказуємо Content-Type, браузер/React Native поставить boundary сам
        },
        body: form as any,
      });

      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(`Server error: ${resp.status} ${t}`);
      }

      const data = await resp.json();
      Alert.alert('Результат', JSON.stringify(data.labels));
      navigation?.navigate?.('NutritionResult', { result: data });
    } catch (e) {
      console.error(e);
      Alert.alert('Помилка при надсиланні зображення', String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: 'flex-start' }}>
      <Text style={{ fontSize: 18, marginBottom: 12 }}>
        Зробіть фото їжі або виберіть з галереї
      </Text>

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        <Button title="Зробити фото" onPress={takePhoto} />
        <View style={{ width: 12 }} />
        <Button title="Вибрати з галереї" onPress={pickImage} />
      </View>

      {imageUri ? (
        <View style={{ alignItems: 'center', marginVertical: 12 }}>
          <Image
            source={{ uri: imageUri }}
            style={{ width: 300, height: 300, borderRadius: 8 }}
            resizeMode="cover"
          />
        </View>
      ) : (
        <Text style={{ color: '#666', marginVertical: 12 }}>Фото ще немає</Text>
      )}

      <Button
        title="Відправити на розпізнавання"
        onPress={uploadForRecognition}
        disabled={!imageUri || loading}
      />

      {loading && (
        <View style={{ marginTop: 12 }}>
          <ActivityIndicator />
        </View>
      )}
    </View>
  );
}
