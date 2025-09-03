"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function NavItem({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname?.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "relative group px-24 py-6 text-2xl transition-colors",
        active ? "text-[hsl(48_90%_88%)]" : "text-[hsl(48_67%_80%)] hover:text-[hsl(48_90%_88%)]"
      )}
    >
      <span className="relative z-10 inline-flex items-center gap-1">
            {label}
            {(active || true) && ( // show on hover OR active
            <Image
                  src="/icons/arrow.png"
                  alt=""
                  width={24}
                  height={24}
                  className={cn(
                  "translate-y-[-3px] transition-opacity",
                  active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}
            />
            )}
      </span>


      {/* active border */}
      {active && (
        <Image
          src="/borders/nav-border.png"
          alt=""
          fill
          className="absolute inset-0 object-fill"
        />
      )}

      {/* hover border */}
      {!active && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Image
            src="/borders/nav-border.png"
            alt=""
            fill
            className="object-fill"
          />
        </div>
      )}
    </Link>
  );
}
