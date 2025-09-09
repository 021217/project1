"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

type Bead = {
  id: string;
  x: number;           // free-drag screen position (CSS px)
  y: number;
  size: number;        // diameter (px)
  color: string;
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

export default function BeadCanvas() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const assetsRef = useRef<{ bg?: HTMLImageElement; ring?: HTMLImageElement }>({});
  const [ready, setReady] = useState(false);

  // ==== Ring setup ====
  // R is the ring's OUTER radius (where the placeholder image is drawn to).
  // ringThickness is the visual thickness of your placeholder ring image (px).
  // The snapping "track" is at the CENTER of that thickness.
  const R = 180;              // outer radius in px (adjust to match your art)
  const ringThickness = 36;   // thickness of the ring image (px) → adjust to match art
  const trackRadius = R - ringThickness / 2; // CENTER of ring thickness (the line we snap to)

  // snapping config
  const snapTolerance = 40;        // how close to the track to snap (px)
  const stackTightness = 0.95;     // 0.9–1.0. Lower = tighter stacking

  const [beads, setBeads] = useState<Bead[]>([
    { id: "b1", x: 200, y: 150, size: 28, color: "#f59e0b" },
    { id: "b2", x: 250, y: 200, size: 20, color: "#06b6d4" },
    { id: "b3", x: 300, y: 250, size: 24, color: "#84cc16" },
  ]);
  const [dragging, setDragging] = useState<string | null>(null);

  // music
  const [musicOn, setMusicOn] = useState(false);

  function toggleMusic() {
    setMusicOn((prev) => {
      const next = !prev;
      const audio = audioRef.current;
      if (audio) {
        if (next) {
          audio.muted = false;
          audio.play().catch(() => {
            // ignore autoplay block errors
          });
        } else {
          audio.pause();
        }
      }
      return next;
    });
  }

  // ==== sizing ====
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

  // ==== assets ====
  useEffect(() => {
    (async () => {
      const [bg, ring] = await Promise.all([
        loadImage("/wood-bg.png"),
        loadImage("/circle_placeholder.png"),
      ]);
      assetsRef.current = { bg, ring };
      setReady(true);
    })();
  }, []);

  // ==== draw loop ====
  useEffect(() => {
    if (!ready) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    function draw() {
      const cssW = canvas.clientWidth || canvas.width / (window.devicePixelRatio || 1);
      const cssH = canvas.clientHeight || canvas.height / (window.devicePixelRatio || 1);
      const cx = cssW / 2;
      const cy = cssH / 2;

      ctx.clearRect(0, 0, cssW, cssH);

      const { bg, ring } = assetsRef.current;

      // bg cover
      if (bg) {
        const scale = Math.max(cssW / bg.width, cssH / bg.height);
        const dw = bg.width * scale;
        const dh = bg.height * scale;
        const dx = (cssW - dw) / 2;
        const dy = (cssH - dh) / 2;
        ctx.drawImage(bg, dx, dy, dw, dh);
      }

      // ring image: draw using OUTER radius R
      if (ring) {
        const d = 2 * R;
        ctx.drawImage(ring, cx - R, cy - R, d, d);
      }

      // guide line: center line of ring thickness (track)
      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(cx, cy, trackRadius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(30,41,59,0.6)"; // slate-800 w/ alpha
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // beads
      beads.forEach((b) => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.fill();
        ctx.strokeStyle = "#1e293b";
        ctx.stroke();
      });

      requestAnimationFrame(draw);
    }

    draw();
  }, [ready, beads, trackRadius]);

  // ==== helpers ====
  function canvasPoint(e: React.MouseEvent) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  // convert (x,y) to arc length on the track (center line)
  function xyToArc(x: number, y: number) {
    const canvas = canvasRef.current!;
    const cx = canvas.clientWidth / 2;
    const cy = canvas.clientHeight / 2;
    const dx = x - cx;
    const dy = y - cy;
    const angle = Math.atan2(dy, dx); // -π..π
    const C = 2 * Math.PI * trackRadius;
    const arc = ((angle + 2 * Math.PI) % (2 * Math.PI)) * trackRadius;
    return { angle, arc, cx, cy, C };
  }

  // Only consider neighbors that are currently snapped on the track
  function onTrackArcOf(bead: Bead): number | null {
    const { cx, cy } = xyToArc(0, 0); // just to read cx,cy from current canvas
    const dx = bead.x - cx;
    const dy = bead.y - cy;
    const dist = Math.hypot(dx, dy);
    if (Math.abs(dist - trackRadius) > snapTolerance) return null; // not on track
    const angle = Math.atan2(dy, dx);
    return ((angle + 2 * Math.PI) % (2 * Math.PI)) * trackRadius;
  }

  // stacking snap on the track centerline
  function snapBead(id: string) {
    const canvas = canvasRef.current!;
    const cx = canvas.clientWidth / 2;
    const cy = canvas.clientHeight / 2;

    setBeads((prev) => {
      const others = prev.filter((b) => b.id !== id);
      const bead = prev.find((b) => b.id === id);
      if (!bead) return prev;

      const dx = bead.x - cx;
      const dy = bead.y - cy;
      const dist = Math.hypot(dx, dy);

      // Snap only if within tolerance of the centerline
      if (Math.abs(dist - trackRadius) <= snapTolerance) {
        // current target arc from drop position
        const { arc: targetArc0, C } = xyToArc(bead.x, bead.y);

        // arcs of other beads that are already on the track
        const neighborArcs = others
          .map(onTrackArcOf)
          .filter((a): a is number => a !== null);

        // Try place at nearest available arc by shifting left/right
        let target = targetArc0;
        const step = bead.size * stackTightness; // shift by bead diameter (slightly tight)
        let tries = 0;

        function overlaps(a: number) {
          return neighborArcs.some((oa) => {
            const diff = Math.abs(oa - a);
            const wrapped = Math.min(diff, C - diff); // shortest arc distance around circle
            // Approximate as: no overlap if center-to-center >= (sum of radii)/2 in arc space
            return wrapped < bead.size / 2; // treat neighbors as same scale on arc
          });
        }

        while (overlaps(target)) {
          target += step * (tries % 2 === 0 ? 1 : -1); // alternate directions
          if (target < 0) target += C;
          if (target > C) target -= C;
          tries++;
          if (tries > 200) break; // safety
        }

        const angle = (target / trackRadius) % (2 * Math.PI);
        const snapped: Bead = {
          ...bead,
          x: cx + Math.cos(angle) * trackRadius,
          y: cy + Math.sin(angle) * trackRadius,
        };
        return [...others, snapped];
      }

      // else keep where dropped
      return [...others, bead];
    });
  }

  // ==== interactions ====
  function getBeadAt(x: number, y: number) {
    return beads.find((b) => Math.hypot(b.x - x, b.y - y) <= b.size / 2);
  }

  function onMouseDown(e: React.MouseEvent) {
    const { x, y } = canvasPoint(e);
    const bead = getBeadAt(x, y);
    if (bead) setDragging(bead.id);
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!dragging) return;
    const { x, y } = canvasPoint(e);
    setBeads((prev) => prev.map((b) => (b.id === dragging ? { ...b, x, y } : b)));
  }

  function onMouseUp() {
    if (!dragging) return;
    snapBead(dragging);
    setDragging(null);
  }

  return (
    <div ref={wrapRef} className="relative w-full h-full">
      {/* Music (OFF by default) */}
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

      <canvas
        ref={canvasRef}
        className="w-full h-full border rounded-xl"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
      />
    </div>
  );
}
