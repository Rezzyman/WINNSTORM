import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';

export interface SubscriptionStatus {
  tier: 'starter' | 'professional' | 'enterprise' | null;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | null;
  currentPeriodEnd: string | null;
  isActive: boolean;
}

export interface SubscriptionError {
  code: 'SUBSCRIPTION_REQUIRED' | 'TIER_INSUFFICIENT' | 'AUTH_REQUIRED';
  requiredTier?: string;
  currentTier?: string;
  message: string;
}

/**
 * Hook to get current subscription status
 */
export function useSubscriptionStatus() {
  const { user, isAuthenticated } = useAuth();

  return useQuery<SubscriptionStatus>({
    queryKey: ['/api/subscription/status'],
    enabled: isAuthenticated,
    staleTime: 60000, // 1 minute
    retry: false,
  });
}

/**
 * Hook to handle subscription-gated actions
 */
export function useSubscriptionGate() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [gateError, setGateError] = useState<SubscriptionError | null>(null);
  const { data: subscription } = useSubscriptionStatus();

  /**
   * Check if user has required tier
   */
  const hasTier = useCallback((requiredTier: 'starter' | 'professional' | 'enterprise'): boolean => {
    if (!subscription?.isActive || !subscription?.tier) return false;

    const tierHierarchy = { starter: 1, professional: 2, enterprise: 3 };
    const userTierLevel = tierHierarchy[subscription.tier] || 0;
    const requiredTierLevel = tierHierarchy[requiredTier];

    return userTierLevel >= requiredTierLevel;
  }, [subscription]);

  /**
   * Handle API error response - returns true if it was a subscription error
   */
  const handleApiError = useCallback((error: any): boolean => {
    const errorData = error?.response?.data || error?.data || error;

    if (errorData?.code === 'SUBSCRIPTION_REQUIRED' || errorData?.code === 'TIER_INSUFFICIENT') {
      setGateError({
        code: errorData.code,
        requiredTier: errorData.requiredTier,
        currentTier: errorData.currentTier,
        message: errorData.message,
      });
      setShowUpgradeModal(true);
      return true;
    }

    return false;
  }, []);

  /**
   * Wrap an async function to handle subscription errors
   */
  const withSubscriptionGate = useCallback(<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    requiredTier?: 'starter' | 'professional' | 'enterprise'
  ): T => {
    return (async (...args: Parameters<T>) => {
      // Pre-check tier if specified
      if (requiredTier && !hasTier(requiredTier)) {
        setGateError({
          code: 'TIER_INSUFFICIENT',
          requiredTier,
          currentTier: subscription?.tier || undefined,
          message: `This feature requires ${requiredTier} tier or higher`,
        });
        setShowUpgradeModal(true);
        throw new Error(`Subscription required: ${requiredTier}`);
      }

      try {
        return await fn(...args);
      } catch (error: any) {
        if (handleApiError(error)) {
          throw error; // Re-throw after handling
        }
        throw error;
      }
    }) as T;
  }, [hasTier, handleApiError, subscription]);

  const closeModal = useCallback(() => {
    setShowUpgradeModal(false);
    setGateError(null);
  }, []);

  return {
    subscription,
    isActive: subscription?.isActive ?? false,
    currentTier: subscription?.tier,
    hasTier,
    handleApiError,
    withSubscriptionGate,
    showUpgradeModal,
    gateError,
    closeModal,
  };
}

/**
 * Parse API fetch response for subscription errors
 */
export async function checkSubscriptionError(response: Response): Promise<SubscriptionError | null> {
  if (response.status === 403) {
    try {
      const data = await response.json();
      if (data.code === 'SUBSCRIPTION_REQUIRED' || data.code === 'TIER_INSUFFICIENT') {
        return {
          code: data.code,
          requiredTier: data.requiredTier,
          currentTier: data.currentTier,
          message: data.message,
        };
      }
    } catch {
      // Not a JSON response
    }
  }
  return null;
}
