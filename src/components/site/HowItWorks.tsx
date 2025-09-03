import Image from "next/image";

export default function HowItWorks() {
  return (
    <section
      className="relative w-full flex justify-center items-center px-3 py-6"
      style={{ backgroundColor: "#F7EEE7", height: "90vh", maxHeight: "90vh" }}
    >
      {/* === Outer border (shrinked with padding) === */}
      <div className="relative w-full max-w-7xl h-full flex justify-center items-center">
        <Image
          src="/borders/boxes.png"
          alt="outer border"
          width={1920} // ⬅️ adjust this value for padding
          height={1080}
          className="h-auto pointer-events-none select-none"
        />

        {/* === Inner guide background === */}
        <div className="absolute inset-0 flex justify-center items-center">
          <Image
            src="/img/how-it-works-bg.png"
            alt="guide background"
            width={1000}
            height={650}
            className="w-[90%] h-auto pointer-events-none select-none"
          />
        </div>

        {/* === Content overlay === */}
        <div className="absolute inset-0 z-20 w-full h-full p-10">
          {/* Title top-left */}
          <h2 className="absolute top-20 left-20 text-5xl font-bold">
            How It Works
          </h2>

          {/* Instructions 1–3 top-right */}
          <ol className="absolute top-20 right-12 text-base space-y-1 list-decimal list-inside max-w-xs">
            <li>
              Use <u>filters</u> to find pieces you like;
            </li>
            <li>
              <u>Drag</u> your chosen components onto the ring;
            </li>
            <li>
              <u>Tweak</u> the order and look;
            </li>
          </ol>

          {/* Instructions 4–5 with button below */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-4">
            <ol start={4} className="text-base space-y-1 list-decimal list-inside max-w-xs text-start">
              <li>
                Save, Share, or <u>Order</u>;
              </li>
              <li>
                Complete checkout and <u>follow</u> updates.
              </li>
            </ol>

            <button
              className="flex items-center gap-2 px-10 py-2 text-white font-medium text-3xl"
              style={{ backgroundColor: "#EB9385" }}
            >
              Start
              <Image
                src="/icons/arrow-right.png"
                alt="arrow right"
                width={20}
                height={20}
              />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
