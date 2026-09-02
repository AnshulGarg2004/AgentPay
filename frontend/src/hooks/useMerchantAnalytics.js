import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api.js";

export function useMerchantAnalytics(merchantId = "all") {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get(`/merchants/${merchantId}/analytics`);
      setAnalytics(res.data);
    } catch (err) {
      console.error("Error fetching merchant analytics:", err);
      setError(err.message || "Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { analytics, isLoading, error, refetch: fetchAnalytics };
}

export default useMerchantAnalytics;
