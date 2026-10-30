"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { BrandLogo } from "@/components/layout/BrandLogo";
import { AppImage } from "@/components/ui/AppImage";
import { ChevronLeftIcon } from "@/components/ui/icons";

const BRAND_IMAGE = "/images/galeri-bali.jpg";

const BRAND_DESCRIPTION =
  "Temukan tradisi, rasa, dan pengetahuan yang tumbuh di Indonesia. Mulai dari rasa ingin tahu, lanjutkan dengan cerita.";

function AuthBackButton() {
  const router = useRouter();

  function goBack(): void {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  }

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label="Kembali ke halaman sebelumnya"
      className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/35 bg-black/20 text-white backdrop-blur-sm transition-colors hover:border-white/60 hover:bg-black/40"
    >
      <ChevronLeftIcon className="h-5 w-5" />
    </button>
  );
}

function BrandWordmark() {
  return <BrandLogo size="lg" />;
}

function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-night lg:sticky lg:top-0 lg:block lg:h-screen">
      <AppImage
        src={BRAND_IMAGE}
        alt="Penari tradisional Indonesia dengan busana dan mahkota emas"
        sizes="50vw"
        priority
        className="object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,7,5,0.55)_0%,rgba(8,7,5,0.25)_45%,rgba(8,7,5,0.82)_100%)]"
      />

      <div className="absolute inset-0 flex flex-col justify-between p-8 xl:p-12">
        <AuthBackButton />

        <div className="max-w-[400px]">
          <BrandWordmark />
          <p className="mt-4 text-[13px] leading-[1.8] text-white/80">
            {BRAND_DESCRIPTION}
          </p>
        </div>
      </div>
    </aside>
  );
}

function MobileBrand() {
  return (
    <div className="relative h-[196px] w-full overflow-hidden bg-night lg:hidden">
      <AppImage
        src={BRAND_IMAGE}
        alt="Penari tradisional Indonesia dengan busana dan mahkota emas"
        sizes="100vw"
        priority
        className="object-cover object-[center_28%]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,7,5,0.5)_0%,rgba(8,7,5,0.2)_40%,rgba(8,7,5,0.85)_100%)]"
      />

      <div className="absolute inset-0 flex flex-col justify-between p-5">
        <AuthBackButton />

        <div className="pr-4">
          <BrandWordmark />
          <p className="mt-2 line-clamp-2 text-[11.5px] leading-[1.7] text-white/75">
            {BRAND_DESCRIPTION}
          </p>
        </div>
      </div>
    </div>
  );
}

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main id="main" className="min-h-screen bg-[#f3efe5] lg:grid lg:grid-cols-2">
      <BrandPanel />

      <div className="flex min-h-screen flex-col">
        <MobileBrand />

        <div className="flex flex-1 items-center justify-center px-5 py-9 sm:px-8 sm:py-12 lg:px-10">
          <div className="w-full max-w-[424px]">{children}</div>
        </div>
      </div>
    </main>
  );
}

export function AuthCard({
  labelledBy,
  children,
}: {
  labelledBy: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={labelledBy}
      className="rounded-[20px] border border-[#e6dfd0] bg-white px-6 py-8 shadow-[0_24px_70px_-38px_rgba(23,21,15,0.45)] sm:px-9 sm:py-10"
    >
      {children}
    </section>
  );
}
