import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useState, useCallback } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { colors } from '@/lib/constants/colors';
import { Avatar, Button, Card, LoadingScreen, StickyBottomBar } from '@/components/ui';
import {
  getCleanerById,
  getCleanerReviews,
  type Cleaner,
  type CleanerReview,
} from '@/lib/api/cleaners';
import { formatUsd } from '@/lib/format';

const REVIEWS_PER_PAGE = 10;

function formatServiceLabel(type: string): string {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function CleanerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    data: cleaner,
    isLoading: cleanerLoading,
    error: cleanerError,
    refetch: refetchCleaner,
    isRefetching: cleanerRefetching,
  } = useQuery({
    queryKey: ['cleaner', id],
    queryFn: () => getCleanerById(id!),
    enabled: !!id,
  });

  const {
    data: reviewsPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: reviewsLoading,
  } = useInfiniteQuery({
    queryKey: ['cleanerReviews', id],
    queryFn: ({ pageParam = 0 }) =>
      getCleanerReviews(id!, { limit: REVIEWS_PER_PAGE, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const nextOffset = lastPage.meta.offset + lastPage.meta.limit;
      return nextOffset < lastPage.meta.total ? nextOffset : undefined;
    },
    enabled: !!id,
  });

  const reviews = reviewsPages?.pages.flatMap((p) => p.reviews) ?? [];
  const totalReviews = reviewsPages?.pages[0]?.meta.total ?? 0;

  const handleLoadMoreReviews = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleBookCleaner = useCallback(() => {
    if (!id) return;
    router.push(`/(customer)/cleaner/${id}/book`);
  }, [id]);

  if (cleanerLoading) return <LoadingScreen />;

  if (cleanerError || !cleaner) {
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
          style={styles.errorButton}
        />
      </View>
    );
  }

  const name = `${cleaner.firstName} ${cleaner.lastName}`;
  const rate = cleaner.hourlyRate ?? cleaner.baseRate ?? 0;

  // Build header and sections as FlatList ListHeaderComponent
  const renderHeader = () => (
    <View>
      {/* Header */}
      <View style={styles.header}>
        <Avatar name={name} size={80} />
        <Text style={styles.name}>{name}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.ratingText}>
            {'\u2605'} {cleaner.rating.toFixed(1)}
          </Text>
          <Text style={styles.reviewCountText}>
            ({cleaner.reviewCount} review{cleaner.reviewCount !== 1 ? 's' : ''})
          </Text>
        </View>
      </View>

      {/* Bio */}
      {cleaner.bio ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bioText}>{cleaner.bio}</Text>
        </View>
      ) : null}

      {/* Rate */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rate</Text>
        <Text style={styles.rateText}>{formatUsd(rate)}/hr</Text>
        {cleaner.minHours ? (
          <Text style={styles.minHoursText}>
            {cleaner.minHours}h minimum
          </Text>
        ) : null}
      </View>

      {/* Reviews header */}
      <View style={styles.reviewsHeader}>
        <Text style={styles.sectionTitle}>
          Reviews{totalReviews > 0 ? ` (${totalReviews})` : ''}
        </Text>
      </View>

      {reviewsLoading && (
        <ActivityIndicator
          size="small"
          color={colors.forest700}
          style={styles.reviewsLoader}
        />
      )}

      {!reviewsLoading && reviews.length === 0 && (
        <Text style={styles.noReviewsText}>No reviews yet</Text>
      )}
    </View>
  );

  const renderReview = ({ item }: { item: CleanerReview }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Avatar name={item.customer} size={32} />
        <View style={styles.reviewMeta}>
          <Text style={styles.reviewAuthor}>{item.customer}</Text>
          <Text style={styles.reviewDate}>
            {new Date(item.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </View>
        <View style={styles.reviewStars}>
          <Text style={styles.reviewStarText}>
            {'\u2605'} {item.rating}
          </Text>
        </View>
      </View>
      {item.text ? (
        <Text style={styles.reviewText}>{item.text}</Text>
      ) : null}
      {item.response ? (
        <View style={styles.reviewResponse}>
          <Text style={styles.reviewResponseLabel}>Cleaner response:</Text>
          <Text style={styles.reviewResponseText}>{item.response}</Text>
        </View>
      ) : null}
    </View>
  );

  const renderFooter = () => {
    if (isFetchingNextPage) {
      return (
        <ActivityIndicator
          size="small"
          color={colors.forest700}
          style={styles.footerLoader}
        />
      );
    }
    if (hasNextPage) {
      return (
        <Button
          title="Load more reviews"
          variant="ghost"
          size="sm"
          onPress={handleLoadMoreReviews}
          style={styles.loadMoreButton}
        />
      );
    }
    return <View style={styles.bottomSpacer} />;
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={renderReview}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMoreReviews}
        onEndReachedThreshold={0.3}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={cleanerRefetching}
            onRefresh={refetchCleaner}
            tintColor={colors.forest700}
          />
        }
      />

      <StickyBottomBar>
        <View style={styles.bottomBarContent}>
          <View>
            <Text style={styles.bottomBarRate}>
              {formatUsd(rate)}/hr
            </Text>
            <Text style={styles.bottomBarRating}>
              {'\u2605'} {cleaner.rating.toFixed(1)} ({cleaner.reviewCount})
            </Text>
          </View>
          <Button
            title="Book this cleaner"
            onPress={handleBookCleaner}
            size="md"
          />
        </View>
      </StickyBottomBar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingBottom: 100,
  },
  // Header
  header: {
    alignItems: 'center',
    paddingVertical: 28,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.foreground,
    marginTop: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  ratingText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.amber500,
  },
  reviewCountText: {
    fontSize: 14,
    color: colors.muted,
  },
  // Section
  section: {
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 8,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.slate600,
  },
  rateText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.forest700,
  },
  minHoursText: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  // Reviews
  reviewsHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: colors.background,
  },
  reviewsLoader: {
    paddingVertical: 20,
  },
  noReviewsText: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: 24,
  },
  reviewCard: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reviewMeta: {
    flex: 1,
  },
  reviewAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  reviewDate: {
    fontSize: 12,
    color: colors.muted,
  },
  reviewStars: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: colors.forest50,
    borderRadius: 6,
  },
  reviewStarText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.forest700,
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.slate600,
    marginTop: 10,
  },
  reviewResponse: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  reviewResponseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
    marginBottom: 4,
  },
  reviewResponseText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.slate600,
  },
  footerLoader: {
    paddingVertical: 16,
  },
  loadMoreButton: {
    alignSelf: 'center',
    marginVertical: 8,
  },
  bottomSpacer: {
    height: 16,
  },
  // Bottom bar
  bottomBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomBarRate: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
  },
  bottomBarRating: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  // Error
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorButton: {
    minWidth: 120,
  },
});
