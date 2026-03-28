"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useDebounce } from "@/hooks/use-debounce";
import { CommunityLogoUpload } from "@/components/community-logo-upload";
import { CommunityBannerUpload } from "@/components/community-banner-upload";
import { ColorPicker } from "@/components/color-picker";

interface CommunityData {
  name: string;
  slug: string;
  description: string | null;
  tagline: string | null;
  location: string | null;
  visibility: "listed" | "unlisted";
  joinPolicy: "invite_only" | "request_to_join" | "open";
  logoUrl: string | null;
  bannerUrl: string | null;
  primaryColor: string | null;
  subTierLabel: string | null;
}

interface CommunitySettingsFormProps {
  community: CommunityData;
}

const JOIN_POLICY_OPTIONS = [
  { value: "invite_only", label: "Invite Only", description: "Only invited users can join" },
  { value: "request_to_join", label: "Request to Join", description: "Users can request to join, admins approve" },
  { value: "open", label: "Open", description: "Anyone can join immediately" },
] as const;

export function CommunitySettingsForm({
  community,
}: CommunitySettingsFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(community.name);
  const [slug, setSlug] = useState(community.slug);
  const [description, setDescription] = useState(community.description ?? "");
  const [tagline, setTagline] = useState(community.tagline ?? "");
  const [location, setLocation] = useState(community.location ?? "");
  const [visibility, setVisibility] = useState(community.visibility);
  const [joinPolicy, setJoinPolicy] = useState(community.joinPolicy);
  const [primaryColor, setPrimaryColor] = useState(
    community.primaryColor ?? "",
  );
  const [subTierLabel, setSubTierLabel] = useState(
    community.subTierLabel ?? "",
  );

  // Slug availability check
  const [slugStatus, setSlugStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");
  const debouncedSlug = useDebounce(slug, 300);

  useEffect(() => {
    if (debouncedSlug === community.slug) {
      setSlugStatus("idle");
      return;
    }

    if (debouncedSlug.length < 2) {
      setSlugStatus("invalid");
      return;
    }

    setSlugStatus("checking");
    fetch(
      `/api/communities/${community.slug}/check-slug?slug=${encodeURIComponent(debouncedSlug)}`,
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setSlugStatus("invalid");
        } else {
          setSlugStatus(data.available ? "available" : "taken");
        }
      })
      .catch(() => setSlugStatus("idle"));
  }, [debouncedSlug, community.slug]);

  async function handleSave() {
    if (slugStatus === "taken" || slugStatus === "invalid") return;

    setSaving(true);
    try {
      const res = await fetch(`/api/communities/${community.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug: slug !== community.slug ? slug : undefined,
          description,
          tagline,
          location,
          visibility,
          joinPolicy,
          primaryColor: primaryColor || undefined,
          subTierLabel: subTierLabel || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      toast.success("Settings updated");

      // If slug changed, redirect to new URL
      if (slug !== community.slug) {
        router.push(`/communities/${slug}/manage/settings`);
      } else {
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* General */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          General
        </h3>

        <div className="space-y-2">
          <Label htmlFor="name">Community Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground">
            {name.length}/100
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">URL Slug</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">/communities/</span>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              maxLength={60}
              className="flex-1"
            />
            {slugStatus === "checking" && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {slugStatus === "available" && (
              <Check className="h-4 w-4 text-green-500" />
            )}
            {(slugStatus === "taken" || slugStatus === "invalid") && (
              <X className="h-4 w-4 text-destructive" />
            )}
          </div>
          {slugStatus === "taken" && (
            <p className="text-xs text-destructive">Slug already taken</p>
          )}
          {slugStatus === "invalid" && (
            <p className="text-xs text-destructive">
              Lowercase letters, numbers, and hyphens. Min 2 characters.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tagline">Tagline</Label>
          <Input
            id="tagline"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            maxLength={150}
            placeholder="A short description of your community"
          />
          <p className="text-xs text-muted-foreground">
            {tagline.length}/150
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="What is this community about?"
          />
          <p className="text-xs text-muted-foreground">
            {description.length}/2000
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            maxLength={100}
            placeholder="City, Country"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subTierLabel">Sub-tier Name</Label>
          <Input
            id="subTierLabel"
            value={subTierLabel}
            onChange={(e) => setSubTierLabel(e.target.value)}
            maxLength={30}
            placeholder="e.g. Regions, Chapters, Clubs"
          />
          <p className="text-xs text-muted-foreground">
            What sub-communities under this community are called. Default: &quot;Sub-communities&quot;
          </p>
        </div>
      </section>

      <Separator />

      {/* Visibility & Join Policy */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Access
        </h3>

        <div className="space-y-2">
          <Label>Visibility</Label>
          <div className="flex gap-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="visibility"
                value="listed"
                checked={visibility === "listed"}
                onChange={() => setVisibility("listed")}
                className="accent-primary"
              />
              <div>
                <p className="text-sm font-medium">Listed</p>
                <p className="text-xs text-muted-foreground">
                  Visible in the public directory
                </p>
              </div>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="visibility"
                value="unlisted"
                checked={visibility === "unlisted"}
                onChange={() => setVisibility("unlisted")}
                className="accent-primary"
              />
              <div>
                <p className="text-sm font-medium">Unlisted</p>
                <p className="text-xs text-muted-foreground">
                  Only accessible via link or invite
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Join Policy</Label>
          <div className="space-y-2">
            {JOIN_POLICY_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2"
              >
                <input
                  type="radio"
                  name="joinPolicy"
                  value={option.value}
                  checked={joinPolicy === option.value}
                  onChange={() => setJoinPolicy(option.value)}
                  className="accent-primary"
                />
                <div>
                  <p className="text-sm font-medium">{option.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* Branding */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Branding
        </h3>

        <div className="space-y-2">
          <Label>Logo</Label>
          <CommunityLogoUpload
            currentUrl={community.logoUrl}
            communitySlug={community.slug}
            communityName={community.name}
            onUploaded={() => router.refresh()}
          />
        </div>

        <div className="space-y-2">
          <Label>Banner</Label>
          <CommunityBannerUpload
            currentUrl={community.bannerUrl}
            communitySlug={community.slug}
            onUploaded={() => router.refresh()}
          />
        </div>

        <ColorPicker value={primaryColor} onChange={setPrimaryColor} />
      </section>

      <Separator />

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}
