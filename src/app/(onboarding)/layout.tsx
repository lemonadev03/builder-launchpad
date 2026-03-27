import Link from "next/link";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Minimal header — logo only */}
      <header className="flex h-14 items-center border-b px-6">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          Builder Launchpad
        </Link>
      </header>

      {/* Centered content */}
      <main className="flex flex-1 items-start justify-center px-4 py-12">
        <div className="w-full max-w-lg">{children}</div>
      </main>
    </div>
  );
}
