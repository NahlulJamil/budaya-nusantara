import { AppImage } from "@/components/ui/AppImage";
import { OutlineLink } from "@/components/ui/OutlineLink";

export function AboutSection() {
  return (
    <section aria-labelledby="tentang-heading" className="pb-20 lg:pb-28">
      <div className="shell grid items-center gap-8 lg:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)] lg:gap-14">
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-cream-deep">
          <AppImage
            src="/images/batik.jpg"
            alt="Perajin batik menorehkan lilin malam pada kain"
            sizes="(min-width: 1024px) 46vw, 100vw"
            className="object-cover"
          />
        </div>

        <div>
          <p className="eyebrow">Tentang ruang budaya</p>
          <h2
            id="tentang-heading"
            className="mt-2.5 max-w-[520px] font-serif text-[clamp(30px,3.6vw,44px)] leading-[1.12] font-normal tracking-[-0.015em] text-ink"
          >
            Bukan museum yang diam. Ruang yang terus bertumbuh.
          </h2>
          <p className="mt-5 max-w-[470px] text-[12.5px] leading-[1.7] text-muted">
            Kami mempertemukan pengetahuan dan partisipasi untuk membantu
            budaya Indonesia tetap dikenal lintas generasi.
          </p>
          <OutlineLink href="/tentang" className="mt-6">
            Tentang Kami
          </OutlineLink>
        </div>
      </div>
    </section>
  );
}
