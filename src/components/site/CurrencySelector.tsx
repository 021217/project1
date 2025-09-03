"use client";

import * as React from "react";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

type Currency = { code: "USD" | "EUR" | "GBP"; symbol: string; label: string };

const CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", label: "USD" },
  { code: "EUR", symbol: "€", label: "EUR" },
  { code: "GBP", symbol: "£", label: "GBP" },
];

export default function CurrencySelector() {
  const [curr, setCurr] = React.useState<Currency>(CURRENCIES[0]);

  // restore previous selection
  React.useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("currency") : null;
    if (saved) {
      const found = CURRENCIES.find(c => c.code === saved);
      if (found) setCurr(found);
    }
  }, []);
  // persist selection
  React.useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("currency", curr.code);
  }, [curr]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* pill button */}
        <button
          className="
            group inline-flex items-center gap-2
            rounded-full
            border-2 border-[#c97e6d]
            outline outline-4 -outline-offset-2 outline-[#e7a79b]/70
            bg-[hsl(24_50%_96%)]
            px-8 py-1.5
            text-sm tracking-wide
            hover:brightness-[1.03] transition
          "
        >
          <span className="tabular-nums">{curr.symbol}</span>
          <span className="font-medium">{curr.label}</span>
          <ChevronDown size={16} className="opacity-70 group-hover:opacity-100 transition" />
        </button>
      </DropdownMenuTrigger>

      {/* dropdown */}
      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="min-w-[8rem] rounded-md border bg-white/95 backdrop-blur px-2 py-2"
      >
        {CURRENCIES.filter(c => c.code !== curr.code).map((c) => (
          <DropdownMenuItem
            key={c.code}
            onClick={() => setCurr(c)}
            className="cursor-pointer text-base py-2 px-2"
          >
            <span className="mr-2">{c.symbol}</span>
            <span className="font-medium">{c.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
