"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils"; // if you have clsx/tailwind-merge; otherwise inline classes
import CurrencySelector from "@/components/site/CurrencySelector";
import SearchBar from "@/components/site/SearchBar";
import NavItem from "./NavItem";

const NAV = [
  { href: "/design", label: "Design" },
  { href: "/gallery", label: "Gallery" },
  { href: "/more", label: "More" },
  { href: "/mywork", label: "MyWork" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="w-full">
      {/* Top bar */}
      <div className="flex items-start justify-between h-32 pt-1.5 px-4 md:px-8 bg-[hsl(24_50%_96%)]">
        {/* Left: currency */}
        <CurrencySelector />

        {/* Center: logo image */}
        <Link href="/" className="inline-flex items-center pt-2">
          {/* set width/height close to your logo’s intrinsic size */}
          <Image
            src="/logo.png"
            alt="POESIS"
            width={180}
            height={42}
            priority
          />
        </Link>

        {/* Right: icons */}
        <div className="flex items-center gap-4">
          <SearchBar />
          <Link href="/account" aria-label="Account" className="p-1.5">
            <Image src="/icons/login.png" alt="" width={15} height={20} />
          </Link>
        </div>
      </div>

      {/* Nav bar */}
      <nav className="bg-[hsl(8_57%_73%)]">
        <div className="flex h-24 items-center justify-around gap-6 px-6">
          {NAV.map((item) => (
            <NavItem key={item.href} href={item.href} label={item.label} />
          ))}
        </div>
      </nav>
    </header>
  );
}
