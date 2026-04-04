import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors } from '@/lib/constants/colors';
import {
  getAdminUsers,
  suspendUser,
  type AdminUser,
} from '@/lib/api/admin';
import {
  Avatar,
  StatusBadge,
  SegmentedControl,
  LoadingScreen,
  EmptyState,
} from '@/components/ui';

const ROLE_SEGMENTS = [
  { label: 'All', value: 'all' },
  { label: 'Customers', value: 'customer' },
  { label: 'Cleaners', value: 'cleaner' },
  { label: 'Admins', value: 'admin' },
];

const ROLE_BADGE_MAP: Record<string, string> = {
  customer: 'active',
  cleaner: 'confirmed',
  admin: 'investigating',
};

function formatJoinDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function UserCard({
  user,
  onSuspend,
}: {
  user: AdminUser;
  onSuspend: (user: AdminUser) => void;
}) {
  const canSuspend =
    user.role !== 'admin' && user.status === 'active';

  return (
    <TouchableOpacity
      style={styles.userCard}
      activeOpacity={canSuspend ? 0.7 : 1}
      onPress={() => {
        if (canSuspend) onSuspend(user);
      }}
    >
      <Avatar name={user.name} size={44} />
      <View style={styles.userInfo}>
        <View style={styles.userTop}>
          <Text style={styles.userName} numberOfLines={1}>
            {user.name}
          </Text>
          <StatusBadge
            status={ROLE_BADGE_MAP[user.role] ?? 'pending'}
            label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          />
        </View>
        <Text style={styles.userEmail} numberOfLines={1}>
          {user.email}
        </Text>
        <View style={styles.userMeta}>
          <Text style={styles.userMetaText}>
            Joined {formatJoinDate(user.joinedAt)}
          </Text>
          <Text style={styles.userMetaDot}> · </Text>
          <Text style={styles.userMetaText}>
            {user.bookings} booking{user.bookings !== 1 ? 's' : ''}
          </Text>
          {user.status !== 'active' && (
            <>
              <Text style={styles.userMetaDot}> · </Text>
              <StatusBadge status={user.status} />
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function AdminUsersScreen() {
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchText.trim());
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchText]);

  const queryParams = {
    role: roleFilter !== 'all' ? roleFilter : undefined,
    search: debouncedSearch || undefined,
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'users', queryParams],
    queryFn: () => getAdminUsers(queryParams),
  });

  const suspendMutation = useMutation({
    mutationFn: (userId: string) => suspendUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: () => {
      Alert.alert('Error', 'Failed to suspend user. Please try again.');
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleSuspend = useCallback(
    (user: AdminUser) => {
      Alert.alert(
        'Suspend User?',
        `Are you sure you want to suspend ${user.name}? They will lose access to the platform.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Suspend',
            style: 'destructive',
            onPress: () => suspendMutation.mutate(user.id),
          },
        ],
      );
    },
    [suspendMutation],
  );

  const users = data ?? [];

  const header = (
    <View style={styles.headerSection}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search by name or email..."
        placeholderTextColor={colors.muted}
        value={searchText}
        onChangeText={setSearchText}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
      <SegmentedControl
        segments={ROLE_SEGMENTS}
        selected={roleFilter}
        onSelect={setRoleFilter}
      />
    </View>
  );

  if (isLoading && !refreshing) {
    return (
      <View style={styles.container}>
        {header}
        <LoadingScreen />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.container}>
        {header}
        <View style={styles.errorContainer}>
          <EmptyState
            title="Unable to load users"
            subtitle="Pull down to retry"
          />
        </View>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={users}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={header}
      renderItem={({ item }) => (
        <UserCard user={item} onSuspend={handleSuspend} />
      )}
      ListEmptyComponent={
        <EmptyState
          title="No users found"
          subtitle={
            debouncedSearch
              ? `No results for "${debouncedSearch}"`
              : 'No users match the current filter'
          }
        />
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.forest700}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 32,
  },
  headerSection: {
    padding: 16,
    gap: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
  },

  // Search
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.foreground,
  },

  // User card
  userCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 12,
    alignItems: 'flex-start',
  },
  userInfo: {
    flex: 1,
  },
  userTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
    flex: 1,
    marginRight: 8,
  },
  userEmail: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 6,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  userMetaText: {
    fontSize: 12,
    color: colors.slate500,
  },
  userMetaDot: {
    fontSize: 12,
    color: colors.slate300,
  },
});
