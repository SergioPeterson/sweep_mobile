import { View, Text, StyleSheet, FlatList } from 'react-native';

const mockBookings = [
  {
    id: '1',
    cleanerName: 'Jane Smith',
    date: '2025-01-20',
    time: '10:00 AM',
    status: 'confirmed',
    total: 105,
  },
  {
    id: '2',
    cleanerName: 'Mike Johnson',
    date: '2025-01-15',
    time: '2:00 PM',
    status: 'completed',
    total: 90,
  },
];

const statusColors: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#2563eb',
  in_progress: '#8b5cf6',
  completed: '#10b981',
  cancelled: '#ef4444',
};

export default function BookingsScreen() {
  return (
    <View style={styles.container}>
      <FlatList
        data={mockBookings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No bookings yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cleanerName}>{item.cleanerName}</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusColors[item.status] || '#666' },
                ]}
              >
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.datetime}>
              {item.date} at {item.time}
            </Text>
            <View style={styles.cardFooter}>
              <Text style={styles.total}>${item.total}</Text>
            </View>
          </View>
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
  list: {
    padding: 16,
    gap: 12,
  },
  empty: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cleanerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  datetime: {
    fontSize: 14,
    color: '#666',
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  total: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
});
