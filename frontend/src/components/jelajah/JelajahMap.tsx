'use client';

import { useState } from 'react';
import Image from 'next/image';
import { type IslandGroup } from '@/data/provinceData';

interface JelajahMapProps {
  selectedIsland: IslandGroup | null;
  onIslandSelect: (island: IslandGroup | null) => void;
}

export function JelajahMap({ selectedIsland, onIslandSelect }: JelajahMapProps) {
  const [hoveredIsland, setHoveredIsland] = useState<IslandGroup | null>(null);

  const islandMarkers = [
    { key: 'sumatera' as IslandGroup, top: '45%', left: '18%', label: 'Sumatera' },
    { key: 'jawa' as IslandGroup, top: '64%', left: '38%', label: 'Jawa' },
    { key: 'bali-nusa-tenggara' as IslandGroup, top: '70%', left: '52%', label: 'Bali & Nusa Tenggara' },
    { key: 'kalimantan' as IslandGroup, top: '44%', left: '42%', label: 'Kalimantan' },
    { key: 'sulawesi' as IslandGroup, top: '52%', left: '56%', label: 'Sulawesi' },
    { key: 'maluku' as IslandGroup, top: '49%', left: '73%', label: 'Maluku' },
    { key: 'papua' as IslandGroup, top: '49%', left: '87%', label: 'Papua' },
  ];

  const handleMarkerClick = (island: IslandGroup) => {
    if (selectedIsland === island) {
      onIslandSelect(null);
    } else {
      onIslandSelect(island);
    }
  };

  return (
    <div className='relative rounded-2xl bg-[#f0f7f0] p-4 sm:p-6 lg:p-8 overflow-hidden'>
      <div className='mb-4 flex items-center justify-between'>
        <span className='text-[9px] font-medium tracking-[0.18em] text-[#6b6b5a] uppercase'>
          PETA NUSANTARA
        </span>
      </div>
      
      <div className='relative w-full max-w-4xl mx-auto'>
        <Image
          src='/images/peta indonesia.avif'
          alt='Peta Indonesia'
          width={1200}
          height={800}
          className='w-full h-auto rounded-lg'
          priority
        />
        
        {islandMarkers.map((marker) => {
          const isSelected = selectedIsland === marker.key;
          const isHovered = hoveredIsland === marker.key;
          
          return (
            <button
              key={marker.key}
              onClick={() => handleMarkerClick(marker.key)}
              onMouseEnter={() => setHoveredIsland(marker.key)}
              onMouseLeave={() => setHoveredIsland(null)}
              onFocus={() => setHoveredIsland(marker.key)}
              onBlur={() => setHoveredIsland(null)}
              className='absolute -translate-x-1/2 -translate-y-1/2 transform cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#E5B51D] focus:ring-offset-2 rounded-full transition-all duration-200'
              style={{ top: marker.top, left: marker.left }}
              aria-label={'Pilih ' + marker.label}
              aria-pressed={isSelected}
            >
              <div className={'relative ' + (isSelected ? 'scale-125' : isHovered ? 'scale-110' : '') + ' transition-transform duration-200'}>
                <svg width='28' height='36' viewBox='0 0 28 36' fill='none' xmlns='http://www.w3.org/2000/svg' className='drop-shadow-lg'>
                  <path d='M14 0C6.268 0 0 6.268 0 14c0 10.5 14 21 14 21s14-10.5 14-21c0-7.732-6.268-14-14-14z' fill='#FFFFFF' stroke='#050505' strokeWidth='1.5'/>
                  <circle cx='14' cy='14' r='5' fill='#050505'/>
                </svg>
                {(isHovered || isSelected) && (
                  <div className='absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#050505] px-2 py-1 text-[10px] text-white'>
                    {marker.label}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

