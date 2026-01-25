"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  getDomains,
  addDomain,
  verifyDomain,
  deleteDomain,
  getDNSRecords,
  addDNSRecord,
  deleteDNSRecord,
  toggleDNSRecordProxy,
  toggleDNSRecordOriginSSL,
} from "@/lib/api";
import { Domain, DNSRecord } from "@/types";
import { toast } from "sonner";
import {
  AlertTriangle,
  Plus,
  Globe,
  Trash2,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Cloud,
  CloudLightning,
  Lock,
  Unlock,
  Server,
  Calendar,
  X,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

// Regex Patterns
const DOMAIN_REGEX =
  /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;
const IPV4_REGEX =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const IPV6_REGEX =
  /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/;

export default function DomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDomainName, setNewDomainName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState<Domain | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
  const [dnsRecords, setDnsRecords] = useState<Record<string, DNSRecord[]>>({});
  const [loadingRecords, setLoadingRecords] = useState<string | null>(null);
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [selectedDomainForRecord, setSelectedDomainForRecord] =
    useState<Domain | null>(null);
  const [newRecord, setNewRecord] = useState({
    name: "",
    type: "A",
    content: "",
    proxied: true,
    ttl: 300,
  });
  const [isAddingRecord, setIsAddingRecord] = useState(false);

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    setIsLoading(true);
    const result = await getDomains();
    if (result) setDomains(result);
    setIsLoading(false);
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomainName) return toast.error("Domain name required");
    if (!DOMAIN_REGEX.test(newDomainName))
      return toast.error("Invalid domain format");

    setIsAdding(true);
    const result = await addDomain({ name: newDomainName });
    if (result) {
      toast.success("Domain added successfully");
      setDomains([result, ...domains]);
      setNewDomainName("");
      setShowAddModal(false);
    }
    setIsAdding(false);
  };

  const handleVerifyDomain = async (domainId: string) => {
    const result = await verifyDomain(domainId);
    if (result) {
      if (result.status === "active") {
        toast.success("Domain verified successfully");
        fetchDomains();
      } else {
        toast.error(result.message);
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!domainToDelete) return;
    setIsDeleting(true);
    const result = await deleteDomain(domainToDelete.id);
    if (result) {
      toast.success("Domain deleted successfully");
      setDomains((prev) => prev.filter((d) => d.id !== domainToDelete.id));
      if (expandedDomain === domainToDelete.id) setExpandedDomain(null);
      setDomainToDelete(null);
    } else {
      toast.error("Failed to delete domain");
    }
    setIsDeleting(false);
  };

  const toggleDomainExpand = async (domain: Domain) => {
    if (expandedDomain === domain.id) {
      setExpandedDomain(null);
      return;
    }
    setExpandedDomain(domain.id);
    if (!dnsRecords[domain.id]) {
      setLoadingRecords(domain.id);
      const records = await getDNSRecords(domain.id);
      if (records) setDnsRecords((prev) => ({ ...prev, [domain.id]: records }));
      setLoadingRecords(null);
    }
  };

  const handleToggleProxy = async (domainId: string, record: DNSRecord) => {
    const previousRecords = dnsRecords[domainId];
    const newProxiedState = !record.proxied;
    setDnsRecords((prev) => ({
      ...prev,
      [domainId]: prev[domainId].map((r) =>
        r.id === record.id ? { ...r, proxied: newProxiedState } : r,
      ),
    }));
    const result = await toggleDNSRecordProxy(
      domainId,
      record.id,
      newProxiedState,
    );
    if (!result || result.status !== "success") {
      toast.error("Failed to update proxy status");
      setDnsRecords((prev) => ({ ...prev, [domainId]: previousRecords }));
    }
  };

  const handleToggleOriginSSL = async (domainId: string, record: DNSRecord) => {
    const newStatus = !record.origin_ssl;
    setDnsRecords((prev) => ({
      ...prev,
      [domainId]: prev[domainId].map((r) =>
        r.id === record.id ? { ...r, origin_ssl: newStatus } : r,
      ),
    }));
    try {
      await toggleDNSRecordOriginSSL(domainId, record.id, newStatus);
    } catch {
      setDnsRecords((prev) => ({
        ...prev,
        [domainId]: prev[domainId].map((r) =>
          r.id === record.id ? { ...r, origin_ssl: !newStatus } : r,
        ),
      }));
      toast.error("Failed to update SSL status");
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDomainForRecord) return;
    if (!newRecord.name) return toast.error("Name required");
    if (!newRecord.content) return toast.error("Content required");

    setIsAddingRecord(true);
    const result = await addDNSRecord({
      domain_id: selectedDomainForRecord.id,
      name: newRecord.name,
      type: newRecord.type,
      content: newRecord.content,
      proxied: newRecord.proxied,
      ttl: newRecord.ttl,
    });

    if (result?.status === "success") {
      toast.success("Record added");
      const records = await getDNSRecords(selectedDomainForRecord.id);
      if (records)
        setDnsRecords((prev) => ({
          ...prev,
          [selectedDomainForRecord.id]: records,
        }));
      setShowAddRecordModal(false);
      setNewRecord({
        name: "",
        type: "A",
        content: "",
        proxied: true,
        ttl: 300,
      });
    } else {
      toast.error(result?.message || "Failed to add record");
    }
    setIsAddingRecord(false);
  };

  const handleDeleteRecord = async (domainId: string, recordId: string) => {
    const result = await deleteDNSRecord(domainId, recordId);
    if (result?.status === "success") {
      toast.success("Record deleted");
      setDnsRecords((prev) => ({
        ...prev,
        [domainId]: prev[domainId].filter((r) => r.id !== recordId),
      }));
    } else {
      toast.error("Failed to delete record");
    }
  };

  const getRecordTypeStyle = (type: string) => {
    const styles: Record<string, string> = {
      A: "text-blue-400 bg-blue-400/10 border-blue-400/20",
      AAAA: "text-purple-400 bg-purple-400/10 border-purple-400/20",
      CNAME: "text-orange-400 bg-orange-400/10 border-orange-400/20",
      MX: "text-pink-400 bg-pink-400/10 border-pink-400/20",
      TXT: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
      NS: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    };
    return styles[type] || "text-muted-foreground bg-muted border-border";
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-[1600px] mx-auto animate-pulse">
        <div className="h-10 w-48 bg-muted rounded mb-4" />
        <div className="grid gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-32 bg-card/50 border border-border/40 rounded-xl"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      {/* HEADER - Responsive Stack */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Domain Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure DNS, proxy settings, and SSL protection.
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="shadow-lg shadow-primary/20 shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Domain
        </Button>
      </div>

      {/* DOMAIN LIST - Grid Layout for Tablets/Desktop */}
      <div className="grid gap-4">
        {domains.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border/60 rounded-xl bg-card/10">
            <Globe className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white">
              No domains configured
            </h3>
            <p className="text-sm text-muted-foreground mt-2 mb-6">
              Start by adding your first domain for protection.
            </p>
            <Button onClick={() => setShowAddModal(true)} variant="outline">
              Add First Domain
            </Button>
          </div>
        ) : (
          domains.map((domain) => {
            const isExpanded = expandedDomain === domain.id;
            const isActive = domain.status === "active";
            return (
              <Card
                key={domain.id}
                className={`group border-border/40 transition-all duration-300 ${isExpanded ? "ring-1 ring-primary/40 bg-card" : "hover:border-primary/40 bg-card/50"}`}
              >
                <div
                  className="p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center gap-6 cursor-pointer"
                  onClick={() => isActive && toggleDomainExpand(domain)}
                >
                  <div className="flex items-center gap-4 min-w-[220px]">
                    <div
                      className={`p-3 rounded-xl transition-colors ${isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-yellow-500/10 text-yellow-500"}`}
                    >
                      <Globe className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-white truncate">
                        {domain.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`h-2 w-2 rounded-full ${isActive ? "bg-emerald-500" : "bg-yellow-500 animate-pulse"}`}
                        />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          {isActive ? "Active" : "Pending"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                        Nameservers
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {domain.nameservers.slice(0, 2).map((ns, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="font-mono text-[9px] px-1.5 h-5 bg-background border-border/40"
                          >
                            {ns}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                        Creation Date
                      </span>
                      <div className="flex items-center gap-2 text-sm text-foreground/80">
                        <Calendar className="h-3.5 w-3.5" />{" "}
                        {formatDate(domain.created_at)}
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex items-center justify-between sm:justify-end gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-border/20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {!isActive ? (
                      <Button
                        onClick={() => handleVerifyDomain(domain.id)}
                        size="sm"
                        className="gap-2"
                      >
                        <ShieldCheck className="h-4 w-4" /> Verify
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDomainForRecord(domain);
                            setShowAddRecordModal(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" /> Record
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-muted-foreground hover:text-white"
                          onClick={() => toggleDomainExpand(domain)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    )}
                    <div className="h-6 w-px bg-border/40 mx-1 hidden sm:block" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                      onClick={() => setDomainToDelete(domain)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* DNS RECORDS PANEL - Mobile Friendly rows */}
                {isExpanded && isActive && (
                  <div className="border-t border-border/40 bg-muted/10 p-4 sm:p-6 animate-in slide-in-from-top-2 duration-300">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-4">
                      <Server className="h-4 w-4 text-primary" /> DNS Records
                    </h4>
                    <div className="space-y-2">
                      {dnsRecords[domain.id]?.map((record) => (
                        <div
                          key={record.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-card border border-border/40 hover:border-primary/20 gap-4"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <Badge
                              variant="outline"
                              className={`w-14 justify-center font-mono text-[10px] font-bold h-6 ${getRecordTypeStyle(record.type)}`}
                            >
                              {record.type}
                            </Badge>
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-white truncate">
                                {record.name}
                              </div>
                              <div
                                className="text-[11px] text-muted-foreground font-mono truncate max-w-[200px] md:max-w-md"
                                title={record.content}
                              >
                                {record.content}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-border/10 pt-3 sm:pt-0">
                            {["A", "AAAA", "CNAME"].includes(record.type) && (
                              <div className="flex items-center gap-4">
                                <div
                                  className="flex items-center gap-2"
                                  title="SSL Protection"
                                >
                                  {record.origin_ssl ? (
                                    <Lock className="h-3.5 w-3.5 text-emerald-500" />
                                  ) : (
                                    <Unlock className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                  <Switch
                                    checked={record.origin_ssl}
                                    onCheckedChange={() =>
                                      handleToggleOriginSSL(domain.id, record)
                                    }
                                    className="scale-75 data-[state=checked]:bg-emerald-500"
                                  />
                                </div>
                                <div
                                  className="flex items-center gap-2"
                                  title="WAF Proxy"
                                >
                                  {record.proxied ? (
                                    <CloudLightning className="h-3.5 w-3.5 text-orange-500" />
                                  ) : (
                                    <Cloud className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                  <Switch
                                    checked={record.proxied}
                                    onCheckedChange={() =>
                                      handleToggleProxy(domain.id, record)
                                    }
                                    className="scale-75 data-[state=checked]:bg-orange-500"
                                  />
                                </div>
                              </div>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-rose-500"
                              onClick={() =>
                                handleDeleteRecord(domain.id, record.id)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* --- MODALS - Center on desktop, Bottom-sheet style on mobile --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
          <Card className="w-full max-w-md border-border/40 shadow-2xl animate-in slide-in-from-bottom-4 duration-300 rounded-t-xl sm:rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/20 py-4 px-6">
              <CardTitle className="text-lg">Add Domain</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAddModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <form onSubmit={handleAddDomain}>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>Domain URL</Label>
                  <Input
                    placeholder="example.com"
                    className="bg-muted/30"
                    value={newDomainName}
                    onChange={(e) => setNewDomainName(e.target.value)}
                  />
                </div>
              </CardContent>
              <div className="p-6 pt-0 flex gap-3">
                <Button type="submit" className="flex-1" disabled={isAdding}>
                  {isAdding ? "Adding..." : "Add Domain"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {showAddRecordModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
          <Card className="w-full max-w-lg border-border/40 shadow-2xl animate-in slide-in-from-bottom-4 duration-300 rounded-t-xl sm:rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/20 py-4 px-6">
              <CardTitle className="text-lg">New DNS Record</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAddRecordModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <form onSubmit={handleAddRecord}>
              <CardContent className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={newRecord.type}
                      onValueChange={(v) =>
                        setNewRecord({ ...newRecord, type: v })
                      }
                    >
                      <SelectTrigger className="bg-muted/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["A", "AAAA", "CNAME", "MX", "TXT", "NS"].map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-3 space-y-2">
                    <Label>Host Name</Label>
                    <Input
                      placeholder="@"
                      className="bg-muted/30"
                      value={newRecord.name}
                      onChange={(e) =>
                        setNewRecord({ ...newRecord, name: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Target Content</Label>
                  <Input
                    placeholder="IP or Hostname"
                    className="bg-muted/30"
                    value={newRecord.content}
                    onChange={(e) =>
                      setNewRecord({ ...newRecord, content: e.target.value })
                    }
                  />
                </div>
                {["A", "AAAA", "CNAME"].includes(newRecord.type) && (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-muted/10">
                    <div className="space-y-0.5">
                      <Label className="text-xs">Proxy Status</Label>
                      <p className="text-[10px] text-muted-foreground font-medium">
                        Protect through WAF Cloud
                      </p>
                    </div>
                    <Switch
                      checked={newRecord.proxied}
                      onCheckedChange={(c) =>
                        setNewRecord({ ...newRecord, proxied: c })
                      }
                      className="data-[state=checked]:bg-orange-500"
                    />
                  </div>
                )}
              </CardContent>
              <div className="p-6 pt-0 flex gap-3">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isAddingRecord}
                >
                  {isAddingRecord ? "Processing..." : "Create Record"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {domainToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-md border-rose-500/30 bg-card overflow-hidden animate-in zoom-in-95 duration-300">
            <div
              className={`h-1.5 w-full ${isDeleting ? "bg-rose-600 animate-pulse" : "bg-rose-500"}`}
            />
            <CardHeader className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 mb-4">
                <AlertTriangle className="h-6 w-6 text-rose-500" />
              </div>
              <CardTitle className="text-xl">
                Delete {domainToDelete.name}?
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2 px-4 italic">
                This will permanently stop all traffic and delete associated DNS
                data.
              </p>
            </CardHeader>
            <div className="p-6 pt-0 flex flex-col gap-2">
              <Button
                variant="destructive"
                className="w-full shadow-lg shadow-rose-900/40 font-bold"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
              >
                {isDeleting ? "Deleting Domain..." : "Confirm Final Deletion"}
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setDomainToDelete(null)}
                disabled={isDeleting}
              >
                Keep Domain
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
