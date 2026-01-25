"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getGlobalRules,
  getCustomRules,
  addCustomRule,
  toggleRule,
  getDomains,
} from "@/lib/api";
import { Rule, RuleCondition, Domain } from "@/types";
import { toast } from "sonner";
import { Plus, Shield, Layout, X, Info } from "lucide-react";

export default function RulesPage() {
  const [activeTab, setActiveTab] = useState<"global" | "custom">("global");
  const [globalRules, setGlobalRules] = useState<Rule[]>([]);
  const [customRules, setCustomRules] = useState<Rule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [isCustomField, setIsCustomField] = useState(false);

  const [newRule, setNewRule] = useState({
    name: "",
    field: "path",
    operator: "contains" as "contains" | "regex" | "equals",
    value: "",
    action: "score" as "score" | "block",
    score: 10,
    tags: "",
  });

  useEffect(() => {
    async function init() {
      const domainList = await getDomains();
      if (domainList && domainList.length > 0) {
        setDomains(domainList);
        setSelectedDomain(domainList[0].id);
      }
      setIsLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    if (selectedDomain) {
      fetchRules();
    }
  }, [selectedDomain]);

  const fetchRules = async () => {
    setIsLoading(true);
    const [global, custom] = await Promise.all([
      getGlobalRules(selectedDomain),
      getCustomRules(selectedDomain),
    ]);
    if (global) setGlobalRules(global);
    if (custom) setCustomRules(custom);
    setIsLoading(false);
  };

  const handleToggleRule = async (ruleId: string, currentEnabled: boolean) => {
    if (!selectedDomain) {
      toast.error("Please select a domain first");
      return;
    }
    const result = await toggleRule({
      id: ruleId,
      enabled: !currentEnabled,
      domain_id: selectedDomain,
    });
    if (result) {
      toast.success("Rule status updated");
      fetchRules();
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    const conditions: RuleCondition[] = [
      {
        field: newRule.field as any,
        operator: newRule.operator,
        value: newRule.value,
      },
    ];
    const tags = newRule.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const result = await addCustomRule({
      name: newRule.name,
      conditions,
      on_match: {
        score_add: newRule.action === "score" ? newRule.score : 0,
        tags,
        hard_block: newRule.action === "block",
      },
    });

    if (result) {
      toast.success("Custom rule created");
      setShowAddModal(false);
      setNewRule({
        name: "",
        field: "path",
        operator: "contains",
        value: "",
        action: "score",
        score: 10,
        tags: "",
      });
      setIsCustomField(false);
      fetchRules();
    }
  };

  const rules = activeTab === "global" ? globalRules : customRules;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-muted animate-pulse rounded" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 bg-card/50 border border-border/40 animate-pulse rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER - Responsive Stack */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Security Rules
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage WAF protection for your domains.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Select
            value={selectedDomain}
            onValueChange={setSelectedDomain}
            disabled={domains.length === 0}
          >
            <SelectTrigger className="w-full sm:w-[220px] bg-card border-border/40">
              <div className="flex items-center gap-2">
                <Layout className="h-4 w-4 text-primary" />
                <SelectValue
                  placeholder={
                    domains.length === 0 ? "No Domains" : "Select Domain"
                  }
                />
              </div>
            </SelectTrigger>
            <SelectContent>
              {domains.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {activeTab === "custom" && (
            <Button
              onClick={() => setShowAddModal(true)}
              className="shadow-lg shadow-primary/20"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Custom Rule
            </Button>
          )}
        </div>
      </div>

      {/* TABS - Scrollable on mobile */}
      <div className="flex items-center gap-1 border-b border-border/40 overflow-x-auto no-scrollbar">
        {(["global", "custom"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)} Rules
          </button>
        ))}
      </div>

      {/* ADD MODAL - Full screen on mobile */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
          <Card className="w-full max-w-2xl border-border/40 shadow-2xl animate-in slide-in-from-bottom-4 duration-300 max-h-[95vh] flex flex-col rounded-t-xl sm:rounded-xl overflow-hidden">
            <CardHeader className="border-b border-border/40 px-6 py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">
                  Create Custom Security Rule
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <form onSubmit={handleAddRule} className="overflow-y-auto flex-1">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Rule Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Block SQL Injection"
                    className="bg-muted/30"
                    value={newRule.name}
                    onChange={(e) =>
                      setNewRule({ ...newRule, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Field</Label>
                    <div className="flex gap-1">
                      {isCustomField ? (
                        <Input
                          placeholder="request.headers.X-Auth"
                          className="bg-muted/30"
                          value={newRule.field}
                          onChange={(e) =>
                            setNewRule({ ...newRule, field: e.target.value })
                          }
                          autoFocus
                        />
                      ) : (
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                          value={newRule.field}
                          onChange={(e) => {
                            if (e.target.value === "custom") {
                              setIsCustomField(true);
                              setNewRule({ ...newRule, field: "" });
                            } else {
                              setNewRule({ ...newRule, field: e.target.value });
                            }
                          }}
                        >
                          <option value="path">Path</option>
                          <option value="query">Query</option>
                          <option value="body">Body</option>
                          <option value="ip">IP Address</option>
                          <option value="request.headers.User-Agent">
                            User-Agent
                          </option>
                          <option value="request.combined">
                            Entire Request
                          </option>
                          <option value="custom">Custom Field...</option>
                        </select>
                      )}
                      {isCustomField && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setIsCustomField(false);
                            setNewRule({ ...newRule, field: "path" });
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Operator</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                      value={newRule.operator}
                      onChange={(e) =>
                        setNewRule({
                          ...newRule,
                          operator: e.target.value as any,
                        })
                      }
                    >
                      <option value="contains">Contains</option>
                      <option value="regex">Regex</option>
                      <option value="equals">Equals</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Value</Label>
                    <Input
                      placeholder="pattern..."
                      className="bg-muted/30"
                      value={newRule.value}
                      onChange={(e) =>
                        setNewRule({ ...newRule, value: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Action</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                      value={newRule.action}
                      onChange={(e) =>
                        setNewRule({
                          ...newRule,
                          action: e.target.value as any,
                        })
                      }
                    >
                      <option value="score">Add Score</option>
                      <option value="block">Hard Block</option>
                    </select>
                  </div>
                  {newRule.action === "score" && (
                    <div className="space-y-2">
                      <Label>Score (1-100)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        className="bg-muted/30"
                        value={newRule.score}
                        onChange={(e) =>
                          setNewRule({
                            ...newRule,
                            score: parseInt(e.target.value),
                          })
                        }
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Tags (comma-separated)</Label>
                  <Input
                    placeholder="sql-injection, high-priority"
                    className="bg-muted/30"
                    value={newRule.tags}
                    onChange={(e) =>
                      setNewRule({ ...newRule, tags: e.target.value })
                    }
                  />
                </div>
              </CardContent>
              <div className="p-6 border-t border-border/40 flex flex-col sm:flex-row gap-3">
                <Button type="submit" className="flex-1">
                  Create Security Rule
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* RULES LIST - Responsive Flex Card */}
      <div className="grid gap-4">
        {rules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card/30 rounded-xl border border-dashed border-border/60">
            <Shield className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground font-medium">
              {activeTab === "global"
                ? "No global rules found for this domain."
                : "No custom rules configured yet."}
            </p>
          </div>
        ) : (
          rules.map((rule) => (
            <Card
              key={rule.id}
              className="group border-border/40 bg-card/50 hover:bg-card hover:border-border/80 transition-all duration-300"
            >
              <CardContent className="p-5 md:p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-4 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Shield className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="text-lg font-bold text-white">
                        {rule.name}
                      </h3>
                      {rule.on_match.hard_block && (
                        <Badge
                          variant="destructive"
                          className="uppercase text-[10px] tracking-wider font-bold"
                        >
                          Hard Block
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold flex items-center gap-1">
                          <Info className="h-3 w-3" /> Condition
                        </span>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {rule.conditions.map((cond, i) => (
                            <code
                              key={i}
                              className="text-[11px] bg-background border border-border/40 px-2 py-1 rounded text-primary font-mono"
                            >
                              {cond.field} {cond.operator} "{cond.value}"
                            </code>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
                          Impact
                        </span>
                        <div className="flex items-center gap-3 pt-1">
                          {rule.on_match.score_add ? (
                            <span className="text-yellow-500 font-bold font-mono">
                              +{rule.on_match.score_add} Score
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">
                              None
                            </span>
                          )}

                          <div className="flex gap-1">
                            {rule.on_match.tags.map((tag, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="text-[10px] bg-muted/20 border-border/40 text-muted-foreground"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4 md:pt-1 border-t md:border-t-0 border-border/40 pt-4">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-widest ${rule.enabled ? "text-emerald-500" : "text-muted-foreground"}`}
                    >
                      {rule.enabled ? "Active" : "Disabled"}
                    </span>
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={() =>
                        handleToggleRule(rule.id, rule.enabled)
                      }
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
