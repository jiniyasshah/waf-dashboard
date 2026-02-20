"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { login, forgotPassword } from "@/lib/api"; // Added forgotPassword here
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";
import { Shield, CheckCircle2, ArrowLeft } from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showVerifiedBanner, setShowVerifiedBanner] = useState(false);

  // [NEW] Toggle between Login and Forgot Password modes
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);

  // Check for verification success
  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      setShowVerifiedBanner(true);
      router.replace("/login");
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isForgotPasswordMode) {
        // --- FORGOT PASSWORD FLOW ---
        const result = await forgotPassword(email);
        if (result) {
          toast.success("If that email exists, a reset link has been sent.");
          setIsForgotPasswordMode(false); // Switch back to login mode
          setPassword(""); // Clear password field for safety
        }
      } else {
        // --- NORMAL LOGIN FLOW ---
        const result = await login({ email, password });
        if (result && result.user) {
          setUser(result.user);
          toast.success("Login successful!");
          router.push("/");
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="animate-fade-in border-border/50 transition-all duration-300">
      <CardHeader>
        <CardTitle>
          {isForgotPasswordMode ? "Reset Password" : "Welcome back"}
        </CardTitle>
        <CardDescription>
          {isForgotPasswordMode
            ? "Enter your email to receive a reset link"
            : "Sign in to your security dashboard"}
        </CardDescription>
      </CardHeader>

      {/* Success Banner */}
      {showVerifiedBanner && !isForgotPasswordMode && (
        <div className="mx-6 mb-2 p-3 bg-green-500/10 border border-green-500/20 rounded-md flex items-center text-green-500 text-sm animate-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 mr-2" />
          <span>Email verified! Please sign in.</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Hide password field if in forgot password mode */}
          {!isForgotPasswordMode && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordMode(true)}
                  className="text-sm font-medium text-primary hover:underline"
                  tabIndex={-1}
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading
              ? "Processing..."
              : isForgotPasswordMode
                ? "Send Reset Link"
                : "Sign in"}
          </Button>

          <div className="text-sm text-muted-foreground text-center">
            {isForgotPasswordMode ? (
              <button
                type="button"
                onClick={() => setIsForgotPasswordMode(false)}
                className="text-primary hover:underline flex items-center justify-center w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to login
              </button>
            ) : (
              <p>
                Don't have an account?{" "}
                <Link href="/register" className="text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            )}
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8 animate-fade-in">
          <Shield className="h-12 w-12 text-primary mr-3" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-cyan-300 bg-clip-text text-transparent">
            WAF Dashboard
          </h1>
        </div>

        <Suspense
          fallback={
            <div className="text-center text-muted-foreground">Loading...</div>
          }
        >
          <LoginContent />
        </Suspense>
      </div>
    </div>
  );
}
