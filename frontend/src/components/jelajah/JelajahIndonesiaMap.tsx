'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SearchIcon } from '@/components/ui/icons';
import { 
  getProvincesByIsland, 
  searchProvinces, 
  ISLANDS, 
  type IslandKey 
} from '@/data/indonesiaIslands';

export function JelajahIndonesiaMap() {
  const [selectedIsland, setSelectedIsland] = useState<IslandKey | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const provincesOnIsland = selectedIsland ? getProvincesByIsland(selectedIsland) : [];
  const searchResults = searchQuery ? searchProvinces(searchQuery) : [];

  const handleIslandClick = (island: IslandKey) => {
    setSelectedIsland(selectedIsland === island ? null : island);
    setSearchQuery('');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value) {
      setSelectedIsland(null);
    }
  };

  const islandPositions: Array<{key: IslandKey, style: React.CSSProperties, label: string}> = [
    { key: 'sumatera', style: { top: '32%', left: '16%' }, label: 'Sumatera' },
    { key: 'jawa', style: { top: '64%', left: '36%' }, label: 'Jawa' },
    { key: 'kalimantan', style: { top: '37%', left: '42%' }, label: 'Kalimantan' },
    { key: 'sulawesi', style: { top: '47%', left: '59%' }, label: 'Sulawesi' },
    { key: 'nusa-tenggara', style: { top: '71%', left: '52%' }, label: 'Nusa Tenggara' },
    { key: 'maluku', style: { top: '49%', left: '72%' }, label: 'Maluku' },
    { key: 'papua', style: { top: '44%', left: '86%' }, label: 'Papua' },
  ];

  return (
    <main id='main' className='pb-20'>
      <section className='shell pt-14 sm:pt-16 lg:pt-20'>
        <div className='max-w-[700px]'>
          <p className='eyebrow'>Jelajah Indonesia</p>
          <h1 className='mt-3 font-serif text-[clamp(34px,4.4vw,54px)] leading-[1.08] font-normal tracking-[-0.02em] text-ink'>
            Jelajah Budaya Nusantara
          </h1>
          <p className='mt-4 text-[13px] leading-[1.8] text-muted'>
            Pilih pulau yang ditandai untuk melihat provinsi, atau cari daerah
            langsung melalui kolom pencarian.
          </p>
        </div>

        <div className='mt-8'>
          <form role='search' className='flex h-11 w-full max-w-[600px] items-center gap-2 rounded-full border border-line bg-paper px-4 transition-colors focus-within:border-ink/40'>
            <SearchIcon className='h-4 w-4 flex-none text-muted' />
            <label htmlFor='jelajah-search' className='sr-only'>
              Cari nama daerah atau provinsi
            </label>
            <input
              id='jelajah-search'
              type='search'
              value={searchQuery}
              onChange={handleSearchChange}
              autoComplete='off'
              placeholder='Cari nama daerah atau provinsi...'
              className='min-w-0 flex-1 bg-transparent text-[12.5px] text-ink outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden'
            />
          </form>
        </div>

        {searchQuery && (
          <div className='mt-8'>
            <p className='text-[11.5px] text-muted mb-4'>
              Hasil pencarian untuk '{searchQuery}'
            </p>
            {searchResults.length > 0 ? (
              <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                {searchResults.map((province) => (
                  <Link
                    key={province.id}
                    href={'/budaya?q=' + encodeURIComponent(province.name)}
                    className='group focus-ring flex items-center justify-between rounded-lg border border-line bg-paper px-4 py-3 transition-all hover:border-ink/40 hover:shadow-sm'
                  >
                    <div>
                      <p className='text-[13px] font-medium text-ink group-hover:text-ink'>
                        {province.name}
                      </p>
                      <p className='text-[11px] text-muted mt-0.5'>
                        {ISLANDS[province.island].label}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className='rounded-lg border border-dashed border-line bg-paper px-5 py-8 text-center'>
                <p className='text-[12.5px] text-muted'>
                  Tidak ditemukan provinsi atau daerah yang cocok.
                </p>
              </div>
            )}
          </div>
        )}

        {!searchQuery && (
          <>
            <div className='mt-10'>
              <div className='relative rounded-lg border border-line bg-paper overflow-hidden'>
                <div className='relative w-full'>
                  <Image
                    src='/images/indonesia-map-new.jpeg'
                    alt='Peta Indonesia'
                    width={1200}
                    height={800}
                    className='w-full h-auto'
                    priority
                  />
                  {islandPositions.map((pos) => (
                    <button
                      key={pos.key}
                      onClick={() => handleIslandClick(pos.key)}
                      className='absolute -translate-x-1/2 -translate-y-1/2 transform cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 rounded-full'
                      style={pos.style}
                      aria-label={'Pilih ' + pos.label}
                    >
                      <div className={'relative ' + (selectedIsland === pos.key ? 'scale-125' : 'hover:scale-110') + ' transition-transform'}>
                        <svg width='32' height='40' viewBox='0 0 32 40' fill='none' xmlns='http://www.w3.org/2000/svg' className='drop-shadow-lg'>
                          <path d='M16 0C7.163 0 0 7.163 0 16c0 12 16 24 16 24s16-12 16-24c0-8.837-7.163-16-16-16z' fill={selectedIsland === pos.key ? '#DC2626' : '#EA580C'}/>
                          <circle cx='16' cy='16' r='6' fill='white'/>
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
                <p className='text-center text-[11px] text-muted py-3'>
                  Klik ikon lokasi pada pulau untuk melihat provinsi
                </p>
              </div>
            </div>

            {selectedIsland && (
              <div className='mt-10'>
                <h2 className='text-[18px] font-medium text-ink mb-6'>
                  Provinsi di {ISLANDS[selectedIsland].label}
                </h2>
                <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                  {provincesOnIsland.map((province) => (
                    <Link
                      key={province.id}
                      href={'/budaya?q=' + encodeURIComponent(province.name)}
                      className='group focus-ring overflow-hidden rounded-lg border border-line bg-paper transition-all hover:border-ink/40 hover:shadow-sm'
                    >
                      <div className='relative h-28 w-full bg-gradient-to-br from-amber-50 to-orange-50'>
                        <div className='absolute inset-0 flex items-center justify-center text-4xl opacity-20'>
                          ???
                        </div>
                      </div>
                      <div className='p-4'>
                        <p className='text-[13px] font-medium text-ink group-hover:text-ink'>
                          {province.name}
                        </p>
                        <p className='text-[11px] text-muted mt-1'>
                          Jelajahi budaya
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
