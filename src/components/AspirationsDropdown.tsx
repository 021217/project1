"use client";

import React from "react";

export type AspirationsDropdownProps = {
  /** open/close the panel (it will slide down under the header) */
  open: boolean;
  /** currently selected labels (controlled by parent) */
  selected: Set<string>;
  /** called when user toggles a chip */
  onToggle: (label: string) => void;
  /** close the panel (X or APPLY) */
  onClose: () => void;
  /** optional: RESET all */
  onReset?: () => void;
  /** optional: called on APPLY */
  onApply?: () => void;
  /** list of chips to render */
  options?: readonly string[];
};

/** default options if none passed in */
export const DEFAULT_ASPIRATIONS = [
  "Health",
  "Study",
  "Career",
  "Wisdom",
  "Inner Peace",
  "Growth",
  "Creativity",
  "Relationship",
  "Protection",
  "Luck",
] as const;

export default function AspirationsDropdown({
  open,
  selected,
  onToggle,
  onClose,
  onReset,
  onApply,
  options = DEFAULT_ASPIRATIONS,
}: AspirationsDropdownProps) {
  return (
    <div
      className={`w-full border-t border-[#EB9385]/60 bg-[#F7EEE7]/70 transition-all duration-300 overflow-hidden
      ${open ? "max-h-[320px]" : "max-h-0"}`}
      aria-hidden={!open}
    >
      <div className="mx-auto max-w-[980px] px-4 pt-3 pb-4">
        {/* Close (X) */}
        <div className="mb-2 flex items-center justify-end">
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-stone-100 cursor-pointer"
            aria-label="Close Aspirations"
          >
            <img src="/icons/cross.png" alt="" className="h-5 w-5" />
          </button>
        </div>

        {/* Chip grid */}
        <div className="flex flex-wrap gap-3">
          {options.map((label) => {
            const active = selected.has(label);
            return (
              <button
                key={label}
                onClick={() => onToggle(label)}
                className={
                  "rounded-full px-5 py-2 text-sm font-medium shadow-sm transition " +
                  (active
                    ? "bg-[#EB9385] text-white"
                    : "bg-white text-stone-900 hover:bg-white/90")
                }
                aria-pressed={active}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
