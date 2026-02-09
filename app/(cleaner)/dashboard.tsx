import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function CleanerDashboardScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>3</Text>
          <Text style={styles.statLabel}>Today&apos;s Bookings</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>$420</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>4.9</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>98%</Text>
          <Text style={styles.statLabel}>Completion</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
        <View style={styles.bookingCard}>
          <View style={styles.bookingHeader}>
            <Text style={styles.bookingTime}>10:00 AM</Text>
            <Text style={styles.bookingDuration}>2 hrs</Text>
          </View>
          <Text style={styles.bookingCustomer}>John Doe</Text>
          <Text style={styles.bookingAddress}>123 Main St, Apt 4B</Text>
        </View>
        <View style={styles.bookingCard}>
          <View style={styles.bookingHeader}>
            <Text style={styles.bookingTime}>2:00 PM</Text>
            <Text style={styles.bookingDuration}>3 hrs</Text>
          </View>
          <Text style={styles.bookingCustomer}>Jane Smith</Text>
          <Text style={styles.bookingAddress}>456 Oak Ave</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  statCard: {
    width: '50%',
    padding: 8,
  },
  statCardInner: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    textAlign: 'center',
    overflow: 'hidden',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#fff',
    textAlign: 'center',
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bookingTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  bookingDuration: {
    fontSize: 14,
    color: '#666',
  },
  bookingCustomer: {
    fontSize: 16,
    fontWeight: '500',
  },
  bookingAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});
