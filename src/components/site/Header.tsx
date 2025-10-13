"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  const router = useRouter();

  // ✅ State for user + dropdown visibility
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // ✅ Load user info from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          setUser(null);
        }
      }
    }
  }, []);

  // ✅ Logout handler
  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setDropdownOpen(false);
    router.push("/login");
  };

  return (
    <header className="w-full">
      {/* Top bar */}
      <div className="flex items-start justify-between h-32 pt-1.5 px-4 md:px-8 bg-[hsl(24_50%_96%)] relative">
        {/* Left: currency */}
        <CurrencySelector />

        {/* Center: logo */}
        <Link href="/" className="inline-flex items-center pt-2">
          <Image src="/logo.png" alt="POESIS" width={180} height={42} priority />
        </Link>

        {/* Right: search + account */}
        <div className="flex items-center gap-4 relative">
          <SearchBar />

          {/* 👇 Account dropdown */}
          <div className="relative">
            {/* Account button */}
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="p-1.5 flex items-center gap-2"
            >
              <Image
                src="/icons/login.png"
                alt="Account"
                width={18}
                height={20}
                className="opacity-90 hover:opacity-100"
              />
              {user && (
                <span className="text-sm text-gray-700 font-medium">
                  {user.name}
                </span>
              )}
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-44 rounded-md bg-white shadow-lg border border-gray-200 py-2 z-50"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                {user ? (
                  <>
                    <Link
                      href="/account"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
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
