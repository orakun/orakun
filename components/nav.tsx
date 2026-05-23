"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Gösterge" },
  { href: "/transactions", label: "İşlemler" },
  { href: "/assets", label: "Varlıklar" },
  { href: "/accounts", label: "Hesaplar" },
  { href: "/scenario", label: "Senaryo" },
  { href: "/import", label: "CSV İmport" },
];

export default function Nav() {
  const pathname = usePathname();
  if (pathname === "/login") return null;
  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4 max-w-7xl flex items-center h-14 gap-6">
        <span className="font-bold text-primary text-sm">📈 Portföy</span>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname.startsWith(l.href)
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
