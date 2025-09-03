"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import Image from "next/image";

import "swiper/css";
import "swiper/css/pagination";

export default function ContentCarousel() {
  return (
    <div className="w-full">
      <Swiper
        modules={[Pagination, Autoplay]}
        slidesPerView={1}
        loop
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        className="w-full"
      >
        {/* slide 1 */}
        <SwiperSlide>
          <div className="grid grid-cols-7 w-full h-[80vh]">
            {/* left content (70%) */}
            <div className="col-span-5 flex flex-col justify-center px-16 bg-[#d6d3c9]">
              <h2 className="text-5xl font-bold mb-6">Natural Beauty</h2>
              <p className="text-xl mb-8">
                Words that describe this design. Tagline, product details, or
                even a CTA button.
              </p>
              <button className="px-6 py-3 bg-black text-white rounded-full w-fit text-lg">
                Explore
              </button>
            </div>

            {/* right image (30%) */}
            <div className="col-span-2 relative">
              <Image
                src="/carousel/1.png"
                alt="slide 1"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </SwiperSlide>

        {/* slide 2 */}
        <SwiperSlide>
          <div className="grid grid-cols-7 w-full h-[80vh]">
            <div className="col-span-5 flex flex-col justify-center px-16 bg-[#f0e7dd]">
              <h2 className="text-5xl font-bold mb-6">Elegant Style</h2>
              <p className="text-xl mb-8">
                Another description, different background color. Each slide can
                have unique styling.
              </p>
              <button className="px-6 py-3 bg-black text-white rounded-full w-fit text-lg">
                Shop Now
              </button>
            </div>
            <div className="col-span-2 relative">
              <Image
                src="/carousel/1.png"
                alt="slide 2"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </SwiperSlide>

        {/* slide 3 */}
        <SwiperSlide>
          <div className="grid grid-cols-7 w-full h-[80vh]">
            <div className="col-span-5 flex flex-col justify-center px-16 bg-[#e9f2ea]">
              <h2 className="text-5xl font-bold mb-6">Handcrafted</h2>
              <p className="text-xl mb-8">
                Combine text, CTA buttons, or even little graphics here.
              </p>
              <button className="px-6 py-3 bg-black text-white rounded-full w-fit text-lg">
                Learn More
              </button>
            </div>
            <div className="col-span-2 relative">
              <Image
                src="/carousel/1.png"
                alt="slide 3"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </SwiperSlide>
      </Swiper>
    </div>
  );
}
