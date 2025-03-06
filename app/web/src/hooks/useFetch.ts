import { useState, useEffect, useCallback } from "react";
import { ApiResponse } from "../types/api";

/**
 * Custom hook for fetching data with support for aborting requests.
 *
 * @param url - The API endpoint to fetch data from.
 * @param options - Optional fetch configuration, for example, request body or auth.
 * @returns An object containing `data`, `loading` and `error`.
 */
function useFetch<T>(url: string, options?: RequestInit): ApiResponse<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (controller?: AbortController) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller?.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result: T = await response.json();

        setData(result);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setError(err.message || "Something went wrong");
        }
      } finally {
        setLoading(false);
      }
    },
    [url, options]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller);

    return () => controller.abort();
  }, [fetchData]);

  return { data, setData, loading, error } as ApiResponse<T>;
}

export default useFetch;
