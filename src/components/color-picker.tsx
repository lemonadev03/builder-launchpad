"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const isValid = /^#[0-9a-fA-F]{6}$/.test(value);

  return (
    <div className="space-y-2">
      <Label>Primary Color</Label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="h-10 w-10 shrink-0 rounded-md border"
          style={{ backgroundColor: isValid ? value : "#1a1a6e" }}
          onClick={() => {
            const input = document.createElement("input");
            input.type = "color";
            input.value = isValid ? value : "#1a1a6e";
            input.addEventListener("input", (e) => {
              onChange((e.target as HTMLInputElement).value);
            });
            input.click();
          }}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#1a1a6e"
          maxLength={7}
          className="font-mono"
        />
      </div>
      {value && !isValid && (
        <p className="text-xs text-destructive">
          Enter a valid hex color (e.g. #1a2b3c)
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Accent color for your community pages. Leave empty for platform default.
      </p>
    </div>
  );
}
