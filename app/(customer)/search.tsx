import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { colors } from '@/lib/constants/colors';
import { Avatar, Card, EmptyState } from '@/components/ui';
import { DurationPills } from '@/components/booking';
import {
  searchCleaners,
  type Cleaner,
  type SearchCleanersParams,
} from '@/lib/api/cleaners';
import { formatUsd } from '@/lib/format';

const SF_LAT = 37.7749;
const SF_LNG = -122.4194;
const DEBOUNCE_MS = 300;

type SortBy = 'distance' | 'rating' | 'price';

const SERVICE_TYPES = [
  { key: 'standard', label: 'Standard' },
  { key: 'deep_clean', label: 'Deep Clean' },
  { key: 'move_in_out', label: 'Move In/Out' },
  { key: 'laundry', label: 'Laundry' },
  { key: 'windows', label: 'Windows' },
  { key: 'inside_fridge', label: 'Fridge' },
  { key: 'inside_oven', label: 'Oven' },
  { key: 'inside_cabinets', label: 'Cabinets' },
];

function getTomorrowDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => setDebounced(value), delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, delay]);

  return debounced;
}

export default function SearchScreen() {
  const [lat, setLat] = useState(SF_LAT);
  const [lng, setLng] = useState(SF_LNG);
  const [locationLabel, setLocationLabel] = useState('San Francisco, CA');
  const [locatingUser, setLocatingUser] = useState(false);

  const [date] = useState(getTomorrowDateString);
  const [duration, setDuration] = useState(3);
  const [sortBy, setSortBy] = useState<SortBy>('distance');

  // Expandable filters
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [maxRate, setMaxRate] = useState(150);
  const [minRating, setMinRating] = useState(0);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const params: SearchCleanersParams = useMemo(
    () => ({
      lat,
      lng,
      date,
      duration,
      sortBy,
      maxRate: maxRate < 150 ? maxRate : undefined,
      minRating: minRating > 0 ? minRating : undefined,
      services: selectedServices.length > 0 ? selectedServices : undefined,
      limit: 20,
    }),
    [lat, lng, date, duration, sortBy, maxRate, minRating, selectedServices],
  );

  const debouncedParams = useDebouncedValue(params, DEBOUNCE_MS);

  const {
    data: cleaners = [],
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useQuery({
    queryKey: ['searchCleaners', debouncedParams],
    queryFn: () => searchCleaners(debouncedParams),
  });

  const handleUseMyLocation = useCallback(async () => {
    setLocatingUser(true);
    try {
      // expo-location is not installed; fall back to SF coords
      setLat(SF_LAT);
      setLng(SF_LNG);
      setLocationLabel('San Francisco, CA');
    } finally {
      setLocatingUser(false);
    }
  }, []);

  const toggleService = useCallback((key: string) => {
    setSelectedServices((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key],
    );
  }, []);

  const renderCleaner = useCallback(
    ({ item }: { item: Cleaner }) => {
      const name = `${item.firstName} ${item.lastName}`;
      const rate = item.hourlyRate ?? item.baseRate ?? 0;
      const distanceMiles =
        item.distance != null ? (item.distance / 1609.34).toFixed(1) : null;

      return (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push(`/(customer)/cleaner/${item.id}`)}
        >
          <Card style={styles.cleanerCard}>
            <View style={styles.cleanerRow}>
              <Avatar name={name} size={56} />
              <View style={styles.cleanerInfo}>
                <View style={styles.cleanerHeader}>
                  <Text style={styles.cleanerName} numberOfLines={1}>
                    {name}
                  </Text>
                  <Text style={styles.cleanerRate}>{formatUsd(rate)}/hr</Text>
                </View>
                <View style={styles.cleanerMeta}>
                  <Text style={styles.cleanerRating}>
                    {'\u2605'} {item.rating.toFixed(1)}
                  </Text>
                  {distanceMiles && (
                    <Text style={styles.cleanerDistance}>
                      {distanceMiles} mi
                    </Text>
                  )}
                </View>
                {item.bio ? (
                  <Text style={styles.cleanerBio} numberOfLines={2}>
                    {item.bio}
                  </Text>
                ) : null}
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      );
    },
    [],
  );

  const sortOptions: { value: SortBy; label: string }[] = [
    { value: 'distance', label: 'Distance' },
    { value: 'rating', label: 'Rating' },
    { value: 'price', label: 'Price' },
  ];

  return (
    <View style={styles.container}>
      {/* Location bar */}
      <View style={styles.locationBar}>
        <View style={styles.locationLabelRow}>
          <Text style={styles.locationIcon}>{'\uD83D\uDCCD'}</Text>
          <Text style={styles.locationText} numberOfLines={1}>
            {locationLabel}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleUseMyLocation}
          disabled={locatingUser}
          style={styles.locationButton}
          activeOpacity={0.7}
        >
          {locatingUser ? (
            <ActivityIndicator size="small" color={colors.forest700} />
          ) : (
            <Text style={styles.locationButtonText}>Use my location</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Filter row */}
      <View style={styles.filterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {/* Date pill */}
          <View style={styles.filterPill}>
            <Text style={styles.filterPillText}>{date}</Text>
          </View>

          {/* Duration pills */}
          <DurationPills
            options={[2, 3, 4, 5, 6, 8]}
            selected={duration}
            onSelect={setDuration}
          />
        </ScrollView>
      </View>

      {/* Sort row */}
      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        {sortOptions.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => setSortBy(opt.value)}
            style={[
              styles.sortPill,
              sortBy === opt.value && styles.sortPillActive,
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.sortPillText,
                sortBy === opt.value && styles.sortPillTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          onPress={() => setFiltersExpanded((v) => !v)}
          style={styles.filterToggle}
          activeOpacity={0.7}
        >
          <Text style={styles.filterToggleText}>
            {filtersExpanded ? 'Less' : 'More'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Expandable filters */}
      {filtersExpanded && (
        <View style={styles.expandedFilters}>
          {/* Max rate slider */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionLabel}>
              Max rate: {maxRate >= 150 ? 'Any' : `${formatUsd(maxRate)}/hr`}
            </Text>
            <View style={styles.rateRow}>
              {[50, 75, 100, 125, 150].map((val) => (
                <TouchableOpacity
                  key={val}
                  onPress={() => setMaxRate(val)}
                  style={[
                    styles.ratePill,
                    maxRate === val && styles.ratePillActive,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.ratePillText,
                      maxRate === val && styles.ratePillTextActive,
                    ]}
                  >
                    {val >= 150 ? 'Any' : `$${val}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Min rating */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionLabel}>
              Min rating: {minRating > 0 ? `${minRating}+` : 'Any'}
            </Text>
            <View style={styles.rateRow}>
              {[0, 3, 3.5, 4, 4.5].map((val) => (
                <TouchableOpacity
                  key={val}
                  onPress={() => setMinRating(val)}
                  style={[
                    styles.ratePill,
                    minRating === val && styles.ratePillActive,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.ratePillText,
                      minRating === val && styles.ratePillTextActive,
                    ]}
                  >
                    {val === 0 ? 'Any' : `${val}+`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Service types */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionLabel}>Services</Text>
            <View style={styles.serviceRow}>
              {SERVICE_TYPES.map((svc) => {
                const active = selectedServices.includes(svc.key);
                return (
                  <TouchableOpacity
                    key={svc.key}
                    onPress={() => toggleService(svc.key)}
                    style={[
                      styles.servicePill,
                      active && styles.servicePillActive,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.servicePillText,
                        active && styles.servicePillTextActive,
                      ]}
                    >
                      {svc.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* Results */}
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Failed to load cleaners. Pull to retry.
          </Text>
        </View>
      ) : null}

      <FlatList
        data={cleaners}
        keyExtractor={(item) => item.id}
        renderItem={renderCleaner}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.forest700}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.forest700} />
            </View>
          ) : (
            <EmptyState
              title="No cleaners found"
              subtitle="Try adjusting your filters or search area"
              actionLabel="Reset filters"
              onAction={() => {
                setMaxRate(150);
                setMinRating(0);
                setSelectedServices([]);
                setSortBy('distance');
              }}
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  locationLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.foreground,
    flex: 1,
  },
  locationButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.forest50,
  },
  locationButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.forest700,
  },
  filterRow: {
    backgroundColor: colors.white,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterScroll: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 10,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.foreground,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 6,
  },
  sortLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.muted,
    marginRight: 4,
  },
  sortPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.slate100,
  },
  sortPillActive: {
    backgroundColor: colors.forest700,
  },
  sortPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slate600,
  },
  sortPillTextActive: {
    color: colors.white,
  },
  filterToggle: {
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  filterToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.forest700,
  },
  expandedFilters: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterSection: {
    marginTop: 12,
  },
  filterSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 8,
  },
  rateRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  ratePill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: colors.slate100,
  },
  ratePillActive: {
    backgroundColor: colors.forest700,
  },
  ratePillText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.slate600,
  },
  ratePillTextActive: {
    color: colors.white,
  },
  serviceRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  servicePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  servicePillActive: {
    backgroundColor: colors.forest50,
    borderColor: colors.forest600,
  },
  servicePillText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.slate600,
  },
  servicePillTextActive: {
    color: colors.forest700,
    fontWeight: '600',
  },
  list: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  cleanerCard: {
    padding: 14,
  },
  cleanerRow: {
    flexDirection: 'row',
    gap: 14,
  },
  cleanerInfo: {
    flex: 1,
  },
  cleanerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cleanerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    flex: 1,
    marginRight: 8,
  },
  cleanerRate: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.forest700,
  },
  cleanerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  cleanerRating: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.amber500,
  },
  cleanerDistance: {
    fontSize: 13,
    color: colors.muted,
  },
  cleanerBio: {
    fontSize: 13,
    color: colors.slate500,
    lineHeight: 18,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  errorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FEE2E2',
  },
  errorText: {
    fontSize: 13,
    color: colors.error,
    textAlign: 'center',
  },
});
