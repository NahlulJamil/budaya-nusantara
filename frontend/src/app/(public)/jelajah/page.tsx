import type { Metadata } from 'next';

import { JelajahContent } from '@/components/jelajah/JelajahContent';

export const metadata: Metadata = {
  title: 'Jelajah Indonesia - Galeri Budaya',
  description: 'Jelajahi kekayaan budaya Indonesia berdasarkan pulau dan provinsi. Temukan tradisi, pakaian adat, makanan, dan alat musik dari berbagai daerah.',
};

export default function JelajahPage() {
  return <JelajahContent />;
}
