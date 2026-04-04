import { useAuth, useUser } from '@clerk/clerk-expo';
import { useEffect, useMemo, useRef } from 'react';
import { apiClient } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { resolvePlatformRole } from './roles';

export function PlatformSyncBridge() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const lastSyncedKey = useRef<string | null>(null);
  const setRole = useAuthStore((s) => s.setRole);

  const syncPayload = useMemo(() => {
    if (!isLoaded || !isSignedIn || !user || !userId) {
      return null;
    }

    const email = user.primaryEmailAddress?.emailAddress;
    if (!email) {
      return null;
    }

    const role = resolvePlatformRole({
      email,
      publicMetadataRole: user.publicMetadata?.role,
      unsafeMetadataRole: user.unsafeMetadata?.role,
    });

    return {
      externalAuthId: userId,
      email,
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
      role,
    };
  }, [isLoaded, isSignedIn, user, userId]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      lastSyncedKey.current = null;
      setRole(null);
      return;
    }

    if (!syncPayload) {
      return;
    }

    const syncKey = `${syncPayload.externalAuthId}:${syncPayload.role}:${syncPayload.email}`;
    if (lastSyncedKey.current === syncKey) {
      return;
    }

    let cancelled = false;
    lastSyncedKey.current = syncKey;

    (async () => {
      try {
        const response = await apiClient.post('/auth/sync', syncPayload);
        if (!cancelled) {
          setRole(response.data.user.role);
        }
      } catch {
        if (!cancelled) {
          setRole(syncPayload.role);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, syncPayload, setRole]);

  return null;
}
