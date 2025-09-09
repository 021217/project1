"use client";

import React, { useMemo, useState } from "react";
import {
      ChevronDown,
      RotateCcw,
      Eye,
      EyeOff,
      Trash2,
      Sparkles,
      ChevronRight,
      BadgeDollarSign,
} from "lucide-react";
import * as Slider from "@radix-ui/react-slider";
import FilterDropdown from "./filterDrawer";
import AspirationsDropdown, { DEFAULT_ASPIRATIONS } from "@/components/AspirationsDropdown";
import AstrologyDropdown from "@/components/AstrologyDropdown";

/* ────────────────────────────────────────────────────────────────────────────
   SECTION: Types (keep these if parent needs to hook into events)
   ──────────────────────────────────────────────────────────────────────────── */
export type PriceRange = [number, number];

export type HeaderAction =
      | { type: "open_filters" }
      | { type: "open_aspirations" }
      | { type: "open_astrology" }
      | { type: "reset" }
      | { type: "price"; value: PriceRange };

export type FooterAction =
      | { type: "toggle_preview"; value: boolean }
      | { type: "open_bin" }
      | { type: "open_antique_collection" }
      | { type: "open_inspirations" };

/* ────────────────────────────────────────────────────────────────────────────
   SECTION: Sample data (placeholder beads)
   - Replace this with your real list later (from Materials tab / backend).
   ──────────────────────────────────────────────────────────────────────────── */
type Bead = {
      id: string;
      name: string;
      material: string;
      sizeMM: number; // 8, 10, 12 etc
      price: number; // RM
      colorHex: string; // visual tint for the placeholder circle
};

// TODO: Replace with live data once your backend/Materials sheet is wired.
const sampleBeads: Bead[] = [
      { id: "b1", name: "Jade Round", material: "Jade", sizeMM: 10, price: 38, colorHex: "#7bb77a" },
      { id: "b2", name: "Rose Quartz", material: "Quartz", sizeMM: 12, price: 45, colorHex: "#f4b6c2" },
      { id: "b3", name: "Obsidian", material: "Obsidian", sizeMM: 8, price: 22, colorHex: "#222" },
      { id: "b4", name: "Tiger's Eye", material: "Quartz", sizeMM: 10, price: 32, colorHex: "#a46a2b" },
      { id: "b5", name: "Amethyst", material: "Quartz", sizeMM: 10, price: 40, colorHex: "#8a6bbf" },
      { id: "b6", name: "White Agate", material: "Agate", sizeMM: 12, price: 36, colorHex: "#eaeaea" },
      { id: "b7", name: "Amber", material: "Amber", sizeMM: 8, price: 28, colorHex: "#f2a65a" },
      { id: "b8", name: "Pearl (Cultured)", material: "Pearl", sizeMM: 9, price: 55, colorHex: "#f5f5f7" },
];


/* ────────────────────────────────────────────────────────────────────────────
   SECTION: BeadsGrid (just the visual list of beads)
   - Keep simple/stubbed for now; we’ll wire filters in the next step.
   ──────────────────────────────────────────────────────────────────────────── */
function BeadsGrid() {
      return (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {sampleBeads.map((b) => (
                        <button
                              key={b.id}
                              className="group flex flex-col items-center gap-2 rounded-2xl border border-stone-200/80 bg-white/80 p-4 text-left shadow-sm transition-all hover:shadow"
                              title={`${b.name} • ${b.sizeMM}mm • RM${b.price}`}
                        >
                              {/* circular color placeholder */}
                              <span
                                    className="relative block size-20 rounded-full border border-stone-300/70 shadow-inner"
                                    style={{ background: b.colorHex }}
                                    aria-hidden
                              >
                                    <span className="absolute inset-0 rounded-full bg-white/10" />
                              </span>

                              <div className="w-full">
                                    <div className="line-clamp-1 text-sm font-medium text-stone-800">{b.name}</div>
                                    <div className="mt-0.5 flex items-center justify-between text-xs text-stone-600">
                                          <span>{b.sizeMM}mm</span>
                                          <span className="font-medium">RM{b.price}</span>
                                    </div>
                              </div>
                        </button>
                  ))}
            </div>
      );
}

/* ────────────────────────────────────────────────────────────────────────────
   SECTION: Component props
   - You can pass handlers from the parent page to react to header/footer clicks.
   ──────────────────────────────────────────────────────────────────────────── */
interface Props {
      className?: string;
      /** Currency symbol for price range display (default: RM) */
      currency?: string;
      /** Absolute slider bounds (min/max) */
      priceBounds?: PriceRange;
      /** Initial selected price range */
      initialPrice?: PriceRange;
      /** Emit header interactions to parent (open menus, reset, price change) */
      onHeader?: (action: HeaderAction) => void;
      /** Emit footer interactions to parent (bin, preview toggle, etc.) */
      onFooter?: (action: FooterAction) => void;
}

/* ────────────────────────────────────────────────────────────────────────────
   SECTION: RightOptionsPanel
   - This is the right-side (filters & listing) shell with sticky header/footer.
   ──────────────────────────────────────────────────────────────────────────── */
export default function RightOptionsPanel({
      className = "",
      currency = "RM",
      priceBounds = [0, 2000],
      initialPrice = [80, 680],
      onHeader,
      onFooter,
}: Props) {
      // state for price range & eye-toggle
      const [range, setRange] = useState<PriceRange>(initialPrice);
      const [previewOn, setPreviewOn] = useState(true);
      const [filtersOpen, setFiltersOpen] = useState(false);
      const [activeTab, setActiveTab] = useState("MATERIAL");
      const [aspirationsOpen, setAspirationsOpen] = useState(false);
      const [selectedAsp, setSelectedAsp] = useState<Set<string>>(new Set());
      const [astroOpen, setAstroOpen] = useState(false);
      const [selectedAstro, setSelectedAstro] = useState<string | null>(null);

      // helper to toggle a pill
      function toggleAsp(label: string) {
            setSelectedAsp(prev => {
                  const next = new Set(prev);
                  next.has(label) ? next.delete(label) : next.add(label);
                  return next;
            });
      }
      function resetAsp() { setSelectedAsp(new Set()); }

      const prettyRange = useMemo(
            () => `${currency}${range[0]} – ${currency}${range[1]}`,
            [range, currency]
      );

      function handlePriceCommit(next: PriceRange) {
            onHeader?.({ type: "price", value: next });
      }

      function resetAll() {
            setRange(initialPrice);
            onHeader?.({ type: "reset" });
      }

      // style helpers
      const chipBase =
            "inline-flex items-center justify-between w-40 rounded-full border px-3  text-lg transition-all select-none cursor-pointer hover:scale-[1.02]";
      const chipTone =
            "border-rose-200/80 bg-[#F7EEE7] text-dark hover:bg-rose-100 active:scale-[0.98]";
      const chipGhost =
            "border-transparent bg-transparent text-stone-700 hover:bg-stone-100/70";

      return (
            <aside
                  className={
                        "flex h-full min-h-[640px] w-full flex-col bg-stone-50/70 " +
                        "backdrop-blur supports-[backdrop-filter]:bg-stone-50/60 " +
                        "border-[2px] border-[#EB9385] " + // ⬅ added here
                        className
                  }
                  aria-label="Configurator – Options"
            >
                  {/* ───────────────── HEADER (sticky) ───────────────── */}
                  <div className="sticky top-0 z-10 border-[2px] border-[#EB9385] bg-[#EB9385] backdrop-blur-sm">
                        <div className="mx-auto flex max-w-[980px] items-center gap-5 px-4 py-3">
                              {/* Filters button */}
                              <button
                                    className={`${chipBase} ${chipTone}`}
                                    onClick={() =>{ setFiltersOpen((v) => !v);
                                          setAspirationsOpen(false);
                                          setAstroOpen(false);
                                    }
                                    }
                              >
                                    <span className="flex-1 text-center font-medium">Filters</span>
                                    <img src="/icons/filter.svg" alt="filter" className="h-4 w-4 object-contain" />
                              </button>

                              {/* Aspirations */}
                              <button
                                    className={`${chipBase} ${chipTone}`}
                                    onClick={() => {
                                          setAspirationsOpen(v => !v);
                                          // optional: close other dropdowns
                                          setFiltersOpen(false);
                                          setAstroOpen(false);
                                    }}
                                    aria-label="Open Aspirations"
                                    title="Aspirations"
                              >
                                    <span className="flex-1 text-center font-medium">Aspirations</span>
                                    <img
                                          src="/icons/eject.svg"
                                          alt=""
                                          className={`h-3 w-3 transition-transform ${aspirationsOpen ? "rotate-180" : ""}`}
                                    />
                              </button>

                              {/* Astrology */}
                              <button
                                    className={`${chipBase} ${chipTone}`}
                                    onClick={() => {
                                    setAstroOpen((v) => !v);
                                    setFiltersOpen(false);
                                    setAspirationsOpen(false);
                                    }}
                                    >
                                    <span className="flex-1 text-center font-medium">Astrology</span>
                                    <img src="/icons/eject.svg" alt="" className={`h-4 w-4 transition-transform ${astroOpen ? "rotate-180" : ""}`} />
                              </button>

                              {/* small dot divider */}
                              {/* <span className="mx-1 inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-stone-300/90" /> */}

                              {/* Price Range slider (dual thumb) */}
                              {/* <div className="ml-1 hidden min-w-[220px] flex-1 items-center gap-2 sm:flex">
            <BadgeDollarSign size={18} className="text-stone-500" />
            <div className="flex w-full max-w-[360px] flex-col">
              <Slider.Root
                className="relative flex h-5 w-full touch-none select-none items-center"
                min={priceBounds[0]}
                max={priceBounds[1]}
                step={10}
                value={range}
                onValueChange={(v) => setRange([v[0], v[1]] as PriceRange)}
                onValueCommit={(v) => handlePriceCommit([v[0], v[1]] as PriceRange)}
                aria-label="Price Range"
              >
                <Slider.Track className="relative h-1.5 w-full grow rounded-full bg-stone-200">
                  <Slider.Range className="absolute h-1.5 rounded-full bg-rose-300" />
                </Slider.Track>
                <Slider.Thumb
                  className="block size-4 rounded-full border border-rose-300 bg-white shadow-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-rose-300"
                  aria-label="Min price"
                />
                <Slider.Thumb
                  className="block size-4 rounded-full border border-rose-300 bg-white shadow-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-rose-300"
                  aria-label="Max price"
                />
              </Slider.Root>
              <div className="mt-1 text-xs text-stone-600">{prettyRange}</div>
            </div>
          </div> */}

                              {/* spacer */}
                              {/* <div className="flex-1" /> */}

                              {/* RESET */}
                              <div className="flex-1 flex justify-center">
                                    <button
                                          className=""
                                          onClick={resetAll}
                                          aria-label="Reset filters"
                                          title="Reset"
                                    >
                                          <span className="text-xl text-[#F7EEE7] underline cursor-pointer">RESET</span>
                                    </button>
                              </div>
                        </div>
                  </div>
                  {/* DROPDOWN: Filters (100% width under header) */}
                  <FilterDropdown
                        filtersOpen={filtersOpen}
                  />
                  <AspirationsDropdown
                        open={aspirationsOpen}
                        selected={selectedAsp}
                        onToggle={toggleAsp}
                        onClose={() => setAspirationsOpen(false)}
                        onReset={resetAsp}
                        onApply={() => {
                              // TODO: send selections to parent/backend if needed
                              // onHeader?.({ type: "aspirations_changed", value: Array.from(selectedAsp) });
                        }}
                  // options={yourCustomList} // optional: pass your own list
                  />
                  <AstrologyDropdown
                  open={astroOpen}
                  selected={selectedAstro}
                  onSelect={(id) => setSelectedAstro(id)}
                  onClose={() => setAstroOpen(false)}
                  />
                  <div className="flex justify-center">
                        <img src="/icons/divider1.png" alt="divider1" className="my-3" />
                  </div>


                  {/* ───────────────── CONTENT (scrollable) ───────────── */}
                  <div className="flex-1 overflow-auto p-6">
                        <div className="mx-auto max-w-[980px] space-y-4">
                              {/* active filter chips preview (stub) */}
                              <div className="flex flex-wrap gap-2 text-xs text-stone-600">
                                    {/* TODO: Replace with real active filter pills from state */}
                                    {/* <span className="rounded-full bg-stone-100 px-2 py-1">All Materials</span>
            <span className="rounded-full bg-stone-100 px-2 py-1">Any Shape</span>
            <span className="rounded-full bg-stone-100 px-2 py-1">Any Function</span>
            <span className="rounded-full bg-stone-100 px-2 py-1">Any Color</span> */}
                              </div>

                              {/* Beads grid (8 placeholders) */}
                              <BeadsGrid />
                        </div>
                  </div>

                  {/* ───────────── FOOTER (sticky) ───────────── */}
                  <div className="sticky bottom-0 z-10 bg-stone-50/80 backdrop-blur-sm">
                        {/* divider image on top */}
                        <div className="mx-auto max-w-[980px] px-4 pt-2">
                              <img
                                    src="/icons/divider2.png"
                                    alt=""
                                    className="mx-auto h-3 w-auto select-none"
                              />
                        </div>

                        <div className="mx-auto max-w-[980px] px-4 py-3">
                              <div className="flex items-center justify-between gap-6">
                                    {/* LEFT: Bin + Eye (grouped) */}
                                    <div className="flex items-center gap-1">
                                          {/* Bin icon (clickable) */}
                                          <button
                                                onClick={() => onFooter?.({ type: "open_bin" })}
                                                className="inline-flex items-center justify-center rounded-full p-2 hover:bg-stone-100 active:scale-[0.98] cursor-pointer"
                                                aria-label="Open Bin"
                                                title="Bin"
                                          >
                                                {/* replace with your provided icon later */}
                                                <img src="/icons/delete.svg" alt="" className="h-5 w-5" />
                                          </button>

                                          {/* Eye toggle (clickable) */}
                                          <button
                                                onClick={() => {
                                                      const next = !previewOn;
                                                      setPreviewOn(next);
                                                      onFooter?.({ type: "toggle_preview", value: next });
                                                }}
                                                className="inline-flex items-center justify-center rounded-full p-2 hover:bg-stone-100 active:scale-[0.98] cursor-pointer"
                                                aria-label={previewOn ? "Hide preview" : "Show preview"}
                                                title="Toggle preview"
                                          >
                                                {/* swap the src when you give me the icons */}
                                                <img
                                                      src={previewOn ? "/icons/hide.svg" : "/icons/unhide.svg"}
                                                      alt=""
                                                      className="h-5 w-5"
                                                />
                                          </button>
                                    </div>

                                    {/* MIDDLE: Antique Collection (primary button) */}
                                    <button
                                          onClick={() => onFooter?.({ type: "open_antique_collection" })}
                                          className="rounded-full bg-[#60673D] px-10 py-1 text-lg text-white shadow-sm hover:brightness-110 active:scale-[0.99] cursor-pointer"
                                          aria-label="Open Antique Collection"
                                    >
                                          Antique  Collection
                                    </button>

                                    {/* RIGHT: Get Inspirations (link-style) */}
                                    <button
                                          onClick={() => onFooter?.({ type: "open_inspirations" })}
                                          className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-sm font-medium text-stone-900 hover:underline cursor-pointer"
                                          aria-label="Get Inspirations"
                                    >
                                          {/* replace with your provided bulb/arrow icons */}
                                          <img src="/icons/bulb.svg" alt="" className="h-5 w-5" />
                                          <span className="text-lg">Get Inspirations</span>
                                          <img src="/icons/arrow-right-black.png" alt="" className="w-5 pt-1" />
                                    </button>
                              </div>
                        </div>
                  </div>
            </aside>
      );
}
