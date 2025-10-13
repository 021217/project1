"use client";

import React, { useMemo, useState, useEffect } from "react";
import * as Slider from "@radix-ui/react-slider";
import FilterDropdown from "./filterDrawer";
import AspirationsDropdown from "@/components/AspirationsDropdown";
import AstrologyDropdown from "@/components/AstrologyDropdown";
import { useDrag, useDrop } from "react-dnd";
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
  | { type: "open_sui_genesis" }
  | { type: "open_inspirations" };

  type Vec2 = { x: number; y: number };

type Bead = {
  id: string;
  name: string;
  material: {
    category: string;
    subgroup: string;
  };
  size: number[];
  price: number;
  image: string;
  shape: string;
  color: string;
  aspirations?: string[];
  astrology?: string[];
  position?: {
    angle: number; // ✅ single rotation angle instead of in/out
  };
};

/* ────────────────────────────────────────────────────────────────────────────
   ThreadAdjuster (inside modal)
   ──────────────────────────────────────────────────────────────────────────── */
function ThreadAdjuster({
  bead,
  onChange,
}: {
  bead: Bead;
  onChange: (updates: Partial<Bead>) => void;
}) {
  const [entry, setEntry] = useState(bead.entryAngle ?? -Math.PI / 2);
  const [exit, setExit] = useState(bead.exitAngle ?? Math.PI / 2);

  const padding = 20;
  const r = 100;
  const d = r * 2 + padding * 2;
  const cx = d / 2;
  const cy = d / 2;

  React.useEffect(() => {
    onChange({ entryAngle: entry, exitAngle: exit });
  }, [entry, exit]);

  function dragHandler(
    e: React.MouseEvent,
    setter: (a: number) => void,
    r: number
  ) {
    const move = (ev: MouseEvent) => {
      const rect = (e.target as SVGElement).ownerSVGElement!.getBoundingClientRect();
      const dx = ev.clientX - (rect.left + cx);
      const dy = ev.clientY - (rect.top + cy);
      setter(Math.atan2(dy, dx));
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }

  return (
    <svg width={d} height={d} className="border rounded">
      <defs>
        <clipPath id={`clip-${bead.id}`}>
          <circle cx={cx} cy={cy} r={r - 2} />
        </clipPath>
      </defs>
      <image
        href={bead.image}
        x={padding}
        y={padding}
        width={r * 2}
        height={r * 2}
        preserveAspectRatio="xMidYMid slice"
        clipPath={`url(#clip-${bead.id})`}
      />
      <line
        x1={cx + (r - 5) * Math.cos(entry)}
        y1={cy + (r - 5) * Math.sin(entry)}
        x2={cx + (r - 5) * Math.cos(exit)}
        y2={cy + (r - 5) * Math.sin(exit)}
        stroke="red"
        strokeWidth="2"
      />
      <circle
        cx={cx + (r - 5) * Math.cos(entry)}
        cy={cy + (r - 5) * Math.sin(entry)}
        r={8}
        fill="blue"
        className="cursor-pointer"
        onMouseDown={(e) => dragHandler(e, setEntry, r)}
      />
      <circle
        cx={cx + (r - 5) * Math.cos(exit)}
        cy={cy + (r - 5) * Math.sin(exit)}
        r={8}
        fill="green"
        className="cursor-pointer"
        onMouseDown={(e) => dragHandler(e, setExit, r)}
      />
    </svg>
  );
}

function BeadInfoModal({
  bead,
  onClose,
}: {
  bead: Bead;
  onClose: () => void;
}) {
  if (!bead) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative bg-[#FDF6F0] w-[90%] h-[90%] p-6 rounded-lg shadow-lg overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl font-bold text-gray-600 hover:text-black"
        >
          ✕
        </button>

        {/* Bead image(s) preview */}
        <div className="flex justify-center gap-4 mb-6">
          {[bead.image, bead.image, bead.image].map((img, i) => (
            <img
              key={i}
              src={img}
              alt={bead.name}
              className="w-20 h-20 rounded-full border object-cover"
            />
          ))}
        </div>

        {/* Name */}
        <h2 className="text-2xl font-serif text-center mb-2">
          {bead.name}
        </h2>

        <p className="text-center text-sm text-gray-500 mb-6">
          {bead.material?.category} / {bead.material?.subgroup}
        </p>

        {/* Attributes */}
        <div className="space-y-2 mb-6 text-sm">
          <p><strong>Weight:</strong> ★★★★☆</p>
          <p><strong>Hardness:</strong> ★★★☆☆</p>
          <p><strong>Heritage:</strong> {bead.shape}</p>
        </div>

        {/* Keywords */}
        <div className="mb-6">
          <p className="text-sm font-semibold mb-1">Keywords:</p>
          <div className="flex flex-wrap gap-2">
            {bead.aspirations?.map((a) => (
              <span key={a} className="text-pink-600 text-sm">
                #{a}
              </span>
            ))}
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-700 leading-relaxed mb-6">
          The {bead.name} is known for its unique qualities and symbolism.
          It is often associated with{" "}
          {bead.astrology?.join(", ") || "various zodiac signs"} and is
          valued for both beauty and spiritual significance.
        </p>

        {/* Gallery grid */}
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-200 h-40 rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  );
}



/* ────────────────────────────────────────────────────────────────────────────
   DraggableBead
   ──────────────────────────────────────────────────────────────────────────── */
function DraggableBead({
  bead,
  size,
  previewOn,
  setBeads,
  offsetX = 0,
  offsetY = 0,
  rotation = 0,
}: {
  bead: Bead;
  size: number;
  previewOn: boolean;
  setBeads: React.Dispatch<React.SetStateAction<Bead[]>>;
  offsetX?: number;
  offsetY?: number;
  rotation?: number;
}) {
  const BEAD_SCALE = 6;
  const [{ isDragging }, drag, dragPreview] = useDrag(
    () => ({
      type: "TEMPLATE_BEAD",
      item: {
        type: "TEMPLATE_BEAD",
        id: bead.id,
        name: bead.name,
        size,
        color: bead.color,
        image: bead.image,
        entryAngle: bead.entryAngle,
        exitAngle: bead.exitAngle,
        position: bead.position, // ✅ pass the in/out data
      },
      collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
    }),
    [size, bead]
  );
  

  const [infoOpen, setInfoOpen] = useState(false);

  React.useEffect(() => {
    dragPreview(getEmptyImage(), { captureDraggingState: true });
  }, [dragPreview]);

  const diameter = size * BEAD_SCALE;

  return (
    <div
      className="relative flex flex-col justify-between items-center text-center cursor-grab select-none border border-transparent"
      style={{ width: 120, height: 200 }}
    >
      {/* Detail modal */}
      {infoOpen && <BeadInfoModal bead={bead} onClose={() => setInfoOpen(false)} />}

      {/* Bead image */}
      <div
        className="relative flex-1 flex items-center justify-center w-full"
        style={{
          transform: `translate(${offsetX}px, ${offsetY}px) rotate(${(bead.position?.angle ?? 0) * (180 / Math.PI)}deg)`,
          transition: "transform 0.2s ease",
        }}
      >
        <img
          ref={drag}
          src={bead.image}
          alt={bead.name}
          draggable={false}
          onClick={() => {
            if (!isDragging) setInfoOpen(true); // only open modal if not dragging
          }}
          style={{
            width: diameter,
            height: diameter,
            borderRadius: "50%",
            objectFit: "cover",
            opacity: isDragging ? 0.4 : 1,
            cursor: "pointer",
            transition: "transform 0.2s ease",
            transform: "scale(1)",
          }}
        />
      </div>

      {/* Label below bead */}
      {previewOn && (
        <div className="h-12 flex flex-col justify-end items-center text-xs text-stone-700 leading-tight">
          <span className="font-medium">{bead.name}</span>
          <span>
            {size}mm • RM{bead.price}
          </span>
        </div>
      )}
    </div>
  );
}
function RemovedBead({ bead }: { bead: Bead }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "TEMPLATE_BEAD",
    item: {
      type: "TEMPLATE_BEAD",
      id: bead.id,
      name: bead.name,
      size: Array.isArray(bead.size) ? bead.size[0] : bead.size, // ✅ pick first size if it's an array
      color: bead.color,
      image: bead.image,
    },
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
  }));

  return (
    <div
      ref={drag}
      className="w-10 h-10 rounded-full cursor-grab"
      style={{
        background: bead.image
          ? `url(${bead.image}) center/cover`
          : bead.color,
        opacity: isDragging ? 0.5 : 1,
      }}
    />
  );
}

function RecentlyDeletedModal({
  open,
  beads,
  onClose,
}: {
  open: boolean;
  beads: Bead[];
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="absolute bottom-[100px] left-1/2 -translate-x-1/2 z-50 
                 w-[85%] max-w-[900px] p-4 rounded-lg shadow-lg 
                 animate-fade-in"
      style={{
        backgroundImage: "url('/recently-deleted-bg.png')",
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Header + Close */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-serif text-[#333]">Recently Removed</h2>
        <button
          onClick={onClose}
          className="text-xl font-bold text-black hover:text-red-500"
        >
          ✕
        </button>
      </div>

      {/* Beads list */}
      <div className="flex gap-3 overflow-x-auto">
        {beads.length > 0 ? (
          beads.map((b) => <RemovedBead key={b.id} bead={b} />)
        ) : (
          <span className="text-gray-500">No removed items yet</span>
        )}
      </div>
    </div>
  );
}



/* ────────────────────────────────────────────────────────────────────────────
   BeadsGrid
   ──────────────────────────────────────────────────────────────────────────── */
function BeadsGrid({
  previewOn,
  beads,
  setBeads,
}: {
  previewOn: boolean;
  beads: Bead[];
  setBeads: React.Dispatch<React.SetStateAction<Bead[]>>;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 place-items-center relative">
      {beads.flatMap((b, i) =>
        b.size.map((s, j) => {
          // stable small offsets (based on index)
          const offsetX = ((i + j) * 13) % 12 - 6; // -6px to +6px
          const offsetY = ((i * 7 + j * 5) % 12) - 6; // -6px to +6px
          const rotation = ((i * 3 + j * 7) % 10) - 5; // -5 to +5 deg

          return (
            <DraggableBead
              key={`${b.id}-${s}`}
              bead={b}
              size={s}
              previewOn={previewOn}
              setBeads={setBeads}
              offsetX={offsetX}
              offsetY={offsetY}
              rotation={rotation}
            />
          );
        })
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
  setPlacedBeads: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function RightOptionsPanel({
  className = "",
  currency = "RM",
  initialPrice = [80, 680],
  onHeader,
  onFooter,
  setPlacedBeads,
}: Props) {
  const [range, setRange] = useState<PriceRange>(initialPrice);
  const [previewOn, setPreviewOn] = useState(false);
  const [selectedAsp, setSelectedAsp] = useState<Set<string>>(new Set());
  const [selectedAstro, setSelectedAstro] = useState<string | null>(null);
  const [priceBounds, setPriceBounds] = useState<PriceRange>([0, 0]);

  const [activeDropdown, setActiveDropdown] = useState<"filters" | "aspirations" | "astrology" | "price" | null>(null);

  const [showSuiGenesis, setShowSuiGenesis] = useState(false);

  const [beads, setBeads] = useState<Bead[]>([]);

  const [showDeletedModal, setShowDeletedModal] = useState(false);
  const [recentlyRemoved, setRecentlyRemoved] = useState<Bead[]>([]);
  const [showRemoveZone, setShowRemoveZone] = useState(false);
  const [, removeDrop] = useDrop(() => ({
    accept: "PLACED_BEAD",
    drop: (item: any) => {
      console.log("🗑 Removing bead:", item.id);

      // Find bead info before removing
      let removed: Bead | undefined;
      setPlacedBeads((prev: Bead[]) => {
        removed = prev.find(b => b.id === item.id);
        return prev.filter(b => b.id !== item.id);
      });

      // Safely push to recentlyRemoved
      if (removed) {
        setRecentlyRemoved(prev => [removed!, ...prev].slice(0, 5)); // keep last 5
      }
    },
    collect: (monitor) => {
      setShowRemoveZone(monitor.isOver() || monitor.canDrop());
    },
  }));

  // Allow placed beads to be dropped back here (return to right panel)
  const [, returnDrop] = useDrop(() => ({
    accept: ["PLACED_BEAD"],
    drop: (item: any) => {
      console.log("↩️ Bead returned to right panel:", item.id);

      // Optionally remove it from bracelet via callback
      setPlacedBeads((prev: any[]) => prev.filter((b) => b.id !== item.id));
    },
  }));

  useEffect(() => {
    fetch("https://mypoesis.ruputech.com/api/getBeads.php")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const loaded = data.beads.map((b: any) => ({
            ...b,
            position: b.position
              ? typeof b.position === "string"
                ? JSON.parse(b.position)
                : b.position
              : { angle: 0 },
          }));

          setBeads(loaded);

          const prices = loaded.map((b: Bead) => b.price);
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          setPriceBounds([minPrice, maxPrice]);
          setRange([minPrice, maxPrice]);
          onHeader?.({ type: "price", value: [minPrice, maxPrice] });
        }
      })
      .catch(console.error);
  }, []);

  function resetAll() {
    setRange(initialPrice);
    onHeader?.({ type: "reset" });
  }

  /* ─────────────── Popup wrapper ─────────────── */
  function PopupModal({
    open,
    title,
    onClose,
    children,
  }: {
    open: boolean;
    title: string;
    onClose: () => void;
    children: React.ReactNode;
  }) {
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div
          className="relative p-6 w-[500px] min-h-[200px] flex flex-col items-center justify-center"
          style={{
            backgroundImage: "url('/ui/modal-small.png')",
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-xl font-bold"
          >
            ✕
          </button>
          <h2 className="text-xl mb-4 font-serif">{title}</h2>
          {children}
        </div>
      </div>
    );
  }


  function PriceModal({
    open,
    onClose,
    range,
    setRange,
    bounds,
    currency = "RM",
  }: {
    open: boolean;
    onClose: () => void;
    range: [number, number];
    setRange: (r: [number, number]) => void;
    bounds: [number, number];
    currency?: string;
  }) {
    if (!open) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        {/* modal background */}
        <div className="relative w-[700px] h-[200px] flex flex-col items-center justify-center">
          <img
            src="/ui/modal-small.png"
            alt="modal bg"
            className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-xl font-bold text-black"
          >
            ✕
          </button>

          {/* PRICE SLIDER */}
          <div className="relative w-[600px] px-6 mt-6">
            <Slider.Root
              className="relative flex items-center w-full"
              min={bounds[0]}
              max={bounds[1]}
              step={10}
              value={range}
              onValueChange={(val) => setRange(val as [number, number])}
            >
              {/* Track */}
              <Slider.Track className="relative h-[20px] w-full">
                <img
                  src="/ui/slider-track.png"
                  alt="track"
                  className="absolute inset-0 w-full h-full object-fill pointer-events-none"
                />
                <Slider.Range className="absolute inset-y-0">
                  <img
                    src="/ui/slider-progress.png"
                    alt="progress"
                    className="absolute inset-0 w-full h-full object-fill pointer-events-none"
                  />
                </Slider.Range>
              </Slider.Track>

              {/* Thumbs */}
              {range.map((val, i) => (
                <Slider.Thumb key={i} asChild>
                  <div className="relative flex flex-col items-center">
                    {/* Indicator bubble with price inside */}
                    <div className="relative mb-2">
                      <img
                        src="/ui/slider-indicator.png"
                        alt="indicator"
                        className="w-8 h-8 object-contain"
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-serif text-black">
                        {currency}{val}
                      </span>
                    </div>

                    {/* Thumb (circle) */}
                    <img
                      src="/ui/slider-thumb.png"
                      alt="thumb"
                      className="w-6 h-6 object-contain"
                    />
                  </div>
                </Slider.Thumb>
              ))}
            </Slider.Root>

            {/* Min/Max labels */}
            <div className="flex justify-between mt-2 text-[#EB9385] font-serif">
              <span>
                {currency}
                {bounds[0]}
              </span>
              <span>
                {currency}
                {bounds[1]}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }



  return (
    <aside
      ref={returnDrop}
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
          {[
            { label: "Filters", action: () => setActiveDropdown(activeDropdown === "filters" ? null : "filters") },
            { label: "Aspirations", action: () => setActiveDropdown(activeDropdown === "aspirations" ? null : "aspirations") },
            { label: "Astrology", action: () => setActiveDropdown(activeDropdown === "astrology" ? null : "astrology") },
            { label: "Price", action: () => setActiveDropdown(activeDropdown === "price" ? null : "price") },
          ].map((btn) => (
            <button
              key={btn.label}
              className="inline-flex items-center justify-between w-40 rounded-full border px-3 text-lg transition-all cursor-pointer border-rose-200/80 bg-[#F7EEE7] hover:bg-rose-100 active:scale-[0.98]"
              onClick={btn.action}
            >
              <span className="flex-1 text-center font-medium">{btn.label}</span>
              <img src="/icons/eject.svg" alt="" className="h-4 w-4" />
            </button>
          ))}

          {/* RESET */}
          <div className="flex-1 flex justify-center">
            <button onClick={resetAll}>
              <span className="text-xl text-[#F7EEE7] underline cursor-pointer">
                RESET
              </span>
            </button>
          </div>
        </div>
      </div>


      {/* DROPDOWNS */}
      {/* Filters */}
      <FilterDropdown filtersOpen={activeDropdown === "filters"} />

      {/* Aspirations */}
      <AspirationsDropdown
        open={activeDropdown === "aspirations"}
        selected={selectedAsp}
        onToggle={(label) => {
          setSelectedAsp((prev) => {
            const next = new Set(prev);
            next.has(label) ? next.delete(label) : next.add(label);
            return next;
          });
        }}
        onClose={() => setActiveDropdown(null)}
        onReset={() => setSelectedAsp(new Set())}
      />

      {/* Astrology */}
      <AstrologyDropdown
        open={activeDropdown === "astrology"}
        selected={selectedAstro}
        onSelect={(id) => setSelectedAstro(id)}
        onClose={() => setActiveDropdown(null)}
      />

      {/* Price */}
      {activeDropdown === "price" && (
        <div className="mx-auto my-3 w-[85%] rounded-md border border-[#EB9385]/60 bg-white shadow-md px-6 py-4">
          <Slider.Root
            className="relative flex items-center w-full"
            min={priceBounds[0]}
            max={priceBounds[1]}
            step={10}
            value={range}
            onValueChange={(val) => {
              setRange(val as [number, number]);
              onHeader?.({ type: "price", value: val as [number, number] });
            }}
          >
            <Slider.Track className="relative h-[20px] w-full">
              <img src="/ui/slider-track.png" alt="track" className="absolute inset-0 w-full h-full" />
              <Slider.Range className="absolute inset-y-0">
                <img src="/ui/slider-progress.png" alt="progress" className="absolute inset-0 w-full h-full" />
              </Slider.Range>
            </Slider.Track>

            {range.map((val, i) => (
              <Slider.Thumb key={i} asChild>
                <div className="relative flex flex-col items-center">
                  <div className="relative mb-2">
                    <img src="/ui/slider-indicator.png" alt="indicator" className="w-8 h-8" />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-serif text-black">
                      {currency}{val}
                    </span>
                  </div>
                  <img src="/ui/slider-thumb.png" alt="thumb" className="w-6 h-6" />
                </div>
              </Slider.Thumb>
            ))}
          </Slider.Root>

          <div className="flex justify-between mt-2 text-[#EB9385] font-serif">
            <span>{currency}{priceBounds[0]}</span>
            <span>{currency}{priceBounds[1]}</span>
          </div>
        </div>
      )}


      <div className="flex justify-center w-full bg-transparent">
        <img
          src="/icons/divider1.png"
          alt="divider1"
          className="my-3 select-none w-[85%] bg-transparent"
        />
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden p-6">
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="mx-auto max-w-[980px] space-y-4">
            <BeadsGrid previewOn={previewOn} beads={beads} setBeads={setBeads} />
          </div>
        </div>
      </div>

      {/* Drop-to-remove zone */}
      <div
        ref={removeDrop}
        className={[
          "fixed bottom-[120px] left-1/2 -translate-x-1/2",
          "flex items-center justify-center",
          "transition-all duration-300 ease-out",
          "w-[75%] h-[434px] rounded-[12px]",
          "z-[120]", // 🟢 ensure above BeadCanvas z-50
          showRemoveZone
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none", // 🟢 mounted but hidden
        ].join(" ")}
        style={{ background: "#DB5375" }}
      >
        <img
          src="/icons/delete.svg"
          alt="Remove"
          className="w-12 h-12"
          style={{
            filter:
              "invert(33%) sepia(70%) saturate(6000%) hue-rotate(320deg) brightness(90%) contrast(90%)",
          }}
        />
      </div>

      <RecentlyDeletedModal
        open={showDeletedModal}
        beads={recentlyRemoved}
        onClose={() => setShowDeletedModal(false)}
      />

      {/* FOOTER */}
      <div className="sticky bottom-0 z-10 bg-stone-50/80 backdrop-blur-sm">
        <div className="flex justify-center w-full bg-transparent">
          <img
            src="/icons/divider1.png" // ✅ use the same arrow-style divider
            alt="divider"
            className="my-3 select-none w-[85%] bg-transparent"
          />
        </div>
        <div className="mx-auto max-w-[980px] px-4 py-3">
          <div className="flex items-center justify-between gap-6">
            {/* LEFT: Bin + Eye */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDeletedModal(true)}
                className="relative w-12 h-12 rounded-full flex items-center justify-center cursor-pointer group"
              >
                <img src="./icons/delete.svg" alt="Recently Removed" />
                <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-3 py-1 text-xs text-white bg-black/80 rounded whitespace-nowrap opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200">
                  Recently Removed
                </span>
              </button>

              <button
                onClick={() => {
                  console.log("Show Details");
                  const next = !previewOn;
                  setPreviewOn(next);
                  onFooter?.({ type: "toggle_preview", value: next });
                }}
                className="relative group w-12 h-12 rounded-full flex items-center justify-center cursor-pointer hover:bg-stone-100 active:scale-[0.98]"
                aria-label={previewOn ? "Hide preview" : "Show preview"}
                title="Toggle preview"
              >
                <img
                  src={previewOn ? "/icons/unhide.svg" : "/icons/hide.svg"}
                  alt=""
                  className="h-5 w-5"
                />
                <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-3 py-1 text-xs text-white bg-black/80 rounded whitespace-nowrap opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200">
                  Show Details
                </span>
              </button>
            </div>

            {/* MIDDLE: Sui Genesis */}
            <button
              onClick={() => {
                if (!showSuiGenesis) {
                  // 🟢 Opening: small delay before showing
                  setTimeout(() => setShowSuiGenesis(true), 300);
                } else {
                  // 🔴 Closing: wait until animation finishes before fully hiding
                  const panel = document.getElementById("suiGenesisPanel");
                  if (panel) {
                    panel.classList.add("translate-x-full", "opacity-0");
                    setTimeout(() => setShowSuiGenesis(false), 500); // match animation duration
                  } else {
                    setShowSuiGenesis(false);
                  }
                }
                onFooter?.({ type: "open_sui_genesis" });
              }}
              className="relative group rounded-full bg-[#60673D] px-10 py-1 text-lg text-white shadow-sm hover:brightness-110 active:scale-[0.99] cursor-pointer"
              aria-label="Open Sui Genesis"
            >
              SUI GENESIS
              <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 text-xs text-white bg-black/80 rounded opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 whitespace-nowrap">
                Prebuilt Collections
              </span>
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
      {showSuiGenesis && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setShowSuiGenesis(false)}
        />
      )}
      {/* ─────────────────────────────── Sui Genesis Panel ─────────────────────────────── */}
      <div
        id="suiGenesisPanel"
        className={`absolute top-0 right-0 h-full w-full z-40 overflow-hidden
                    bg-[#60673D] text-white shadow-2xl
                    transform transition-all duration-500 ease-in-out
                    ${showSuiGenesis ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}`}
        style={{
          visibility: showSuiGenesis ? "visible" : "hidden",
          transitionDelay: showSuiGenesis ? "0.35s" : "0s",
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/30">
            <h2 className="text-xl font-serif tracking-wide">SUI GENESIS</h2>
            <button
              onClick={() => {
                const panel = document.getElementById("suiGenesisPanel");
                if (panel) {
                  panel.classList.add("translate-x-full", "opacity-0");
                  setTimeout(() => setShowSuiGenesis(false), 500);
                } else setShowSuiGenesis(false);
              }}
              className="text-2xl font-bold hover:text-rose-200"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <p className="opacity-80 text-sm">Collections will appear here.</p>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="aspect-square bg-white/10 rounded-lg flex items-center justify-center font-serif text-lg"
                >
                  Item {i}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </aside>
  );
}
