"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDrop } from "react-dnd";

type Bead = {
  id: string;
  socketIndex: number;
  size: number; // px diameter
  color: string;
  name?: string;
  image?: string;
};

type DragItem =
  | {
    type: "TEMPLATE_BEAD";
    id: string;
    name: string;
    size: number;
    color: string;
    image?: string;
  }
  | {
    type: "PLACED_BEAD";
    id: string;
    socketIndex: number;
    size: number;
    color: string;
    image?: string;
  };

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

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

  const assetsRef = useRef<{ bg?: HTMLImageElement; ring?: HTMLImageElement; logo?: HTMLImageElement; }>(
    {}
  );
  const [ready, setReady] = useState(false);

  const ringThickness = 36;

  // bracelet sizes in mm (S, M, L)
  const braceletSizes = { S: 55, M: 70, L: 80 };
  const pxPerMM = 4; // scale factor, adjust visually
  const [braceletSize, setBraceletSize] = useState<
    keyof typeof braceletSizes
  >("M");

  const [_, forceRerender] = useState(0);

  // music
  const [musicOn, setMusicOn] = useState(false);
  function toggleMusic() {
    const audio = audioRef.current;
    if (!audio) return;
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

  // preload assets
  useEffect(() => {
    (async () => {
      const [bg, ring, logo] = await Promise.all([
        loadImage("/wood-bg.png"),
        loadImage("/circle_placeholder.png"),
        loadImage("/Logo-light.png"),   // 👈 add this
      ]);
      assetsRef.current = { bg, ring, logo }; // 👈 store logo too
      setReady(true);
    })();
  }, []);

  // draw loop
  useEffect(() => {
    if (!ready) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    function draw() {
      if (!canvas || !ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const cssW = canvas.width / dpr;
      const cssH = canvas.height / dpr;
      const cx = cssW / 2;
      const cy = cssH / 2;

      const R = (braceletSizes[braceletSize] * pxPerMM) / 2;
      const trackRadius = R - ringThickness / 2;

      ctx.clearRect(0, 0, cssW, cssH);
      const { bg, ring, logo } = assetsRef.current;

      if (bg) {
        const scale = Math.max(cssW / bg.width, cssH / bg.height);
        const dw = bg.width * scale;
        const dh = bg.height * scale;
        const dx = (cssW - dw) / 2;
        const dy = (cssH - dh) / 2;
        ctx.drawImage(bg, dx, dy, dw, dh);
      }

      // draw logo top-left
      if (assetsRef.current.logo) {
        const logo = assetsRef.current.logo;
        const logoW = 120;  // 👈 adjust size
        const logoH = (logo.height / logo.width) * logoW;
        ctx.drawImage(logo, 20, 20, logoW, logoH); // 👈 (x=20,y=20) top-left
      }

      if (ring) {
        const d = 2 * R;
        ctx.drawImage(ring, cx - R, cy - R, d, d);
      }

      // --- sequential bead placement ---
      const circumference = Math.PI * braceletSizes[braceletSize] * pxPerMM;

      let angle = -Math.PI / 2; // start at top
      let usedLength = 0;

      const trackRadiusMM = (braceletSizes[braceletSize] - ringThickness / pxPerMM) / 2;
      beads.forEach((b) => {
        // convert bead size (mm) → pixels
        const beadPx = b.size * pxPerMM;

        // Angle subtended by bead (edge-to-edge along circle)
        const deltaAngle = beadDeltaAngle(b.size, trackRadiusMM);

        // if (usedLength + arcLength > circumference) return; // skip if too long

        const bx = cx + trackRadius * Math.cos(angle + deltaAngle / 2);
        const by = cy + trackRadius * Math.sin(angle + deltaAngle / 2);

        const img = b.image ? beadImagesRef.current[b.image] : undefined;

        if (img) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(bx, by, beadPx / 2, 0, Math.PI * 2);
          ctx.clip();

          // draw bead texture at correct scale
          ctx.drawImage(img, bx - beadPx / 2, by - beadPx / 2, beadPx, beadPx);

          // soft shading
          const shadow = ctx.createRadialGradient(
            bx, by, beadPx * 0.2,
            bx, by, beadPx / 2
          );
          shadow.addColorStop(0, "rgba(0,0,0,0)");
          shadow.addColorStop(1, "rgba(0,0,0,0.25)");
          ctx.fillStyle = shadow;
          ctx.fillRect(bx - beadPx / 2, by - beadPx / 2, beadPx, beadPx);

          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(bx, by, beadPx / 2, 0, Math.PI * 2);
          ctx.fillStyle = b.color || "#ff00ff";
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = "#000";
          ctx.stroke();
        }
        
        // usedLength += arcLength;
        angle += deltaAngle;
      });


      requestAnimationFrame(draw);
    }

    draw();
  }, [ready, beads, braceletSize]);

  // convert bead size (mm diameter) → arc length in mm along circle
  function beadArcLengthMM(beadMM: number, trackRadiusMM: number) {
    const angle = 2 * Math.asin((beadMM / 2) / trackRadiusMM); // radians
    return angle * trackRadiusMM; // arc length
  }
  function getMaxQuota(braceletSize: keyof typeof braceletSizes) {
    // trackRadius in mm, not pixels
    const trackRadiusMM =
      (braceletSizes[braceletSize] - ringThickness / pxPerMM) / 2;
    return 2 * Math.PI * trackRadiusMM; // full circumference arc length
  }
  function beadDeltaAngle(beadMM: number, trackRadiusMM: number) {
    return 2 * Math.asin((beadMM / 2) / trackRadiusMM);
  }
  // drop handler
  const [, drop] = useDrop(() => ({
    accept: ["TEMPLATE_BEAD", "PLACED_BEAD"],
    drop: (item: DragItem) => {
      const beadMM = item.size; // diameter in mm
      const trackRadiusMM = (braceletSizes[braceletSize] - ringThickness / pxPerMM) / 2;

      setBeads((prev) => {
        const usedQuota = prev.reduce(
          (sum, b) => sum + beadArcLengthMM(b.size, trackRadiusMM),
          0
        );
        const newBeadArc = beadArcLengthMM(beadMM, trackRadiusMM);
        const maxQuota = getMaxQuota(braceletSize);

        const total = usedQuota + newBeadArc;
        const max = getMaxQuota(braceletSize);

        // allow up to 2mm over quota
        const tolerance = 1;

        if (total > max + tolerance) {
          const remaining = Math.max(0, Math.floor(max - usedQuota));
          alert(
            `Not enough space! Only ${remaining} mm of arc left in ${braceletSize} bracelet.`
          );
          return prev; // ❌ reject
        }

        console.log(
          `[Quota] ${braceletSize}: used=${usedQuota.toFixed(2)}mm, new=${newBeadArc.toFixed(
            2
          )}mm, max=${max.toFixed(2)}mm`
        );

        const newBead: Bead = {
          id: "b" + Date.now(),
          socketIndex: prev.length,
          size: beadMM,
          color: item.color,
          name: item.name,
          image: item.image,
        };

        if (newBead.image && !beadImagesRef.current[newBead.image]) {
          loadImage(newBead.image).then((img) => {
            beadImagesRef.current[newBead.image!] = img;
            forceRerender((n) => n + 1);
          });
        }

        return [...prev, newBead];
      });
    },
    collect: () => ({}),
  }));
  drop(wrapRef);

  // ─────────── SAVE / LOAD / SHARE ───────────
  function saveCanvas() {
    const blob = new Blob([JSON.stringify(beads, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "bead-canvas.json";
    a.click();

    URL.revokeObjectURL(url);
  }

  function loadCanvas() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";

    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed: Bead[] = JSON.parse(reader.result as string);

          parsed.forEach((b) => {
            if (b.image && !beadImagesRef.current[b.image]) {
              loadImage(b.image).then((img) => {
                beadImagesRef.current[b.image!] = img;
                forceRerender((n) => n + 1);
              });
            }
          });

          setBeads(parsed);
          alert("Canvas loaded from file!");
        } catch (err) {
          console.error(err);
          alert("Error parsing JSON file.");
        }
      };
      reader.readAsText(file);
    };

    input.click();
  }

  async function shareCanvas() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(beads, null, 2));
      alert("Canvas copied to clipboard!");
    } catch {
      saveCanvas(); // fallback
      alert("Clipboard not available, file downloaded instead.");
    }
  }

  return (
    <div ref={wrapRef} className="relative w-full h-full">
      <audio ref={audioRef} loop muted>
        <source src="/bg-music.mp3" type="audio/mpeg" />
      </audio>

      {/* Music toggle button */}
      <button
        type="button"
        onClick={toggleMusic}
        className="absolute right-3 top-3 z-10 rounded-full bg-white/80 px-3 py-1 text-sm shadow hover:bg-white"
        title={musicOn ? "Music: On" : "Music: Off"}
      >
        {musicOn ? "🔊 On" : "🔇 Off"}
      </button>

      {/* Save / Load / Share buttons */}
      <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
        <button
          onClick={saveCanvas}
          className="rounded bg-white/80 px-3 py-1 text-sm shadow hover:bg-white"
        >
          Save
        </button>
        <button
          onClick={loadCanvas}
          className="rounded bg-white/80 px-3 py-1 text-sm shadow hover:bg-white"
        >
          Load
        </button>
        <button
          onClick={shareCanvas}
          className="rounded bg-white/80 px-3 py-1 text-sm shadow hover:bg-white"
        >
          Share
        </button>
      </div>

      {/* Bracelet size selector */}
      <div className="absolute left-3 bottom-3 z-10 flex gap-2">
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
      </div>

      {/* Canvas */}
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
