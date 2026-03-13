'use client';

import { useState, useEffect } from 'react';
import type { PickerItem } from '@lol/shared';
import { apiFetch } from './api';

type MasterDataEntity = 'dispatchers' | 'drivers' | 'units' | 'brokerages';

interface UseMasterDataResult {
  items: PickerItem[];
  loading: boolean;
  error: string | null;
}

/**
 * Fetches master-data picker items for a given entity type.
 * Caches nothing — simple fetch on mount. Good enough for small lists.
 */
export function useMasterData(entity: MasterDataEntity): UseMasterDataResult {
  const [items, setItems] = useState<PickerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiFetch<PickerItem[]>(`/master-data/${entity}`)
      .then((data) => {
        if (!cancelled) {
          setItems(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [entity]);

  return { items, loading, error };
}
