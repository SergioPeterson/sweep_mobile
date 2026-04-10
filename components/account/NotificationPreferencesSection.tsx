import {
  ActivityIndicator,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { colors } from '@/lib/constants/colors';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from '@/lib/api/notifications';
import { Button, Card } from '@/components/ui';

interface NotificationPreferencesSectionProps {
  title: string;
  description: string;
}

interface PreferenceToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

function PreferenceToggleRow({
  label,
  description,
  checked,
  disabled = false,
  onChange,
}: PreferenceToggleRowProps) {
  return (
    <Card style={styles.preferenceCard}>
      <View style={styles.preferenceCopy}>
        <Text style={styles.preferenceLabel}>{label}</Text>
        <Text style={styles.preferenceDescription}>{description}</Text>
      </View>
      <Switch
        value={checked}
        disabled={disabled}
        onValueChange={onChange}
        trackColor={{ false: colors.slate300, true: colors.forest200 }}
        thumbColor={checked ? colors.forest700 : colors.white}
      />
    </Card>
  );
}

export function NotificationPreferencesSection({
  title,
  description,
}: NotificationPreferencesSectionProps) {
  const queryClient = useQueryClient();
  const preferencesQuery = useQuery({
    queryKey: ['notifications', 'preferences'],
    queryFn: getNotificationPreferences,
  });
  const updateMutation = useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'preferences'] });
    },
  });

  const preferences = preferencesQuery.data?.preferences;
  const [phoneDraft, setPhoneDraft] = useState('');

  useEffect(() => {
    setPhoneDraft(preferences?.phone ?? '');
  }, [preferences?.phone]);

  const savePhone = async (nextPhone: string) => {
    await updateMutation.mutateAsync({
      phone: nextPhone.trim() === '' ? null : nextPhone.trim(),
    });
  };

  const updatePreference = async (
    patch: Partial<NotificationPreferences>,
  ) => {
    await updateMutation.mutateAsync(patch);
  };

  if (preferencesQuery.isLoading || !preferences) {
    return (
      <Card style={styles.loadingCard}>
        <ActivityIndicator size="small" color={colors.forest700} />
        <Text style={styles.loadingText}>Loading notification preferences...</Text>
      </Card>
    );
  }

  const phoneDirty = phoneDraft !== (preferences.phone ?? '');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      <Card style={styles.phoneCard}>
        <View style={styles.phoneHeader}>
          <View style={styles.phoneCopy}>
            <Text style={styles.preferenceLabel}>SMS phone number</Text>
            <Text style={styles.preferenceDescription}>
              We use this only for critical booking alerts.
            </Text>
          </View>
          <Button
            title="Save"
            size="sm"
            variant="secondary"
            disabled={!phoneDirty}
            onPress={() => {
              void savePhone(phoneDraft);
            }}
            loading={updateMutation.isPending}
          />
        </View>
        <TextInput
          style={styles.phoneInput}
          value={phoneDraft}
          onChangeText={setPhoneDraft}
          placeholder="+1 (415) 555-1212"
          placeholderTextColor={colors.muted}
          keyboardType="phone-pad"
        />
        <Text style={styles.phoneMeta}>
          {preferences.phoneVerified
            ? 'Phone number verified'
            : preferences.phone
              ? 'Phone number saved'
              : 'No phone number saved yet'}
        </Text>
      </Card>

      <PreferenceToggleRow
        label="Push notifications"
        description="Enable booking updates in your notification inbox. Device push registration is configured separately."
        checked={preferences.pushEnabled}
        disabled={updateMutation.isPending}
        onChange={(checked) => {
          void updatePreference({ pushEnabled: checked });
        }}
      />

      <PreferenceToggleRow
        label="Email notifications"
        description="Keep booking updates and reminders in your inbox."
        checked={preferences.emailEnabled}
        disabled={updateMutation.isPending}
        onChange={(checked) => {
          void updatePreference({ emailEnabled: checked });
        }}
      />

      <PreferenceToggleRow
        label="SMS booking confirmations"
        description="Receive a text when a booking is confirmed."
        checked={preferences.smsBookingConfirmationsEnabled}
        disabled={updateMutation.isPending}
        onChange={(checked) => {
          void updatePreference({ smsBookingConfirmationsEnabled: checked });
        }}
      />

      <PreferenceToggleRow
        label="SMS reminders"
        description="Receive text reminders for upcoming bookings."
        checked={preferences.smsRemindersEnabled}
        disabled={updateMutation.isPending}
        onChange={(checked) => {
          void updatePreference({ smsRemindersEnabled: checked });
        }}
      />

      <PreferenceToggleRow
        label="SMS cancellations"
        description="Get urgent texts when bookings are cancelled or changed."
        checked={preferences.smsBookingCancellationsEnabled}
        disabled={updateMutation.isPending}
        onChange={(checked) => {
          void updatePreference({ smsBookingCancellationsEnabled: checked });
        }}
      />

      <PreferenceToggleRow
        label="Booking updates"
        description="Confirmation, cancellation, dispute, and status-change alerts."
        checked={preferences.bookingUpdatesEnabled}
        disabled={updateMutation.isPending}
        onChange={(checked) => {
          void updatePreference({ bookingUpdatesEnabled: checked });
        }}
      />

      <PreferenceToggleRow
        label="Reminders"
        description="Receive 24-hour and day-of reminders for upcoming work."
        checked={preferences.reminderNotificationsEnabled}
        disabled={updateMutation.isPending}
        onChange={(checked) => {
          void updatePreference({ reminderNotificationsEnabled: checked });
        }}
      />

      <PreferenceToggleRow
        label="Tips"
        description="Get notified when tips are sent or confirmed."
        checked={preferences.tipNotificationsEnabled}
        disabled={updateMutation.isPending}
        onChange={(checked) => {
          void updatePreference({ tipNotificationsEnabled: checked });
        }}
      />

      <PreferenceToggleRow
        label="Payouts"
        description="Cleaner payout confirmations and earnings-related updates."
        checked={preferences.payoutNotificationsEnabled}
        disabled={updateMutation.isPending}
        onChange={(checked) => {
          void updatePreference({ payoutNotificationsEnabled: checked });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.slate600,
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: colors.slate600,
  },
  phoneCard: {
    gap: 12,
  },
  phoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  phoneCopy: {
    flex: 1,
    gap: 4,
  },
  phoneInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.foreground,
    backgroundColor: colors.white,
  },
  phoneMeta: {
    fontSize: 12,
    color: colors.muted,
  },
  preferenceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  preferenceCopy: {
    flex: 1,
    gap: 4,
  },
  preferenceLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
  },
  preferenceDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.slate600,
  },
});
