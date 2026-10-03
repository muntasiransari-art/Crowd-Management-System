"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Forgot Password?</h1>
      <p className="text-sm text-muted-foreground">
        Please contact your administrator to reset your password.
      </p>
      <div className="text-center">
        <Button asChild variant="outline">
          <Link href="/sign-in">Back to Sign In</Link>
        </Button>
      </div>
    </div>
  );
}
