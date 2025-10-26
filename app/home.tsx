import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const user = {
    name: 'Sergey',
    weeklyProgress: 0.6,
    workoutsCompleted: 4,
    caloriesBurned: 1200,
    kmRun: 15,
  };

  const quickWorkouts = [
    { title: 'Кардио 20 мин' },
    { title: 'Силовая тренировка' },
    { title: 'Йога для спины' },
    { title: 'HIIT 15 мин' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Приветствие */}
        <Text style={styles.greeting}>Привет, {user.name}!</Text>

        {/* Статистика */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{user.workoutsCompleted}</Text>
            <Text style={styles.statLabel}>Тренировок</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{user.caloriesBurned}</Text>
            <Text style={styles.statLabel}>Калорий</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{user.kmRun}</Text>
            <Text style={styles.statLabel}>Км</Text>
          </View>
        </View>

        {/* Кнопка начать тренировку */}
        <TouchableOpacity>
          <LinearGradient
            colors={['#4caf50', '#81c784']}
            style={styles.startButton}
          >
            <Text style={styles.startButtonText}>Начать тренировку</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Быстрые тренировки */}
        <Text style={styles.sectionTitle}>Быстрые тренировки</Text>

        {/* ✅ Виправлено: FlatList без власного скролу */}
        <FlatList
          data={quickWorkouts}
          numColumns={2}
          keyExtractor={(item, index) => index.toString()}
          scrollEnabled={false} // ⚠️ вимикає власний скрол
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.workoutCard, { flex: 1, margin: 6 }]}
            >
              <Text style={styles.workoutTitle}>{item.title}</Text>
            </TouchableOpacity>
          )}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111',
    paddingTop: 10, // ✅ Отступ сверху от часов/батареи
  },
  container: { flex: 1, paddingHorizontal: 16 },
  greeting: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    marginHorizontal: 6,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  statLabel: { fontSize: 14, color: '#aaa', marginTop: 4 },
  startButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  workoutCard: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 10,
    marginRight: 12,
  },
  workoutTitle: { color: '#fff', fontSize: 16 },
});
