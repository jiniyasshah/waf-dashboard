"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldAlert,
  Globe,
  FileText,
  HelpCircle,
  MessageCircle,
  Server,
  Code,
} from "lucide-react";

export default function HelpPage() {
  const faqs = [
    {
      question: "How does the ML Engine differ from Custom Rules?",
      answer:
        "Custom Rules are deterministic (If X, then Y) and are evaluated first by the Go Gateway. The ML Engine acts as a secondary, intelligent layer that analyzes payloads for structural anomalies (like zero-day obfuscated SQLi) even if they bypass known static rules.",
    },
    {
      question: "What exactly happens when a request is blocked?",
      answer:
        "When a request hits a 'Hard Block' rule or exceeds the maximum ML threat threshold, the WAF instantly drops the connection. It logs the event, serves a custom 403 Forbidden page to the client, and ensures the malicious payload never reaches your upstream server.",
    },
    {
      question: "How does the 'Add Score' action work?",
      answer:
        "Instead of immediately blocking a request, 'Add Score' increments the request's internal threat level. If a request triggers multiple minor rules and its total combined score (Rule Score + ML Engine Score) exceeds 75, the WAF classifies it as an anomaly and blocks it.",
    },
    {
      question: "What should I do about False Positives?",
      answer:
        "If legitimate traffic is being blocked, check the Traffic Logs to see which rule or ML prediction triggered the block. You can then write a Custom Rule targeting the specific IP address or Path and set it to a negative score to bypass the block.",
    },
  ];

  return (
    <div className="space-y-8 max-w-[1000px] mx-auto animate-in fade-in duration-500 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          System Documentation
        </h1>
        <p className="text-muted-foreground mt-2">
          Learn how to configure your MiniShield firewall, manage upstream
          domains, and deploy custom security rules.
        </p>
      </div>

      {/* DOMAINS GUIDE */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2 border-b border-border/50 pb-2">
          <Globe className="h-5 w-5 text-blue-500" />
          Adding & Configuring Domains
        </h2>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Domain Onboarding Process</CardTitle>
            <CardDescription>
              Follow these steps to route your website's traffic through the
              WAF.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 text-sm text-muted-foreground">
            <div className="flex gap-4">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs mt-0.5">
                1
              </div>
              <div>
                <strong className="text-foreground block mb-1">
                  Add Domain in Dashboard
                </strong>
                Navigate to the <strong>Domains</strong> tab and click{" "}
                <Badge variant="outline" className="mx-1">
                  Add Domain
                </Badge>
                . Enter your public domain name (e.g., <code>example.com</code>)
                and the internal IP address or hostname of your actual upstream
                server.
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs mt-0.5">
                2
              </div>
              <div>
                <strong className="text-foreground block mb-1">
                  Update DNS Records
                </strong>
                Log into your DNS provider. Change your domain's{" "}
                <Badge variant="secondary" className="mx-1">
                  A Record
                </Badge>{" "}
                to point to the public IP address of the MiniShield Gateway,
                rather than your actual server.
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs mt-0.5">
                3
              </div>
              <div>
                <strong className="text-foreground block mb-1">
                  Traffic Routing & Inspection
                </strong>
                Once DNS propagates, all traffic will flow through the WAF. The
                system will automatically inspect payloads via the ML engine and
                global rule sets before proxying clean traffic to your upstream
                server.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RULES GUIDE */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2 border-b border-border/50 pb-2 pt-4">
          <FileText className="h-5 w-5 text-emerald-500" />
          Creating Custom Firewall Rules
        </h2>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Rule Configuration Guide</CardTitle>
            <CardDescription>
              Build deterministic conditions to explicitly block or flag
              specific traffic patterns.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-sm text-muted-foreground">
            <p>
              Navigate to the <strong>Firewall Rules</strong> tab, select your
              target Domain from the dropdown, switch to the{" "}
              <strong>Custom Rules</strong> tab, and click{" "}
              <strong>Add Custom Rule</strong>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 bg-muted/20 p-4 rounded-lg border border-border/40">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Code className="h-4 w-4 text-primary" /> 1. Match Conditions
                </h3>
                <p className="text-xs">
                  Define what part of the HTTP request to inspect:
                </p>
                <ul className="space-y-2 list-disc list-inside ml-1 text-xs">
                  <li>
                    <strong>Field:</strong> Target the <code>Path</code>,{" "}
                    <code>Query</code>, <code>Body</code>, <code>IP</code>, or
                    Headers (like <code>User-Agent</code>).
                  </li>
                  <li>
                    <strong>Operator:</strong> Choose the matching logic:
                    <ul className="ml-5 mt-1 space-y-1">
                      <li>
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1 py-0 h-4"
                        >
                          Contains
                        </Badge>{" "}
                        Simple substring
                      </li>
                      <li>
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1 py-0 h-4"
                        >
                          Equals
                        </Badge>{" "}
                        Exact match
                      </li>
                      <li>
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1 py-0 h-4"
                        >
                          Regex
                        </Badge>{" "}
                        Advanced pattern
                      </li>
                    </ul>
                  </li>
                </ul>
              </div>

              <div className="space-y-3 bg-muted/20 p-4 rounded-lg border border-border/40">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-rose-500" /> 2. Rule
                  Actions
                </h3>
                <p className="text-xs">Decide what happens on a match:</p>
                <ul className="space-y-3 ml-1 text-xs">
                  <li className="flex flex-col gap-1">
                    <div>
                      <Badge className="bg-rose-500 hover:bg-rose-600 text-white text-[10px] px-1 py-0 h-4">
                        Hard Block
                      </Badge>
                    </div>
                    <span className="text-muted-foreground leading-relaxed">
                      Instantly drops the request and returns a 403 page.
                    </span>
                  </li>
                  <li className="flex flex-col gap-1">
                    <div>
                      <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white text-[10px] px-1 py-0 h-4">
                        Add Score
                      </Badge>
                    </div>
                    <span className="text-muted-foreground leading-relaxed">
                      Increases the threat score. Blocked if the total exceeds
                      threshold.
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg flex items-start gap-3">
              <Server className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="text-foreground block mb-0.5">
                  Tags & Status
                </strong>
                Assign tags (e.g., <code>api-abuse, high-priority</code>) to
                rules to track them in Traffic Logs. Don't forget to toggle the
                rule to <strong className="text-emerald-500">Active</strong> to
                enforce it!
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQ SECTION */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2 border-b border-border/50 pb-2 pt-4">
          <HelpCircle className="h-5 w-5 text-purple-500" />
          Frequently Asked Questions
        </h2>

        <div className="grid gap-4">
          {faqs.map((faq, index) => (
            <Card
              key={index}
              className="border-border/50 bg-card/30 shadow-none hover:bg-card/50 transition-colors"
            >
              <CardHeader className="p-4 pb-2 flex flex-row items-start gap-3">
                <MessageCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <CardTitle className="text-base leading-tight">
                  {faq.question}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 pl-12 text-sm text-muted-foreground leading-relaxed">
                {faq.answer}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
