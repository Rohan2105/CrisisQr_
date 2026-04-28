'use client';

import { useState, useEffect } from 'react';

export interface MapData {
  requests: any[];
  teams: any[];
  shelters: any[];
}

export function useMapData(refreshInterval = 15000) {
  const [data, setData] = useState<MapData>({
    requests: [],
    teams: [],
    shelters: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    try {
      const res = await fetch('/api/admin/map-data');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || 'Failed to fetch map data');
      }
    } catch (err) {
      setError('Network error fetching map data');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return { data, isLoading, error, refresh: fetchData };
}
