"use client";

import { useState } from "react";
import Tree from "@/components/Tree";

interface Props {
  filtersOpen: boolean;
  initialTab?: "Visual Qualities" | "Role" | "Material"; // 👈 added
}

type TreeNode = {
  id: string;
  label: string;
  children?: TreeNode[];
};

// ─── Options Data ──────────────────────────────
const VISUALS: TreeNode[] = [
  { id: "hue", label: "Hue" },
  { id: "size", label: "Size" },
  { id: "surface", label: "Surface / Pattern" },
];

const ROLES: TreeNode[] = [
  { id: "centerpiece", label: "Centerpiece" },
  { id: "spacer", label: "Spacer" },
  { id: "accents", label: "Accents" },
  { id: "closure", label: "Closure" },
];

const MATERIALS: TreeNode[] = [
  { id: "crystals", label: "Crystals & Minerals" },
  { id: "organics", label: "Organics" },
  { id: "metals", label: "Metals" },
  { id: "fabric", label: "Fabric & Other" },
];

const FILTER_TABS = ["Visual Qualities", "Role", "Material"] as const;

// ─── Component ──────────────────────────────
export default function FilterDropdown({ filtersOpen, initialTab = "Visual Qualities" }: Props) {
  const [activeTab, setActiveTab] = useState<(typeof FILTER_TABS)[number]>(initialTab);

  // open/close nodes
  const [openSet, setOpenSet] = useState<Set<string>>(new Set());
  // checked nodes
  const [checkedSet, setCheckedSet] = useState<Set<string>>(new Set());

  const toggleOpen = (id: string) =>
    setOpenSet((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const toggleCheck = (id: string, list: TreeNode[], withDescendants = true) =>
    setCheckedSet((s) => {
      const n = new Set(s);
      if (n.has(id)) {
        n.delete(id);
        if (withDescendants) uncheckDesc(id, list, n);
      } else {
        n.add(id);
        if (withDescendants) checkDesc(id, list, n);
      }
      return n;
    });

  // pick dataset based on tab
  const currentItems =
    activeTab === "Visual Qualities"
      ? VISUALS
      : activeTab === "Role"
      ? ROLES
      : MATERIALS;

  return (
    <div
      className={`w-full transition-all duration-300 overflow-hidden ${
        filtersOpen ? "max-h-[520px]" : "max-h-0"
      }`}
      aria-hidden={!filtersOpen}
    >
      <div className="mx-auto my-3 w-[85%] rounded-md border border-[#EB9385]/60 bg-white shadow-md">
        {/* Grid layout */}
        <div className="grid grid-cols-[160px_1fr]">
          {/* left tabs */}
          <div className="bg-[#EB9385] text-white rounded-l-md overflow-hidden">
            {FILTER_TABS.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`block w-full px-4 py-3 text-left font-serif text-sm tracking-wide cursor-pointer transition-colors
                  ${
                    activeTab === t
                      ? "bg-white text-black"
                      : "text-white hover:bg-white hover:text-black"
                  }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* right tree */}
          <div className="p-4 overflow-y-auto max-h-[400px]">
            <Tree
              items={currentItems}
              openSet={openSet}
              onToggleOpen={toggleOpen}
              checkedSet={checkedSet}
              onToggleCheck={(id) => toggleCheck(id, currentItems)}
            />
          </div>
        </div>

        {/* footer actions */}
        <div className="flex items-center justify-end border-t border-stone-200 bg-[#F7EEE7] px-4 py-3 rounded-b-md">
          <button
            onClick={() => setCheckedSet(new Set())}
            className="font-medium text-rose-600 underline cursor-pointer hover:scale-[0.98] transition-all"
          >
            RESET
          </button>
          <span className="mx-2 text-stone-400"></span>
          <button
            onClick={() => {
              console.log("APPLY ->", Array.from(checkedSet));
            }}
            className="bg-[#EB9385] px-4 py-1 text-white cursor-pointer font-medium hover:bg-rose-600 hover:scale-[0.98] transition-all rounded"
          >
            APPLY
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────
function findNode(id: string, list: TreeNode[]): TreeNode | null {
  for (const n of list) {
    if (n.id === id) return n;
    if (n.children) {
      const hit = findNode(id, n.children);
      if (hit) return hit;
    }
  }
  return null;
}

function traverse(n: TreeNode, visit: (node: TreeNode) => void) {
  visit(n);
  n.children?.forEach((c) => traverse(c, visit));
}

function checkDesc(id: string, roots: TreeNode[], set: Set<string>) {
  const node = findNode(id, roots);
  if (!node) return;
  traverse(node, (x) => set.add(x.id));
}

function uncheckDesc(id: string, roots: TreeNode[], set: Set<string>) {
  const node = findNode(id, roots);
  if (!node) return;
  traverse(node, (x) => set.delete(x.id));
}
