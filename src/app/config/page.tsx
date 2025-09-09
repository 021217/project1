import BeadCanvas from "@/components/configurator/BeadCanvas";
import RightOptionsPanel from "./rightOptionsPanel";

export default function Page() {
  return (
    <main className="container mx-auto p-6 space-y-6 h-screen">
      <h1 className="text-2xl font-semibold">Bead Configurator (Lightweight Canvas)</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-8rem)]">
        {/* BeadCanvas should stretch */}
        <div className="flex">
          <BeadCanvas />
        </div>

        {/* Right panel should stretch */}
        <div className="flex">
          <RightOptionsPanel />
        </div>
      </div>
    </main>
  );
}
