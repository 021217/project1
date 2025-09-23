"use client";

import React, { useMemo, useState, useEffect } from "react";
import * as Slider from "@radix-ui/react-slider";
import FilterDropdown from "./filterDrawer";
import AspirationsDropdown from "@/components/AspirationsDropdown";
import AstrologyDropdown from "@/components/AstrologyDropdown";
import { useDrag } from "react-dnd";
import { getEmptyImage } from "react-dnd-html5-backend";

/* ────────────────────────────────────────────────────────────────────────────
   Types
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
      | { type: "clear_canvas" }
      | { type: "open_antique_collection" }
      | { type: "open_inspirations" };

/* ────────────────────────────────────────────────────────────────────────────
   Sample beads (replace with live data later)
   ──────────────────────────────────────────────────────────────────────────── */
type Bead = {
      id: string;
      name: string;
      material: {
            category: string;
            subgroup: string;
      };
      size: number[]; // 👈 fixed list of allowed sizes (mm)
      price: number;
      image: string;
      shape: string;
      color: string;
      aspirations?: string[];
      astrology?: string[];
};



const sampleBeads: Bead[] = [
      {
            "id": "b1",
            "name": "Amazonite",
            "material": {
                  "category": "Crystals & Mineraloids",
                  "subgroup": "Silicate Crystals"
            },
            "size": [5, 8, 10, 12],
            "price": 38,
            "image": "/beads/amazonite.jpg",
            "shape": "Spherical",
            "color": "Blue",
            "aspirations": ["Health", "Inner Peace", "Creativity"],
            "astrology": ["Virgo"]
      },

      {
            "id": "b2",
            "name": "Phosphosiderite",
            "material": {
                  "category": "Crystals & Mineraloids",
                  "subgroup": "Phosphate & Other Crystals"
            },
            "size": [8, 10],
            "price": 45,
            "image": "/beads/phosphosiderite.jpg",
            "shape": "Spherical",
            "color": "Purple",
            "aspirations": ["Wisdom", "Inner Peace", "Study"]
      },

      {
            "id": "b3",
            "name": "Nephrite",
            "material": {
                  "category": "Crystals & Mineraloids",
                  "subgroup": "Silicate Crystals"
            },
            "size": [10],
            "price": 40,
            "image": "/beads/nephrite.jpg",
            "shape": "Spherical",
            "color": "White",
            "aspirations": ["Health", "Protection", "Growth"],
            "astrology": ["Taurus", "Libra"]
      },

      {
            "id": "b4",
            "name": "Kunzite",
            "material": {
                  "category": "Crystals & Mineraloids",
                  "subgroup": "Silicate Crystals"
            },
            "size": [12],
            "price": 55,
            "image": "/beads/kunzite.jpg",
            "shape": "Spherical",
            "color": "Pink",
            "aspirations": ["Relationship", "Inner Peace"],
            "astrology": ["Taurus", "Leo", "Scorpio"]
      },

      {
            "id": "b5",
            "name": "Obsidian",
            "material": {
                  "category": "Crystals & Mineraloids",
                  "subgroup": "Mineraloids"
            },
            "size": [8, 10, 12],
            "price": 32,
            "image": "/beads/obsidian.jpg",
            "shape": "Spherical",
            "color": "Black",
            "aspirations": ["Protection", "Inner Peace"],
            "astrology": ["Scorpio", "Sagittarius"]
      },

      {
            "id": "b6",
            "name": "Silver Obsidian",
            "material": {
                  "category": "Crystals & Mineraloids",
                  "subgroup": "Mineraloids"
            },
            "size": [8, 10, 12],
            "price": 36,
            "image": "/beads/silver-obsidian.jpg",
            "shape": "Spherical",
            "color": "Black",
            "aspirations": ["Protection", "Luck", "Inner Peace"],
            "astrology": ["Scorpio"]
      },

      {
            "id": "b7",
            "name": "Golden Obsidian",
            "material": {
                  "category": "Crystals & Mineraloids",
                  "subgroup": "Mineraloids"
            },
            "size": [8, 10, 12],
            "price": 36,
            "image": "/beads/golden-obsidian.jpg",
            "shape": "Spherical",
            "color": "Black",
            "aspirations": ["Protection", "Luck", "Career"],
            "astrology": ["Sagittarius"]
      }




];

/* ────────────────────────────────────────────────────────────────────────────
   DraggableBead (from right panel)
   ──────────────────────────────────────────────────────────────────────────── */
function DraggableBead({ bead, size, previewOn }: { bead: Bead; size: number; previewOn: boolean }) {
      const BEAD_SCALE = 8;
      const [{ isDragging }, drag, dragPreview] = useDrag(
            () => ({
                  type: "TEMPLATE_BEAD",
                  item: {
                        type: "TEMPLATE_BEAD",
                        id: bead.id,
                        name: bead.name,
                        size: size, // 👈 use provided size
                        color: bead.color,
                        image: bead.image,
                  },
                  collect: (monitor) => ({
                        isDragging: !!monitor.isDragging(),
                  }),
            }),
            [size]
      );

      useEffect(() => {
            dragPreview(getEmptyImage(), { captureDraggingState: true });
      }, [dragPreview]);

      return (
            <div className="relative flex flex-col items-center gap-2 cursor-grab select-none">
                  {/* bead image */}
                  <img
                        ref={drag}
                        src={bead.image}
                        alt={bead.name}
                        draggable={false}
                        style={{
                              width: size * BEAD_SCALE,
                              height: size * BEAD_SCALE,
                              borderRadius: "50%",
                              border: "1px solid rgba(0,0,0,0.2)",
                              objectFit: "cover",
                              opacity: isDragging ? 0.4 : 1,
                        }}
                        title={previewOn ? `${bead.name} • ${size}mm • RM${bead.price}` : ""}
                  />

                  {/* labels */}
                  {previewOn && (
                        <div className="flex flex-col items-center text-xs text-stone-700">
                              <span className="font-medium">{bead.name}</span>
                              <span>{size}mm • RM{bead.price}</span>
                        </div>
                  )}
            </div>
      );
}

/* ────────────────────────────────────────────────────────────────────────────
   BeadsGrid
   ──────────────────────────────────────────────────────────────────────────── */
function BeadsGrid({ previewOn }: { previewOn: boolean }) {
      return (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {sampleBeads.flatMap((b) =>
                        b.size.map((s) => (
                              <DraggableBead key={`${b.id}-${s}`} bead={b} size={s} previewOn={previewOn} />
                        ))
                  )}
            </div>
      );
}


/* ────────────────────────────────────────────────────────────────────────────
   RightOptionsPanel
   ──────────────────────────────────────────────────────────────────────────── */
interface Props {
      className?: string;
      currency?: string;
      priceBounds?: PriceRange;
      initialPrice?: PriceRange;
      onHeader?: (action: HeaderAction) => void;
      onFooter?: (action: FooterAction) => void;
}

export default function RightOptionsPanel({
      className = "",
      currency = "RM",
      priceBounds = [0, 2000],
      initialPrice = [80, 680],
      onHeader,
      onFooter,
}: Props) {
      const [range, setRange] = useState<PriceRange>(initialPrice);
      const [previewOn, setPreviewOn] = useState(true);
      const [filtersOpen, setFiltersOpen] = useState(false);
      const [aspirationsOpen, setAspirationsOpen] = useState(false);
      const [selectedAsp, setSelectedAsp] = useState<Set<string>>(new Set());
      const [astroOpen, setAstroOpen] = useState(false);
      const [selectedAstro, setSelectedAstro] = useState<string | null>(null);

      const prettyRange = useMemo(
            () => `${currency}${range[0]} – ${currency}${range[1]}`,
            [range, currency]
      );

      function resetAll() {
            setRange(initialPrice);
            onHeader?.({ type: "reset" });
      }

      return (
            <aside
                  className={
                        "flex h-full min-h-[640px] w-full flex-col bg-stone-50/70 " +
                        "backdrop-blur supports-[backdrop-filter]:bg-stone-50/60 " +
                        "rugged-border " +
                        className
                  }
                  aria-label="Configurator – Options"
            >
                  {/* HEADER */}
                  <div className="sticky top-0 z-10 border-[2px] border-[#EB9385] bg-[#EB9385] backdrop-blur-sm">
                        <div className="mx-auto flex max-w-[980px] items-center gap-5 px-4 py-3">
                              {/* Filters */}
                              <button
                                    className="inline-flex items-center justify-between w-40 rounded-full border px-3 text-lg transition-all select-none cursor-pointer border-rose-200/80 bg-[#F7EEE7] text-dark hover:bg-rose-100 active:scale-[0.98]"
                                    onClick={() => {
                                          setFiltersOpen((v) => !v);
                                          setAspirationsOpen(false);
                                          setAstroOpen(false);
                                    }}
                              >
                                    <span className="flex-1 text-center font-medium">Filters</span>
                                    <img src="/icons/filter.svg" alt="filter" className="h-4 w-4 object-contain" />
                              </button>

                              {/* Aspirations */}
                              <button
                                    className="inline-flex items-center justify-between w-40 rounded-full border px-3 text-lg transition-all select-none cursor-pointer border-rose-200/80 bg-[#F7EEE7] text-dark hover:bg-rose-100 active:scale-[0.98]"
                                    onClick={() => {
                                          setAspirationsOpen((v) => !v);
                                          setFiltersOpen(false);
                                          setAstroOpen(false);
                                    }}
                              >
                                    <span className="flex-1 text-center font-medium">Aspirations</span>
                                    <img src="/icons/eject.svg" alt="" className={`h-3 w-3 transition-transform ${aspirationsOpen ? "rotate-180" : ""}`} />
                              </button>

                              {/* Astrology */}
                              <button
                                    className="inline-flex items-center justify-between w-40 rounded-full border px-3 text-lg transition-all select-none cursor-pointer border-rose-200/80 bg-[#F7EEE7] text-dark hover:bg-rose-100 active:scale-[0.98]"
                                    onClick={() => {
                                          setAstroOpen((v) => !v);
                                          setFiltersOpen(false);
                                          setAspirationsOpen(false);
                                    }}
                              >
                                    <span className="flex-1 text-center font-medium">Astrology</span>
                                    <img src="/icons/eject.svg" alt="" className={`h-4 w-4 transition-transform ${astroOpen ? "rotate-180" : ""}`} />
                              </button>

                              {/* RESET */}
                              <div className="flex-1 flex justify-center">
                                    <button
                                          onClick={resetAll}
                                          aria-label="Reset filters"
                                          title="Reset"
                                    >
                                          <span className="text-xl text-[#F7EEE7] underline cursor-pointer">RESET</span>
                                    </button>
                              </div>
                        </div>
                  </div>

                  {/* DROPDOWNS */}
                  <FilterDropdown filtersOpen={filtersOpen} />
                  <AspirationsDropdown
                        open={aspirationsOpen}
                        selected={selectedAsp}
                        onToggle={(label) => {
                              setSelectedAsp((prev) => {
                                    const next = new Set(prev);
                                    next.has(label) ? next.delete(label) : next.add(label);
                                    return next;
                              });
                        }}
                        onClose={() => setAspirationsOpen(false)}
                        onReset={() => setSelectedAsp(new Set())}
                  />
                  <AstrologyDropdown
                        open={astroOpen}
                        selected={selectedAstro}
                        onSelect={(id) => setSelectedAstro(id)}
                        onClose={() => setAstroOpen(false)}
                  />

                  <div className="flex justify-center">
                        <img src="/icons/divider1.png" alt="divider1" className="my-3 select-none" />
                  </div>

                  {/* CONTENT */}
                  <div className="flex-1 overflow-hidden p-6">
                        <div className="mx-auto max-w-[980px] space-y-4 h-full">
                              <div className="h-full overflow-y-auto pr-2">
                                    <BeadsGrid previewOn={previewOn} />
                              </div>
                        </div>
                  </div>

                  {/* FOOTER */}
                  <div className="sticky bottom-0 z-10 bg-stone-50/80 backdrop-blur-sm">
                        <div className="mx-auto max-w-[980px] px-4 pt-2">
                              <img src="/icons/divider2.png" alt="" className="mx-auto h-3 w-auto select-none" />
                        </div>
                        <div className="mx-auto max-w-[980px] px-4 py-3">
                              <div className="flex items-center justify-between gap-6">
                                    {/* LEFT: Bin + Eye */}
                                    <div className="flex items-center gap-1">
                                          <button
                                                onClick={() => onFooter?.({ type: "clear_canvas" })}
                                                className="inline-flex items-center justify-center rounded-full p-2 hover:bg-stone-100 active:scale-[0.98] cursor-pointer"
                                                aria-label="Open Bin"
                                                title="Bin"
                                          >
                                                <img src="/icons/delete.svg" alt="" className="h-5 w-5" />
                                          </button>

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
                                                <img
                                                      src={previewOn ? "/icons/unhide.svg" : "/icons/hide.svg"}
                                                      alt=""
                                                      className="h-5 w-5"
                                                />
                                          </button>
                                    </div>

                                    {/* MIDDLE: Antique Collection */}
                                    <button
                                          onClick={() => onFooter?.({ type: "open_antique_collection" })}
                                          className="rounded-full bg-[#60673D] px-10 py-1 text-lg text-white shadow-sm hover:brightness-110 active:scale-[0.99] cursor-pointer"
                                          aria-label="Open Antique Collection"
                                    >
                                          Antique Collection
                                    </button>

                                    {/* RIGHT: Inspirations */}
                                    <button
                                          onClick={() => onFooter?.({ type: "open_inspirations" })}
                                          className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-sm font-medium text-stone-900 hover:underline cursor-pointer"
                                          aria-label="Get Inspirations"
                                    >
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
