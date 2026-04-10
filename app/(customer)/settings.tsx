import { ScrollView, StyleSheet } from 'react-native';
import { AgentAccessSection } from '@/components/account/AgentAccessSection';
import { colors } from '@/lib/constants/colors';

export default function CustomerSettingsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AgentAccessSection />
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
