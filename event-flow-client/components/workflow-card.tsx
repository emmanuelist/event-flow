"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  Settings,
  Trash2,
  Activity,
  Clock,
  Zap,
  Lock,
  Globe,
} from "lucide-react";
import type { Workflow } from "@/lib/types";

interface WorkflowCardProps {
  workflow: Workflow;
  onToggle?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onView?: (id: number) => void;
}

export function WorkflowCard({
  workflow,
  onToggle,
  onEdit,
  onDelete,
  onView,
}: WorkflowCardProps) {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
      },
    },
    hover: {
      y: -4,
      boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.3)",
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
    >
      <Card className="p-6 relative overflow-hidden group cursor-pointer" onClick={() => onView?.(workflow.id)}>
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Status indicator */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {workflow.isPremium && (
            <Badge variant="secondary" className="gap-1">
              <Lock className="h-3 w-3" />
              Premium
            </Badge>
          )}
          {workflow.isPublic && (
            <Badge variant="outline" className="gap-1">
              <Globe className="h-3 w-3" />
              Public
            </Badge>
          )}
        </div>

        <div className="relative z-10 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between pr-24">
            <div className="space-y-1">
              <h3 className="text-xl font-bold flex items-center gap-2">
                {workflow.name}
                {workflow.active ? (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  >
                    <Activity className="h-4 w-4 text-green-500" />
                  </motion.div>
                ) : (
                  <Pause className="h-4 w-4 text-gray-400" />
                )}
              </h3>
              <Badge variant="default">{workflow.category}</Badge>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {workflow.description}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4" />
              <span>{workflow.eventCount.toLocaleString()} events</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>
                {new Date(workflow.createdAt * 1000).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              size="sm"
              variant={workflow.active ? "destructive" : "default"}
              onClick={(e) => {
                e.stopPropagation();
                onToggle?.(workflow.id);
              }}
              className="gap-1"
            >
              {workflow.active ? (
                <>
                  <Pause className="h-3 w-3" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" />
                  Start
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(workflow.id);
              }}
              className="gap-1"
            >
              <Settings className="h-3 w-3" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(workflow.id);
              }}
              className="gap-1 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
