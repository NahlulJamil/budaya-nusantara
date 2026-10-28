'use client';

import { useState, useMemo } from 'react';
import { JelajahMap } from './JelajahMap';
import { ProvinceCard } from './ProvinceCard';
import { 
  getProvincesByIslandGroup, 
  searchProvinces, 
  ISLAND_GROUPS, 
  type IslandGroup 
} from '@/data/provinceData';
import { SearchIcon } from '@/components/ui/icons';

export function JelajahContent() {
  const [selectedIsland, setSelectedIsland] = useState<IslandGroup | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);

  const provinces = useMemo(() => {
    let result = selectedIsland 
      ? getProvincesByIslandGroup(selectedIsland)
      : [];
    
    if (searchQuery.trim()) {
      result = searchProvinces(searchQuery, selectedIsland || undefined);
    }
    
    return result;
  }, [selectedIsland, searchQuery]);

  const islandInfo = selectedIsland ? ISLAND_GROUPS[selectedIsland] : null;
  const provinceCount = provinces.length;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const resetAll = () => {
    setSelectedIsland(null);
    setSearchQuery('');
    setFilterOpen(false);
  };

  return (
    <main id='main' className='bg-[#F8F6EF] pb-20'>
      <section className='shell pt-12 sm:pt-16 lg:pt-20'>
        {/* Hero Section */}
        <div className='mb-12 max-w-3xl'>
          <h1 className='mb-4 font-serif text-[clamp(36px,5vw,64px)] leading-[1.05] font-normal tracking-[-0.02em] text-[#1a1a1a]'>
            Beda tempat, kaya cerita.
          </h1>
          <p className='text-[14px] leading-[1.8] text-[#6b6b5a] sm:text-[15px]'>
            Pilih pulau, temukan provinsi, lalu kenali budaya yang membentuk identitasnya. 
            Eksplorasi dan preview budaya terbuka tanpa login.
          </p>
        </div>

        {/* Map Section */}
        <div className='mb-12'>
          <JelajahMap selectedIsland={selectedIsland} onIslandSelect={setSelectedIsland} />
        </div>

        {/* Province List Section */}
        {selectedIsland && (
          <div>
            <div className='mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
              <div>
                <h2 className='mb-2 font-serif text-[clamp(28px,4vw,42px)] leading-[1.1] font-normal text-[#1a1a1a]'>
                  Menjelajahi {islandInfo?.name}
                </h2>
                <p className='text-[13px] text-[#6b6b5a]'>
                  {provinceCount} {provinceCount === 1 ? 'provinsi' : islandInfo?.countLabel} · Jelajahi kekayaan budaya dari setiap daerah.
                </p>
              </div>
              
              <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3'>
                <form role='search' className='flex h-10 items-center gap-2 rounded-full border border-[#d4cfc0] bg-white px-4 transition-colors focus-within:border-[#b8b3a3]'>
                  <SearchIcon className='h-4 w-4 flex-none text-[#8b8b7a]' />
                  <label htmlFor='province-search' className='sr-only'>
                    Cari provinsi
                  </label>
                  <input
                    id='province-search'
                    type='search'
                    value={searchQuery}
                    onChange={handleSearchChange}
                    autoComplete='off'
                    placeholder='Cari provinsi...'
                    className='min-w-[200px] flex-1 bg-transparent text-[12.5px] text-[#1a1a1a] outline-none placeholder:text-[#8b8b7a] [&::-webkit-search-cancel-button]:hidden'
                  />
                  {searchQuery && (
                    <button
                      type='button'
                      onClick={clearSearch}
                      className='text-[#8b8b7a] hover:text-[#1a1a1a]'
                      aria-label='Hapus pencarian'
                    >
                      ?
                    </button>
                  )}
                </form>
                
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className='flex h-10 items-center gap-2 rounded-full border border-[#d4cfc0] bg-white px-4 text-[12.5px] text-[#1a1a1a] transition-colors hover:bg-[#f9f7f2]'
                >
                  <svg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'>
                    <path d='M2 4h12M4 8h8M6 12h4' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round'/>
                  </svg>
                  Filter
                </button>
              </div>
            </div>

            {filterOpen && (
              <div className='mb-6 rounded-xl border border-[#e5e0d5] bg-white p-4'>
                <div className='flex flex-wrap gap-2'>
                  <button className='rounded-full bg-[#E5B51D] px-3 py-1 text-[11.5px] text-white'>
                    Semua Kategori
                  </button>
                  <button className='rounded-full border border-[#d4cfc0] px-3 py-1 text-[11.5px] text-[#1a1a1a] hover:bg-[#f9f7f2]'>
                    Tradisi
                  </button>
                  <button className='rounded-full border border-[#d4cfc0] px-3 py-1 text-[11.5px] text-[#1a1a1a] hover:bg-[#f9f7f2]'>
                    Pakaian Adat
                  </button>
                  <button className='rounded-full border border-[#d4cfc0] px-3 py-1 text-[11.5px] text-[#1a1a1a] hover:bg-[#f9f7f2]'>
                    Makanan
                  </button>
                  <button className='rounded-full border border-[#d4cfc0] px-3 py-1 text-[11.5px] text-[#1a1a1a] hover:bg-[#f9f7f2]'>
                    Alat Musik
                  </button>
                </div>
              </div>
            )}

            {provinces.length > 0 ? (
              <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                {provinces.map((province) => (
                  <ProvinceCard key={province.id} province={province} />
                ))}
              </div>
            ) : (
              <div className='rounded-xl border border-dashed border-[#d4cfc0] bg-white/50 px-6 py-12 text-center'>
                <p className='mb-2 text-[14px] text-[#6b6b5a]'>
                  Tidak ada provinsi yang cocok dengan pencarian
                </p>
                <button
                  onClick={resetAll}
                  className='text-[13px] font-medium text-[#E5B51D] hover:text-[#d4a61a]'
                >
                  Tampilkan semua provinsi di {islandInfo?.name}
                </button>
              </div>
            )}
          </div>
        )}

        {!selectedIsland && (
          <div className='text-center py-12'>
            <p className='text-[13px] text-[#6b6b5a]'>
              Pilih pulau pada peta untuk melihat daftar provinsi
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
