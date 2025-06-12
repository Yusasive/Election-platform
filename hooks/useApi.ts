import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';

interface UseApiOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export function useApi<T = any>(
  url: string,
  options: UseApiOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { immediate = true, onSuccess, onError } = options;

  const execute = async (config?: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient({
        url,
        ...config,
      });
      
      setData(response.data);
      onSuccess?.(response.data);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred';
      setError(errorMessage);
      onError?.(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [url, immediate]);

  return {
    data,
    loading,
    error,
    execute,
    refetch: () => execute(),
  };
}

export function useApiMutation<T = any>(url: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async (data?: any, config?: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient({
        url,
        method: 'POST',
        data,
        ...config,
      });
      
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    mutate,
    loading,
    error,
  };
}