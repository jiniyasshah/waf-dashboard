"use client";

import { useEffect, useState, useRef, Suspense } from "react"; // [1] Import Suspense
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

// [2] Create a Child Component for the Logic
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
          setTimeout(() => router.push("/login"), 2000);
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
    <Card className="border-border/50 text-center animate-fade-in">
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
          <>
            <CheckCircle2 className="h-16 w-16 text-green-500 animate-in zoom-in" />
            <p className="text-muted-foreground">
              Your email has been verified. You can now access your dashboard.
            </p>
            <Button onClick={() => router.push("/login")} className="w-full">
              Continue to Login
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-16 w-16 text-red-500 animate-in zoom-in" />
            <p className="text-muted-foreground">
              Invalid or expired verification link. Please try registering
              again.
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

// [3] Export the Main Page wrapped in Suspense
export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <Shield className="h-12 w-12 text-primary mr-3" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-cyan-300 bg-clip-text text-transparent">
            WAF Dashboard
          </h1>
        </div>

        {/* This boundary catches the 'useSearchParams' requirement */}
        <Suspense
          fallback={
            <Card className="border-border/50 text-center">
              <CardContent className="py-10">
                <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
              </CardContent>
            </Card>
          }
        >
          <VerifyContent />
        </Suspense>
      </div>
    </div>
  );
}
