"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    authClient.signOut().then(() => {
      router.push("/login");
    });
  }, [router]);

  return (
    <div className="text-center text-sm text-muted-foreground">
      Signing out...
    </div>
  );
}
