import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CardField, useConfirmSetupIntent } from '@stripe/stripe-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { colors } from '@/lib/constants/colors';
import {
  createPaymentMethodSetupIntent,
  deletePaymentMethod,
  getSavedPaymentMethods,
  setDefaultPaymentMethod,
  syncSavedPaymentMethod,
} from '@/lib/api/paymentMethods';
import {
  formatSavedPaymentMethodLabel,
  getFallbackPaymentMethodId,
} from '@/lib/paymentMethods';
import { Button, Card } from '@/components/ui';

export function PaymentMethodsManager() {
  const queryClient = useQueryClient();
  const { confirmSetupIntent, loading: confirmingSetupIntent } = useConfirmSetupIntent();
  const paymentMethodsQuery = useQuery({
    queryKey: ['payment-methods'],
    queryFn: getSavedPaymentMethods,
  });
  const createSetupIntentMutation = useMutation({
    mutationFn: createPaymentMethodSetupIntent,
  });
  const syncMutation = useMutation({
    mutationFn: syncSavedPaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    },
  });
  const setDefaultMutation = useMutation({
    mutationFn: setDefaultPaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deletePaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    },
  });

  const paymentMethods = paymentMethodsQuery.data?.paymentMethods ?? [];
  const defaultPaymentMethodId = getFallbackPaymentMethodId(paymentMethodsQuery.data);
  const setupIntentState = createSetupIntentMutation.data ?? null;
  const cardBusy =
    createSetupIntentMutation.isPending ||
    syncMutation.isPending ||
    confirmingSetupIntent;

  const handleSaveCard = async () => {
    if (!setupIntentState) {
      return;
    }

    const result = await confirmSetupIntent(setupIntentState.clientSecret, {
      paymentMethodType: 'Card',
    });

    if (result.error || result.setupIntent?.status !== 'Succeeded') {
      return;
    }

    await syncMutation.mutateAsync({
      setupIntentId: setupIntentState.setupIntentId,
      setDefault: paymentMethods.length === 0,
    });
    createSetupIntentMutation.reset();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Payment methods</Text>
        <Text style={styles.description}>
          Save a card for faster checkout and choose your default payment method.
        </Text>
      </View>

      {paymentMethodsQuery.isLoading ? (
        <Card style={styles.loadingCard}>
          <ActivityIndicator size="small" color={colors.forest700} />
          <Text style={styles.loadingText}>Loading saved cards...</Text>
        </Card>
      ) : paymentMethods.length > 0 ? (
        paymentMethods.map((paymentMethod) => {
          const isDefault =
            paymentMethod.isDefault || defaultPaymentMethodId === paymentMethod.id;

          return (
            <Card key={paymentMethod.id} style={styles.paymentMethodCard}>
              <View style={styles.paymentMethodHeader}>
                <View style={styles.paymentMethodCopy}>
                  <Text style={styles.paymentMethodLabel}>
                    {formatSavedPaymentMethodLabel(paymentMethod)}
                  </Text>
                  {isDefault ? (
                    <Text style={styles.defaultText}>Default for checkout</Text>
                  ) : null}
                </View>
                <View style={styles.paymentMethodActions}>
                  {!isDefault ? (
                    <Button
                      title="Set default"
                      size="sm"
                      variant="secondary"
                      onPress={() => {
                        void setDefaultMutation.mutateAsync(paymentMethod.id);
                      }}
                      loading={
                        setDefaultMutation.isPending &&
                        setDefaultMutation.variables === paymentMethod.id
                      }
                    />
                  ) : null}
                  <Button
                    title="Remove"
                    size="sm"
                    variant="ghost"
                    onPress={() => {
                      void deleteMutation.mutateAsync(paymentMethod.id);
                    }}
                    loading={
                      deleteMutation.isPending &&
                      deleteMutation.variables === paymentMethod.id
                    }
                  />
                </View>
              </View>
            </Card>
          );
        })
      ) : (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No saved payment methods yet</Text>
          <Text style={styles.emptyDescription}>
            Save a card once and it will be ready the next time you book.
          </Text>
        </Card>
      )}

      {setupIntentState ? (
        <Card style={styles.addCard}>
          <Text style={styles.addCardTitle}>Add a new card</Text>
          <CardField
            postalCodeEnabled={false}
            placeholders={{ number: '4242 4242 4242 4242' }}
            cardStyle={{
              backgroundColor: colors.white,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 12,
              textColor: colors.foreground,
              placeholderColor: colors.muted,
            }}
            style={styles.cardField}
          />
          <View style={styles.addCardActions}>
            <Button
              title="Save card"
              size="sm"
              onPress={() => {
                void handleSaveCard();
              }}
              loading={cardBusy}
            />
            <Button
              title="Cancel"
              size="sm"
              variant="ghost"
              onPress={() => {
                createSetupIntentMutation.reset();
              }}
            />
          </View>
        </Card>
      ) : null}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          void createSetupIntentMutation.mutateAsync();
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.addButtonText}>+ Add payment method</Text>
      </TouchableOpacity>
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
  paymentMethodCard: {
    gap: 12,
  },
  paymentMethodHeader: {
    gap: 12,
  },
  paymentMethodCopy: {
    gap: 4,
  },
  paymentMethodLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
  },
  defaultText: {
    fontSize: 12,
    color: colors.forest700,
    fontWeight: '600',
  },
  paymentMethodActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emptyCard: {
    gap: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
  },
  emptyDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.slate600,
  },
  addCard: {
    gap: 12,
  },
  addCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
  },
  cardField: {
    height: 48,
  },
  addCardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  addButton: {
    paddingVertical: 10,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.forest700,
  },
});
