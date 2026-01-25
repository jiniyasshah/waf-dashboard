"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyEmail } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Shield } from "lucide-react";
import { toast } from "sonner";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  // [NEW] Add countdown state
  const [countdown, setCountdown] = useState(5);
  const processedToken = useRef<string | null>(null);

  // 1. Verify Logic
  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    if (processedToken.current === token) return;
    processedToken.current = token;

    const verify = async () => {
      try {
        const result = await verifyEmail(token);
        if (result) {
          setStatus("success");
          toast.success("Email verified successfully!");
        } else {
          setStatus("error");
        }
      } catch (error) {
        console.error(error);
        setStatus("error");
      }
    };

    verify();
  }, [token]);

  // 2. Countdown Logic (Runs only when status is success)
  useEffect(() => {
    if (status === "success") {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push("/login?verified=true");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Cleanup timer if user leaves page
      return () => clearInterval(timer);
    }
  }, [status, router]);

  return (
    <Card className="border-border/50 text-center animate-fade-in shadow-lg w-full max-w-md">
      <CardHeader>
        <CardTitle>Account Verification</CardTitle>
        <CardDescription>
          {status === "loading" && "Verifying your email address..."}
          {status === "success" && "Verification Complete"}
          {status === "error" && "Verification Failed"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-6 py-6">
        {status === "loading" && (
          <Loader2 className="h-16 w-16 text-primary animate-spin" />
        )}

        {status === "success" && (
          <div className="flex flex-col items-center space-y-4">
            <CheckCircle2 className="h-20 w-20 text-green-500 animate-in zoom-in duration-300" />
            <div className="space-y-1">
              <p className="text-lg font-medium">Verified!</p>
              {/* [NEW] Visible Countdown */}
              <p className="text-muted-foreground text-sm">
                Redirecting to login in{" "}
                <span className="font-bold text-foreground">{countdown}</span>{" "}
                seconds...
              </p>
            </div>

            {/* Manual Button in case they don't want to wait */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push("/login?verified=true")}
            >
              Go to Login Now
            </Button>
          </div>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-16 w-16 text-red-500 animate-in zoom-in" />
            <p className="text-muted-foreground">
              Invalid or expired verification link.
            </p>
            <Button
              variant="outline"
              onClick={() => router.push("/login")}
              className="w-full"
            >
              Back to Login
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md flex flex-col items-center">
        <div className="flex items-center justify-center mb-8">
          <Shield className="h-12 w-12 text-primary mr-3" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-cyan-300 bg-clip-text text-transparent">
            WAF Dashboard
          </h1>
        </div>

        <Suspense
          fallback={<div className="text-muted-foreground">Loading...</div>}
        >
          <VerifyContent />
        </Suspense>
      </div>
    </div>
  );
}
