import BeadCanvas from "@/components/configurator/BeadCanvas";

export default function Page() {
  return (
    <main className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Bead Configurator (Lightweight Canvas)</h1>
      <BeadCanvas />
    </main>
  );
}
