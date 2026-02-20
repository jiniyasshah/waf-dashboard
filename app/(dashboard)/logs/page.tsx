"use client";

import { useEffect, useState, useCallback, useMemo, Fragment } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getLogs, getDomains, createLogStream } from "@/lib/api";
import { AttackLog, Domain } from "@/types";
import { formatRelativeTime } from "@/lib/utils";
import {
  Search,
  RefreshCw,
  PauseCircle,
  PlayCircle,
  ChevronDown,
  ChevronRight,
  Shield,
  ShieldAlert,
  Activity,
  Filter,
  Download,
  XCircle,
  Terminal,
  ChevronLeft,
  Copy,
  ArrowUpRight,
  FileCode,
  Globe,
} from "lucide-react";
import { toast } from "sonner";

const TableSkeleton = () => (
  <>
    {Array.from({ length: 5 }).map((_, i) => (
      <TableRow key={i} className="animate-pulse border-b border-border/40">
        <TableCell className="py-4">
          <div className="h-4 w-4 bg-muted/50 rounded" />
        </TableCell>
        <TableCell>
          <div className="h-4 w-24 bg-muted/50 rounded" />
        </TableCell>
        <TableCell>
          <div className="h-4 w-48 bg-muted/50 rounded" />
        </TableCell>
        <TableCell>
          <div className="h-4 w-32 bg-muted/50 rounded" />
        </TableCell>
        <TableCell>
          <div className="h-4 w-20 bg-muted/50 rounded" />
        </TableCell>
        <TableCell>
          <div className="h-5 w-16 bg-muted/50 rounded-full" />
        </TableCell>
        <TableCell className="text-right">
          <div className="h-4 w-12 bg-muted/50 rounded ml-auto" />
        </TableCell>
      </TableRow>
    ))}
  </>
);

const RawRequestViewer = ({
  request,
}: {
  request: NonNullable<AttackLog["request"]>;
}) => {
  const copyToClipboard = () => {
    const content =
      `${request.method} ${request.url}\n` +
      Object.entries(request.headers || {})
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n") +
      (request.body ? `\n\n${request.body}` : "");
    navigator.clipboard.writeText(content);
    toast.success("Request copied to clipboard");
  };

  return (
    <div className="rounded-lg border border-border bg-[#09090b] shadow-sm overflow-hidden text-sm font-mono w-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-2 text-[10px] md:text-xs text-muted-foreground">
          <Terminal className="h-3.5 w-3.5" />
          <span>Raw HTTP Request</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={copyToClipboard}
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
      <div className="p-3 md:p-4 overflow-x-auto leading-relaxed">
        {/* Request Line - Added break-all for long URLs */}
        <div className="mb-3 text-[11px] md:text-sm break-all">
          <span className="text-blue-400 font-bold">{request.method}</span>{" "}
          <span className="text-foreground">{request.url}</span>{" "}
          <span className="text-muted-foreground">HTTP/1.1</span>
        </div>

        {/* Headers Section - Adjusted layout for mobile */}
        <div className="space-y-1 mb-4 text-[10px] md:text-xs">
          {Object.entries(request.headers || {}).map(([key, values]) => (
            <div key={key} className="flex flex-col sm:flex-row sm:gap-2">
              <span className="text-indigo-300 sm:min-w-[140px] select-none shrink-0 font-bold sm:font-normal">
                {key}:
              </span>
              <span className="text-muted-foreground break-all whitespace-pre-wrap sm:whitespace-normal">
                {Array.isArray(values) ? values.join(", ") : values}
              </span>
            </div>
          ))}
        </div>

        {/* Payload Section - Added overflow control */}
        {request.body && (
          <div className="border-t border-border/40 pt-3 mt-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 select-none">
              Payload Body
            </div>
            <div className="text-foreground/80 whitespace-pre-wrap break-all bg-muted/5 p-2 rounded border border-border/20 text-[10px] md:text-xs max-h-[300px] overflow-y-auto">
              {request.body}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function LogsPage() {
  const [logs, setLogs] = useState<AttackLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [domains, setDomains] = useState<Domain[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState("20");

  // True Backend Stats
  const [totalEvents, setTotalEvents] = useState(0);
  const [blockedCount, setBlockedCount] = useState(0);
  const [flaggedCount, setFlaggedCount] = useState(0);

  // Filters
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [ipSearch, setIpSearch] = useState("");
  const [debouncedIp, setDebouncedIp] = useState("");

  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const engineSources = ["Rule Engine", "ML Engine"];
  // Debounce IP search to prevent backend spamming
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedIp(ipSearch), 500);
    return () => clearTimeout(timer);
  }, [ipSearch]);

  useEffect(() => {
    setIsMounted(true);
    async function loadDomains() {
      const list = await getDomains();
      if (list) setDomains(list);
    }
    loadDomains();
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      if (logs.length === 0) setIsLoading(true);
      const res = await getLogs(
        page,
        parseInt(limit),
        selectedDomain,
        actionFilter,
        debouncedIp,
        sourceFilter,
      );

      if (res) {
        // Strictly use the new flattened properties
        setLogs(res.logs || []);
        setTotalPages(res.total_pages || 1);

        if (res.total_events !== undefined) setTotalEvents(res.total_events);
        if (res.blocked !== undefined) setBlockedCount(res.blocked);
        if (res.flagged !== undefined) setFlaggedCount(res.flagged);

        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Failed to fetch logs", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    page,
    limit,
    selectedDomain,
    actionFilter,
    debouncedIp,
    sourceFilter,
    logs.length,
  ]);

  // Initial fetch and automatic refresh interval
  useEffect(() => {
    fetchLogs();
    const interval = setInterval(() => {
      if (!isPaused && !document.hidden && page === 1) fetchLogs();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchLogs, isPaused, page]);

  // Reset page to 1 when any filter changes
  useEffect(() => {
    setPage(1);
  }, [selectedDomain, actionFilter, debouncedIp, sourceFilter, limit]);

  useEffect(() => {
    const eventSource = createLogStream((newLog) => {
      if (isPaused) return;
      if (selectedDomain !== "all" && newLog.domain_id !== selectedDomain)
        return;
      if (actionFilter !== "All" && newLog.action !== actionFilter) return;

      if (sourceFilter !== "All" && newLog.source !== sourceFilter) return;

      if (debouncedIp && !newLog.ip.includes(debouncedIp)) return;

      if (page === 1) {
        setLogs((prev) => [newLog, ...prev].slice(0, parseInt(limit)));
      }

      // Update global stats
      setTotalEvents((prev) => prev + 1);
      if (newLog.action === "Blocked") setBlockedCount((prev) => prev + 1);
      if (newLog.action === "Flagged") setFlaggedCount((prev) => prev + 1);
    });

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [
    selectedDomain,
    actionFilter,
    sourceFilter,
    debouncedIp,
    limit,
    isPaused,
    page,
  ]);

  // Calculate local "Top Threat" for the dashboard card based on current view
  const topReason = useMemo(() => {
    if (!logs.length) return "None";
    const reasons: Record<string, number> = {};
    logs.forEach((l) => {
      reasons[l.reason] = (reasons[l.reason] || 0) + 1;
    });
    return (
      Object.entries(reasons).sort((a, b) => b[1] - a[1])[0]?.[0] || "None"
    );
  }, [logs]);

  const toggleRow = (id: string) =>
    setExpandedRowId((prev) => (prev === id ? null : id));

  const handleExport = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute(
      "download",
      `waf_logs_${new Date().toISOString()}.json`,
    );
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      {/* HEADER - Responsive Stack */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            Traffic Inspector
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Real-time analysis of incoming requests and security events.
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          <div
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors shrink-0 ${
              isPaused
                ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            }`}
          >
            <div
              className={`h-2 w-2 rounded-full ${
                isPaused ? "bg-yellow-500" : "bg-emerald-500 animate-pulse"
              }`}
            />
            {isPaused ? "Paused" : "Live Stream"}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPaused(!isPaused)}
            className="h-8 shrink-0"
          >
            {isPaused ? (
              <PlayCircle className="h-3.5 w-3.5 mr-2" />
            ) : (
              <PauseCircle className="h-3.5 w-3.5 mr-2" />
            )}
            {isPaused ? "Resume" : "Pause"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsLoading(true);
              fetchLogs();
            }}
            className="h-8 w-8 p-0 shrink-0"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="h-8 w-8 p-0 shrink-0"
            title="Export JSON"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* STATS OVERVIEW - Responsive Grid (Now uses backend global stats) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Events"
          value={totalEvents || logs.length}
          icon={<FileCode className="h-4 w-4 text-primary" />}
        />
        <StatsCard
          title="Blocked Attacks"
          value={blockedCount}
          icon={<ShieldAlert className="h-4 w-4 text-rose-500" />}
        />
        <StatsCard
          title="Flagged Traffic"
          value={flaggedCount}
          icon={<Shield className="h-4 w-4 text-yellow-500" />}
        />
        <StatsCard
          title="Top Threat (Current View)"
          value={topReason}
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
          textSmall
        />
      </div>

      {/* TOOLBAR & TABLE */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by IP address..."
              className="pl-9 bg-background/50 w-full"
              value={ipSearch}
              onChange={(e) => setIpSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={selectedDomain} onValueChange={setSelectedDomain}>
              <SelectTrigger className="w-full sm:w-[180px] bg-background/50">
                <div className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="All Domains" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Domains</SelectItem>
                {domains.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[140px] bg-background/50">
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Action" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Actions</SelectItem>
                <SelectItem value="Blocked">Blocked</SelectItem>
                <SelectItem value="Flagged">Flagged</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[180px] bg-background/50">
                <SelectValue placeholder="Detection Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Sources</SelectItem>
                {engineSources.map((src) => (
                  <SelectItem key={src} value={src}>
                    {src}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={limit} onValueChange={setLimit}>
              <SelectTrigger className="w-[100px] bg-background/50">
                <SelectValue placeholder="Limit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20 rows</SelectItem>
                <SelectItem value="50">50 rows</SelectItem>
                <SelectItem value="100">100 rows</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* TABLE - Horizontal Scroll for Mobile */}
        <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent border-b border-border">
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead className="w-[120px] md:w-[150px]">Time</TableHead>
                  <TableHead className="min-w-[200px]">Request</TableHead>
                  <TableHead className="hidden md:table-cell w-[140px]">
                    Source IP
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">Reason</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[80px] text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && logs.length === 0 ? (
                  <TableSkeleton />
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="p-0 max-w-0">
                      <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in-95 duration-300 py-12">
                        <XCircle className="h-8 w-8 opacity-20" />
                        <p className="text-muted-foreground">
                          No matching events found
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log, i) => {
                    const rowId = log._id || String(i);
                    const isExpanded = expandedRowId === rowId;

                    return (
                      <Fragment key={rowId}>
                        <TableRow
                          className={`cursor-pointer transition-all duration-200 border-b border-border/40 
                            ${
                              isExpanded
                                ? "bg-muted/30 border-b-0"
                                : "hover:bg-muted/10"
                            } 
                            animate-in fade-in slide-in-from-bottom-2`}
                          style={{
                            animationDelay: `${i * 30}ms`,
                            animationFillMode: "backwards",
                          }}
                          onClick={() => toggleRow(rowId)}
                        >
                          <TableCell className="py-3 pl-4">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell className="py-3 font-mono text-[10px] md:text-xs text-muted-foreground whitespace-nowrap">
                            {formatRelativeTime(log.timestamp)}
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex items-center gap-2 max-w-[200px] md:max-w-[400px]">
                              <Badge
                                variant="secondary"
                                className="font-mono text-[9px] md:text-[10px] h-4 md:h-5 px-1 md:px-1.5 rounded-sm uppercase bg-background border-border text-foreground/80"
                              >
                                {log.request?.method || "REQ"}
                              </Badge>
                              <span
                                className="font-mono text-[10px] md:text-xs text-foreground truncate"
                                title={log.request_path}
                              >
                                {log.request_path}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground py-3">
                            {log.ip}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell py-3">
                            <span className="text-xs font-medium text-foreground/90">
                              {log.reason}
                            </span>
                          </TableCell>
                          <TableCell className="py-3">
                            <StatusBadge action={log.action} />
                          </TableCell>
                          <TableCell className="py-3 text-right">
                            {log.ml_confidence !== undefined ? (
                              <span
                                className={`font-mono text-[10px] md:text-xs font-bold ${
                                  log.ml_confidence > 0.8
                                    ? "text-rose-500"
                                    : "text-blue-500"
                                }`}
                              >
                                {(log.ml_confidence * 100).toFixed(0)}%
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>

                        {isExpanded && (
                          <TableRow className="bg-muted/10 hover:bg-muted/10 border-b border-border">
                            <TableCell colSpan={7} className="p-0">
                              <div className="p-4 md:p-6 grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8 border-l-2 border-primary/50 ml-1 bg-gradient-to-r from-background to-transparent animate-in slide-in-from-top-2 duration-300">
                                <div className="space-y-6">
                                  <div>
                                    <h4 className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                      <Activity className="h-3.5 w-3.5" />{" "}
                                      Threat Analysis
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <div className="p-3 rounded-md bg-background border border-border">
                                        <span className="text-[10px] md:text-xs text-muted-foreground block mb-1">
                                          Detection Engine
                                        </span>
                                        <span className="text-xs md:text-sm font-medium text-foreground">
                                          {log.source}
                                        </span>
                                      </div>
                                      <div className="p-3 rounded-md bg-background border border-border">
                                        <span className="text-[10px] md:text-xs text-muted-foreground block mb-1">
                                          Threat Score
                                        </span>
                                        <div className="flex items-center gap-3">
                                          <div className="h-2 flex-1 rounded-full bg-secondary overflow-hidden">
                                            <div
                                              className={`h-full rounded-full ${
                                                log.score > 80
                                                  ? "bg-rose-500"
                                                  : "bg-yellow-500"
                                              }`}
                                              style={{ width: `${log.score}%` }}
                                            />
                                          </div>
                                          <span className="text-xs md:text-sm font-bold text-foreground">
                                            {log.score}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                      <ArrowUpRight className="h-3.5 w-3.5" />{" "}
                                      Client Details
                                    </h4>
                                    <div className="space-y-2 p-3 rounded-md bg-background border border-border">
                                      <div className="flex flex-col sm:flex-row sm:justify-between text-[10px] md:text-xs py-1.5 border-b border-border/50 gap-1">
                                        <span className="text-muted-foreground">
                                          User Agent
                                        </span>
                                        <span
                                          className="text-foreground sm:max-w-[280px] truncate"
                                          title={
                                            log.request?.headers?.[
                                              "user-agent"
                                            ]?.[0]
                                          }
                                        >
                                          {log.request?.headers?.[
                                            "user-agent"
                                          ]?.[0] || "Unknown"}
                                        </span>
                                      </div>
                                      <div className="flex flex-col sm:flex-row sm:justify-between text-[10px] md:text-xs py-1.5 border-b border-border/50 gap-1">
                                        <span className="text-muted-foreground">
                                          Log ID
                                        </span>
                                        <span className="font-mono text-muted-foreground break-all">
                                          {log._id || "N/A"}
                                        </span>
                                      </div>
                                      <div className="pt-2">
                                        <span className="text-[10px] md:text-xs text-muted-foreground block mb-1.5">
                                          Rule Tags
                                        </span>
                                        <div className="flex flex-wrap gap-1.5">
                                          {log.tags?.length ? (
                                            log.tags.map((t) => (
                                              <Badge
                                                key={t}
                                                variant="secondary"
                                                className="text-[9px] md:text-[10px] px-1.5 h-4 md:h-5 font-mono bg-secondary/50"
                                              >
                                                {t}
                                              </Badge>
                                            ))
                                          ) : (
                                            <span className="text-xs italic text-muted-foreground">
                                              No tags
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  {log.request ? (
                                    <RawRequestViewer request={log.request} />
                                  ) : (
                                    <div className="h-32 flex items-center justify-center border border-dashed rounded-lg text-muted-foreground text-xs md:text-sm">
                                      Raw request data unavailable
                                    </div>
                                  )}

                                  {log.trigger_payload && (
                                    <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
                                      <div className="flex items-center gap-2 text-rose-500 mb-2">
                                        <ShieldAlert className="h-4 w-4" />
                                        <span className="text-[10px] md:text-xs font-bold uppercase tracking-wide">
                                          Payload Match
                                        </span>
                                      </div>
                                      <code className="block text-[10px] md:text-xs font-mono text-rose-300 break-all bg-black/40 p-2.5 rounded border border-rose-500/10">
                                        {log.trigger_payload}
                                      </code>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* PAGINATION - Server Side */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-border bg-muted/20 gap-4">
            <div className="text-[10px] md:text-xs text-muted-foreground">
              Showing logs {(page - 1) * parseInt(limit) + 1} to{" "}
              {Math.min(
                page * parseInt(limit),
                page * parseInt(limit) + logs.length,
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
                className="h-8 px-3 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
              </Button>
              <div className="text-[10px] md:text-xs font-medium px-2 min-w-[80px] text-center">
                Page {page} of {totalPages || 1}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages || totalPages === 0 || isLoading}
                className="h-8 px-3 text-xs"
              >
                Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon, textSmall }: any) {
  return (
    <div className="p-3 md:p-4 rounded-lg border border-border bg-card flex items-center justify-between shadow-sm">
      <div className="min-w-0">
        <p className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
          {title}
        </p>
        <div
          className={`font-bold text-foreground mt-1 truncate ${
            textSmall ? "text-sm md:text-lg" : "text-lg md:text-2xl"
          }`}
        >
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
      </div>
      <div className="p-2 md:p-2.5 bg-muted rounded-full opacity-80 shrink-0 ml-2">
        {icon}
      </div>
    </div>
  );
}

// "Monitor" check removed entirely
function StatusBadge({ action }: { action: string }) {
  let className = "text-muted-foreground bg-muted";

  if (action === "Blocked") {
    className = "text-rose-500 bg-rose-500/10 border-rose-500/20";
  } else if (action === "Flagged") {
    className = "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
  }

  return (
    <Badge
      variant="outline"
      className={`text-[9px] md:text-[10px] h-4 md:h-5 border px-1.5 md:px-2 ${className}`}
    >
      {action}
    </Badge>
  );
}
