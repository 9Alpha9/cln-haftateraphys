'use client';

import { useCallback, useEffect, useState } from 'react';

export type Province = { id: string; name: string };
export type Regency = { id: string; province_id: string; name: string };

export function useWilayahIndonesia() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('');
  const [regencies, setRegencies] = useState<Regency[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingRegencies, setLoadingRegencies] = useState(false);

  useEffect(() => {
    fetch('/api/regions')
      .then((res) => res.json())
      .then((data: Province[]) => setProvinces(data))
      .catch(() => setProvinces([]))
      .finally(() => setLoadingProvinces(false));
  }, []);

  const selectProvince = useCallback((provinceId: string) => {
    setSelectedProvinceId(provinceId);
    setLoadingRegencies(Boolean(provinceId));
    if (!provinceId) setRegencies([]);
  }, []);

  useEffect(() => {
    if (!selectedProvinceId) return;
    fetch(`/api/regions?provinceId=${encodeURIComponent(selectedProvinceId)}`)
      .then((res) => res.json())
      .then((data: Regency[]) => setRegencies(data))
      .catch(() => setRegencies([]))
      .finally(() => setLoadingRegencies(false));
  }, [selectedProvinceId]);

  return {
    provinces,
    regencies,
    selectedProvinceId,
    setSelectedProvinceId: selectProvince,
    loadingProvinces,
    loadingRegencies,
  };
}
