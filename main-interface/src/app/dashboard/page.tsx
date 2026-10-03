"use client";
import { useSession } from "next-auth/react";


import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type UserRole = "attendee" | "venue_staff" | "security" | "medical";

const rolePaths: Record<UserRole, string> = {
  attendee: "/attendee",
  venue_staff: "/venue",
  security: "/security",
  medical: "/medical",
};

export default function DashboardRedirect() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchRoleAndRedirect() {
      if (status === "loading") return;

      if (!user) {
        // Not logged in, redirect to sign-in
        router.replace("/sign-in");
        return;
      }

      try {
        const res = await fetch("/api/user/role");
        if (res.ok) {
          const data = await res.json();
          const role: UserRole = data.role || "attendee";
          const targetPath = rolePaths[role] || "/attendee";
          router.replace(targetPath);
        } else {
          // If user doesn't exist in DB yet (new user), default to attendee
          router.replace("/attendee");
        }
      } catch (err) {
        console.error("Failed to fetch role:", err);
        setError("Failed to load your dashboard. Please try again.");
        // Fallback to attendee dashboard after 2 seconds
        setTimeout(() => router.replace("/attendee"), 2000);
      }
    }

    fetchRoleAndRedirect();
  }, [status, user, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      {error ? (
        <div className="text-center space-y-2">
          <p className="text-destructive">{error}</p>
          <p className="text-sm text-muted-foreground">Redirecting...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      )}
    </div>
  );
}
