"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDrop, useDragLayer, useDrag } from "react-dnd";
import html2canvas from "html2canvas";
import { getEmptyImage } from "react-dnd-html5-backend";

type Bead = {
  id: string;
  socketIndex: number;
  size: number;
  color: string;
  name?: string;
  image?: string;
  angle: number; // angular position on bracelet
  entryAngle?: number;
  exitAngle?: number;
  location?: "bracelet" | "waiting";
  position?: {
    angle: number; // ✅ rotation of string hole (like a wheel)
  };
};

type DragItem =
  | {
      type: "TEMPLATE_BEAD";
      id: string;
      name: string;
      size: number;
      color: string;
      image?: string;
      position?: { angle: number }; // ✅ simplified
    }
  | {
      type: "PLACED_BEAD";
      id: string;
      socketIndex: number;
      size: number;
      color: string;
      name?: string;
      image?: string;
      location?: "bracelet" | "waiting";
      angle?: number;
      position?: { angle: number }; // ✅ simplified
    };


const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

function normalizeAngle(a: number): number {
  a = a % (2 * Math.PI);
  if (a < 0) a += 2 * Math.PI;
  return a;
}

function beadArcLengthMM(beadMM: number, trackRadiusMM: number) {
  const angle = 2 * Math.asin((beadMM / 2) / trackRadiusMM);
  return angle * trackRadiusMM;
}
function getMaxQuota(braceletSize: keyof typeof braceletSizes) {
  const trackRadiusMM =
    (braceletSizes[braceletSize] - ringThickness / pxPerMM) / 2;
  return 2 * Math.PI * trackRadiusMM;
}
function beadDeltaAngle(beadMM: number, trackRadiusMM: number) {
  return 2 * Math.asin((beadMM / 2) / trackRadiusMM);
}

const ringThickness = 36;
const braceletSizes = { S: 55, M: 70, L: 80 };
const pxPerMM = 6;
const waitingWidth = 400;
const waitingHeight = 100;

function ConfirmationModal({
  open,
  title,
  children,
  onYes,
  onNo,
}: {
  open: boolean;
  title: string;
  children?: React.ReactNode;
  onYes: () => void;
  onNo: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
      <div
        className="relative w-[500px] h-[180px] flex flex-col justify-center items-center text-center"
        style={{
          backgroundImage: `url(/ui/modal-small.png)`,
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
        }}
      >
        <h3 className="text-lg mb-3">{title}</h3>
        {children}
        <div className="flex justify-center gap-10 mt-4">
          <button onClick={onYes} className="text-lg cursor-pointer">YES</button>
          <button onClick={onNo} className="text-lg cursor-pointer">NO</button>
        </div>
      </div>
    </div>
  );
}

// 👇 drop this in place of your current DraggableBead
function DraggableBead({
  bead,
  x,
  y,
  beadPx,
}: {
  bead: Bead;
  x: number;
  y: number;
  beadPx: number;
}) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "PLACED_BEAD",
    item: bead,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      style={{
        position: "absolute",
        left: x - beadPx / 2,
        top: y - beadPx / 2,
        width: beadPx,
        height: beadPx,
        borderRadius: "50%",
        background: bead.image ? `url(${bead.image}) center/cover` : bead.color,
        opacity: isDragging ? 0.5 : 1,
        cursor: "grab",
      }}
    />
  );
}

export default function BeadCanvas({
  beads,
  setBeads,
}: {
  beads: Bead[];
  setBeads: React.Dispatch<React.SetStateAction<Bead[]>>;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const beadImagesRef = useRef<Record<string, HTMLImageElement>>({});
  const [redoOpen, setRedoOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("Untitled Design");
  const [designId, setDesignId] = useState<number | null>(null);
  const [fadeState, setFadeState] = useState<"in" | "out">("in");
  const [showSaveBanner, setShowSaveBanner] = useState(false);
  const [showSpaceBanner, setShowSpaceBanner] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [description, setDescription] = useState(
    "I just designed my own bracelet with natural materials 🌿✨ Check it out here!"
  );
  const [theme, setTheme] = useState<"wood" | "stone" | "paper" | "custom">("wood");
  const [customBg, setCustomBg] = useState<string | null>(null);

  // history stacks
  const historyRef = useRef<Bead[][]>([]);
  const futureRef = useRef<Bead[][]>([]);

  function applyBeads(updater: (prev: Bead[]) => Bead[]) {
    setBeads(updater);
  }

  function updateBeads(updater: (prev: Bead[]) => Bead[]) {
    setBeads((prev) => {
      const next = updater(prev);
      historyRef.current = [...historyRef.current, prev];
      futureRef.current = [];
      return next;
    });
  }

  function undo() {
    if (historyRef.current.length === 0) return;
    setBeads((current) => {
      const prevHistory = historyRef.current;
      const previous = prevHistory[prevHistory.length - 1];
      historyRef.current = prevHistory.slice(0, -1);
      futureRef.current = [current, ...futureRef.current];
      return previous;
    });
  }

  function redo() {
    if (futureRef.current.length === 0) return;
    setBeads((current) => {
      const [next, ...rest] = futureRef.current;
      historyRef.current = [...historyRef.current, current];
      futureRef.current = rest;
      return next;
    });
  }

  const previewRef = useRef<HTMLDivElement>(null);

  async function handleSaveImage() {
    if (!previewRef.current) return;

    const canvas = await html2canvas(previewRef.current, {
      backgroundColor: null, // keep transparent if needed
      scale: 2, // higher resolution export
    });

    const link = document.createElement("a");
    link.download = `${saveName || "bracelet-design"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  const assetsRef = useRef<{
    bg?: HTMLImageElement;
    ring?: HTMLImageElement;
    logo?: HTMLImageElement;
    leaves?: HTMLImageElement;
    receipt?: HTMLImageElement;
    disc?: HTMLImageElement;
    waiting?: HTMLImageElement;
  }>({});

  const [ready, setReady] = useState(false);
  const [braceletSize, setBraceletSize] =
    useState<keyof typeof braceletSizes>("M");

  const [isHoveringRing, setIsHoveringRing] = useState(false);

  const [_, forceRerender] = useState(0);
  const [designName, setDesignName] = useState<string | null>(null);

  // MUSIC
  const [musicOn, setMusicOn] = useState(false);
  function toggleMusic() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.1;
    setMusicOn((prev) => {
      const next = !prev;
      if (next) {
        audio.currentTime = 0;
        audio.muted = false;
        audio.play().catch(() => { });
      } else {
        audio.pause();
        audio.currentTime = 0;
      }
      return next;
    });
  }

  // resize
  function resizeCanvas() {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const rect = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  useLayoutEffect(() => {
    resizeCanvas();
    const ro = new ResizeObserver(() => resizeCanvas());
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  // preload
  useEffect(() => {
    (async () => {
      // Load core assets
      const [ring, logo, receipt, waiting] = await Promise.all([
        loadImage("/circle_placeholder.png"),
        loadImage("/Logo-light.png"),
        loadImage("/Receipt.png"),
        loadImage("/waiting-area.png"),
      ]);

      // 🎨 Load all theme variations
      const themeImages = [
        "/wood-bg.png", "/marble-bg.png", "/paper-bg.jpg",
        "/Leaves.png", "/Stones.png", "/Paper.png",
        "/music-disc.png", "/music-disc2.png", "/music-disc2.png",
      ];

      // Preload each image and store in beadImagesRef for easy access later
      for (const path of themeImages) {
        try {
          const img = await loadImage(path);
          beadImagesRef.current[path] = img;
        } catch (err) {
          console.warn("Failed to load theme image:", path, err);
        }
      }

      // You can still keep one default bg and assetsRef for legacy usage
      assetsRef.current = {
        bg: beadImagesRef.current["/wood-bg.png"],
        ring,
        logo,
        leaves: beadImagesRef.current["/Leaves.png"],
        receipt,
        disc: beadImagesRef.current["/music-disc.png"],
        waiting,
      };

      setReady(true);
    })();
  }, []);

  const themeConfig = {
    wood: { bg: "/wood-bg.png", leaves: "/Leaves.png", disc: "/music-disc.png" },
    stone: { bg: "/marble-bg.png", leaves: "/Stones.png", disc: "/music-disc2.png" },
    paper: { bg: "/paper-bg.jpg", leaves: "/Paper.png", disc: "/music-disc2.png" },
    custom: { bg: "", leaves: "", disc: "/music-disc2.png" },
  };

  function handleCustomBgUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const imgSrc = reader.result as string;
      setCustomBg(imgSrc);
      setTheme("custom"); // switch to custom theme
    };
    reader.readAsDataURL(file);
  }

  // re-layout beads when bracelet size changes
  useEffect(() => {
    if (beads.length === 0) return;
    const trackRadiusMM =
      (braceletSizes[braceletSize] - ringThickness / pxPerMM) / 2;

    let angle = -Math.PI / 2;
    const relaid = beads
      .slice()
      .sort((a, b) => a.socketIndex - b.socketIndex)
      .map((b) => {
        const delta = beadDeltaAngle(b.size, trackRadiusMM);
        const beadAngle = angle + delta / 2;
        angle += delta;
        return { ...b, angle: beadAngle };
      });

    applyBeads(() => relaid); // ✅ no history push
  }, [braceletSize]);

  // helper: check if angle is free
  function isOccupied(prev: Bead[], angle: number, beadMM: number, trackRadiusMM: number) {
    const newDelta = beadDeltaAngle(beadMM, trackRadiusMM);
    for (const b of prev) {
      const delta = beadDeltaAngle(b.size, trackRadiusMM);
      let diff = Math.abs(angle - b.angle);
      if (diff > Math.PI) diff = 2 * Math.PI - diff;
      if (diff < (newDelta + delta) / 2 - 0.01) {
        return true;
      }
    }
    return false;
  }

  function updateOrCreateBead(
    prev: Bead[],
    item: DragItem,
    updates: Partial<Bead>,
    createIfTemplate: () => Bead
  ) {
    // Always remove any existing bead with same id
    let withoutOld = prev.filter((b) => b.id !== item.id);

    if (item.type === "PLACED_BEAD") {
      return [...withoutOld, { ...item, ...updates } as Bead];
    } else {
      const newBead = createIfTemplate();
      return [...withoutOld, newBead];
    }
  }

  // DROP HANDLER (left + right)
  const [, drop] = useDrop(() => ({
    accept: ["TEMPLATE_BEAD", "PLACED_BEAD"],

    // 🧭 Detect hover near placeholder ring
    hover: (item: DragItem, monitor) => {
      if (!wrapRef.current) return;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      const rect = wrapRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientOffset.x - cx;
      const dy = clientOffset.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const Rpx = (braceletSizes[braceletSize] * pxPerMM) / 2;
      const trackRadius = Rpx - ringThickness / 2;

      // Define the ring hover detection band (like a donut zone)
      const ringInner = trackRadius - 50; // tolerance inside
      const ringOuter = trackRadius + 50; // tolerance outside

      const hovering = dist >= ringInner && dist <= ringOuter;
      setIsHoveringRing(hovering);
    },

    drop: (item: DragItem, monitor) => {
      setIsHoveringRing(false); // reset hover glow after drop

      if (!wrapRef.current) return;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      const rect = wrapRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      // --- 1. Check waiting area ---
      const Rpx = (braceletSizes[braceletSize] * pxPerMM) / 2;
      const waitingX = rect.left + cx - waitingWidth / 2;
      const waitingY = rect.top + cy + Rpx + 80;

      if (
        clientOffset.x >= waitingX &&
        clientOffset.x <= waitingX + waitingWidth &&
        clientOffset.y >= waitingY &&
        clientOffset.y <= waitingY + waitingHeight
      ) {
        console.log("🎯 Drop detected in waiting area");
        updateBeads((prev) => {
          const slotSize = 50;
          const totalSlots = Math.floor(waitingWidth / slotSize);
          const usedSlots = prev
            .filter((b) => b.location === "waiting")
            .map((b) => b.socketIndex);

          const localX = clientOffset.x - (rect.left + cx - waitingWidth / 2);
          let nearestSlot = Math.round(localX / slotSize);
          if (nearestSlot < 0) nearestSlot = 0;
          if (nearestSlot >= totalSlots) nearestSlot = totalSlots - 1;

          while (usedSlots.includes(nearestSlot) && nearestSlot < totalSlots) {
            nearestSlot++;
          }

          return updateOrCreateBead(
            prev,
            item,
            {
              socketIndex: nearestSlot,
              location: "waiting",
              angle: 0,
              entryAngle: undefined,
              exitAngle: undefined,
            },
            () => ({
              id: "b" + Date.now(),
              socketIndex: nearestSlot,
              size: item.size,
              color: item.color,
              name: item.name,
              image: item.image,
              angle: 0,
              location: "waiting",
            })
          );
        });
        return; // ✅ stop, don’t try to place on bracelet
      }

      // --- 2. Bracelet placement (your existing logic) ---
      const dx = clientOffset.x - cx;
      const dy = clientOffset.y - cy;
      const cursorAngle = normalizeAngle(Math.atan2(dy, dx));

      const beadMM = item.size;
      const trackRadiusMM =
        (braceletSizes[braceletSize] - ringThickness / pxPerMM) / 2;

      updateBeads((prev) => {
        const usedQuota = prev.reduce(
          (sum, b) => sum + beadArcLengthMM(b.size, trackRadiusMM),
          0
        );
        const newBeadArc = beadArcLengthMM(beadMM, trackRadiusMM);
        const max = getMaxQuota(braceletSize);

        if (usedQuota + newBeadArc > max) {
          setFadeState("in");
          setShowSpaceBanner(true);
          setTimeout(() => setFadeState("out"), 2700);
          setTimeout(() => setShowSpaceBanner(false), 3000);
          return prev;
        }

        // find nearest anchor + dropAngle
        let anchor: Bead | null = null;
        let minDiff = Infinity;
        for (const b of prev) {
          let diff = Math.abs(cursorAngle - b.angle);
          if (diff > Math.PI) diff = 2 * Math.PI - diff;
          if (diff < minDiff) {
            minDiff = diff;
            anchor = b;
          }
        }

        let dropAngle = cursorAngle;
        if (anchor) {
          const beadDelta = beadDeltaAngle(beadMM, trackRadiusMM) / 2;
          const anchorDelta = beadDeltaAngle(anchor.size, trackRadiusMM) / 2;
          const offset = beadDelta + anchorDelta;

          const leftAngle = normalizeAngle(anchor.angle - offset);
          const rightAngle = normalizeAngle(anchor.angle + offset);

          const leftFree = !isOccupied(prev, leftAngle, beadMM, trackRadiusMM);
          const rightFree = !isOccupied(prev, rightAngle, beadMM, trackRadiusMM);

          if (leftFree && rightFree) {
            const diff = cursorAngle - anchor.angle;
            const side =
              (diff > 0 && diff < Math.PI) || diff < -Math.PI ? "right" : "left";
            dropAngle = side === "right" ? rightAngle : leftAngle;
          } else if (leftFree) {
            dropAngle = leftAngle;
          } else if (rightFree) {
            dropAngle = rightAngle;
          } else {
            return prev; // no space
          }
        }

        return updateOrCreateBead(
          prev,
          item,
          {
            angle: dropAngle,
            location: "bracelet",
            socketIndex: prev.length,
            position: (item as any).position ?? { angle: 0 },
          },
          () => ({
            id: "b" + Date.now(),
            socketIndex: prev.length,
            size: beadMM,
            color: item.color,
            name: item.name,
            image: item.image,
            angle: dropAngle,
            entryAngle: (item as any).entryAngle ?? -Math.PI / 2,
            exitAngle: (item as any).exitAngle ?? Math.PI / 2,
            location: "bracelet",
            position: (item as any).position ?? { angle: 0 },
          })
        ).sort((a, b) => a.angle - b.angle);
      });
    },
  }));
  drop(wrapRef);


  async function getCanvasImage(): Promise<string | null> {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    // Clone the base canvas
    const exportCanvas = document.createElement("canvas");
    const ctx = exportCanvas.getContext("2d")!;
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;

    // Draw background, ring, etc.
    ctx.drawImage(canvas, 0, 0);

    // Ensure all bead images are preloaded before drawing
    const preloadPromises = beads.map(async (b) => {
      if (b.image && !beadImagesRef.current[b.image]) {
        try {
          const img = await loadImage(b.image);
          beadImagesRef.current[b.image] = img;
        } catch (err) {
          console.warn("Failed to load bead image", b.image, err);
        }
      }
    });
    await Promise.all(preloadPromises);

    // Now draw beads
    const rect = canvas.getBoundingClientRect();
    const cssW = rect.width;
    const cssH = rect.height;
    const cx = cssW / 2;
    const cy = cssH / 2;
    const R = (braceletSizes[braceletSize] * pxPerMM) / 2;
    const trackRadius = R - ringThickness / 2;

    for (const b of beads) {
      const beadPx = b.size * pxPerMM;
      let x: number;
      let y: number;

      if (b.location === "waiting") {
        const slotSize = 50;
        x = cx - waitingWidth / 2 + b.socketIndex * slotSize + slotSize / 2;
        y = cy + R + 100;
      } else {
        x = cx + trackRadius * Math.cos(b.angle);
        y = cy + trackRadius * Math.sin(b.angle);
      }

      const img = b.image ? beadImagesRef.current[b.image] : undefined;
      if (img) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, beadPx / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, x - beadPx / 2, y - beadPx / 2, beadPx, beadPx);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(x, y, beadPx / 2, 0, Math.PI * 2);
        ctx.fillStyle = b.color || "#ff00ff";
        ctx.fill();
      }
    }

    return exportCanvas.toDataURL("image/png");
  }

  async function exportDesignWithText(
    name: string,
    description: string
  ) {
    const baseData = await getCanvasImage(); // ✅ includes beads, background, etc.
    if (!baseData) return;

    const baseImage = new Image();
    baseImage.src = baseData;

    baseImage.onload = () => {
      const tempCanvas = document.createElement("canvas");
      const ctx = tempCanvas.getContext("2d")!;
      tempCanvas.width = baseImage.width;
      tempCanvas.height = baseImage.height;

      // 🎨 draw full bracelet image
      ctx.drawImage(baseImage, 0, 0);

      // 🩶 overlay background
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillRect(30, tempCanvas.height - 120, tempCanvas.width - 60, 90);

      // 🖋 project name
      ctx.fillStyle = "#000";
      ctx.font = "bold 28px serif";
      ctx.textAlign = "left";
      ctx.fillText(name || "Untitled Design", 50, tempCanvas.height - 80);

      // 🖋 description (word-wrapped)
      ctx.font = "16px sans-serif";
      ctx.fillStyle = "#444";
      wrapText(
        ctx,
        description || "Write something about your design...",
        50,
        tempCanvas.height - 50,
        tempCanvas.width - 100,
        20
      );

      // 💾 save to device
      const link = document.createElement("a");
      link.download = (name || "bracelet") + ".png";
      link.href = tempCanvas.toDataURL("image/png");
      link.click();
    };
  }

  // helper for wrapping description text
  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(" ");
    let line = "";
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + " ";
        y += lineHeight;
      } else line = testLine;
    }
    ctx.fillText(line, x, y);
  }

  // ─────────── SAVE / LOAD API ───────────
  const DOMAIN = "https://mypoesis.ruputech.com";
  async function saveDesign() {
    const userId = 1; // TODO: replace with real logged-in user later
    let name = designName || saveName;

    if (!name) return;

    const body = new URLSearchParams({
      userId: userId.toString(),
      name,
      beads: JSON.stringify(beads),
    });

    // If designId exists, update instead of insert
    if (designId) {
      body.append("id", designId.toString());
    }

    const response = await fetch(`${DOMAIN}/api/saveDesign.php`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const result = await response.json();
    if (result.success) {
      setDesignId(result.id);
      setDesignName(name);

      setFadeState("in");
      setShowSaveBanner(true);
      setTimeout(() => setFadeState("out"), 2700);
      setTimeout(() => setShowSaveBanner(false), 3000);
    } else {
      console.error("Save failed:", result.error);
    }
  }

  async function loadDesign() {
    const idStr = prompt("Enter design ID to load:");
    if (!idStr) return;
    const id = parseInt(idStr);
    const response = await fetch(`${DOMAIN}/api/loadDesigns.php?id=${id}`);
    const result = await response.json();
    if (result.success) {
      const loadedBeads = JSON.parse(result.design.beads);

      // preload images for loaded beads
      for (const b of loadedBeads) {
        if (b.image && !beadImagesRef.current[b.image]) {
          try {
            const img = await loadImage(b.image);
            beadImagesRef.current[b.image] = img;
          } catch (err) {
            console.warn("Failed to load bead image", b.image, err);
          }
        }
      }

      setBeads(loadedBeads);
      setDesignName(result.design.name);
      alert(`Loaded design "${result.design.name}"`);
    } else {
      alert("Load failed: " + result.error);
    }
  }

  async function listDesigns() {
    const response = await fetch(`${DOMAIN}/api/listDesign.php`);
    const result = await response.json();
    if (result.success) {
      alert(
        "Saved designs:\n" +
        result.designs.map((d: any) => `${d.id}: ${d.name}`).join("\n")
      );
    } else {
      alert("Failed to list designs");
    }
  }


  // DRAG LAYER → custom preview
  const { item, isDragging, clientOffset } = useDragLayer((monitor) => ({
    item: monitor.getItem() as DragItem | null,
    isDragging: monitor.isDragging(),
    clientOffset: monitor.getClientOffset(),
  }));

  // DRAW LOOP
  useEffect(() => {
    if (!ready) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    async function draw() {
      if (!canvas || !ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const cssW = canvas.width / dpr;
      const cssH = canvas.height / dpr;
      const cx = cssW / 2;
      const cy = cssH / 2;

      const R = (braceletSizes[braceletSize] * pxPerMM) / 2;
      const trackRadius = R - ringThickness / 2;

      ctx.clearRect(0, 0, cssW, cssH);
      const {ring, logo, leaves, receipt, disc } = assetsRef.current;

      const currentTheme = themeConfig[theme];
      let bg: HTMLImageElement | undefined;

      if (theme === "custom" && customBg) {
        // reuse already-loaded image if possible
        if (beadImagesRef.current[customBg]) {
          bg = beadImagesRef.current[customBg];
        } else {
          try {
            const img = await loadImage(customBg);
            beadImagesRef.current[customBg] = img;
            bg = img;
          } catch (err) {
            console.warn("Failed to load custom background:", err);
          }
        }
      } else {
        bg = beadImagesRef.current[currentTheme.bg];
      }

      if (bg) {
        const scale = Math.max(cssW / bg.width, cssH / bg.height);
        ctx.drawImage(
          bg,
          (cssW - bg.width * scale) / 2,
          (cssH - bg.height * scale) / 2,
          bg.width * scale,
          bg.height * scale
        );
      }

      // if (leaves) {
      //   const maxScale = 0.9; // shrink factor, 70% of full fit
      //   const scale = Math.min(cssW / leaves.width, cssH / leaves.height) * maxScale;
      //   const w = leaves.width * scale;
      //   const h = leaves.height * scale;

      //   // draw bottom-left
      //   ctx.drawImage(leaves, 0, cssH - h, w, h);
      // }


      if (ring) {
        // slightly enlarge the placeholder (so beads appear outside)
        const ringScale = 1.08; // increase 8% — adjust if needed
        const d = 2 * R * ringScale;
        ctx.drawImage(ring, cx - d / 2, cy - d / 2, d, d);
      }

      if (isHoveringRing) {
        ctx.save();
        ctx.strokeStyle = "rgba(235,147,133,0.9)";
        ctx.lineWidth = 10;
        ctx.shadowBlur = 20;
        ctx.shadowColor = "rgba(235,147,133,0.7)";
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      if (assetsRef.current.waiting) {
        const waiting = assetsRef.current.waiting;
        const waitingW = 400; // adjust to match design
        const waitingH = (waiting.height / waiting.width) * waitingW;
        ctx.drawImage(waiting, cx - waitingW / 2, cy + R + 80, waitingW, waitingH);
      }

      // --- ghost preview (snap slot) ---
      if (isDragging && item && clientOffset) {
        const beadMM = item.size;
        const beadPx = beadMM * pxPerMM;
        const trackRadiusMM =
          (braceletSizes[braceletSize] - ringThickness / pxPerMM) / 2;

        const rect = canvas.getBoundingClientRect();
        const cxPage = rect.left + rect.width / 2;
        const cyPage = rect.top + rect.height / 2;
        const dx = clientOffset.x - cxPage;
        const dy = clientOffset.y - cyPage;
        const cursorAngle = normalizeAngle(Math.atan2(dy, dx));

        // find anchor bead
        let anchor: Bead | null = null;
        let minDiff = Infinity;
        for (const b of beads) {
          let diff = Math.abs(cursorAngle - b.angle);
          if (diff > Math.PI) diff = 2 * Math.PI - diff;
          if (diff < minDiff) {
            minDiff = diff;
            anchor = b;
          }
        }

        let previewAngle = cursorAngle;
        if (anchor) {
          const beadDelta = beadDeltaAngle(beadMM, trackRadiusMM) / 2;
          const anchorDelta = beadDeltaAngle(anchor.size, trackRadiusMM) / 2;
          const offset = beadDelta + anchorDelta;

          const leftAngle = normalizeAngle(anchor.angle - offset);
          const rightAngle = normalizeAngle(anchor.angle + offset);

          // pick free side
          const leftFree = !isOccupied(beads, leftAngle, beadMM, trackRadiusMM);
          const rightFree = !isOccupied(beads, rightAngle, beadMM, trackRadiusMM);

          if (leftFree && rightFree) {
            const diff = cursorAngle - anchor.angle;
            const side =
              (diff > 0 && diff < Math.PI) || diff < -Math.PI ? "right" : "left";
            previewAngle = side === "right" ? rightAngle : leftAngle;
          } else if (leftFree) {
            previewAngle = leftAngle;
          } else if (rightFree) {
            previewAngle = rightAngle;
          } else {
            previewAngle = null;
          }
        }

        if (previewAngle !== null) {
          const bx = cx + trackRadius * Math.cos(previewAngle);
          const by = cy + trackRadius * Math.sin(previewAngle);

          ctx.save();
          ctx.beginPath();
          ctx.arc(bx, by, beadPx / 2, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255,192,203,0.4)";
          ctx.fill();
          ctx.restore();
        }
      }

      // draw placed beads
      beads.forEach((b) => {
      const beadPx = b.size * pxPerMM;
      let bx: number;
      let by: number;

      if (b.location === "waiting") {
        const slotSize = 50;
        bx = cx - (waitingWidth / 2) + b.socketIndex * slotSize + slotSize / 2;
        by = cy + R + 100;
      } else {
        // ✅ Correct circular bracelet placement
        const trackRadius = R - ringThickness / 2;
        bx = cx + trackRadius * Math.cos(b.angle);
        by = cy + trackRadius * Math.sin(b.angle);
      }

      const img = b.image ? beadImagesRef.current[b.image] : undefined;
      if (img) {
        const rotation = b.position?.angle ?? 0;
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(rotation);
        ctx.beginPath();
        ctx.arc(0, 0, beadPx / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, -beadPx / 2, -beadPx / 2, beadPx, beadPx);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(bx, by, beadPx / 2, 0, Math.PI * 2);
        ctx.fillStyle = b.color || "#ff00ff";
        ctx.fill();
      }
    });

      requestAnimationFrame(draw);
    }
    draw();
  }, [ready, beads, braceletSize, theme, customBg]);
  const [menuOpen, setMenuOpen] = useState(false);



  function AsyncPreview() {
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    useEffect(() => {
      (async () => {
        const data = await getCanvasImage();
        setImgSrc(data);
      })();
    }, [beads, theme, customBg]);

    if (!imgSrc) return <span className="text-gray-500 italic">Loading preview...</span>;

    return (
      <div className="relative">
        <img
          src={imgSrc}
          alt="Bracelet Preview"
          className="max-h-[550px] max-w-[550px] object-contain"
        />

        {/* Overlayed text */}
        <div className="absolute bottom-6 left-6 right-6 bg-white/70 backdrop-blur-sm p-3">
          <h3 className="text-xl font-handwriting text-black text-start">
            {saveName || "Untitled Design"}
          </h3>
          <p className="text-sm italic text-gray-700 whitespace-pre-line text-end">
            {description || "Write something about your design..."}
          </p>
        </div>
      </div>
    );
  }

  const handleDroppedOutside = (id: string) => {
    updateBeads((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <div ref={wrapRef} className="relative w-full h-full">
      <audio ref={audioRef} loop muted>
        <source src="/bg-music.mp3" type="audio/mpeg" />
      </audio>

      {/* <div className="absolute left-3 bottom-3 z-10 flex gap-2">
        {(["S", "M", "L"] as const).map((sz) => (
          <button
            key={sz}
            onClick={() => setBraceletSize(sz)}
            className={`px-3 py-1 rounded ${braceletSize === sz ? "bg-pink-500 text-white" : "bg-white/80"
              }`}
          >
            {sz}
          </button>
        ))}
      </div> */}

      {/* Custom drag preview */}
      {isDragging && item && clientOffset && (() => {
        const beadMM = item.size;
        const beadPx = beadMM * pxPerMM;

        return (
          <div
            style={{
              position: "fixed",
              left: clientOffset.x - beadPx / 2,
              top: clientOffset.y - beadPx / 2,
              width: beadPx,
              height: beadPx,
              pointerEvents: "none",
              transform: "scale(1)",
              transition: "transform 0.1s ease-in-out",
              borderRadius: "50%",
              background: item.image
                ? `url(${item.image}) center/cover`
                : item.color,
              opacity: 0.9,
              zIndex: 9999,
            }}
          />
        );
      })()}

      {/* Dropdown Menu */}
      <div className="absolute right-8 bottom-8 z-20">
        <div className="flex gap-5">
          <button
            onClick={undo}
            className="relative w-12 h-12 rounded-full flex items-center justify-center shadow-md cursor-pointer group hover:bg-[#EB9385] p-3"
          >
            <img src="./icons/backward.svg" alt="Undo" />
            <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 text-xs text-white bg-black/80 rounded opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200">
              Undo
            </span>
          </button>

          <button
            onClick={redo}
            className="relative w-12 h-12 rounded-full flex items-center justify-center shadow-md cursor-pointer group hover:bg-[#EB9385] p-3"
          >
            <img src="./icons/forward.svg" alt="Redo" />
            <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 text-xs text-white bg-black/80 rounded opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200">
              Redo
            </span>
          </button>
          {/* Toggle button (the round one at bottom) */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md cursor-pointer duration-300 p-3
              ${menuOpen ? "bg-[#EB9385]" : "hover:bg-[#EB9385]"}`}
          >
            <img src="./icons/list.svg" alt="" /> {/* hamburger icon */}
          </button>
        </div>


        {/* Dropdown content */}
        {menuOpen && (
          <div
    className="absolute bottom-[80px] right-0 translate-x-[40%] 
               bg-[#EB9385] shadow-lg py-3 px-5 space-y-1 text-white 
               handdrawn-border z-[9999] animate-fade-in"
    style={{
      borderRadius: "6px",
      minWidth: "150px",
    }}
  >
            {[
              { label: "BUY", icon: "./icons/shopping-cart.svg", action: saveDesign },
              { label: "SHARE", icon: "./icons/paper-clip-2.svg", action: () => setShareOpen(true) },
              { label: "SAVE", icon: "./icons/pin.svg", action: () => setSaveOpen(true) },
              { label: "REDO", icon: "./icons/sync.svg", action: () => setRedoOpen(true) },
              { label: "EXIT", icon: "./icons/logout.svg", action: listDesigns },
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={btn.action}
                className="group relative flex w-full items-center gap-3 px-4 py-1.5 overflow-visible cursor-pointer"
              >
                {/* Expanding + fading background */}
                <span className="absolute -inset-x-8 -inset-y-1 rounded-md bg-[#DA5373] opacity-0 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:-inset-x-6 group-hover:-inset-y-2"></span>

                {/* Icon */}
                <span className="relative z-10 flex-shrink-0">
                  <img src={btn.icon} alt="" width={26} />
                </span>

                {/* Text */}
                <span className="relative z-10 text-lg font-medium">{btn.label}</span>
              </button>
            ))}
          </div>
        )}

      </div>

      {/* REDO Modal */}
      <ConfirmationModal
        open={redoOpen}
        title="Start from scratch?"
        onYes={() => {
          setTimeout(() => updateBeads(() => []), 0); // ✅ defer state update
          setRedoOpen(false);
        }}
        onNo={() => setRedoOpen(false)}
      />

      {/* Save Modal */}
      <ConfirmationModal
        open={saveOpen}
        title="Save to MyWorks as"
        onYes={() => {
          saveDesign(); // call your existing save
          setSaveOpen(false);
        }}
        onNo={() => setSaveOpen(false)}
      >
        <input
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
          className="border px-2 py-1 text-sm text-pink-500"
        />
      </ConfirmationModal>
      {/* ☕ Saved Banner */}
      {showSaveBanner && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div
            className={`relative w-[360px] h-[90px] flex items-center justify-center text-xl text-black
                        ${fadeState === "in" ? "animate-fade-in" : "animate-fade-out"}`}
            style={{
              backgroundImage: "url('/ui/alert-banner.png')",
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
            }}
          >
            <span className="pr-2 font-semibold">Saved to MyWork!</span>
            <img src="/icons/coffee-cup-2.svg" alt="icon" className="w-8 h-8" />
          </div>
        </div>
      )}

      {/* ⚠️ Not Enough Space Banner */}
      {showSpaceBanner && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div
            className={`relative w-[360px] h-[90px] flex items-center justify-center text-lg text-black
                        ${fadeState === "in" ? "animate-fade-in" : "animate-fade-out"}`}
            style={{
              backgroundImage: "url('/ui/alert-banner.png')",
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
            }}
          >
            <span className="pr-2 font-medium">Not enough space!</span>
          </div>
        </div>
      )}
      
      {shareOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50">
          <div className="relative w-[1000px] h-[700px] bg-[#FBF0E6] p-8 flex shadow-lg">
            {/* Close */}
            <button
              onClick={() => setShareOpen(false)}
              className="absolute top-4 right-4 text-2xl font-bold text-gray-700 hover:text-black"
            >
              ✕
            </button>

            {/* Left – preview with live overlay */}
            <div
              ref={previewRef}
              className="flex-1 flex items-center justify-center mr-6 relative"
            >
              {getCanvasImage ? (
                <AsyncPreview />
              ) : (
                <span className="text-gray-500 italic">No preview</span>
              )}
            </div>

            {/* Right – share form */}
            <div className="w-[400px] flex flex-col">
              <h2 className="text-3xl mb-6 text-center">Share Your Creation</h2>

              <label className="text-lg mb-1">Name</label>
              <input
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                className="w-full border px-3 py-2 mb-4 bg-white text-end text-[#EB9385]"
              />

              <label className="text-lg mb-1">Description</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border px-3 py-2 mb-4 bg-white text-end text-[#EB9385]"
              />

              {/* <p className="text-lg mb-2">Publish on</p>
              <div className="flex gap-6 mb-0">
                <img src="/icons/instagram.png" alt="IG" className="w-8 cursor-pointer" />
                <img src="/icons/facebook.png" alt="FB" className="w-8 cursor-pointer" />
                <img src="/icons/discord.png" alt="Discord" className="w-8 cursor-pointer" />
              </div>
              <div className="my-6 text-center text-gray-500">--------- or ---------</div> */}
              <div className="flex gap-6 justify-start items-center">
                <button
                    onClick={() => exportDesignWithText(saveName, description)}
                    className="bg-[#EB9385] text-white px-8 py-1 shadow hover:brightness-110"
                  >
                  Save Image
                </button>
                <span>to device</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay for draggable placed beads */}
      {wrapRef.current &&
        beads.map((b) => {
          const beadPx = b.size * pxPerMM;
          const rect = wrapRef.current.getBoundingClientRect();
          const cx = rect.width / 2;
          const cy = rect.height / 2;
          const R = (braceletSizes[braceletSize] * pxPerMM) / 2;
          const trackRadius = R - ringThickness / 2;

          let x: number;
          let y: number;
          if (b.location === "waiting") {
            const slotSize = 50;
            x = cx - (waitingWidth / 2) + b.socketIndex * slotSize + slotSize / 2;
            y = cy + R + 100;
          } else {
            x = cx + trackRadius * Math.cos(b.angle);
            y = cy + trackRadius * Math.sin(b.angle);
          }

          x = Number.isFinite(x) ? x : 0;
          y = Number.isFinite(y) ? y : 0;

          return (
            <DraggableBead
              key={b.id}
              bead={b}
              x={x}
              y={y}
              beadPx={beadPx}
              onRemove={(id) => setBeads((prev) => prev.filter((bb) => bb.id !== id))}
            />
          );
        })}

        {/* Logo Element (same position as before) */}
        <a href="#">
          <img
            src="/Logo-light.png"
            alt="Logo"
            className="absolute top-[30px] left-[50px] w-[150px] z-[40] opacity-100"
          />
        </a>

        {/* Recorder Overlay */}
        <div
          className="absolute top-0 right-[20%] z-[60] overflow-hidden 
                    w-[500px] h-[500px] pointer-events-none" // 👈 disable pointer capture
        >
          <div
            onClick={toggleMusic}
            className="w-full h-full transform
                      translate-y-[-80%]
                      hover:translate-y-[-60%]
                      transition-all duration-500 ease-in-out
                      cursor-pointer flex items-center justify-center
                      pointer-events-auto" // 👈 re-enable click for the inner div
            style={{
              backgroundImage: `url('${themeConfig[theme].disc}')`,
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
              filter: musicOn ? "brightness(1)" : "brightness(0.8) grayscale(40%)",
            }}
          />
        </div>

        {/* Receipt Overlay */}
        <div className="absolute bottom-0 left-[15%] z-10 overflow-hidden
             w-full h-[90vh] max-h-[780px] pointer-events-none"> 
          {/* Inner receipt (slides inside wrapper) */}
          <div
            className="group w-[70vw] max-w-[360px] h-full shadow-lg transform
                  -translate-x-10 translate-y-[90%]
                  hover:translate-y-[25%] hover:translate-x-12
                  transition-all duration-500 ease-in-out cursor-pointer
                  flex flex-col px-6 py-8 pointer-events-auto"
            style={{
              transform: "rotate(8.67deg)",
              backgroundImage: "url('/ui/receipt-bg.png')",
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
            }}
          >
            {/* Top Logo */}
            <div className="flex justify-center mb-3">
              <img src="/Logo.png" alt="Logo" className="h-10 object-contain" />
            </div>

            {/* Date */}
            <div className="text-center mb-4">
              <p className="text-xs">{new Date().toDateString()}</p>
            </div>

            {/* Project ID */}
            <div className="border border-dashed border-gray-400 rounded-md px-2 py-1 mb-4 text-center">
              <span className="block text-xs">Project ID</span>
              <p className="font-bold text-sm">
                {designName || "Anonymous Project 001"}
              </p>
            </div>

            {/* Details */}
            <div className="flex-1 text-sm font-mono space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Product Type</span>
                <span>Online Design</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">User Name</span>
                <span>Visitor 003</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Customer Type</span>
                <span>Non-backer</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email</span>
                <span>Missing Input</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Operation Serial</span>
                <span>0017-D0R3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Weight</span>
                <span>95 grams</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Component Count</span>
                <span>{beads.length} pcs</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-gray-600">Total</span>
                <span>$ {(beads.length * 5).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Operator</span>
                <span>POESIS.design</span>
              </div>
            </div>

            {/* Bottom Receipt Logo */}
            <div className="flex justify-center items-center mt-6">
              <img
                src="/ui/receipt-logo.png"
                alt="Receipt Logo"
                className="h-14 object-contain"
              />
            </div>
          </div>
        </div>


      {/* Theme Selector (top-right corner) */}
      <div className="absolute top-6 right-6 z-[50] flex flex-col gap-3">
        {(["wood", "stone", "paper"] as const).map((key) => {
          const active = theme === key;
          const preview =
            key === "wood"
              ? "/wood-bg.png"
              : key === "stone"
              ? "/marble-bg.png"
              : "/paper-bg.jpg";
          return (
            <img
              key={key}
              src={preview}
              alt={`${key} theme`}
              onClick={() => {
                setCustomBg(null);
                setTheme(key);
              }}
              className={`w-24 h-14 object-cover rounded-md border-2 cursor-pointer transition-all 
                duration-200 hover:scale-105 ${
                  active ? "border-pink-500" : "border-white/40"
                }`}
            />
          );
        })}

        {/* 4️⃣ Custom Upload Button (opens modal) */}
        <div
          onClick={() => setUploadModalOpen(true)}
          className={`relative w-24 h-14 rounded-md border-2 border-dashed border-white/60 
                      cursor-pointer flex items-center justify-center 
                      hover:scale-105 transition-all duration-200 ${
                        theme === "custom" ? "border-pink-500" : "border-white/40"
                      }`}
          style={{
            backgroundImage:
              customBg ? `url(${customBg})` : "url('/ui/transparent-bg.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {!customBg && (
            <img
              src="/icons/folder-plus.png"
              alt="Add Folder"
              className="w-6 h-6 opacity-80"
            />
          )}
        </div>
      </div>

      {/* 🖼 Custom Background Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div
            className="relative bg-[#FBF0E6] w-[480px] h-[320px] rounded-lg shadow-lg p-8 flex flex-col items-center justify-center text-center border border-[#EB9385]"
          >
            {/* Close button */}
            <button
              onClick={() => setUploadModalOpen(false)}
              className="absolute top-4 right-4 text-xl font-bold text-gray-600 hover:text-black"
            >
              ✕
            </button>

            <h2 className="text-2xl mb-4 text-[#EB9385] font-semibold">Upload Custom Background</h2>

            {/* Drag-and-Drop / Click Area */}
            <label
              htmlFor="modalFileInput"
              className="w-full h-[160px] border-2 border-dashed border-[#EB9385]/60 rounded-md flex flex-col items-center justify-center gap-3 cursor-pointer bg-white/70 hover:bg-[#FFF2EE] transition-all"
            >
              <img src="/icons/folder-plus.png" alt="Upload" className="w-8 h-8 opacity-80" />
              <span className="text-[#EB9385] text-sm">Drag & drop image or click to browse</span>
              <input
                id="modalFileInput"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  handleCustomBgUpload(e);
                  setUploadModalOpen(false);
                }}
              />
            </label>

            <p className="text-xs text-gray-500 mt-4">
              Supported formats: JPG, PNG, WebP
            </p>
          </div>
        </div>
      )}


      {/* Leaves Overlay (changes with theme) */}
      {themeConfig[theme].leaves && (
        <img
          src={themeConfig[theme].leaves}
          alt="Decorative Leaves"
          className="absolute bottom-0 left-0 w-[45%] max-w-[400px] z-0 pointer-events-none opacity-90"
        />
      )}


      <canvas ref={canvasRef} className="w-full h-full z-50" />
    </div>
  );
}
