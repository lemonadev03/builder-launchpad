"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AvatarUpload } from "@/components/avatar-upload";
import { BannerUpload } from "@/components/banner-upload";
import { TagSelector } from "@/components/tag-selector";
import { useDebounce } from "@/hooks/use-debounce";
import { SOCIAL_PLATFORMS } from "@/lib/validations/profile";
import type { SocialLinks } from "@/db/schema";

interface ProfileData {
  displayName: string;
  username: string;
  bio: string | null;
  tagline: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  location: string | null;
  educationSchool: string | null;
  educationProgram: string | null;
  educationYear: string | null;
  socialLinks: SocialLinks;
  tags: { slug: string }[];
}

interface ProfileEditFormProps {
  profile: ProfileData;
}

const SOCIAL_LABELS: Record<string, string> = {
  linkedin: "LinkedIn URL",
  github: "GitHub URL",
  twitter: "Twitter / X URL",
  discord: "Discord Username",
  website: "Website URL",
  email: "Contact Email",
};

export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [tagline, setTagline] = useState(profile.tagline ?? "");
  const [location, setLocation] = useState(profile.location ?? "");
  const [educationSchool, setEducationSchool] = useState(
    profile.educationSchool ?? "",
  );
  const [educationProgram, setEducationProgram] = useState(
    profile.educationProgram ?? "",
  );
  const [educationYear, setEducationYear] = useState(
    profile.educationYear ?? "",
  );
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(
    profile.socialLinks ?? {},
  );
  const [tagSlugs, setTagSlugs] = useState<string[]>(
    profile.tags.map((t) => t.slug),
  );

  // Username availability check
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
        if (data.error) {
          setUsernameStatus("invalid");
        } else {
          setUsernameStatus(data.available ? "available" : "taken");
        }
      })
      .catch(() => setUsernameStatus("idle"));
  }, [debouncedUsername, profile.username]);

  async function handleSave() {
    if (usernameStatus === "taken" || usernameStatus === "invalid") return;

    setSaving(true);
    try {
      const res = await fetch("/api/profiles/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          username,
          bio,
          tagline,
          location,
          educationSchool,
          educationProgram,
          educationYear,
          socialLinks,
          tags: tagSlugs,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div>
        <Label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">
          Banner
        </Label>
        <BannerUpload
          currentUrl={profile.bannerUrl}
          onUploaded={() => {}}
        />
      </div>

      {/* Avatar */}
      <div>
        <Label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">
          Avatar
        </Label>
        <AvatarUpload
          currentUrl={profile.avatarUrl}
          displayName={displayName}
          onUploaded={() => {}}
        />
      </div>

      <Separator />

      {/* Display Name */}
      <div className="space-y-1.5">
        <Label htmlFor="displayName">Display Name</Label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={50}
          required
        />
        <p className="text-xs text-muted-foreground">
          {displayName.length}/50
        </p>
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
              setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
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
            {(usernameStatus === "taken" || usernameStatus === "invalid") && (
              <X className="h-4 w-4 text-destructive" />
            )}
          </span>
        </div>
        {usernameStatus === "taken" && (
          <p className="text-xs text-destructive">Username already taken</p>
        )}
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
        />
        <p className="text-xs text-muted-foreground">
          {tagline.length}/100
        </p>
      </div>

      {/* Bio */}
      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={500}
          rows={4}
          placeholder="Tell the community about yourself"
        />
        <p className="text-xs text-muted-foreground">{bio.length}/500</p>
      </div>

      <Separator />

      {/* Tags */}
      <div className="space-y-1.5">
        <Label>Tags</Label>
        <TagSelector
          selectedSlugs={tagSlugs}
          onChange={setTagSlugs}
          max={3}
        />
      </div>

      <Separator />

      {/* Location */}
      <div className="space-y-1.5">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          maxLength={100}
          placeholder="City, Country"
        />
      </div>

      {/* Education */}
      <div className="space-y-3">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          Education
        </Label>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="school" className="text-xs">
              School
            </Label>
            <Input
              id="school"
              value={educationSchool}
              onChange={(e) => setEducationSchool(e.target.value)}
              maxLength={100}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="program" className="text-xs">
              Program
            </Label>
            <Input
              id="program"
              value={educationProgram}
              onChange={(e) => setEducationProgram(e.target.value)}
              maxLength={100}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="year" className="text-xs">
              Year
            </Label>
            <Input
              id="year"
              value={educationYear}
              onChange={(e) => setEducationYear(e.target.value)}
              maxLength={10}
              placeholder="2026"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Social Links */}
      <div className="space-y-3">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          Social Links
        </Label>
        <div className="space-y-3">
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
                  setSocialLinks({ ...socialLinks, [platform]: e.target.value })
                }
                placeholder={
                  platform === "email"
                    ? "you@example.com"
                    : `https://${platform}.com/...`
                }
              />
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Save */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={
            saving ||
            !displayName.trim() ||
            usernameStatus === "taken" ||
            usernameStatus === "invalid"
          }
        >
          {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          Save changes
        </Button>
      </div>
    </div>
  );
}
