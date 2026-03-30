"use client";

import { Suspense, useState, useEffect } from "react";
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

type FormState = "idle" | "loading" | "magic-link-sent";
type SignupMethod = "password" | "magic-link";

interface InviteContext {
  communityName: string;
  communityLogoUrl: string | null;
  communitySlug: string;
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const [formState, setFormState] = useState<FormState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [signupMethod, setSignupMethod] = useState<SignupMethod>("password");
  const [inviteContext, setInviteContext] = useState<InviteContext | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Fetch invite context if invite token present
  useEffect(() => {
    if (!inviteToken) return;
    fetch(`/api/invites/${inviteToken}/info`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setInviteContext(data);
      })
      .catch(() => {});
  }, [inviteToken]);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFormState("loading");

    const { error } = await authClient.signUp.email({
      name,
      email,
      password,
    });

    if (error) {
      setError(error.message ?? "Something went wrong. Please try again.");
      setFormState("idle");
      return;
    }

    router.push(inviteToken ? `/invite/${inviteToken}` : "/");
  }

  async function handleMagicLink() {
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    setError(null);
    setFormState("loading");

    const { error } = await authClient.signIn.magicLink({
      email,
      callbackURL: inviteToken ? `/invite/${inviteToken}` : "/",
    });

    if (error) {
      setError(error.message ?? "Could not send magic link. Please try again.");
      setFormState("idle");
      return;
    }

    setFormState("magic-link-sent");
  }

  function handleMethodChange(method: SignupMethod) {
    setSignupMethod(method);
    setError(null);
  }

  if (formState === "magic-link-sent") {
    return (
      <Card className="border-border/70 shadow-lg shadow-primary/5">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Check your email</CardTitle>
          <CardDescription>
            We sent a sign-in link to <strong>{email}</strong>. Click it to
            create your account. The link expires in 15 minutes.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button variant="ghost" onClick={() => setFormState("idle")}>
            Back to signup
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border-border/70 shadow-lg shadow-primary/5">
      <CardHeader className="gap-2 text-center">
        {inviteContext ? (
          <>
            <div className="mx-auto mb-3">
              <Avatar className="h-12 w-12">
                {inviteContext.communityLogoUrl ? (
                  <AvatarImage
                    src={inviteContext.communityLogoUrl}
                    alt={inviteContext.communityName}
                  />
                ) : null}
                <AvatarFallback>
                  {inviteContext.communityName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-xl">
              Join {inviteContext.communityName}
            </CardTitle>
          </>
        ) : (
          <>
            <CardTitle className="text-xl">Create your account</CardTitle>
          </>
        )}
        <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl border border-border/70 bg-muted/60 p-1">
          <button
            type="button"
            onClick={() => handleMethodChange("password")}
            aria-pressed={signupMethod === "password"}
            className={cn(
              "rounded-[calc(var(--radius)+2px)] px-3 py-2 text-sm font-medium transition",
              signupMethod === "password"
                ? "bg-background text-foreground shadow-sm ring-1 ring-border/70"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Email + password
          </button>
          <button
            type="button"
            onClick={() => handleMethodChange("magic-link")}
            aria-pressed={signupMethod === "magic-link"}
            className={cn(
              "rounded-[calc(var(--radius)+2px)] px-3 py-2 text-sm font-medium transition",
              signupMethod === "magic-link"
                ? "bg-background text-foreground shadow-sm ring-1 ring-border/70"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Magic link
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {signupMethod === "password" ? (
          <form onSubmit={handleSignup} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
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
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={formState === "loading"}>
              {formState === "loading" ? "Creating account..." : "Create account"}
            </Button>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleMagicLink();
            }}
            className="grid gap-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="magic-signup-email">Email</Label>
              <Input
                id="magic-signup-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={formState === "loading"}>
              {formState === "loading" ? "Sending link..." : "Sign up with magic link"}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href={inviteToken ? `/login?invite=${inviteToken}` : "/login"}
            className="text-primary hover:underline"
          >
            Log in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
