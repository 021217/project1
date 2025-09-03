"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function SearchBar() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // auto-close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative flex items-center">
      {/* custom search icon */}
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-full cursor-pointer hover:bg-gray-100 transition"
        aria-label="Search"
      >
        <Image src="/icons/search.png" alt="search" width={18} height={18} />
      </button>

      {/* expanding input */}
      <AnimatePresence>
        {open && (
          <motion.input
            key="search-input"
            type="text"
            placeholder="Search…"
            autoFocus
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 200, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="
              absolute right-10
              h-10 px-4 pr-2
              rounded-full border
              bg-white shadow-sm
              text-sm
              focus:outline-none
            "
          />
        )}
      </AnimatePresence>
    </div>
  );
}
