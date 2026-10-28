export type IslandKey = 
  | 'sumatera' 
  | 'jawa' 
  | 'kalimantan' 
  | 'sulawesi' 
  | 'maluku' 
  | 'papua' 
  | 'nusa-tenggara';

export interface Province {
  id: string;
  name: string;
  island: IslandKey;
}

export const ISLANDS: Record<IslandKey, { name: string; label: string }> = {
  sumatera: { name: 'Sumatera', label: 'Sumatera' },
  jawa: { name: 'Jawa', label: 'Jawa' },
  kalimantan: { name: 'Kalimantan', label: 'Kalimantan' },
  sulawesi: { name: 'Sulawesi', label: 'Sulawesi' },
  maluku: { name: 'Maluku', label: 'Maluku & Papua Barat' },
  papua: { name: 'Papua', label: 'Papua' },
  'nusa-tenggara': { name: 'Nusa Tenggara', label: 'Bali & Nusa Tenggara' },
};

export const PROVINCES: Province[] = [
  { id: 'aceh', name: 'Aceh', island: 'sumatera' },
  { id: 'sumatera-utara', name: 'Sumatera Utara', island: 'sumatera' },
  { id: 'sumatera-barat', name: 'Sumatera Barat', island: 'sumatera' },
  { id: 'riau', name: 'Riau', island: 'sumatera' },
  { id: 'kepulauan-riau', name: 'Kepulauan Riau', island: 'sumatera' },
  { id: 'jambi', name: 'Jambi', island: 'sumatera' },
  { id: 'sumatera-selatan', name: 'Sumatera Selatan', island: 'sumatera' },
  { id: 'bangka-belitung', name: 'Bangka Belitung', island: 'sumatera' },
  { id: 'bengkulu', name: 'Bengkulu', island: 'sumatera' },
  { id: 'lampung', name: 'Lampung', island: 'sumatera' },
  { id: 'dki-jakarta', name: 'DKI Jakarta', island: 'jawa' },
  { id: 'jawa-barat', name: 'Jawa Barat', island: 'jawa' },
  { id: 'jawa-tengah', name: 'Jawa Tengah', island: 'jawa' },
  { id: 'di-yogyakarta', name: 'DI Yogyakarta', island: 'jawa' },
  { id: 'jawa-timur', name: 'Jawa Timur', island: 'jawa' },
  { id: 'banten', name: 'Banten', island: 'jawa' },
  { id: 'kalimantan-barat', name: 'Kalimantan Barat', island: 'kalimantan' },
  { id: 'kalimantan-tengah', name: 'Kalimantan Tengah', island: 'kalimantan' },
  { id: 'kalimantan-selatan', name: 'Kalimantan Selatan', island: 'kalimantan' },
  { id: 'kalimantan-timur', name: 'Kalimantan Timur', island: 'kalimantan' },
  { id: 'kalimantan-utara', name: 'Kalimantan Utara', island: 'kalimantan' },
  { id: 'sulawesi-utara', name: 'Sulawesi Utara', island: 'sulawesi' },
  { id: 'gorontalo', name: 'Gorontalo', island: 'sulawesi' },
  { id: 'sulawesi-tengah', name: 'Sulawesi Tengah', island: 'sulawesi' },
  { id: 'sulawesi-barat', name: 'Sulawesi Barat', island: 'sulawesi' },
  { id: 'sulawesi-selatan', name: 'Sulawesi Selatan', island: 'sulawesi' },
  { id: 'sulawesi-tenggara', name: 'Sulawesi Tenggara', island: 'sulawesi' },
  { id: 'bali', name: 'Bali', island: 'nusa-tenggara' },
  { id: 'nusa-tenggara-barat', name: 'Nusa Tenggara Barat', island: 'nusa-tenggara' },
  { id: 'nusa-tenggara-timur', name: 'Nusa Tenggara Timur', island: 'nusa-tenggara' },
  { id: 'maluku', name: 'Maluku', island: 'maluku' },
  { id: 'maluku-utara', name: 'Maluku Utara', island: 'maluku' },
  { id: 'papua-barat', name: 'Papua Barat', island: 'maluku' },
  { id: 'papua-barat-daya', name: 'Papua Barat Daya', island: 'maluku' },
  { id: 'papua', name: 'Papua', island: 'papua' },
  { id: 'papua-tengah', name: 'Papua Tengah', island: 'papua' },
  { id: 'papua-pegunungan', name: 'Papua Pegunungan', island: 'papua' },
  { id: 'papua-selatan', name: 'Papua Selatan', island: 'papua' },
];

export function getProvincesByIsland(island: IslandKey): Province[] {
  return PROVINCES.filter(p => p.island === island);
}

export function searchProvinces(query: string): Province[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase().trim();
  return PROVINCES.filter(p => p.name.toLowerCase().includes(q));
}
