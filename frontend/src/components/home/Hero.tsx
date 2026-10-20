import { AppImage } from "@/components/ui/AppImage";

import { HeroSearch } from "./HeroSearch";

export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative isolate h-[clamp(540px,78vh,840px)] w-full overflow-hidden bg-[#1b1c18]"
    >
      <AppImage
        src="/images/hero-pura.jpg"
        alt="Pura di tepi danau dengan latar pegunungan Bali"
        priority
        sizes="100vw"
        className="object-cover object-[58%_52%] brightness-[1.05] saturate-[1.12]"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,10,8,0.3)_0%,rgba(7,10,8,0.04)_38%,rgba(7,10,8,0.72)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,10,8,0.46)_0%,rgba(7,10,8,0.12)_56%,transparent_100%)]"
      />

      <div className="shell relative flex h-full flex-col justify-between pt-5 pb-10 sm:pt-6 sm:pb-14 lg:pb-16">
        <div className="flex justify-end">
          <HeroSearch />
        </div>

        <div className="max-w-[1020px] text-[#f8f4e9]">
          <h1
            id="hero-heading"
            className="font-serif text-[clamp(42px,6.1vw,76px)] leading-[0.98] font-normal tracking-[-0.02em]"
          >
            <span className="block">Beragam akar.</span>
            <span className="block">Satu ruang untuk mengenal.</span>
          </h1>
          <p className="mt-5 max-w-[560px] text-[13px] leading-[1.65] text-white/85 sm:mt-6 sm:text-[14.5px]">
            Temukan tradisi, rasa, dan pengetahuan yang tumbuh di Indonesia.
            Mulai dari rasa ingin tahu, lanjutkan dengan cerita.
          </p>
        </div>
      </div>
    </section>
  );
}
