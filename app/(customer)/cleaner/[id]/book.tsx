import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { CardField, useConfirmPayment } from '@stripe/stripe-react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { colors } from '@/lib/constants/colors';
import { Button, Card, LoadingScreen, StickyBottomBar } from '@/components/ui';
import {
  DateStrip,
  DurationPills,
  RecurrencePicker,
  TimeSlotList,
  generateTimeSlots,
} from '@/components/booking';
import { getCleanerById, getCleanerAvailability } from '@/lib/api/cleaners';
import {
  confirmBooking,
  createHold,
  createPaymentIntent,
} from '@/lib/api/bookings';
import {
  createAddress,
  getAddresses,
  type UserAddress,
} from '@/lib/api/addresses';
import {
  getSavedPaymentMethods,
  type SavedPaymentMethod,
} from '@/lib/api/paymentMethods';
import {
  alignRecurrenceToDate,
  formatBookingRecurrenceSummary,
  type BookingRecurrence,
} from '@/lib/booking/recurrence';
import {
  getInitialBookingAddressSelection,
  shouldLoadSavedAddresses,
} from '@/lib/booking/address';
import { buildUpcomingDateKeys } from '@/lib/booking/date';
import { formatUsd, formatUsdFromCents } from '@/lib/format';
import {
  formatSavedPaymentMethodLabel,
  getFallbackPaymentMethodId,
} from '@/lib/paymentMethods';

const PLATFORM_FEE_RATE = 0.08;
const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

interface BookingStepCardProps {
  step: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

function BookingStepCard({
  step,
  title,
  description,
  children,
}: BookingStepCardProps) {
  return (
    <Card style={styles.stepCard}>
      <Text style={styles.stepEyebrow}>{step}</Text>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepDescription}>{description}</Text>
      <View style={styles.stepBody}>{children}</View>
    </Card>
  );
}

function formatDateDisplay(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTimeLabel(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date(2000, 0, 1, hours, minutes);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getErrorStatus(error: unknown): number | undefined {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'status' in error.response &&
    typeof error.response.status === 'number'
  ) {
    return error.response.status;
  }

  return undefined;
}

function getErrorCode(error: unknown): string | undefined {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'data' in error.response &&
    typeof error.response.data === 'object' &&
    error.response.data !== null &&
    'error' in error.response.data &&
    typeof error.response.data.error === 'object' &&
    error.response.data.error !== null &&
    'code' in error.response.data.error &&
    typeof error.response.data.error.code === 'string'
  ) {
    return error.response.data.error.code;
  }

  return undefined;
}

function getBookingFlowErrorMessage(error: unknown): string {
  const status = getErrorStatus(error);
  const code = getErrorCode(error);

  if (status === 409) {
    return 'That time was just booked. Please choose another slot.';
  }

  if (status === 410 || code === 'HOLD_EXPIRED') {
    return 'This hold expired. Please pick a time again.';
  }

  if (status === 422 && code === 'STRIPE_NOT_CONNECTED') {
    return 'This cleaner has not finished payment setup yet.';
  }

  if (status === 404 && code === 'PAYMENT_NOT_FOUND') {
    return 'We could not find the payment for this booking yet. Please try again.';
  }

  return 'Something went wrong. Please try again.';
}

function getAvailabilitySlots(
  availabilityData:
    | {
        slots: Array<{
          startTime?: string;
          start?: string;
          available: boolean;
        }>;
      }
    | undefined,
) {
  const base = generateTimeSlots(8, 18);
  if (!availabilityData?.slots?.length) {
    return base;
  }

  const availableSet = new Set<string>();
  for (const slot of availabilityData.slots) {
    if (!slot.available) {
      continue;
    }

    const raw = slot.startTime ?? slot.start ?? '';
    if (raw.includes('T')) {
      const date = new Date(raw);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      availableSet.add(`${hours}:${minutes}`);
      continue;
    }

    if (raw.includes(':')) {
      availableSet.add(raw.slice(0, 5));
    }
  }

  if (availableSet.size === 0) {
    return base.map((slot) => ({ ...slot, available: false }));
  }

  return base.map((slot) => ({
    ...slot,
    available: availableSet.has(slot.time),
  }));
}

export default function CleanerBookScreen() {
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { confirmPayment, loading: confirmingPayment } = useConfirmPayment();
  const {
    id,
    date: paramDate,
    duration: paramDuration,
    time: paramTime,
  } = useLocalSearchParams<{
    id: string;
    date?: string;
    duration?: string;
    time?: string;
  }>();

  const dates = useMemo(() => {
    const generated = buildUpcomingDateKeys(14);
    if (!paramDate || generated.includes(paramDate) || paramDate < generated[0]) {
      return generated;
    }

    return [...generated, paramDate].sort();
  }, [paramDate]);

  const [selectedDate, setSelectedDate] = useState(
    paramDate && dates.includes(paramDate) ? paramDate : dates[0],
  );
  const [duration, setDuration] = useState(paramDuration ? Number(paramDuration) : 3);
  const [selectedTime, setSelectedTime] = useState<string | null>(paramTime ?? null);
  const [recurrence, setRecurrence] = useState<BookingRecurrence | null>(null);

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [street, setStreet] = useState('');
  const [unit, setUnit] = useState('');
  const [zip, setZip] = useState('');
  const [instructions, setInstructions] = useState('');
  const [saveAddressPreference, setSaveAddressPreference] = useState(true);

  const [holdId, setHoldId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [useNewPaymentMethod, setUseNewPaymentMethod] = useState(false);
  const [selectedSavedPaymentMethodId, setSelectedSavedPaymentMethodId] = useState<string | null>(
    null,
  );
  const [holdError, setHoldError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const cleanerQuery = useQuery({
    queryKey: ['cleaner', id],
    queryFn: () => getCleanerById(id!),
    enabled: !!id,
  });

  const availabilityQuery = useQuery({
    queryKey: ['cleanerAvailability', id, selectedDate, duration],
    queryFn: () => getCleanerAvailability(id!, selectedDate, duration),
    enabled: !!id && !!selectedDate,
  });

  const addressesQuery = useQuery({
    queryKey: ['addresses'],
    queryFn: getAddresses,
    enabled: shouldLoadSavedAddresses(isAuthLoaded, isSignedIn),
  });

  const paymentMethodsQuery = useQuery({
    queryKey: ['payment-methods'],
    queryFn: getSavedPaymentMethods,
    enabled: isAuthLoaded && isSignedIn,
  });

  const prepareCheckoutMutation = useMutation({
    mutationFn: async () => {
      if (!id || !selectedTime) {
        throw new Error('Select a time before continuing.');
      }

      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startDate = new Date(`${selectedDate}T00:00:00`);
      startDate.setHours(hours, minutes, 0, 0);

      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + duration);

      const hold = await createHold({
        cleanerId: id,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        recurrence,
      });

      const paymentIntent = await createPaymentIntent(hold.id);

      return { hold, paymentIntent };
    },
    onSuccess: ({ hold, paymentIntent }) => {
      setHoldId(hold.id);
      setClientSecret(paymentIntent.clientSecret);
      setPaymentIntentId(paymentIntent.paymentIntentId);
      setPaymentError(null);
    },
    onError: (error) => {
      setHoldError(getBookingFlowErrorMessage(error));
      setClientSecret(null);
      setPaymentIntentId(null);
      setHoldId(null);
    },
  });

  const cleaner = cleanerQuery.data;
  const availabilityData = availabilityQuery.data;
  const savedAddresses = addressesQuery.data ?? [];
  const savedPaymentMethods = paymentMethodsQuery.data?.paymentMethods ?? [];
  const fallbackSavedPaymentMethodId = getFallbackPaymentMethodId(
    paymentMethodsQuery.data,
  );
  const initialAddressSelection = useMemo(
    () => getInitialBookingAddressSelection(savedAddresses, null),
    [savedAddresses],
  );
  const effectiveSelectedAddressId = showNewAddress
    ? null
    : selectedAddressId ?? initialAddressSelection?.selectedAddressId ?? null;
  const effectiveInstructions =
    !showNewAddress && selectedAddressId === null && instructions === ''
      ? (initialAddressSelection?.accessInstructions ?? '')
      : instructions;

  const timeSlots = useMemo(
    () => getAvailabilitySlots(availabilityData),
    [availabilityData],
  );

  const rate = cleaner?.hourlyRate ?? cleaner?.baseRate ?? 0;
  const subtotalCents = Math.round(rate * duration * 100);
  const platformFeeCents = Math.round(subtotalCents * PLATFORM_FEE_RATE);
  const totalCents = subtotalCents + platformFeeCents;
  const hasAddresses = savedAddresses.length > 0;
  const recurrenceSummary = formatBookingRecurrenceSummary(recurrence);
  const showAddressStep = Boolean(selectedTime);
  const showPaymentStep = Boolean(clientSecret && holdId && paymentIntentId);
  const activeSavedPaymentMethodId = !useNewPaymentMethod
    ? selectedSavedPaymentMethodId ?? fallbackSavedPaymentMethodId
    : null;

  const resetCheckout = useCallback(() => {
    setHoldId(null);
    setClientSecret(null);
    setPaymentIntentId(null);
    setCardComplete(false);
    setHoldError(null);
    setPaymentError(null);
  }, []);

  useEffect(() => {
    if (!showPaymentStep) {
      return;
    }

    if (savedPaymentMethods.length === 0) {
      if (!useNewPaymentMethod) {
        setUseNewPaymentMethod(true);
      }
      if (selectedSavedPaymentMethodId !== null) {
        setSelectedSavedPaymentMethodId(null);
      }
      return;
    }

    if (
      !useNewPaymentMethod &&
      selectedSavedPaymentMethodId === null &&
      fallbackSavedPaymentMethodId
    ) {
      setSelectedSavedPaymentMethodId(fallbackSavedPaymentMethodId);
    }
  }, [
    fallbackSavedPaymentMethodId,
    savedPaymentMethods.length,
    selectedSavedPaymentMethodId,
    showPaymentStep,
    useNewPaymentMethod,
  ]);

  const handleDateChange = useCallback(
    (nextDate: string) => {
      setSelectedDate(nextDate);
      setSelectedTime(null);
      setRecurrence((current) => alignRecurrenceToDate(current, nextDate));
      resetCheckout();
    },
    [resetCheckout],
  );

  const handleDurationChange = useCallback(
    (hours: number) => {
      setDuration(hours);
      setSelectedTime(null);
      resetCheckout();
    },
    [resetCheckout],
  );

  const handleTimeChange = useCallback(
    (time: string) => {
      setSelectedTime(time);
      resetCheckout();
    },
    [resetCheckout],
  );

  const handleRecurrenceChange = useCallback(
    (nextRecurrence: BookingRecurrence | null) => {
      setRecurrence(nextRecurrence);
      resetCheckout();
    },
    [resetCheckout],
  );

  const getAddress = useCallback(() => {
    if (effectiveSelectedAddressId && savedAddresses.length > 0) {
      const address = savedAddresses.find((item) => item.id === effectiveSelectedAddressId);
      if (address) {
        return {
          street: address.street,
          unit: address.unit ?? undefined,
          city: address.city,
          state: address.state,
          zip: address.zip,
        };
      }
    }

    return {
      street,
      unit: unit || undefined,
      city: 'San Francisco',
      state: 'CA',
      zip,
    };
  }, [effectiveSelectedAddressId, savedAddresses, street, unit, zip]);

  const hasValidAddress = useCallback(() => {
    if (
      effectiveSelectedAddressId &&
      savedAddresses.some((address) => address.id === effectiveSelectedAddressId)
    ) {
      return true;
    }

    return street.trim() !== '' && zip.trim() !== '';
  }, [effectiveSelectedAddressId, savedAddresses, street, zip]);

  const handleContinueToPayment = useCallback(() => {
    if (!selectedTime) {
      Alert.alert('Select a time', 'Please choose a time slot to continue.');
      return;
    }

    if (!hasValidAddress()) {
      Alert.alert('Add an address', 'Please add or choose an address first.');
      return;
    }

    if (!stripePublishableKey) {
      Alert.alert(
        'Payments unavailable',
        'The mobile Stripe publishable key is not configured in this environment.',
      );
      return;
    }

    prepareCheckoutMutation.mutate();
  }, [hasValidAddress, prepareCheckoutMutation, selectedTime]);

  const handleConfirmAndPay = useCallback(async () => {
    if (!clientSecret || !holdId || !paymentIntentId) {
      return;
    }

    const address = getAddress();
    setPaymentError(null);

    const paymentMethodData = useNewPaymentMethod
      ? {
          billingDetails: {
            address: {
              line1: address.street,
              line2: address.unit,
              city: address.city,
              state: address.state,
              postalCode: address.zip,
              country: 'US',
            },
          },
        }
      : activeSavedPaymentMethodId
        ? {
            paymentMethodId: activeSavedPaymentMethodId,
            billingDetails: {
              address: {
                line1: address.street,
                line2: address.unit,
                city: address.city,
                state: address.state,
                postalCode: address.zip,
                country: 'US',
              },
            },
          }
        : null;

    if (!paymentMethodData) {
      setPaymentError('Select a saved card or add a new one before paying.');
      return;
    }

    const result = await confirmPayment(clientSecret, {
      paymentMethodType: 'Card',
      paymentMethodData,
    });

    if (result.error) {
      setPaymentError(result.error.message ?? 'Payment failed. Please try again.');
      return;
    }

    const confirmedPaymentIntentId = result.paymentIntent?.id ?? paymentIntentId;

    try {
      let booking = null;

      for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
          booking = await confirmBooking({
            holdId,
            paymentIntentId: confirmedPaymentIntentId,
            address,
            accessInstructions: effectiveInstructions || undefined,
          });
          break;
        } catch (error) {
          const shouldRetry =
            getErrorStatus(error) === 402 || getErrorCode(error) === 'PAYMENT_NOT_CONFIRMED';

          if (!shouldRetry || attempt === 4) {
            throw error;
          }

          await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
        }
      }

      if (!booking) {
        throw new Error('Booking confirmation is still processing.');
      }

      if (saveAddressPreference && !effectiveSelectedAddressId) {
        try {
          await createAddress({
            street: address.street,
            unit: address.unit,
            city: address.city,
            state: address.state,
            zip: address.zip,
            accessInstructions: effectiveInstructions || undefined,
            isDefault: true,
          });
        } catch {
          // Non-blocking if address persistence fails
        }
      }

      Alert.alert('Booking confirmed', 'Your cleaning has been booked successfully.', [
        {
          text: 'View booking',
          onPress: () => router.replace(`/(customer)/booking/${booking.id}` as never),
        },
      ]);
    } catch (error) {
      setPaymentError(getBookingFlowErrorMessage(error));
    }
  }, [
    clientSecret,
    confirmPayment,
    effectiveInstructions,
    effectiveSelectedAddressId,
    getAddress,
    holdId,
    paymentIntentId,
    saveAddressPreference,
    activeSavedPaymentMethodId,
    useNewPaymentMethod,
  ]);

  if (cleanerQuery.isLoading) {
    return <LoadingScreen />;
  }

  if (!cleaner) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Cleaner not found</Text>
        <Text style={styles.errorSubtitle}>
          This cleaner profile may no longer be available.
        </Text>
        <Button
          title="Go Back"
          variant="secondary"
          onPress={() => router.back()}
        />
      </View>
    );
  }

  const cleanerName = `${cleaner.firstName} ${cleaner.lastName}`;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.cleanerSummary}>
          <View style={styles.cleanerSummaryCopy}>
            <Text style={styles.cleanerName}>{cleanerName}</Text>
            <Text style={styles.cleanerMeta}>
              {formatUsd(rate)}/hr
              {cleaner.minHours ? `  ·  ${cleaner.minHours}h minimum` : ''}
            </Text>
          </View>
          <Text style={styles.cleanerRating}>
            {'\u2605'} {cleaner.rating.toFixed(1)} ({cleaner.reviewCount})
          </Text>
        </Card>

        <BookingStepCard
          step="Step 1"
          title="Choose the visit length"
          description="Pick the cleaning length that matches the work you need done."
        >
          <DurationPills
            options={[2, 3, 4, 5, 6, 8]}
            selected={duration}
            onSelect={handleDurationChange}
            minHours={cleaner.minHours}
          />
        </BookingStepCard>

        <BookingStepCard
          step="Step 2"
          title="Repeat if you want"
          description="Keep it one-time or save a repeat preference for weekly, biweekly, or custom days."
        >
          <RecurrencePicker
            selectedDate={selectedDate}
            value={recurrence}
            onChange={handleRecurrenceChange}
          />
        </BookingStepCard>

        <BookingStepCard
          step="Step 3"
          title="Pick the first visit"
          description="Choose the date and start time for the first clean."
        >
          <DateStrip
            dates={dates}
            selectedDate={selectedDate}
            onSelectDate={handleDateChange}
          />

          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>Available start times</Text>
            <Text style={styles.sectionHint}>
              Select the time that works best for your first visit.
            </Text>
          </View>

          {availabilityQuery.isLoading ? (
            <ActivityIndicator
              size="small"
              color={colors.forest700}
              style={styles.loader}
            />
          ) : (
            <TimeSlotList
              slots={timeSlots}
              selectedTime={selectedTime}
              onSelectTime={handleTimeChange}
            />
          )}
        </BookingStepCard>

        {showAddressStep && (
          <BookingStepCard
            step="Step 4"
            title="Add your address"
            description="Choose a saved location or add a new one for this first visit."
          >
            {hasAddresses && !showNewAddress ? (
              <View style={styles.addressList}>
                {savedAddresses.map((address: UserAddress) => {
                  const selected = effectiveSelectedAddressId === address.id;
                  return (
                    <TouchableOpacity
                      key={address.id}
                      style={[styles.addressCard, selected && styles.addressCardActive]}
                      onPress={() => {
                        setSelectedAddressId(address.id);
                        setInstructions(address.accessInstructions ?? '');
                        setPaymentError(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.addressRadio}>
                        <View
                          style={[
                            styles.addressRadioDot,
                            selected && styles.addressRadioDotActive,
                          ]}
                        />
                      </View>
                      <View style={styles.addressCopy}>
                        <Text style={styles.addressTitle}>
                          {address.label || address.street}
                        </Text>
                        <Text style={styles.addressLine}>
                          {address.street}
                          {address.unit ? `, ${address.unit}` : ''}
                        </Text>
                        <Text style={styles.addressLine}>
                          {address.city}, {address.state} {address.zip}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => {
                    setSelectedAddressId(null);
                    setInstructions('');
                    setShowNewAddress(true);
                    setPaymentError(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkButtonText}>+ Add new address</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.form}>
                <TextInput
                  style={styles.input}
                  placeholder="Street address"
                  placeholderTextColor={colors.muted}
                  value={street}
                  onChangeText={(value) => {
                    setStreet(value);
                    setPaymentError(null);
                  }}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Unit (optional)"
                  placeholderTextColor={colors.muted}
                  value={unit}
                  onChangeText={setUnit}
                />
                <View style={styles.inputRow}>
                  <View style={styles.inputCellWide}>
                    <TextInput
                      style={[styles.input, styles.inputDisabled]}
                      value="San Francisco"
                      editable={false}
                    />
                  </View>
                  <View style={styles.inputCell}>
                    <TextInput
                      style={[styles.input, styles.inputDisabled]}
                      value="CA"
                      editable={false}
                    />
                  </View>
                  <View style={styles.inputCell}>
                    <TextInput
                      style={styles.input}
                      placeholder="ZIP"
                      placeholderTextColor={colors.muted}
                      value={zip}
                      onChangeText={(value) => {
                        setZip(value);
                        setPaymentError(null);
                      }}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setSaveAddressPreference((current) => !current)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.checkbox,
                      saveAddressPreference && styles.checkboxActive,
                    ]}
                  >
                    {saveAddressPreference ? (
                      <Text style={styles.checkboxMark}>{'\u2713'}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.checkboxLabel}>Save this address</Text>
                </TouchableOpacity>

                {hasAddresses && (
                  <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => {
                      setShowNewAddress(false);
                      setPaymentError(null);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.linkButtonText}>Use a saved address</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={styles.accessInstructionsBlock}>
              <Text style={styles.sectionLabel}>Access instructions</Text>
              <TextInput
                style={[styles.input, styles.instructionsInput]}
                placeholder="Gate code, parking, or anything the cleaner should know"
                placeholderTextColor={colors.muted}
                multiline
                value={effectiveInstructions}
                onChangeText={(value) => {
                  setInstructions(value);
                  setPaymentError(null);
                }}
              />
            </View>
          </BookingStepCard>
        )}

        {showPaymentStep && (
          <BookingStepCard
            step="Step 5"
            title="Confirm and pay"
            description="Use your card to confirm the first visit securely in the app."
          >
            {paymentMethodsQuery.isLoading ? (
              <ActivityIndicator
                size="small"
                color={colors.forest700}
                style={styles.loader}
              />
            ) : null}

            {savedPaymentMethods.length > 0 ? (
              <View style={styles.savedPaymentList}>
                {savedPaymentMethods.map((paymentMethod: SavedPaymentMethod) => {
                  const selected =
                    !useNewPaymentMethod &&
                    activeSavedPaymentMethodId === paymentMethod.id;

                  return (
                    <TouchableOpacity
                      key={paymentMethod.id}
                      style={[
                        styles.savedPaymentCard,
                        selected && styles.savedPaymentCardActive,
                      ]}
                      onPress={() => {
                        setUseNewPaymentMethod(false);
                        setSelectedSavedPaymentMethodId(paymentMethod.id);
                        setPaymentError(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.addressRadio}>
                        <View
                          style={[
                            styles.addressRadioDot,
                            selected && styles.addressRadioDotActive,
                          ]}
                        />
                      </View>
                      <View style={styles.savedPaymentCopy}>
                        <Text style={styles.savedPaymentTitle}>
                          {formatSavedPaymentMethodLabel(paymentMethod)}
                        </Text>
                        {paymentMethod.isDefault ? (
                          <Text style={styles.savedPaymentMeta}>
                            Default for checkout
                          </Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={[
                    styles.savedPaymentCard,
                    useNewPaymentMethod && styles.savedPaymentCardActive,
                  ]}
                  onPress={() => {
                    setUseNewPaymentMethod(true);
                    setCardComplete(false);
                    setPaymentError(null);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.addressRadio}>
                    <View
                      style={[
                        styles.addressRadioDot,
                        useNewPaymentMethod && styles.addressRadioDotActive,
                      ]}
                    />
                  </View>
                  <View style={styles.savedPaymentCopy}>
                    <Text style={styles.savedPaymentTitle}>Use a new card</Text>
                    <Text style={styles.savedPaymentMeta}>
                      Save cards anytime from Checkout Settings.
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => router.push('/(customer)/settings' as never)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkButtonText}>Manage cards in settings</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {(useNewPaymentMethod || savedPaymentMethods.length === 0) && (
              <View style={styles.paymentCard}>
                <CardField
                  postalCodeEnabled={false}
                  placeholders={{
                    number: '4242 4242 4242 4242',
                  }}
                  cardStyle={{
                    backgroundColor: colors.white,
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: 12,
                    textColor: colors.foreground,
                    placeholderColor: colors.muted,
                  }}
                  style={styles.cardField}
                  onCardChange={(details) => {
                    setCardComplete(Boolean(details.complete));
                    setPaymentError(null);
                  }}
                />
              </View>
            )}
          </BookingStepCard>
        )}

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Finish your booking</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Length</Text>
            <Text style={styles.summaryValue}>{duration} hours</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Schedule</Text>
            <Text style={styles.summaryValue}>{recurrenceSummary}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>First visit</Text>
            <Text style={styles.summaryValue}>
              {selectedTime
                ? `${formatDateDisplay(selectedDate)} at ${formatTimeLabel(selectedTime)}`
                : 'Choose a day and start time'}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              {formatUsd(rate)}/hr x {duration}h
            </Text>
            <Text style={styles.summaryValue}>{formatUsdFromCents(subtotalCents)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Platform fee (8%)</Text>
            <Text style={styles.summaryValue}>
              {formatUsdFromCents(platformFeeCents)}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotalRow]}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalValue}>
              {formatUsdFromCents(totalCents)}
            </Text>
          </View>
        </Card>

        {holdError ? <Text style={styles.errorMessage}>{holdError}</Text> : null}
        {paymentError ? <Text style={styles.errorMessage}>{paymentError}</Text> : null}
      </ScrollView>

      <StickyBottomBar>
        <View style={styles.bottomBar}>
          <View style={styles.bottomBarCopy}>
            {selectedTime ? (
              <>
                <Text style={styles.bottomBarPrimary}>
                  {formatDateDisplay(selectedDate)} at {formatTimeLabel(selectedTime)}
                </Text>
                <Text style={styles.bottomBarSecondary}>
                  {recurrenceSummary} · {formatUsdFromCents(totalCents)}
                </Text>
              </>
            ) : (
              <Text style={styles.bottomBarPrimary}>Choose a time to continue</Text>
            )}
          </View>

          {showPaymentStep ? (
            <Button
              title={`Confirm & Pay ${formatUsdFromCents(totalCents)}`}
              onPress={handleConfirmAndPay}
              disabled={
                confirmingPayment ||
                paymentMethodsQuery.isLoading ||
                (useNewPaymentMethod
                  ? !cardComplete
                  : !activeSavedPaymentMethodId)
              }
              loading={confirmingPayment}
              size="sm"
            />
          ) : (
            <Button
              title="Continue to Payment"
              onPress={handleContinueToPayment}
              disabled={!selectedTime || !hasValidAddress() || prepareCheckoutMutation.isPending}
              loading={prepareCheckoutMutation.isPending}
              size="sm"
            />
          )}
        </View>
      </StickyBottomBar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 140,
    gap: 14,
  },
  cleanerSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.slate100,
  },
  cleanerSummaryCopy: {
    flex: 1,
    gap: 4,
  },
  cleanerName: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.foreground,
  },
  cleanerMeta: {
    fontSize: 13,
    color: colors.slate600,
  },
  cleanerRating: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.forest700,
    marginLeft: 12,
  },
  stepCard: {
    gap: 8,
  },
  stepEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.muted,
  },
  stepTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.foreground,
  },
  stepDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.slate600,
  },
  stepBody: {
    gap: 14,
    marginTop: 4,
  },
  sectionBlock: {
    gap: 2,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.foreground,
  },
  sectionHint: {
    fontSize: 12,
    color: colors.slate600,
  },
  loader: {
    paddingVertical: 18,
  },
  addressList: {
    gap: 10,
  },
  addressCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: 14,
  },
  addressCardActive: {
    borderColor: colors.forest600,
    backgroundColor: colors.forest50,
  },
  addressRadio: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressRadioDot: {
    width: 14,
    height: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.slate300,
  },
  addressRadioDotActive: {
    backgroundColor: colors.forest700,
    borderColor: colors.forest700,
  },
  addressCopy: {
    flex: 1,
    gap: 2,
  },
  addressTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
  },
  addressLine: {
    fontSize: 13,
    color: colors.slate600,
  },
  form: {
    gap: 10,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputCellWide: {
    flex: 1.5,
  },
  inputCell: {
    flex: 1,
  },
  input: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.foreground,
  },
  inputDisabled: {
    color: colors.slate600,
    backgroundColor: colors.slate100,
  },
  instructionsInput: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    borderColor: colors.forest700,
    backgroundColor: colors.forest700,
  },
  checkboxMark: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 13,
    color: colors.slate600,
  },
  linkButton: {
    alignSelf: 'flex-start',
  },
  linkButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.forest700,
  },
  accessInstructionsBlock: {
    gap: 8,
  },
  savedPaymentList: {
    gap: 10,
  },
  savedPaymentCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: 14,
  },
  savedPaymentCardActive: {
    borderColor: colors.forest600,
    backgroundColor: colors.forest50,
  },
  savedPaymentCopy: {
    flex: 1,
    gap: 2,
  },
  savedPaymentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
  },
  savedPaymentMeta: {
    fontSize: 12,
    color: colors.slate600,
  },
  paymentCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: 12,
  },
  cardField: {
    width: '100%',
    height: 54,
  },
  summaryCard: {
    gap: 10,
    backgroundColor: colors.slate100,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.foreground,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  summaryLabel: {
    flex: 1,
    fontSize: 13,
    color: colors.slate600,
  },
  summaryValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '600',
    color: colors.foreground,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  summaryTotalRow: {
    paddingTop: 2,
  },
  summaryTotalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.foreground,
  },
  summaryTotalValue: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.forest700,
  },
  errorMessage: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.error,
    paddingHorizontal: 4,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bottomBarCopy: {
    flex: 1,
    gap: 2,
  },
  bottomBarPrimary: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.foreground,
  },
  bottomBarSecondary: {
    fontSize: 12,
    color: colors.slate600,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 32,
    gap: 10,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
  },
  errorSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    color: colors.slate600,
  },
});
