'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ProvinceData } from '@/data/provinceData';

interface ProvinceCardProps {
  province: ProvinceData;
}

export function ProvinceCard({ province }: ProvinceCardProps) {
  return (
    <Link
      href={'/jelajah/' + province.slug}
      className='group block overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#e5e0d5] transition-all duration-300 hover:shadow-lg hover:ring-[#d4cfc0] hover:-translate-y-1'
    >
      <div className='relative h-40 w-full overflow-hidden'>
        <Image
          src={province.image}
          alt={province.name}
          fill
          className='object-cover transition-transform duration-300 group-hover:scale-105'
          sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
        />
      </div>
      <div className='p-5'>
        <div className='mb-2 flex items-center justify-between'>
          <span className='text-[9px] font-medium tracking-[0.18em] text-[#8b8b7a] uppercase'>
            {province.cultureCount} KONTEN
          </span>
        </div>
        <h3 className='mb-2 font-serif text-[22px] leading-tight text-[#1a1a1a]'>
          {province.name}
        </h3>
        <p className='mb-4 text-[12.5px] leading-[1.7] text-[#6b6b5a] line-clamp-2'>
          {province.description}
        </p>
        <div className='flex items-center gap-1 text-[12px] font-medium text-[#E5B51D] transition-colors group-hover:text-[#d4a61a]'>
          Baca selengkapnya
          <svg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg' className='transition-transform group-hover:translate-x-0.5'>
            <path d='M1 11L11 1M11 1H3M11 1V9' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'/>
          </svg>
        </div>
      </div>
    </Link>
  );
}
