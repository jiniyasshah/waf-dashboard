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
  const processedToken = useRef<string | null>(null);

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

          // [UX IMPROVEMENT] Wait 3 seconds so user sees the Green Checkmark
          setTimeout(() => {
            // Redirect with the flag so Login page knows to show a success banner
            router.push("/login?verified=true");
          }, 3000);
        } else {
          setStatus("error");
        }
      } catch (error) {
        console.error(error);
        setStatus("error");
      }
    };

    verify();
  }, [token, router]);

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
            <p className="text-muted-foreground">Redirecting to login...</p>
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
