"use client";

import { useState } from "react";
import { FILTER_TABS, MATERIALS, type TreeNode } from "./data/filters";
import Tree from "@/components/Tree";

interface Props {
  filtersOpen: boolean;
}

export default function FilterDropdown({ filtersOpen }: Props) {
  // which left tab is active
  const [activeTab, setActiveTab] = useState<(typeof FILTER_TABS)[number]>("MATERIAL");

  // open/close nodes set
  const [openSet, setOpenSet] = useState<Set<string>>(new Set());

  // checked nodes set
  const [checkedSet, setCheckedSet] = useState<Set<string>>(new Set());

  const toggleOpen = (id: string) =>
    setOpenSet((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const toggleCheck = (id: string, withDescendants = true) =>
    setCheckedSet((s) => {
      const n = new Set(s);
      if (n.has(id)) {
        n.delete(id);
        if (withDescendants) uncheckDesc(id, MATERIALS, n);
      } else {
        n.add(id);
        if (withDescendants) checkDesc(id, MATERIALS, n);
      }
      return n;
    });

  return (
    <div
      className={`w-full border-t border-[#EB9385]/60 bg-white/95 transition-all duration-300 overflow-hidden ${
        filtersOpen ? "max-h-[520px]" : "max-h-0"
      }`}
      aria-hidden={!filtersOpen}
    >
      <div className="mx-auto max-w-[980px]">
        <div className="grid grid-cols-[160px_1fr]">
          {/* left tabs */}
          <div className="bg-[#EB9385] text-white">
            {FILTER_TABS.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`block w-full px-4 py-3 text-left font-serif text-sm tracking-wide cursor-pointer hover:bg-white hover:text-black ${
                  activeTab === t ? "bg-white text-black" : "text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* right tree */}
          <div className="p-4">
            {activeTab === "MATERIAL" && (
              <Tree
                items={MATERIALS}
                openSet={openSet}
                onToggleOpen={toggleOpen}
                checkedSet={checkedSet}
                onToggleCheck={toggleCheck}
              />
            )}

            
          </div>
        </div>
        {/* TODO: SHAPE / FUNCTION / COLORS trees here when you have data */}
            <div className="flex items-center justify-end border-t border-stone-200 bg-[#F7EEE7] px-4 py-3">
              <button
                onClick={() => setCheckedSet(new Set())}
                className="font-medium text-rose-600 underline cursor-pointer hover:scale-[0.98] transition-all"
              >
                RESET
              </button>
              <span className="mx-2 text-stone-400"></span>
              <button
                onClick={() => {
                  // emit selected ids (replace with your callback)
                  console.log("APPLY ->", Array.from(checkedSet));
                }}
                className="bg-[#EB9385] px-4 py-1 text-white cursor-pointer font-medium hover:bg-rose-600 hover:scale-[0.98] transition-all"
              >
                APPLY
              </button>
            </div>
      </div>
    </div>
  );
}

// helpers to bulk (un)check descendants
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
