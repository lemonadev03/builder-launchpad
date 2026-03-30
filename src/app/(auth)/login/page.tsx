"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type FormState = "idle" | "loading" | "magic-link-sent";
type LoginMethod = "password" | "magic-link";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const redirectTo = inviteToken
    ? `/invite/${inviteToken}`
    : searchParams.get("redirect") ?? "/feed";
  const [formState, setFormState] = useState<FormState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("password");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFormState("loading");

    const { error } = await authClient.signIn.email({
      email,
      password,
    });

    if (error) {
      setError(error.message ?? "Invalid email or password.");
      setFormState("idle");
      return;
    }

    router.push(redirectTo);
  }

  async function sendMagicLink() {
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    setError(null);
    setFormState("loading");

    const { error } = await authClient.signIn.magicLink({
      email,
      callbackURL: redirectTo,
    });

    if (error) {
      setError(error.message ?? "Could not send magic link. Please try again.");
      setFormState("idle");
      return;
    }

    setFormState("magic-link-sent");
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    await sendMagicLink();
  }

  function handleMethodChange(method: LoginMethod) {
    setLoginMethod(method);
    setError(null);
  }

  if (formState === "magic-link-sent") {
    return (
      <Card className="border-border/70 shadow-lg shadow-primary/5">
        <CardHeader className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-primary/70">
            Magic Link Sent
          </p>
          <CardTitle className="text-xl">Check your email</CardTitle>
          <CardDescription className="mx-auto max-w-sm">
            We sent a sign-in link to <strong>{email}</strong>. Click it to log
            in. The link expires in 15 minutes.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center gap-2">
          <Button variant="ghost" onClick={() => setFormState("idle")}>
            Back
          </Button>
          <Button variant="outline" onClick={() => void sendMagicLink()}>
            Send again
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border-border/70 shadow-lg shadow-primary/5">
      <CardHeader className="gap-2 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-primary/70">
          Builder Launchpad
        </p>
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl border border-border/70 bg-muted/60 p-1">
          <button
            type="button"
            onClick={() => handleMethodChange("password")}
            aria-pressed={loginMethod === "password"}
            className={cn(
              "rounded-[calc(var(--radius)+2px)] px-3 py-2 text-sm font-medium transition",
              loginMethod === "password"
                ? "bg-background text-foreground shadow-sm ring-1 ring-border/70"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Email + password
          </button>
          <button
            type="button"
            onClick={() => handleMethodChange("magic-link")}
            aria-pressed={loginMethod === "magic-link"}
            className={cn(
              "rounded-[calc(var(--radius)+2px)] px-3 py-2 text-sm font-medium transition",
              loginMethod === "magic-link"
                ? "bg-background text-foreground shadow-sm ring-1 ring-border/70"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Magic link
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {loginMethod === "password" ? (
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={formState === "loading"}>
              {formState === "loading" ? "Logging in..." : "Log in"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleMagicLink} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="magic-email">Email</Label>
              <Input
                id="magic-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={formState === "loading"}>
              {formState === "loading" ? "Sending link..." : "Send magic link"}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href={inviteToken ? `/signup?invite=${inviteToken}` : "/signup"}
            className="text-primary hover:underline"
          >
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
