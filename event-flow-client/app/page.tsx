"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { EventFlowWordmark } from "@/components/logo";
import { WorkflowCard } from "@/components/workflow-card";
import { EventItem } from "@/components/event-item";
import { SubscriptionPlans } from "@/components/subscription-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Activity,
  Zap,
  TrendingUp,
  Users,
  Wallet,
  Menu,
  Bell,
} from "lucide-react";
import { useChainhooks } from "@/providers/chainhook-provider";
import type { Workflow, Event, UserStats } from "@/lib/types";
import { toast } from "sonner";

export default function Home() {
  const { events, connected } = useChainhooks();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats>({
    totalWorkflows: 0,
    activeWorkflows: 0,
    eventsProcessed: 0,
    creditsRemaining: 0,
    subscriptionTier: 0,
    subscriptionActive: false,
  });

  // Mock data loading
  useEffect(() => {
    const loadData = async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const mockWorkflows: Workflow[] = [
        {
          id: 1,
          owner: "SPVQ61FEWR6M4HVAT3BNE07D4BNW6A1C2ACCNQ6F",
          name: "Token Transfer Monitor",
          description:
            "Automatically monitor and react to STX token transfers above 1000 STX",
          category: "DeFi",
          active: true,
          createdAt: Date.now() / 1000 - 86400 * 7,
          eventCount: 1247,
          isPremium: true,
          isPublic: true,
        },
        {
          id: 2,
          owner: "SPVQ61FEWR6M4HVAT3BNE07D4BNW6A1C2ACCNQ6F",
          name: "NFT Sales Tracker",
          description: "Track NFT sales and send notifications to Discord",
          category: "NFT",
          active: true,
          createdAt: Date.now() / 1000 - 86400 * 14,
          eventCount: 892,
          isPremium: false,
          isPublic: false,
        },
        {
          id: 3,
          owner: "SPVQ61FEWR6M4HVAT3BNE07D4BNW6A1C2ACCNQ6F",
          name: "Contract Deploy Alert",
          description: "Get notified when new contracts are deployed",
          category: "Development",
          active: false,
          createdAt: Date.now() / 1000 - 86400 * 3,
          eventCount: 234,
          isPremium: false,
          isPublic: true,
        },
      ];

      setWorkflows(mockWorkflows);
      setUserStats({
        totalWorkflows: mockWorkflows.length,
        activeWorkflows: mockWorkflows.filter((w) => w.active).length,
        eventsProcessed: mockWorkflows.reduce((sum, w) => sum + w.eventCount, 0),
        creditsRemaining: 2450,
        subscriptionTier: 2,
        subscriptionActive: true,
      });
      setLoading(false);
    };

    loadData();
  }, []);

  const handleToggleWorkflow = (id: number) => {
    setWorkflows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, active: !w.active } : w))
    );
    toast.success(`Workflow ${workflows.find((w) => w.id === id)?.active ? "paused" : "started"}`);
  };

  const handleEditWorkflow = (id: number) => {
    toast.info(`Edit workflow ${id} - Coming soon!`);
  };

  const handleDeleteWorkflow = (id: number) => {
    toast.error(`Delete workflow ${id} - Coming soon!`);
  };

  const handleViewWorkflow = (id: number) => {
    toast.info(`View workflow ${id} - Coming soon!`);
  };

  const handleSubscribe = (tierId: number) => {
    toast.success(`Subscribing to tier ${tierId} - Wallet integration coming soon!`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <EventFlowWordmark size="sm" />

            <div className="flex items-center gap-4">
              {connected && (
                <Badge variant="outline" className="gap-1">
                  <Activity className="h-3 w-3 text-green-500" />
                  Live
                </Badge>
              )}
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Wallet className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Hero Section */}
          <motion.div variants={itemVariants} className="text-center space-y-4 py-12">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Build Powerful Blockchain Workflows
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Automate blockchain event monitoring and actions with EventFlow's
              powerful smart contract platform
            </p>
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Create Workflow
              </Button>
              <Button size="lg" variant="outline">
                View Documentation
              </Button>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div variants={itemVariants}>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {loading ? (
                <>
                  {[...Array(4)].map((_, i) => (
                    <Card key={i} className="p-6">
                      <Skeleton className="h-24" />
                    </Card>
                  ))}
                </>
              ) : (
                <>
                  <Card className="p-6 relative overflow-hidden group hover:shadow-lg transition-shadow">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Total Workflows</p>
                        <Activity className="h-5 w-5 text-blue-500" />
                      </div>
                      <p className="text-3xl font-bold">{userStats.totalWorkflows}</p>
                      <p className="text-xs text-muted-foreground">
                        {userStats.activeWorkflows} active
                      </p>
                    </div>
                  </Card>

                  <Card className="p-6 relative overflow-hidden group hover:shadow-lg transition-shadow">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Events Processed</p>
                        <Zap className="h-5 w-5 text-purple-500" />
                      </div>
                      <p className="text-3xl font-bold">
                        {userStats.eventsProcessed.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">This month</p>
                    </div>
                  </Card>

                  <Card className="p-6 relative overflow-hidden group hover:shadow-lg transition-shadow">
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Credits Remaining</p>
                        <TrendingUp className="h-5 w-5 text-pink-500" />
                      </div>
                      <p className="text-3xl font-bold">
                        {userStats.creditsRemaining.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Pro tier</p>
                    </div>
                  </Card>

                  <Card className="p-6 relative overflow-hidden group hover:shadow-lg transition-shadow">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Subscription</p>
                        <Users className="h-5 w-5 text-green-500" />
                      </div>
                      <p className="text-3xl font-bold">Pro</p>
                      <p className="text-xs text-muted-foreground">
                        {userStats.subscriptionActive ? "Active" : "Inactive"}
                      </p>
                    </div>
                  </Card>
                </>
              )}
            </div>
          </motion.div>

          {/* Main Tabs */}
          <motion.div variants={itemVariants}>
            <Tabs defaultValue="workflows" className="space-y-6">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="workflows">Workflows</TabsTrigger>
                <TabsTrigger value="events">Events</TabsTrigger>
                <TabsTrigger value="subscription">Subscription</TabsTrigger>
              </TabsList>

              {/* Workflows Tab */}
              <TabsContent value="workflows" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">My Workflows</h2>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Workflow
                  </Button>
                </div>

                {loading ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                      <Card key={i} className="p-6">
                        <Skeleton className="h-48" />
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {workflows.map((workflow) => (
                      <WorkflowCard
                        key={workflow.id}
                        workflow={workflow}
                        onToggle={handleToggleWorkflow}
                        onEdit={handleEditWorkflow}
                        onDelete={handleDeleteWorkflow}
                        onView={handleViewWorkflow}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Events Tab */}
              <TabsContent value="events" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Recent Events</h2>
                  <Badge variant="outline" className="gap-1">
                    <Activity className="h-3 w-3" />
                    {events.length} events
                  </Badge>
                </div>

                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-4">
                    {events.length === 0 ? (
                      <Card className="p-12 text-center">
                        <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          No events yet. Create a workflow to start monitoring!
                        </p>
                      </Card>
                    ) : (
                      events.map((event, index) => {
                        const mockEvent: Event = {
                          id: event.event_id,
                          workflowId: event.data.workflow_id || 1,
                          eventType: event.data.event_type || "unknown",
                          eventData: JSON.stringify(event.data),
                          timestamp: Date.now() - index * 60000,
                          processedBy: event.contract_identifier,
                          status: ["completed", "processing", "pending"][
                            Math.floor(Math.random() * 3)
                          ] as Event["status"],
                        };
                        return <EventItem key={event.event_id} event={mockEvent} index={index} />;
                      })
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Subscription Tab */}
              <TabsContent value="subscription" className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Subscription Plans</h2>
                  <p className="text-muted-foreground">
                    Choose the plan that fits your needs. All plans include core features.
                  </p>
                </div>

                <SubscriptionPlans
                  currentTier={userStats.subscriptionTier}
                  onSubscribe={handleSubscribe}
                />
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© 2025 EventFlow. Built on Stacks blockchain.</p>
          <p className="mt-2">
            Contracts deployed on mainnet:{" "}
            <code className="text-xs">SPVQ61FEWR6M4HVAT3BNE07D4BNW6A1C2ACCNQ6F</code>
          </p>
        </div>
      </footer>
    </div>
  );
}
