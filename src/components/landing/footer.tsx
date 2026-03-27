import Link from "next/link";

const PLATFORM_LINKS = [
  { href: "/communities", label: "Communities" },
  { href: "/directory", label: "Directory" },
  { href: "/jobs", label: "Jobs" },
];

export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <span className="text-[10px] font-bold text-primary-foreground">
                BL
              </span>
            </div>
            <span className="text-sm font-semibold tracking-tight">
              Builder Launchpad
            </span>
          </div>
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-muted-foreground">
            The discovery layer for builder communities.
          </p>
        </div>

        {/* Links */}
        <div className="flex gap-12">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Platform
            </h4>
            <ul className="mt-3 space-y-2">
              {PLATFORM_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Company
            </h4>
            <ul className="mt-3 space-y-2">
              <li>
                <span className="text-sm text-muted-foreground">
                  Built by{" "}
                  <span className="font-medium text-foreground">
                    Bscale Labs
                  </span>
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-5xl border-t border-border pt-6">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Builder Launchpad
        </p>
      </div>
    </footer>
  );
}
