"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDrop } from "react-dnd";

type Bead = {
  id: string;
  socketIndex: number; // 👈 instead of raw x/y
  size: number;
  color: string;
};

type DragItem =
  | {
      type: "TEMPLATE_BEAD";
      id: string;
      name: string;
      size: number;
      color: string;
    }
  | {
      type: "PLACED_BEAD";
      id: string;
      socketIndex: number;
      size: number;
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

  const R = 180;
  const ringThickness = 36;
  const trackRadius = R - ringThickness / 2;

  const SOCKET_COUNT = 12;
  const socketPositions = Array.from({ length: SOCKET_COUNT }, (_, i) => {
    const angle = (i / SOCKET_COUNT) * 2 * Math.PI - Math.PI / 2;
    return { angle };
  });

  const [beads, setBeads] = useState<Bead[]>([]);
  const [ghostSocket, setGhostSocket] = useState<number | null>(null);

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
        audio.play().catch(() => {});
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
      const [bg, ring] = await Promise.all([
        loadImage("/wood-bg.png"),
        loadImage("/circle_placeholder.png"),
      ]);
      assetsRef.current = { bg, ring };
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

      ctx.clearRect(0, 0, cssW, cssH);
      const { bg, ring } = assetsRef.current;

      if (bg) {
        const scale = Math.max(cssW / bg.width, cssH / bg.height);
        const dw = bg.width * scale;
        const dh = bg.height * scale;
        const dx = (cssW - dw) / 2;
        const dy = (cssH - dh) / 2;
        ctx.drawImage(bg, dx, dy, dw, dh);
      }

      if (ring) {
        const d = 2 * R;
        ctx.drawImage(ring, cx - R, cy - R, d, d);
      }

      // draw sockets
      socketPositions.forEach(({ angle }, i) => {
        const sx = cx + trackRadius * Math.cos(angle);
        const sy = cy + trackRadius * Math.sin(angle);
        ctx.beginPath();
        ctx.arc(sx, sy, 6, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(100,100,100,0.4)";
        ctx.stroke();

        if (ghostSocket === i) {
          ctx.beginPath();
          ctx.arc(sx, sy, 14, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(0,150,255,0.6)";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });

      // draw placed beads
      beads.forEach((b) => {
        const { angle } = socketPositions[b.socketIndex];
        const bx = cx + trackRadius * Math.cos(angle);
        const by = cy + trackRadius * Math.sin(angle);

        ctx.beginPath();
        ctx.arc(bx, by, b.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = b.color || "#ff00ff";
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#000";
        ctx.stroke();
      });

      requestAnimationFrame(draw);
    }

    draw();
  }, [ready, beads, trackRadius, ghostSocket]);

  // drop handler
  const [, drop] = useDrop(() => ({
    accept: ["TEMPLATE_BEAD", "PLACED_BEAD"],
    hover: (item: DragItem, monitor) => {
      const client = monitor.getClientOffset();
      const bounds = canvasRef.current?.getBoundingClientRect();
      const canvas = canvasRef.current;
      if (!client || !bounds || !canvas) return;

      const dpr = window.devicePixelRatio || 1;
      const cssW = canvas.width / dpr;
      const cssH = canvas.height / dpr;
      const cx = cssW / 2;
      const cy = cssH / 2;

      const x = client.x - bounds.left;
      const y = client.y - bounds.top;

      // find nearest socket
      let nearest: number | null = null;
      let minDist = Infinity;
      socketPositions.forEach(({ angle }, i) => {
        const sx = cx + trackRadius * Math.cos(angle);
        const sy = cy + trackRadius * Math.sin(angle);
        const dist = Math.hypot(x - sx, y - sy);
        if (dist < minDist) {
          minDist = dist;
          nearest = i;
        }
      });
      setGhostSocket(nearest);
    },
    drop: (item: DragItem, monitor) => {
      const client = monitor.getClientOffset();
      const bounds = canvasRef.current?.getBoundingClientRect();
      const canvas = canvasRef.current;
      if (!client || !bounds || !canvas) return;

      const dpr = window.devicePixelRatio || 1;
      const cssW = canvas.width / dpr;
      const cssH = canvas.height / dpr;
      const cx = cssW / 2;
      const cy = cssH / 2;

      const x = client.x - bounds.left;
      const y = client.y - bounds.top;

      // recalc nearest socket at drop time
      let nearest: number | null = null;
      let minDist = Infinity;
      socketPositions.forEach(({ angle }, i) => {
        const sx = cx + trackRadius * Math.cos(angle);
        const sy = cy + trackRadius * Math.sin(angle);
        const dist = Math.hypot(x - sx, y - sy);
        if (dist < minDist) {
          minDist = dist;
          nearest = i;
        }
      });

      if (nearest === null) {
        console.warn("[drop] No socket found!");
        return;
      }

      const { angle } = socketPositions[nearest];
      const newBead: Bead = {
        id: "b" + Date.now(),
        socketIndex: nearest, // keep socket index
        size: item.size,
        color: item.color,
      };

      setBeads((prev) => {
        // overwrite bead at this socket if exists
        const filtered = prev.filter((b) => b.socketIndex !== nearest);
        return [...filtered, newBead];
      });

      console.log("[drop] Overwrite bead at socket", nearest, newBead);
      setGhostSocket(null);
    },
    end: () => {
      setGhostSocket(null);
    },
    collect: () => ({}),
  }));
  drop(wrapRef);

  // ─────────── SAVE / LOAD / SHARE ───────────
  function saveCanvas() {
    const blob = new Blob([JSON.stringify(beads, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "bead-canvas.json";   // 👈 user chooses folder when Save As dialog pops
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
          const parsed = JSON.parse(reader.result as string);
          setBeads(parsed);
          alert("Canvas loaded from file!");
        } catch {
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
      saveCanvas(); // fallback → just trigger download
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

      <canvas ref={canvasRef} className="w-full h-full border rounded-xl" />
    </div>
  );
}
