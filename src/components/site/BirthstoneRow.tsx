"use client";

import { useState } from "react";

const stones = [
      { month: "January", stone: "Garnet" },
      { month: "February", stone: "Amethyst" },
      { month: "March", stone: "White Moonstone" },
      { month: "April", stone: "Diamond" },
      { month: "May", stone: "Emerald" },
      { month: "June", stone: "Pearl" },
      { month: "July", stone: "Ruby" },
      { month: "August", stone: "Peridot" },
      { month: "September", stone: "Sapphire" },
      { month: "October", stone: "Opal" },
      { month: "November", stone: "Topaz" },
      { month: "December", stone: "Turquoise" },
];

export default function BirthstoneRow() {
      const [hovered, setHovered] = useState<number | null>(null);

      return (
            <section className=" bg-[#f7f7f7] p-8">
                  <div className="dashed-custom py-3">
                        <h2 className="text-4xl font-semibold mb-8 text-start pl-8">Find Your Birthstone</h2>

                        <div className="flex justify-center gap-12">
                              {stones.map((stone, idx) => (
                                    <div
                                          key={idx}
                                          className="relative flex flex-col items-center"
                                          onMouseEnter={() => setHovered(idx)}
                                          onMouseLeave={() => setHovered(null)}
                                    >
                                          {/* month above circle */}
                                          <div
                                                className={`mb-2 h-10 text-xl text-[#EB9385] font-medium transition-opacity duration-200 ${hovered === idx ? "opacity-100 text-[#EB9385]" : "opacity-0"
                                                      }`}
                                          >
                                                {stone.month}
                                          </div>

                                          {/* circle */}
                                          <div className="w-14 h-14 rounded-full bg-gray-300"></div>

                                          {/* stone below circle */}
                                          <div
                                                className={`mt-2 h-5 text-sm transition-opacity duration-200 ${hovered === idx ? "opacity-100 text-black" : "opacity-0"
                                                      }`}
                                          >
                                                {stone.stone}
                                          </div>
                                    </div>
                              ))}
                        </div>
                  </div>

            </section>
      );
}
