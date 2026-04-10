import { ScrollView, StyleSheet, View } from 'react-native';
import { AgentAccessSection } from '@/components/account/AgentAccessSection';
import { NotificationPreferencesSection } from '@/components/account/NotificationPreferencesSection';
import { PaymentMethodsManager } from '@/components/account/PaymentMethodsManager';
import { colors } from '@/lib/constants/colors';

export default function CustomerSettingsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <PaymentMethodsManager />
      </View>

      <View style={styles.section}>
        <NotificationPreferencesSection
          title="Notification preferences"
          description="Choose which booking updates and reminders you want to receive across push, email, and SMS."
        />
      </View>

      <View style={styles.section}>
        <AgentAccessSection />
      </View>
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
    gap: 24,
  },
  section: {
    gap: 12,
  },
});
