"use client";

import { useEffect, useRef, useState } from "react";

type Bead = { id: string; x: number; y: number; color: string };

export default function BeadCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [beads, setBeads] = useState<Bead[]>([
    { id: "b1", x: 200, y: 150, color: "#f59e0b" },
    { id: "b2", x: 250, y: 150, color: "#06b6d4" },
    { id: "b3", x: 300, y: 150, color: "#84cc16" },
  ]);
  const [dragging, setDragging] = useState<string | null>(null);

  // Draw beads
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw ring guide
    ctx.beginPath();
    ctx.arc(400, 240, 120, 0, Math.PI * 2);
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw beads
    beads.forEach((b) => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, 14, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.fill();
      ctx.strokeStyle = "#1e293b";
      ctx.stroke();
    });
  }, [beads]);

  // Mouse events
  function getBeadAt(x: number, y: number) {
    return beads.find(
      (b) => Math.hypot(b.x - x, b.y - y) <= 14
    );
  }

  function onMouseDown(e: React.MouseEvent) {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const bead = getBeadAt(x, y);
    if (bead) setDragging(bead.id);
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!dragging) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setBeads((prev) =>
      prev.map((b) => (b.id === dragging ? { ...b, x, y } : b))
    );
  }

  function onMouseUp() {
    setDragging(null);
  }

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={480}
      className="border rounded-xl bg-white"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    />
  );
}
