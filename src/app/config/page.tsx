"use client";

import { useState } from "react";
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
};

export default function Page() {
  const [beads, setBeads] = useState<Bead[]>([]);

  return (
    <DndProvider backend={HTML5Backend}>
      <main className="flex justify-center items-center h-screen">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 w-[70vw] h-[80vh] mx-auto">
          {/* BeadCanvas should stretch */}
          <div className="flex h-[80vh]">
            <BeadCanvas beads={beads} setBeads={setBeads} />
          </div>

          {/* Right panel should stretch */}
          <div className="flex h-[80vh]">
            <RightOptionsPanel
              onFooter={(action) => {
                if (action.type === "clear_canvas") {
                  setBeads([]); // 👈 clears the canvas
                }
              }}
            />
          </div>
      </div>
      </main>
    </DndProvider>
  );
}
