"use client";

import { authClient } from "@/lib/client/auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const handleLogout = async () => {
    await authClient.signOut();
  };

  return (
    <Button onClick={handleLogout} variant="outline">
      <LogOut className="mr-2 h-4 w-4" />
      Sign out
    </Button>
  );
}