import { ScrollView, StyleSheet } from 'react-native';
import { colors } from '@/lib/constants/colors';
import { NotificationPreferencesSection } from '@/components/account/NotificationPreferencesSection';

export default function CleanerSettingsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <NotificationPreferencesSection
        title="Notification preferences"
        description="Choose how Sweep should notify you about new jobs, reminders, tips, and payout activity."
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
});
