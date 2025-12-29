"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface EventFlowLogoProps {
  size?: number;
  animate?: boolean;
  className?: string;
}

export function EventFlowLogo({ size = 40, animate = true, className = "" }: EventFlowLogoProps) {
  const containerVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  const iconVariants = {
    initial: { rotate: 0 },
    animate: {
      rotate: [0, 10, -10, 0],
      transition: {
        duration: 2,
        repeat: Number.POSITIVE_INFINITY,
        repeatDelay: 3,
      },
    },
  };

  const pathVariants = {
    initial: { pathLength: 0, opacity: 0 },
    animate: {
      pathLength: 1,
      opacity: 1,
      transition: {
        duration: 1.5,
      },
    },
  };

  return (
    <motion.div
      className={`relative inline-flex items-center justify-center ${className}`}
      variants={containerVariants}
      initial="initial"
      animate={animate ? "animate" : "initial"}
    >
      {/* Glowing background effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-xl"
        animate={
          animate
            ? {
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }
            : {}
        }
        transition={{
          duration: 3,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />

      {/* Main icon */}
      <motion.div
        className="relative z-10"
        variants={iconVariants}
        initial="initial"
        animate={animate ? "animate" : "initial"}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer circle with gradient */}
          <defs>
            <linearGradient id="eventflow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>

          {/* Animated circular path */}
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            stroke="url(#eventflow-gradient)"
            strokeWidth="3"
            fill="none"
            variants={pathVariants}
            initial="initial"
            animate={animate ? "animate" : "initial"}
          />

          {/* Inner lightning bolt */}
          <motion.path
            d="M50 15 L40 50 L55 50 L45 85 L70 45 L55 45 L65 15 Z"
            fill="url(#eventflow-gradient)"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={
              animate
                ? {
                    opacity: [0.8, 1, 0.8],
                    scale: [0.95, 1, 0.95],
                  }
                : { opacity: 1, scale: 1 }
            }
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />

          {/* Connection nodes */}
          <motion.circle
            cx="30"
            cy="30"
            r="4"
            fill="#3b82f6"
            animate={
              animate
                ? {
                    scale: [1, 1.5, 1],
                    opacity: [0.6, 1, 0.6],
                  }
                : {}
            }
            transition={{
              duration: 1.5,
              repeat: Number.POSITIVE_INFINITY,
              delay: 0,
            }}
          />
          <motion.circle
            cx="70"
            cy="30"
            r="4"
            fill="#a855f7"
            animate={
              animate
                ? {
                    scale: [1, 1.5, 1],
                    opacity: [0.6, 1, 0.6],
                  }
                : {}
            }
            transition={{
              duration: 1.5,
              repeat: Number.POSITIVE_INFINITY,
              delay: 0.3,
            }}
          />
          <motion.circle
            cx="50"
            cy="75"
            r="4"
            fill="#ec4899"
            animate={
              animate
                ? {
                    scale: [1, 1.5, 1],
                    opacity: [0.6, 1, 0.6],
                  }
                : {}
            }
            transition={{
              duration: 1.5,
              repeat: Number.POSITIVE_INFINITY,
              delay: 0.6,
            }}
          />
        </svg>
      </motion.div>
    </motion.div>
  );
}

export function EventFlowWordmark({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-5xl",
  };

  return (
    <motion.div
      className={`flex items-center gap-3 ${className}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <EventFlowLogo size={size === "sm" ? 32 : size === "md" ? 48 : 64} />
      <motion.div
        className={`font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent ${sizeClasses[size]}`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        EventFlow
      </motion.div>
    </motion.div>
  );
}
