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

  const mutate = async (config?: any, data?: any, extraConfig?: any) => {
    try {
      setLoading(true);
      setError(null);
      
      // Handle different parameter patterns
      let requestConfig;
      if (config && config.method) {
        // New pattern: mutate({ method: 'DELETE' }, data, { url: '/custom' })
        requestConfig = {
          url: extraConfig?.url || url,
          method: config.method || 'POST',
          data,
          params: extraConfig?.params,
          ...config,
        };
      } else {
        // Old pattern: mutate(data, config)
        requestConfig = {
          url,
          method: 'POST',
          data: config || data,
          ...extraConfig,
        };
      }
      
      const response = await apiClient(requestConfig);
      
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