'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ProvinceData } from '@/data/provinceData';

interface ProvinceDetailContentProps {
  province: ProvinceData;
}

const CATEGORIES = [
  { id: 'tradisi', name: 'Tradisi Daerah', image: '/images/sekaten.jpg', slug: 'tradisi' },
  { id: 'baju-adat', name: 'Baju Adat', image: '/images/batik.jpg', slug: 'baju-adat' },
  { id: 'makanan', name: 'Makanan Khas', image: '/images/tinutuan.jpg', slug: 'makanan' },
  { id: 'alat-musik', name: 'Alat Musik', image: '/images/angklung.jpg', slug: 'alat-musik' },
  { id: 'aksara', name: 'Aksara', image: '/images/hero-pura.jpg', slug: 'aksara' },
];

export function ProvinceDetailContent({ province }: ProvinceDetailContentProps) {
  return (
    <main id="main" className="bg-[#F8F6EF] pb-20">
      <section className="relative h-[400px] sm:h-[500px] lg:h-[600px] w-full overflow-hidden">
        <Image src={province.image} alt={province.name} fill className="object-cover" priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 shell pb-8 sm:pb-12 lg:pb-16">
          <h1 className="mb-3 font-sans text-[clamp(40px,6vw,72px)] font-semibold leading-tight text-white tracking-tight">{province.name}</h1>
          <p className="max-w-2xl text-[14px] sm:text-[15px] leading-[1.8] text-white/90">{province.description}</p>
        </div>
      </section>

      <section className="shell pt-12 sm:pt-16 lg:pt-20">
        <div className="mb-10">
          <h2 className="mb-3 font-serif text-[clamp(28px,4vw,38px)] leading-[1.2] font-normal text-[#1a1a1a]">Kenali {province.name} lebih dekat.</h2>
          <p className="text-[14px] leading-[1.8] text-[#6b6b5a]">Temukan beragam warisan budaya yang menjadi bagian dari identitas daerah ini.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((cat) => (
            <Link key={cat.id} href={'/jelajah/' + province.slug + '/' + cat.slug} className="group relative aspect-[4/3] overflow-hidden rounded-xl">
              <Image src={cat.image} alt={cat.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                <h3 className="text-[13px] sm:text-[14px] font-medium text-white">{cat.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="shell pt-12 sm:pt-16">
        <div className="mb-8">
          <h2 className="mb-2 font-serif text-[clamp(26px,3.5vw,34px)] leading-[1.2] font-normal text-[#1a1a1a]">Mulai dari cerita pilihan</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <article className="group overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#e5e0d5]">
            <div className="relative h-48 w-full overflow-hidden">
              <Image src="/images/sekaten.jpg" alt="Sekaten" fill className="object-cover" sizes="33vw" />
            </div>
            <div className="p-5">
              <div className="mb-2 text-[10px] font-medium tracking-[0.15em] text-[#8b8b7a] uppercase">Tradisi · Jawa Tengah</div>
              <h3 className="mb-2 font-serif text-[20px] text-[#1a1a1a]">Sekaten</h3>
              <p className="mb-4 text-[12.5px] text-[#6b6b5a]">Perayaan Maulid Nabi Muhammad SAW di Keraton Surakarta dan Yogyakarta.</p>
              <Link href="/budaya/1" className="text-[12px] font-medium text-[#D9A817]">Baca selengkapnya ?</Link>
            </div>
          </article>
          <article className="group overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#e5e0d5]">
            <div className="relative h-48 w-full overflow-hidden">
              <Image src="/images/hero-pura.jpg" alt="Wayang Kulit" fill className="object-cover" sizes="33vw" />
            </div>
            <div className="p-5">
              <div className="mb-2 text-[10px] font-medium tracking-[0.15em] text-[#8b8b7a] uppercase">Tradisi · Jawa Tengah</div>
              <h3 className="mb-2 font-serif text-[20px] text-[#1a1a1a]">Wayang Kulit</h3>
              <p className="mb-4 text-[12.5px] text-[#6b6b5a]">Seni pertunjukan bayangan kulit dengan cerita pewayangan.</p>
              <Link href="/budaya/1" className="text-[12px] font-medium text-[#D9A817]">Baca selengkapnya ?</Link>
            </div>
          </article>
          <article className="group overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#e5e0d5]">
            <div className="relative h-48 w-full overflow-hidden">
              <Image src="/images/batik.jpg" alt="Batik Tulis" fill className="object-cover" sizes="33vw" />
            </div>
            <div className="p-5">
              <div className="mb-2 text-[10px] font-medium tracking-[0.15em] text-[#8b8b7a] uppercase">Kerajinan · Jawa Tengah</div>
              <h3 className="mb-2 font-serif text-[20px] text-[#1a1a1a]">Batik Tulis</h3>
              <p className="mb-4 text-[12.5px] text-[#6b6b5a]">Kain bergambar yang dibuat secara khusus dengan menuliskan malam pada kain.</p>
              <Link href="/budaya/1" className="text-[12px] font-medium text-[#D9A817]">Baca selengkapnya ?</Link>
            </div>
          </article>
        </div>
      </section>

      <section className="shell pt-12 sm:pt-16">
        <div className="mb-10 text-center">
          <h2 className="mb-2 font-serif text-[clamp(28px,4vw,38px)] font-normal text-[#1a1a1a]">Galeri Budaya</h2>
          <p className="text-[14px] text-[#6b6b5a]">Cerita dan foto budaya dari komunitas untuk {province.name}</p>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-6 items-end max-w-4xl mx-auto">
          <article className="relative overflow-hidden rounded-2xl aspect-[3/4]">
            <Image src="/images/galeri-bali.jpg" alt="Galeri" fill className="object-cover" sizes="25vw" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="relative h-6 w-6 rounded-full overflow-hidden"><Image src="/images/batik.jpg" alt="Author" fill className="object-cover" /></div>
                <span className="text-[11px] text-white">Sari</span>
                <span className="ml-auto text-[11px] text-white">? 24</span>
              </div>
              <p className="text-[10px] text-white/90">Upacara adat</p>
            </div>
          </article>
          <article className="relative overflow-hidden rounded-2xl aspect-[3/4] row-span-2 -mb-4 sm:-mb-6">
            <Image src="/images/galeri-rumah-gadang.jpg" alt="Galeri" fill className="object-cover" sizes="25vw" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="relative h-6 w-6 rounded-full overflow-hidden"><Image src="/images/angklung.jpg" alt="Author" fill className="object-cover" /></div>
                <span className="text-[11px] text-white">Budi</span>
                <span className="ml-auto text-[11px] text-white">? 18</span>
              </div>
              <p className="text-[10px] text-white/90">Festival budaya</p>
            </div>
          </article>
          <article className="relative overflow-hidden rounded-2xl aspect-[3/4]">
            <Image src="/images/galeri-kuliner.jpg" alt="Galeri" fill className="object-cover" sizes="25vw" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="relative h-6 w-6 rounded-full overflow-hidden"><Image src="/images/tinutuan.jpg" alt="Author" fill className="object-cover" /></div>
                <span className="text-[11px] text-white">Maya</span>
                <span className="ml-auto text-[11px] text-white">? 31</span>
              </div>
              <p className="text-[10px] text-white/90">Kuliner tradisional</p>
            </div>
          </article>
        </div>
        <div className="mt-10 text-center">
          <p className="mb-3 text-[13px] text-[#6b6b5a]">Belum ada cerita komunitas dari daerah ini.</p>
          <Link href="/galeri" className="inline-flex rounded-full bg-[#050505] px-6 py-2.5 text-[12.5px] text-white hover:bg-[#1a1a1a]">Bagikan Cerita</Link>
        </div>
      </section>
    </main>
  );
}
