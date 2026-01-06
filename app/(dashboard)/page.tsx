// type: uploaded file
// fileName: jiniyasshah/waf-dashboard/waf-dashboard-main/app/(dashboard)/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSystemStatus, getLogs, createLogStream } from "@/lib/api";
import { SystemStatus, AttackLog } from "@/types";
import { getActionColor, formatRelativeTime } from "@/lib/utils";
import {
  Server,
  Database,
  Brain,
  Activity,
  Shield,
  AlertTriangle,
} from "lucide-react";

export default function DashboardPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [recentLogs, setRecentLogs] = useState<AttackLog[]>([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    blocked: 0,
    flagged: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      const systemStatus = await getSystemStatus();
      if (systemStatus) setStatus(systemStatus);

      // getLogs returns { data, pagination }
      const response = await getLogs(1, 20);

      if (response && response.data) {
        setRecentLogs(response.data.slice(0, 10));

        const blockedCount = response.data.filter(
          (l) => l.action === "Blocked"
        ).length;
        const flaggedCount = response.data.filter(
          (l) => l.action === "Flagged"
        ).length;

        setStats({
          totalRequests: response.pagination.total_items,
          blocked: blockedCount,
          flagged: flaggedCount,
        });
      }
    };

    fetchData();

    const eventSource = createLogStream((log) => {
      setRecentLogs((prev) => [log, ...prev.slice(0, 9)]);
      setStats((prev) => ({
        totalRequests: prev.totalRequests + 1,
        blocked: log.action === "Blocked" ? prev.blocked + 1 : prev.blocked,
        flagged: log.action === "Flagged" ? prev.flagged + 1 : prev.flagged,
      }));
    });

    return () => {
      eventSource?.close();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor your WAF system in real-time
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Requests
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequests}</div>
            <p className="text-xs text-muted-foreground">Monitored requests</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Blocks</CardTitle>
            <Shield className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats.blocked}
            </div>
            <p className="text-xs text-muted-foreground">In last 20 requests</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Flagged
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {stats.flagged}
            </div>
            <p className="text-xs text-muted-foreground">In last 20 requests</p>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gateway</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Badge
              variant={
                status?.gateway.status === "Online" ? "default" : "destructive"
              }
              className={
                status?.gateway.status === "Online"
                  ? "bg-green-500/20 text-green-500 hover:bg-green-500/30"
                  : ""
              }
            >
              {status?.gateway.status || "Unknown"}
            </Badge>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>CPU: {status?.gateway.cpu || "N/A"}</div>
              <div>Memory: {status?.gateway.memory || "N/A"}</div>
              <div>Network: {status?.gateway.network || "N/A"}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Badge
              variant={
                status?.database.status === "Online" ? "default" : "destructive"
              }
              className={
                status?.database.status === "Online"
                  ? "bg-green-500/20 text-green-500 hover:bg-green-500/30"
                  : ""
              }
            >
              {status?.database.status || "Unknown"}
            </Badge>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>CPU: {status?.database.cpu || "N/A"}</div>
              <div>Memory: {status?.database.memory || "N/A"}</div>
              <div>Network: {status?.database.network || "N/A"}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ML Scorer</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Badge
              variant={
                status?.ml_scorer.status === "Online"
                  ? "default"
                  : "destructive"
              }
              className={
                status?.ml_scorer.status === "Online"
                  ? "bg-green-500/20 text-green-500 hover:bg-green-500/30"
                  : ""
              }
            >
              {status?.ml_scorer.status || "Unknown"}
            </Badge>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>CPU: {status?.ml_scorer.cpu || "N/A"}</div>
              <div>Memory: {status?.ml_scorer.memory || "N/A"}</div>
              <div>Network: {status?.ml_scorer.network || "N/A"}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Threat Feed */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary animate-pulse" />
            Live Threat Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent activity
              </p>
            ) : (
              recentLogs.map((log, index) => (
                <div
                  key={log._id || index}
                  className="flex items-start gap-3 rounded-lg border border-border/50 p-3 animate-fade-in hover:bg-accent/50 transition-colors"
                >
                  <div
                    className={`mt-0.5 h-2 w-2 rounded-full ${
                      log.action === "Blocked"
                        ? "bg-destructive"
                        : "bg-yellow-500"
                    }`}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{log.reason}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(log.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{log.ip}</span>
                      <span>•</span>
                      <span className={getActionColor(log.action)}>
                        {log.action}
                      </span>
                      <span>•</span>
                      <span>Score: {log.score}</span>
                      {log.ml_confidence && (
                        <>
                          <span>•</span>
                          <span>
                            Confidence: {(log.ml_confidence * 100).toFixed(0)}%
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {log.tags?.map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
