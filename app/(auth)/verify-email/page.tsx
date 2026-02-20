"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyEmailChange } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { checkAuth } = useAuthStore();
  const [status, setStatus] = useState("Verifying your new email...");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("Invalid or missing verification token.");
      return;
    }

    const verify = async () => {
      const res = await verifyEmailChange(token);
      if (res) {
        setStatus("Email updated successfully! Redirecting...");
        toast.success("Email updated successfully!");

        // Refresh auth state so the dashboard immediately shows the new email
        await checkAuth();

        setTimeout(() => {
          router.push("/settings");
        }, 2000);
      } else {
        setStatus("Verification failed. The link may have expired.");
      }
    };

    verify();
  }, [router, searchParams, checkAuth]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="p-8 max-w-md text-center space-y-4 border rounded-lg shadow-sm bg-card">
        {status.includes("Verifying") && (
          <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
        )}
        <h1 className="text-xl font-semibold">{status}</h1>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center mt-20">
          <Loader2 className="animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
