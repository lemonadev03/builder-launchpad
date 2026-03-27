"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AvatarUpload } from "@/components/avatar-upload";
import { useDebounce } from "@/hooks/use-debounce";
import { SOCIAL_PLATFORMS } from "@/lib/validations/profile";

interface ProfileData {
  displayName: string;
  username: string;
  avatarUrl: string | null;
}

interface OnboardingWizardProps {
  profile: ProfileData;
}

const SOCIAL_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  github: "GitHub",
  twitter: "Twitter / X",
  discord: "Discord",
  website: "Website",
  email: "Email",
};

export function OnboardingWizard({ profile }: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1 fields
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [username, setUsername] = useState(profile.username);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);

  // Step 2 fields
  const [bio, setBio] = useState("");
  const [tagline, setTagline] = useState("");
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});

  // Username check
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");
  const debouncedUsername = useDebounce(username, 300);

  useEffect(() => {
    if (debouncedUsername === profile.username) {
      setUsernameStatus("idle");
      return;
    }
    if (debouncedUsername.length < 3) {
      setUsernameStatus("invalid");
      return;
    }
    setUsernameStatus("checking");
    fetch(
      `/api/profiles/check-username?username=${encodeURIComponent(debouncedUsername)}`,
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setUsernameStatus("invalid");
        else setUsernameStatus(data.available ? "available" : "taken");
      })
      .catch(() => setUsernameStatus("idle"));
  }, [debouncedUsername, profile.username]);

  async function saveAndContinue(complete: boolean) {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};

      if (step === 1) {
        body.displayName = displayName;
        body.username = username;
      }

      if (step === 2 || complete) {
        if (bio) body.bio = bio;
        if (tagline) body.tagline = tagline;

        const filteredLinks: Record<string, string> = {};
        for (const [k, v] of Object.entries(socialLinks)) {
          if (v.trim()) filteredLinks[k] = v.trim();
        }
        if (Object.keys(filteredLinks).length > 0) {
          body.socialLinks = filteredLinks;
        }
      }

      const res = await fetch("/api/profiles/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Save failed");
      }

      if (complete) {
        // Mark onboarding complete
        await fetch("/api/profiles/me", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ onboardingCompletedAt: true }),
        });
        router.push("/feed");
      } else if (step === 1) {
        setStep(2);
      }
    } catch {
      // Silently continue — the user can retry
    } finally {
      setSaving(false);
    }
  }

  async function skip() {
    if (step === 1) {
      setStep(2);
    } else {
      setSaving(true);
      // Mark onboarding complete even when skipping
      await fetch("/api/profiles/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingCompletedAt: true }),
      }).catch(() => {});
      router.push("/feed");
    }
  }

  return (
    <div>
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <div
            className={`h-1.5 flex-1 rounded-full ${
              step >= 1 ? "bg-primary" : "bg-muted"
            }`}
          />
          <div
            className={`h-1.5 flex-1 rounded-full ${
              step >= 2 ? "bg-primary" : "bg-muted"
            }`}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Step {step} of 2
        </p>
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Set up your profile</h2>
            <p className="text-sm text-muted-foreground">
              Your name and handle are how the community sees you.
            </p>
          </div>

          {/* Avatar */}
          <div className="flex justify-center">
            <AvatarUpload
              currentUrl={avatarUrl}
              displayName={displayName}
              onUploaded={setAvatarUrl}
              size="lg"
            />
          </div>

          {/* Display Name */}
          <div className="space-y-1.5">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              autoFocus
            />
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                @
              </span>
              <Input
                id="username"
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                  )
                }
                maxLength={30}
                className="pl-7"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameStatus === "checking" && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {usernameStatus === "available" && (
                  <Check className="h-4 w-4 text-green-500" />
                )}
                {(usernameStatus === "taken" ||
                  usernameStatus === "invalid") && (
                  <X className="h-4 w-4 text-destructive" />
                )}
              </span>
            </div>
            {usernameStatus === "taken" && (
              <p className="text-xs text-destructive">
                Username already taken
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-2">
            <Button type="button" variant="ghost" onClick={skip}>
              Skip
            </Button>
            <Button
              onClick={() => saveAndContinue(false)}
              disabled={
                saving ||
                !displayName.trim() ||
                usernameStatus === "taken" ||
                usernameStatus === "invalid"
              }
            >
              {saving && (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              )}
              Next
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Tell us about yourself</h2>
            <p className="text-sm text-muted-foreground">
              Add a bio and connect your socials. LinkedIn helps others find you.
            </p>
          </div>

          {/* Tagline */}
          <div className="space-y-1.5">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              maxLength={100}
              placeholder="A playful one-liner about you"
              autoFocus
            />
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="What are you building?"
            />
            <p className="text-xs text-muted-foreground">{bio.length}/500</p>
          </div>

          {/* Social Links — LinkedIn first and prominent */}
          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Social Links
            </Label>
            {SOCIAL_PLATFORMS.map((platform) => (
              <div key={platform} className="space-y-1">
                <Label htmlFor={`social-${platform}`} className="text-xs">
                  {SOCIAL_LABELS[platform]}
                </Label>
                <Input
                  id={`social-${platform}`}
                  type={platform === "email" ? "email" : "url"}
                  value={socialLinks[platform] ?? ""}
                  onChange={(e) =>
                    setSocialLinks({
                      ...socialLinks,
                      [platform]: e.target.value,
                    })
                  }
                  placeholder={
                    platform === "email"
                      ? "you@example.com"
                      : `https://${platform === "linkedin" ? "linkedin.com/in/" : `${platform}.com/`}...`
                  }
                />
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-2">
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button type="button" variant="ghost" onClick={skip}>
                Skip
              </Button>
            </div>
            <Button
              onClick={() => saveAndContinue(true)}
              disabled={saving}
            >
              {saving && (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              )}
              Complete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
