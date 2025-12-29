"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Check, Zap, Crown, Rocket } from "lucide-react";
import type { SubscriptionTier } from "@/lib/types";
import { SUBSCRIPTION_TIERS } from "@/lib/types";

interface SubscriptionCardProps {
  tier: SubscriptionTier;
  isCurrentTier?: boolean;
  onSubscribe?: (tierId: number) => void;
  index?: number;
}

export function SubscriptionCard({
  tier,
  isCurrentTier = false,
  onSubscribe,
  index = 0,
}: SubscriptionCardProps) {
  const icons = {
    1: Zap,
    2: Crown,
    3: Rocket,
  };

  const TierIcon = icons[tier.id as keyof typeof icons] || Zap;

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        delay: index * 0.1,
      },
    },
  };

  const isPro = tier.id === 2;

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.05, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`p-6 relative overflow-hidden ${
          isPro
            ? "border-2 border-primary shadow-lg shadow-primary/20"
            : "border"
        }`}
      >
        {/* Background effects */}
        {isPro && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10" />
        )}

        {isCurrentTier && (
          <div className="absolute top-4 right-4">
            <Badge variant="default">Current Plan</Badge>
          </div>
        )}

        {isPro && (
          <div className="absolute top-4 left-4">
            <Badge variant="default" className="bg-gradient-to-r from-blue-600 to-purple-600">
              Most Popular
            </Badge>
          </div>
        )}

        <div className="relative z-10 space-y-6">
          {/* Icon and Title */}
          <div className="space-y-2">
            <motion.div
              className="inline-flex p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20"
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <TierIcon className="h-8 w-8 text-primary" />
            </motion.div>
            <h3 className="text-2xl font-bold">{tier.name}</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">{tier.price}</span>
              <span className="text-muted-foreground">STX/month</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {tier.eventsPerMonth.toLocaleString()} events per month
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3">
            {tier.features.map((feature, idx) => (
              <motion.div
                key={idx}
                className="flex items-start gap-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 + idx * 0.05 }}
              >
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{feature}</span>
              </motion.div>
            ))}
          </div>

          {/* Subscribe Button */}
          <Button
            className={`w-full ${
              isPro
                ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                : ""
            }`}
            size="lg"
            disabled={isCurrentTier}
            onClick={() => onSubscribe?.(tier.id)}
          >
            {isCurrentTier ? "Current Plan" : `Subscribe to ${tier.name}`}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

export function SubscriptionPlans({ currentTier, onSubscribe }: {
  currentTier?: number;
  onSubscribe?: (tierId: number) => void;
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {SUBSCRIPTION_TIERS.map((tier, index) => (
        <SubscriptionCard
          key={tier.id}
          tier={tier}
          isCurrentTier={currentTier === tier.id}
          onSubscribe={onSubscribe}
          index={index}
        />
      ))}
    </div>
  );
}
