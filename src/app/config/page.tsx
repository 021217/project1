"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import BeadCanvas from "./BeadCanvas";
import RightOptionsPanel from "./rightOptionsPanel";

export type Bead = {
  id: string;
  socketIndex: number;
  size: number;
  color: string;
  name?: string;
  image?: string;
  angle: number;
  entryAngle?: number;
  exitAngle?: number;
  location?: "bracelet" | "waiting";
};

export default function Page() {
  const router = useRouter();
  const [beads, setBeads] = useState<Bead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Check login session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
    } else {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        Checking session...
      </div>
    );
  }

  // ✅ If logged in, show the actual bead editor
  return (
    <DndProvider backend={HTML5Backend}>
      <main className="flex justify-center items-center w-screen h-screen overflow-hidden">
        <div className="flex w-full h-full">
          {/* LEFT — BeadCanvas full height, width auto based on 0.77 ratio */}
          <div className="relative flex items-center justify-center h-full bg-[#00000008] flex-[0_0_auto]">
            <div
              className="relative h-full"
              style={{
                width: "77vh", // ← width always 0.77 of viewport height
                maxWidth: "calc(100vw - 520px)", // ensure it doesn’t overlap right panel
              }}
            >
              <BeadCanvas beads={beads} setBeads={setBeads} />
            </div>
          </div>

          {/* RIGHT — fills remaining space */}
          <div className="flex-1 h-full min-w-[520px] overflow-hidden">
            <RightOptionsPanel
              setPlacedBeads={setBeads}
              onFooter={(action) => {
                if (action.type === "clear_canvas") setBeads([]);
              }}
            />
          </div>
        </div>
      </main>

    </DndProvider>
  );
}
