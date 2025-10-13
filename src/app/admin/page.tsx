"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

/* ------------------------- TYPES ------------------------- */

type Bead = {
  id: number;
  name: string;
  category: string;
  subgroup: string;
  size: string[];
  price: number;
  image: string;
  shape: string;
  color: string;
  aspirations: string[];
  astrology: string[];
  position: { angle: number };
};

/* ------------------------- MAIN COMPONENT ------------------------- */
export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [beads, setBeads] = useState<Bead[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<number | null>(null);

  const [form, setForm] = useState<Partial<Bead>>({
      size: [],
      aspirations: [],
      astrology: [],
      position: { angle: 0 },
      });

  const [lists] = useState({
    categories: ["Crystals & Mineraloids"],
    subgroups: ["Silicate Crystals", "Mineraloids", "Phosphate & Other Crystals"],
    shapes: ["Spherical", "Cylindrical"],
    aspirations: [
      "Health",
      "Protection",
      "Luck",
      "Inner Peace",
      "Creativity",
      "Wisdom",
      "Career",
      "Growth",
    ],
    astrology: [
      "Virgo",
      "Taurus",
      "Leo",
      "Scorpio",
      "Sagittarius",
      "Libra",
      "Capricorn",
      "Aries",
    ],
  });

  /* ------------------------- AUTH ------------------------- */
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return router.push("/login");
    const parsed = JSON.parse(stored);
    if (parsed.role !== "admin") return router.push("/config");
    setUser(parsed);
  }, [router]);

  /* ------------------------- LOAD BEADS ------------------------- */
  async function loadBeads() {
    try {
      const res = await fetch("https://mypoesis.ruputech.com/api/getBeads.php");
      const data = await res.json();
      if (data.success) {
        const mapped = data.beads.map((b: any) => ({
          ...b,
          category: b.material.category,
          subgroup: b.material.subgroup,
          position:
            b.position || {
              in: { x: 50, y: 30 },
              out: { x: 50, y: 70 },
            },
        }));
        setBeads(mapped);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  }
  useEffect(() => {
    loadBeads();
  }, []);

  /* ------------------------- IMAGE UPLOAD ------------------------- */
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      if (!file) return;

      // 🧩 Create local blob URL (no actual upload)
      const localUrl = URL.createObjectURL(file);

      // 🧩 Simulate stored path in /beads/
      const fakePath = `/beads/${file.name}`;

      // ✅ Update form + preview
      setForm((f) => ({ ...f, image: fakePath }));
      setPreview(localUrl);
      setMessage("Using local preview only (not uploaded)");
      }

  /* ------------------------- TAG INPUT ------------------------- */
  function handleTagInput(
    e: React.KeyboardEvent<HTMLInputElement>,
    field: "size" | "aspirations" | "astrology"
  ) {
    if (e.key === " " && e.currentTarget.value.trim() !== "") {
      e.preventDefault();
      const value = e.currentTarget.value.trim();
      setForm((prev) => ({
        ...prev,
        [field]: [...(prev[field] || []), value],
      }));
      e.currentTarget.value = "";
    }
  }

  const removeTag = (field: "size" | "aspirations" | "astrology", value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: (prev[field] || []).filter((v) => v !== value),
    }));
  };

  /* ------------------------- SUBMIT ------------------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return setMessage("Please fill all required fields.");

    const endpoint = editing
      ? "https://mypoesis.ruputech.com/api/updateBead.php"
      : "https://mypoesis.ruputech.com/api/addBead.php";

    const payload = { ...form };
    if (editing) payload.id = editing;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setMessage(data.message);

    if (data.success) {
      await loadBeads();
      setForm({
        size: [],
        aspirations: [],
        astrology: [],
        position: { angle: 0 },
      });
      setPreview(null);
      setEditing(null);
    }
  };

  /* ------------------------- DELETE ------------------------- */
  const handleDelete = async (id: number) => {
    if (!confirm("Deactivate this bead?")) return;
    const res = await fetch("https://mypoesis.ruputech.com/api/deleteBead.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    setMessage(data.message);
    if (data.success) setBeads((prev) => prev.filter((b) => b.id !== id));
  };

  const handleEdit = (bead: Bead) => {
    setEditing(bead.id);
    setForm(bead);
    setPreview(bead.image);
  };

  if (!user) return null;

  /* ------------------------- UI ------------------------- */
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#F7EEE7", fontFamily: "Poppins, sans-serif" }}
    >
      {/* Header */}
      <div className="flex justify-between items-center px-8 py-6 bg-[#EB9385] text-white">
        <h1 className="text-2xl font-semibold">Beads Admin Dashboard</h1>
        <div className="flex gap-4 items-center">
          <span>{user.name}</span>
          <button
            onClick={() => {
              localStorage.removeItem("user");
              router.push("/login");
            }}
            className="bg-white text-[#C04365] px-4 py-1 rounded-full text-sm hover:bg-[#fde4e4]"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 p-8 gap-8">
        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/80 rounded-xl shadow-md p-6 w-full lg:w-[420px] overflow-auto"
        >
          <h2 className="text-lg font-semibold mb-4 text-[#C04365]">
            {editing ? "Edit Bead" : "Add New Bead"}
          </h2>

          <input
            type="text"
            placeholder="Bead name"
            value={form.name || ""}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border p-2 rounded-md w-full mb-3 outline-none"
            style={{ borderColor: "#EB9385" }}
          />

          <DropdownField label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={lists.categories} />
          <DropdownField label="Subgroup" value={form.subgroup} onChange={(v) => setForm({ ...form, subgroup: v })} options={lists.subgroups} />
          <DropdownField label="Shape" value={form.shape} onChange={(v) => setForm({ ...form, shape: v })} options={lists.shapes} />

          <input type="text" placeholder="Color" value={form.color || ""} onChange={(e) => setForm({ ...form, color: e.target.value })} className="border p-2 rounded-md w-full mb-3 outline-none" style={{ borderColor: "#EB9385" }} />
          <input type="number" placeholder="Price" step="0.01" value={form.price || ""} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })} className="border p-2 rounded-md w-full mb-3 outline-none" style={{ borderColor: "#EB9385" }} />

          {/* 2D Position Editor */}
          <div className="mb-4">
            <label className="text-sm text-gray-700 font-medium">In/Out Position (2D)</label>
            <BeadPosition2D
            position={form.position || { angle: 0 }}
            onChange={(pos) => setForm((f) => ({ ...f, position: pos }))}
            image={form.image || "/placeholder.jpg"}
            />
          </div>

          <TagField label="Size" field="size" tags={form.size || []} removeTag={removeTag} handleTagInput={handleTagInput} />
          <TagField label="Aspirations" field="aspirations" tags={form.aspirations || []} removeTag={removeTag} handleTagInput={handleTagInput} />
          <TagField label="Astrology" field="astrology" tags={form.astrology || []} removeTag={removeTag} handleTagInput={handleTagInput} />

          {/* Image */}
          <div className="mt-3">
            <label className="text-sm text-gray-700 font-medium">Image</label>
            <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} className="block w-full text-sm mt-1" />
            {preview && (
              <div className="mt-2">
                <Image src={preview} alt="preview" width={100} height={100} className="rounded-md border" />
              </div>
            )}
          </div>

          <button type="submit" className="mt-5 w-full py-2 rounded-full text-white font-semibold hover:scale-[1.02] transition" style={{ backgroundColor: "#C04365" }}>
            {editing ? "Update Bead" : "Save Bead"}
          </button>
          {message && <p className="text-[#C04365] text-sm mt-2">{message}</p>}
        </form>

        {/* INVENTORY */}
        <div className="flex-1 bg-white/80 rounded-xl shadow-md p-6 overflow-auto">
          <h2 className="text-lg font-semibold mb-4 text-[#C04365]">Bead Inventory</h2>
          {beads.length === 0 ? (
            <p>No beads yet.</p>
          ) : (
            beads.map((b) => (
              <div key={b.id} className="flex justify-between items-center border border-[#EB9385]/30 rounded-xl p-4 mb-3 bg-[#fffaf8]">
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24 overflow-hidden rounded-md border bg-white">
                    <Image src={b.image || "/placeholder.jpg"} alt={b.name} fill className="object-cover" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#C04365]">{b.name}</p>
                    <p className="text-sm text-gray-600">
                        Angle: {(b.position?.angle * 180 / Math.PI).toFixed(1)}°
                  </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleEdit(b)} title="Edit">
                    <Image src="/icons/filter.svg" width={22} height={22} alt="edit" />
                  </button>
                  <button onClick={() => handleDelete(b.id)} title="Delete">
                    <Image src="/icons/delete.svg" width={22} height={22} alt="delete" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------- 2D POSITION CANVAS ------------------------- */
function BeadPosition2D({
  position,
  onChange,
  image,
}: {
  position: { angle: number };
  onChange: (p: { angle: number }) => void;
  image?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new window.Image();
    img.src = image || "/placeholder.jpg";

    img.onload = () => {
      const size = 140;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw bead
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, cx - size / 2, cy - size / 2, size, size);
      ctx.restore();

      // Outer ring
      ctx.strokeStyle = "#EB9385";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
      ctx.stroke();

      // Rotate line according to position.angle
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(position.angle);
      ctx.strokeStyle = "#999";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-size / 3, 0);
      ctx.lineTo(size / 3, 0);
      ctx.stroke();
      ctx.restore();

      // Angle label
      ctx.fillStyle = "#C04365";
      ctx.font = "12px Poppins";
      ctx.fillText(`${(position.angle * 180 / Math.PI).toFixed(1)}°`, 10, 20);
    };
  }, [position, image]);

  const handleDrag = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const angle = Math.atan2(y, x);
    onChange({ angle });
  };

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={200}
      className="border border-[#EB9385] rounded-md mt-2 bg-white"
      style={{ width: "100%", maxWidth: "260px", cursor: "grab" }}
      onMouseDown={() => setDragging(true)}
      onMouseUp={() => setDragging(false)}
      onMouseMove={handleDrag}
    />
  );
}


/* ------------------------- DROPDOWN ------------------------- */
function DropdownField({ label, value, onChange, options }: any) {
  const [search, setSearch] = useState("");
  const [list, setList] = useState(options);
  const [open, setOpen] = useState(false);

  function handleAddOther() {
    if (!search) return;
    setList((prev) => [...prev, search]);
    onChange(search);
    setSearch("");
    setOpen(false);
  }

  return (
    <div className="mb-3 relative">
      <label className="text-sm text-gray-700 font-medium">{label}</label>
      <div
        className="border p-2 rounded-md w-full text-sm bg-white cursor-pointer select-none"
        style={{ borderColor: "#EB9385" }}
        onClick={() => setOpen((o) => !o)}
      >
        {value || `Select ${label.toLowerCase()}`}
      </div>
      {open && (
        <div className="absolute z-20 bg-white shadow-md rounded-md mt-1 w-full max-h-40 overflow-y-auto border border-[#EB9385]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full px-2 py-1 border-b text-sm outline-none"
          />
          {list
            .filter((v: string) => v.toLowerCase().includes(search.toLowerCase()))
            .map((opt: string) => (
              <div
                key={opt}
                className="px-2 py-1 hover:bg-[#fdf4f2] cursor-pointer"
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
              >
                {opt}
              </div>
            ))}
          {search && !list.includes(search) && (
            <div
              className="px-2 py-1 text-[#C04365] hover:bg-[#fde4e4] cursor-pointer"
              onClick={handleAddOther}
            >
              ➕ Add “{search}”
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------- TAG FIELD ------------------------- */
function TagField({ label, field, tags, removeTag, handleTagInput }: any) {
  return (
    <div className="mb-3">
      <label className="text-sm text-gray-700 font-medium">{label}</label>
      <div
        className="border rounded-md flex flex-wrap gap-2 p-2"
        style={{ borderColor: "#EB9385" }}
      >
        {tags.map((tag: string) => (
          <div
            key={tag}
            className="flex items-center gap-1 bg-[#EB9385]/20 px-2 py-1 rounded-full text-sm"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(field, tag)}
              className="text-[#C04365] hover:text-red-500"
            >
              ×
            </button>
          </div>
        ))}
        <input
          onKeyDown={(e) => handleTagInput(e, field)}
          placeholder={`Add ${label.toLowerCase()} (space to add)`}
          className="flex-1 min-w-[100px] text-sm outline-none bg-transparent"
        />
      </div>
    </div>
  );
}
