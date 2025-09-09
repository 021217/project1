"use client";
import React, { useMemo, useRef, useEffect } from "react";
import type { TreeNode } from "../app/config/data/filters";

type Props = {
      items: TreeNode[];
      openSet: Set<string>;
      onToggleOpen: (id: string) => void;
      checkedSet: Set<string>;
      onToggleCheck: (id: string, withDescendants?: boolean) => void;
      level?: number;
};

export default function Tree({
      items,
      openSet,
      onToggleOpen,
      checkedSet,
      onToggleCheck,
      level = 0,
}: Props) {
      return (
            <div className={level === 0 ? "space-y-2" : "ml-5 space-y-2"}>
                  {items.map((node) => (
                        <TreeRow
                              key={node.id}
                              node={node}
                              openSet={openSet}
                              onToggleOpen={onToggleOpen}
                              checkedSet={checkedSet}
                              onToggleCheck={onToggleCheck}
                              level={level}
                        />
                  ))}
            </div>
      );
}

function TreeRow({
      node,
      openSet,
      onToggleOpen,
      checkedSet,
      onToggleCheck,
      level,
}: {
      node: TreeNode;
      openSet: Set<string>;
      onToggleOpen: (id: string) => void;
      checkedSet: Set<string>;
      onToggleCheck: (id: string, withDescendants?: boolean) => void;
      level: number;
}) {
      const hasChildren = !!node.children?.length;
      const isOpen = openSet.has(node.id);

      // tri-state
      const { isChecked, isIndeterminate } = useTriState(node, checkedSet);
      const ref = useRef<HTMLInputElement>(null);
      useEffect(() => {
            if (ref.current) ref.current.indeterminate = isIndeterminate;
      }, [isIndeterminate]);

      return (
            <div className="w-full">
                  <div className="flex items-center gap-2">
                        {/* checkbox + label */}
                        <label className="flex grow items-center gap-3">
                              <input
                                    ref={ref}
                                    type="checkbox"
                                    className="size-4 accent-[#EB9385] cursor-pointer"
                                    checked={isChecked}
                                    onChange={() => onToggleCheck(node.id, true)}
                              />
                              <span className="font-serif">{node.name}</span>
                        </label>

                        {/* dropdown icon (on right side of row) */}
                        {hasChildren && (
                              <button
                                    onClick={() => onToggleOpen(node.id)}
                                    className="rounded p-1 hover:bg-stone-100 cursor-pointer"
                                    aria-label={isOpen ? "Collapse" : "Expand"}
                              >
                                    <img
                                          src="/icons/eject.svg"
                                          alt=""
                                          className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-90" : "rotate-0"}`}
                                    />
                              </button>
                        )}
                  </div>

                  {/* children below */}
                  {hasChildren && isOpen && (
                        <div className="mt-2 ml-6 space-y-2">
                              <Tree
                                    items={node.children!}
                                    openSet={openSet}
                                    onToggleOpen={onToggleOpen}
                                    checkedSet={checkedSet}
                                    onToggleCheck={onToggleCheck}
                                    level={level + 1}
                              />
                        </div>
                  )}
            </div>

      );
}

// ---------- helpers ----------
function useTriState(node: TreeNode, checkedSet: Set<string>) {
      const { isChecked, isIndeterminate } = useMemo(() => {
            // leaf
            if (!node.children?.length) {
                  return {
                        isChecked: checkedSet.has(node.id),
                        isIndeterminate: false,
                  };
            }
            // compute over descendants
            const { all, some } = foldDescChecked(node, checkedSet);
            return {
                  isChecked: all,
                  isIndeterminate: !all && some,
            };
      }, [node, checkedSet]);
      return { isChecked, isIndeterminate };
}

function foldDescChecked(node: TreeNode, checkedSet: Set<string>): { all: boolean; some: boolean } {
      if (!node.children?.length) {
            const c = checkedSet.has(node.id);
            return { all: c, some: c };
      }
      let all = true;
      let some = false;
      for (const child of node.children) {
            const res = foldDescChecked(child, checkedSet);
            all = all && res.all;
            some = some || res.some;
      }
      // also allow checking the parent id itself
      if (checkedSet.has(node.id)) {
            some = true;
            // if parent explicitly checked, treat as all
            all = true;
      }
      return { all, some };
}
