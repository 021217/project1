"use client";

import React from "react";
import { ASTROLOGY_SIGNS } from "../app/config/data/filters";

type Props = {
  open: boolean;
  selected?: string | null;
  onSelect?: (id: string) => void;
  onClose?: () => void;
};

export default function AstrologyDropdown({ open, selected, onSelect, onClose }: Props) {
  return (
    <div
      className={`w-full border-t border-[#EB9385]/60 bg-[#F7EEE7]/70 transition-all duration-300 overflow-hidden
      ${open ? "max-h-[340px]" : "max-h-0"}`}
      aria-hidden={!open}
    >
      <div className="mx-auto max-w-[980px] px-4 py-4 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 z-20 right-2  cursor-pointer"
          aria-label="Close Astrology"
        >
          <img src="/icons/cross.png" alt="" className="h-5 w-5" />
        </button>

        {/* astrology list */}
        <div className="flex overflow-x-auto gap-2 pb-3">
          {ASTROLOGY_SIGNS.map((item) => {
            const active = selected === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelect?.(item.id)}
                className="relative shrink-0 w-20 h-60 rounded overflow-hidden group focus:outline-none cursor-pointer"
              >
                {/* background */}
                <img
                  src={item.bg}
                  alt={item.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />

                {/* dark overlay */}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition" />

                {/* astrology icon */}
                <img
                  src={item.icon}
                  alt={item.name}
                  className="relative mx-auto mt-20 h-8 w-8 text-white z-10"
                />

                {/* on-hover vertical bar */}
                <div
                  className={`absolute left-1/4 top-0 h-full w-10 bg-[#EB9385] opacity-0 group-hover:opacity-100 transition-all z-0`}
                />

                {/* highlight if selected */}
                {active && (
                  <div className="absolute inset-0 ring-2 ring-[#EB9385] pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
