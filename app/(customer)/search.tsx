import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Link } from 'expo-router';

// Placeholder data
const mockCleaners = [
  { id: '1', name: 'Jane Smith', rating: 4.9, reviewCount: 127, hourlyRate: 35 },
  { id: '2', name: 'Mike Johnson', rating: 4.7, reviewCount: 89, hourlyRate: 30 },
  { id: '3', name: 'Sarah Williams', rating: 4.8, reviewCount: 156, hourlyRate: 40 },
];

export default function SearchScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>Map View</Text>
        <Text style={styles.mapSubtext}>(Requires react-native-maps setup)</Text>
      </View>

      <FlatList
        data={mockCleaners}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Link href={`/(customer)/cleaner/${item.id}`} asChild>
            <Pressable style={styles.card}>
              <View style={styles.avatar} />
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.rate}>${item.hourlyRate}/hr</Text>
                </View>
                <Text style={styles.rating}>
                  ★ {item.rating} ({item.reviewCount} reviews)
                </Text>
              </View>
            </Pressable>
          </Link>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: {
    fontSize: 18,
    color: '#666',
  },
  mapSubtext: {
    fontSize: 12,
    color: '#999',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ddd',
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  rate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  rating: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});
