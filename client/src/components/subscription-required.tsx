import { Link } from "wouter";
import { Lock, Zap, Crown, Rocket, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StormyAvatar } from "./stormy-avatar";

interface SubscriptionRequiredProps {
  feature?: string;
  requiredTier?: 'starter' | 'professional' | 'enterprise';
  currentTier?: string | null;
  onClose?: () => void;
}

const TIER_INFO = {
  starter: {
    name: 'Starter',
    price: '$49',
    icon: Zap,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    features: [
      'Unlimited properties',
      'Stormy AI Coach',
      'Basic reports',
      'Photo documentation'
    ]
  },
  professional: {
    name: 'Professional',
    price: '$149',
    icon: Crown,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    features: [
      'Everything in Starter',
      'Thermal analysis',
      'Advanced AI features',
      'Bulk image analysis',
      'Priority support'
    ]
  },
  enterprise: {
    name: 'Enterprise',
    price: '$399',
    icon: Rocket,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    features: [
      'Everything in Professional',
      'Carrier integrations',
      'Risk intelligence',
      'Custom branding',
      'Dedicated support'
    ]
  }
};

export function SubscriptionRequired({
  feature = "this feature",
  requiredTier = 'starter',
  currentTier,
  onClose
}: SubscriptionRequiredProps) {
  const tierInfo = TIER_INFO[requiredTier];
  const TierIcon = tierInfo.icon;

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
      {/* Lock Icon */}
      <div className="relative mb-6">
        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center">
          <Lock className="w-10 h-10 text-slate-400" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
          <StormyAvatar size={32} />
        </div>
      </div>

      {/* Message */}
      <h2 className="text-2xl font-bold text-foreground mb-2">
        Subscription Required
      </h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        To access {feature}, you need an active <span className={tierInfo.color}>{tierInfo.name}</span> subscription or higher.
      </p>

      {/* Stormy Message */}
      <Card className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-500/5 dark:to-amber-500/5 border-orange-200 dark:border-orange-500/20 mb-6 max-w-md">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <StormyAvatar size={40} />
            <div className="text-left">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                "Hey partner! This feature is part of our {tierInfo.name} plan.
                Upgrade now and I'll help you knock out inspections faster than a Texas tornado!"
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Card */}
      <Card className={`w-full max-w-sm border-2 ${tierInfo.color.replace('text-', 'border-')} mb-6`}>
        <CardHeader className="text-center pb-2">
          <div className={`w-12 h-12 ${tierInfo.bgColor} rounded-xl flex items-center justify-center mx-auto mb-2`}>
            <TierIcon className={`w-6 h-6 ${tierInfo.color}`} />
          </div>
          <CardTitle className="text-xl">{tierInfo.name}</CardTitle>
          <CardDescription>
            <span className="text-3xl font-bold text-foreground">{tierInfo.price}</span>
            <span className="text-muted-foreground">/month</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-left mb-4">
            {tierInfo.features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <Check className={`w-4 h-4 ${tierInfo.color}`} />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/pricing">
          <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white">
            View Plans
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
        {onClose && (
          <Button variant="outline" size="lg" onClick={onClose}>
            Maybe Later
          </Button>
        )}
      </div>

      {/* Current Status */}
      {currentTier && (
        <p className="text-xs text-muted-foreground mt-4">
          Your current plan: <span className="font-medium">{currentTier}</span>
        </p>
      )}
    </div>
  );
}

/**
 * Modal wrapper for subscription required
 */
export function SubscriptionRequiredModal({
  isOpen,
  onClose,
  ...props
}: SubscriptionRequiredProps & { isOpen: boolean }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-background rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <SubscriptionRequired {...props} onClose={onClose} />
      </div>
    </div>
  );
}

/**
 * Inline banner for subscription required
 */
export function SubscriptionBanner({
  feature = "this feature",
  requiredTier = 'starter'
}: Pick<SubscriptionRequiredProps, 'feature' | 'requiredTier'>) {
  const tierInfo = TIER_INFO[requiredTier];

  return (
    <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
          <Lock className="w-5 h-5 text-orange-500" />
        </div>
        <div>
          <p className="font-medium text-foreground">Upgrade to unlock {feature}</p>
          <p className="text-sm text-muted-foreground">
            Requires {tierInfo.name} plan ({tierInfo.price}/mo)
          </p>
        </div>
      </div>
      <Link href="/pricing">
        <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
          Upgrade
        </Button>
      </Link>
    </div>
  );
}
