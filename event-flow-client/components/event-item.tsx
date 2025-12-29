"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, AlertCircle, Loader2, Zap } from "lucide-react";
import type { Event } from "@/lib/types";

interface EventItemProps {
  event: Event;
  index?: number;
}

export function EventItem({ event, index = 0 }: EventItemProps) {
  const statusConfig = {
    pending: {
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      label: "Pending",
    },
    processing: {
      icon: Loader2,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      label: "Processing",
    },
    completed: {
      icon: CheckCircle2,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      label: "Completed",
    },
    failed: {
      icon: AlertCircle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      label: "Failed",
    },
  };

  const config = statusConfig[event.status];
  const StatusIcon = config.icon;

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        delay: index * 0.05,
      },
    },
  };

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02 }}
      className="group"
    >
      <Card className="p-4 hover:shadow-md transition-all duration-200">
        <div className="flex items-start justify-between gap-4">
          {/* Left side - Status icon and details */}
          <div className="flex items-start gap-3 flex-1">
            <div className={`p-2 rounded-lg ${config.bgColor}`}>
              <StatusIcon
                className={`h-5 w-5 ${config.color} ${
                  event.status === "processing" ? "animate-spin" : ""
                }`}
              />
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <Zap className="h-3 w-3" />
                  Workflow #{event.workflowId}
                </Badge>
                <Badge variant="secondary">{event.eventType}</Badge>
                <Badge variant="default" className={config.bgColor}>
                  {config.label}
                </Badge>
              </div>

              <div className="text-sm">
                <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                  Event ID: {event.id.slice(0, 16)}...
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  Processed by: {event.processedBy.slice(0, 8)}...
                  {event.processedBy.slice(-8)}
                </p>
              </div>

              {event.eventData && (
                <div className="mt-2 p-2 bg-muted rounded text-xs font-mono text-muted-foreground max-w-md overflow-hidden text-ellipsis whitespace-nowrap">
                  {event.eventData}
                </div>
              )}
            </div>
          </div>

          {/* Right side - Timestamp */}
          <div className="text-right text-sm text-muted-foreground whitespace-nowrap">
            <div>{new Date(event.timestamp).toLocaleDateString()}</div>
            <div className="text-xs">
              {new Date(event.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Progress bar for processing */}
        {event.status === "processing" && (
          <motion.div
            className="mt-3 h-1 bg-muted rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="h-full bg-blue-500"
              initial={{ width: "0%" }}
              animate={{ width: "70%" }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
}
