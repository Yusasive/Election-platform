import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';

interface UseApiOptions {
  immediate?: boolean;
  onSuccess?: (data: unknown) => void;
  onError?: (error: unknown) => void;
  retries?: number;
  retryDelay?: number;
}

export function useApi<T = unknown>(
  url: string,
  options: UseApiOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { 
    immediate = true, 
    onSuccess, 
    onError, 
    retries = 2, 
    retryDelay = 1000 
  } = options;

  const execute = useCallback(async (config?: unknown, attemptCount = 0): Promise<T> => {
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
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { error?: string } }; message?: string; code?: string })?.response?.data?.error || 
                          (err as { message?: string })?.message || 
                          'An error occurred';
      
      // Retry logic for network errors and timeouts
      if (attemptCount < retries && ((err as { code?: string })?.code === 'ECONNABORTED' || (err as { code?: string })?.code === 'NETWORK_ERROR')) {
        console.log(`Retrying request to ${url}, attempt ${attemptCount + 1}/${retries + 1}`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attemptCount + 1)));
        return execute(config, attemptCount + 1);
      }
      
      setError(errorMessage);
      onError?.(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url, onSuccess, onError, retries, retryDelay]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return {
    data,
    loading,
    error,
    execute,
    refetch: () => execute(),
  };
}

export function useApiMutation<T = unknown>(url: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async (config?: unknown, data?: unknown, extraConfig?: unknown): Promise<T> => {
    try {
      setLoading(true);
      setError(null);
      
      // Handle different parameter patterns
      let requestConfig;
      if (config && typeof config === 'object' && 'method' in config) {
        // New pattern: mutate({ method: 'DELETE' }, data, { url: '/custom' })
        requestConfig = {
          url: (extraConfig as { url?: string })?.url || url,
          method: (config as { method?: string }).method || 'POST',
          data,
          params: (extraConfig as { params?: unknown })?.params,
          timeout: 30000, // 30 second timeout
          ...config,
        };
      } else {
        // Old pattern: mutate(data, config)
        requestConfig = {
          url,
          method: 'POST',
          data: config || data,
          timeout: 30000, // 30 second timeout
          ...extraConfig,
        };
      }
      
      const response = await apiClient(requestConfig);
      
      return response.data;
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error || 
                          (err as { message?: string })?.message || 
                          'An error occurred';
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