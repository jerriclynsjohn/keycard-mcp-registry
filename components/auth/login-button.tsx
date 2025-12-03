"use client";

import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";

export function LoginButton() {
  const handleLogin = () => {
    window.location.href = "/api/auth/sign-in/github";
  };

  return (
    <Button onClick={handleLogin} variant="outline">
      <Github className="mr-2 h-4 w-4" />
      Sign in with GitHub
    </Button>
  );
}