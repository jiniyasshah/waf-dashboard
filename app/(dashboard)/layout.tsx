"use client";

import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Loader2, Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated } = useAuthStore();
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-medium text-muted-foreground mt-6 animate-pulse uppercase tracking-widest">
            Initializing Security Protocol...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <Sidebar />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header - Visible only on mobile */}
        <header className="flex h-16 items-center border-b border-border/40 bg-[#0a0a0a]/50 px-4 md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="p-0 w-64 bg-[#050505] border-r-border/40"
            >
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <Sidebar setOpen={setOpen} />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2 font-bold text-sm tracking-tight text-white">
            MiniShield
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
