export type IslandGroup = 'sumatera' | 'jawa' | 'bali-nusa-tenggara' | 'kalimantan' | 'sulawesi' | 'maluku' | 'papua';

export interface ProvinceData {
  id: string;
  name: string;
  slug: string;
  islandGroup: IslandGroup;
  region: string;
  image: string;
  description: string;
  cultureCount: number;
  position?: { top: string; left: string };
}

export const ISLAND_GROUPS: Record<IslandGroup, { name: string; countLabel: string }> = {
  sumatera: { name: 'Pulau Sumatera', countLabel: 'provinsi' },
  jawa: { name: 'Pulau Jawa', countLabel: 'provinsi' },
  'bali-nusa-tenggara': { name: 'Bali dan Nusa Tenggara', countLabel: 'provinsi' },
  kalimantan: { name: 'Pulau Kalimantan', countLabel: 'provinsi' },
  sulawesi: { name: 'Pulau Sulawesi', countLabel: 'provinsi' },
  maluku: { name: 'Kepulauan Maluku', countLabel: 'provinsi' },
  papua: { name: 'Pulau Papua', countLabel: 'provinsi' },
};

export const PROVINCE_DATA: ProvinceData[] = [
  // Sumatera
  { id: 'aceh', name: 'Aceh', slug: 'aceh', islandGroup: 'sumatera', region: 'Sumatera', image: '/images/batik.jpg', description: 'Serambi Mekkah dengan kekayaan adat istiadat dan kesenian khas Aceh.', cultureCount: 24, position: { top: '18%', left: '12%' } },
  { id: 'sumut', name: 'Sumatera Utara', slug: 'sumatera-utara', islandGroup: 'sumatera', region: 'Sumatera', image: '/images/galeri-rumah-gadang.jpg', description: 'Tanah Batak dengan rumah adat Bolon dan kekayaan tradisi.', cultureCount: 31, position: { top: '22%', left: '16%' } },
  { id: 'sumbar', name: 'Sumatera Barat', slug: 'sumatera-barat', islandGroup: 'sumatera', region: 'Sumatera', image: '/images/galeri-rumah-gadang.jpg', description: 'Ranah Minangkabau dengan rumah Gadang dan budaya matrilineal.', cultureCount: 28, position: { top: '28%', left: '16%' } },
  { id: 'riau', name: 'Riau', slug: 'riau', islandGroup: 'sumatera', region: 'Sumatera', image: '/images/angklung.jpg', description: 'Pusat kebudayaan Melayu dengan tradisi bahari yang kaya.', cultureCount: 19, position: { top: '30%', left: '20%' } },
  { id: 'kepri', name: 'Kepulauan Riau', slug: 'kepulauan-riau', islandGroup: 'sumatera', region: 'Sumatera', image: '/images/galeri-bali.jpg', description: 'Kepulauan dengan kekayaan bahari dan budaya Melayu.', cultureCount: 16, position: { top: '26%', left: '24%' } },
  { id: 'jambi', name: 'Jambi', slug: 'jambi', islandGroup: 'sumatera', region: 'Sumatera', image: '/images/batik.jpg', description: 'Tanah Melayu Jambi dengan kesenian tradisional yang unik.', cultureCount: 21, position: { top: '36%', left: '19%' } },
  { id: 'sumsel', name: 'Sumatera Selatan', slug: 'sumatera-selatan', islandGroup: 'sumatera', region: 'Sumatera', image: '/images/tinutuan.jpg', description: 'Rumah adat Limas dan kekayaan budaya Palembang.', cultureCount: 25, position: { top: '42%', left: '20%' } },
  { id: 'babel', name: 'Bangka Belitung', slug: 'bangka-belitung', islandGroup: 'sumatera', region: 'Sumatera', image: '/images/galeri-kuliner.jpg', description: 'Kepulauan dengan budaya Melayu dan tambang timah.', cultureCount: 14, position: { top: '44%', left: '24%' } },
  { id: 'bengkulu', name: 'Bengkulu', slug: 'bengkulu', islandGroup: 'sumatera', region: 'Sumatera', image: '/images/batik.jpg', description: 'Provinsi dengan sejarah kolonial dan kekayaan budaya lokal.', cultureCount: 17, position: { top: '48%', left: '18%' } },
  { id: 'lampung', name: 'Lampung', slug: 'lampung', islandGroup: 'sumatera', region: 'Sumatera', image: '/images/sekaten.jpg', description: 'Tanah Lampung dengan tapis dan kerajinan tradisional.', cultureCount: 20, position: { top: '52%', left: '22%' } },
  
  // Jawa
  { id: 'banten', name: 'Banten', slug: 'banten', islandGroup: 'jawa', region: 'Jawa', image: '/images/batik.jpg', description: 'Banten dengan sejarah Kesultanan dan keragaman budaya.', cultureCount: 22, position: { top: '58%', left: '30%' } },
  { id: 'jakarta', name: 'DKI Jakarta', slug: 'dki-jakarta', islandGroup: 'jawa', region: 'Jawa', image: '/images/hero-pura.jpg', description: 'Ibu kota dengan kekayaan budaya Betawi yang autentik.', cultureCount: 18, position: { top: '60%', left: '32%' } },
  { id: 'jabar', name: 'Jawa Barat', slug: 'jawa-barat', islandGroup: 'jawa', region: 'Jawa', image: '/images/angklung.jpg', description: 'Tanah Sunda dengan angklung, wayang golek, dan kesenian tradisional.', cultureCount: 35, position: { top: '62%', left: '34%' } },
  { id: 'jogja', name: 'DI Yogyakarta', slug: 'di-yogyakarta', islandGroup: 'jawa', region: 'Jawa', image: '/images/sekaten.jpg', description: 'Kota budaya dengan kraton, batik, dan tradisi yang lestari.', cultureCount: 29, position: { top: '66%', left: '36%' } },
  { id: 'jateng', name: 'Jawa Tengah', slug: 'jawa-tengah', islandGroup: 'jawa', region: 'Jawa', image: '/images/sekaten.jpg', description: 'Pusat kebudayaan Jawa dengan wayang kulit dan gamelan.', cultureCount: 33, position: { top: '64%', left: '38%' } },
  { id: 'jatim', name: 'Jawa Timur', slug: 'jawa-timur', islandGroup: 'jawa', region: 'Jawa', image: '/images/tinutuan.jpg', description: 'Tanah Arek dengan kesenian ludruk dan kekayaan tradisi.', cultureCount: 32, position: { top: '68%', left: '42%' } },
  
  // Bali & Nusa Tenggara
  { id: 'bali', name: 'Bali', slug: 'bali', islandGroup: 'bali-nusa-tenggara', region: 'Bali & Nusa Tenggara', image: '/images/galeri-bali.jpg', description: 'Pulau Dewata dengan tari tradisional, pura, dan budaya Hindu.', cultureCount: 27, position: { top: '72%', left: '48%' } },
  { id: 'ntb', name: 'Nusa Tenggara Barat', slug: 'nusa-tenggara-barat', islandGroup: 'bali-nusa-tenggara', region: 'Bali & Nusa Tenggara', image: '/images/galeri-kuliner.jpg', description: 'NTB dengan Sasak, Sumbawa, dan kekayaan budaya maritim.', cultureCount: 21, position: { top: '74%', left: '52%' } },
  { id: 'ntt', name: 'Nusa Tenggara Timur', slug: 'nusa-tenggara-timur', islandGroup: 'bali-nusa-tenggara', region: 'Bali & Nusa Tenggara', image: '/images/tinutuan.jpg', description: 'Kepulauan dengan rumah adat Mbaru Niang dan tenun ikat.', cultureCount: 24, position: { top: '76%', left: '56%' } },
  
  // Kalimantan
  { id: 'kalbar', name: 'Kalimantan Barat', slug: 'kalimantan-barat', islandGroup: 'kalimantan', region: 'Kalimantan', image: '/images/batik.jpg', description: 'Tanah Dayak dengan rumah panjang dan kesenian tradisional.', cultureCount: 26, position: { top: '42%', left: '40%' } },
  { id: 'kalteng', name: 'Kalimantan Tengah', slug: 'kalimantan-tengah', islandGroup: 'kalimantan', region: 'Kalimantan', image: '/images/angklung.jpg', description: 'Jantung Kalimantan dengan budaya Dayak Ngaju.', cultureCount: 23, position: { top: '46%', left: '44%' } },
  { id: 'kalsel', name: 'Kalimantan Selatan', slug: 'kalimantan-selatan', islandGroup: 'kalimantan', region: 'Kalimantan', image: '/images/galeri-kuliner.jpg', description: 'Banjar dengan rumah Bubungan Tinggi dan kesenian lokal.', cultureCount: 25, position: { top: '50%', left: '48%' } },
  { id: 'kaltim', name: 'Kalimantan Timur', slug: 'kalimantan-timur', islandGroup: 'kalimantan', region: 'Kalimantan', image: '/images/tinutuan.jpg', description: 'Kalimantan Timur dengan Dayak Kenyah dan pesisir beragam.', cultureCount: 28, position: { top: '38%', left: '48%' } },
  { id: 'kaltara', name: 'Kalimantan Utara', slug: 'kalimantan-utara', islandGroup: 'kalimantan', region: 'Kalimantan', image: '/images/batik.jpg', description: 'Provinsi termuda dengan kekayaan budaya perbatasan.', cultureCount: 19, position: { top: '34%', left: '52%' } },
  
  // Sulawesi
  { id: 'sulut', name: 'Sulawesi Utara', slug: 'sulawesi-utara', islandGroup: 'sulawesi', region: 'Sulawesi', image: '/images/tinutuan.jpg', description: 'Manado dengan tari kabasaran dan kuliner khas.', cultureCount: 22, position: { top: '36%', left: '62%' } },
  { id: 'gorontalo', name: 'Gorontalo', slug: 'gorontalo', islandGroup: 'sulawesi', region: 'Sulawesi', image: '/images/galeri-kuliner.jpg', description: 'Gorontalo dengan adat istiadat dan kesenian unik.', cultureCount: 18, position: { top: '38%', left: '60%' } },
  { id: 'sulteng', name: 'Sulawesi Tengah', slug: 'sulawesi-tengah', islandGroup: 'sulawesi', region: 'Sulawesi', image: '/images/batik.jpg', description: 'Kaili dengan rumah adat Tambi dan megalitikum.', cultureCount: 24, position: { top: '42%', left: '58%' } },
  { id: 'sulbar', name: 'Sulawesi Barat', slug: 'sulawesi-barat', islandGroup: 'sulawesi', region: 'Sulawesi', image: '/images/angklung.jpg', description: 'Mamuju dengan budaya Mandar yang kaya.', cultureCount: 20, position: { top: '48%', left: '56%' } },
  { id: 'sulsel', name: 'Sulawesi Selatan', slug: 'sulawesi-selatan', islandGroup: 'sulawesi', region: 'Sulawesi', image: '/images/galeri-bali.jpg', description: 'Bugis-Makassar dengan kapal pinisi dan adat istiadat.', cultureCount: 31, position: { top: '54%', left: '60%' } },
  { id: 'sultra', name: 'Sulawesi Tenggara', slug: 'sulawesi-tenggara', islandGroup: 'sulawesi', region: 'Sulawesi', image: '/images/tinutuan.jpg', description: 'Kendari dengan budaya Tolaki dan kekayaan bahari.', cultureCount: 21, position: { top: '56%', left: '64%' } },
  
  // Maluku
  { id: 'maluku', name: 'Maluku', slug: 'maluku', islandGroup: 'maluku', region: 'Maluku', image: '/images/galeri-bali.jpg', description: 'Kepulauan rempah dengan budaya Ambon yang kaya.', cultureCount: 19, position: { top: '50%', left: '70%' } },
  { id: 'malut', name: 'Maluku Utara', slug: 'maluku-utara', islandGroup: 'maluku', region: 'Maluku', image: '/images/angklung.jpg', description: 'Ternate-Tidore dengan sejarah kesultanan rempah.', cultureCount: 17, position: { top: '46%', left: '74%' } },
  { id: 'papbar', name: 'Papua Barat', slug: 'papua-barat', islandGroup: 'maluku', region: 'Maluku', image: '/images/batik.jpg', description: 'Papua Barat dengan kekayaan budaya suku Asmat dan lainnya.', cultureCount: 23, position: { top: '44%', left: '78%' } },
  { id: 'papbard', name: 'Papua Barat Daya', slug: 'papua-barat-daya', islandGroup: 'maluku', region: 'Maluku', image: '/images/galeri-rumah-gadang.jpg', description: 'Provinsi baru dengan kekayaan budaya Papua Barat.', cultureCount: 20, position: { top: '40%', left: '80%' } },
  
  // Papua
  { id: 'papua', name: 'Papua', slug: 'papua', islandGroup: 'papua', region: 'Papua', image: '/images/hero-pura.jpg', description: 'Tanah Papua dengan suku Asmat, Dani, dan kekayaan seni ukir.', cultureCount: 35, position: { top: '48%', left: '84%' } },
  { id: 'papteng', name: 'Papua Tengah', slug: 'papua-tengah', islandGroup: 'papua', region: 'Papua', image: '/images/sekaten.jpg', description: 'Provinsi baru dengan budaya pegunungan yang unik.', cultureCount: 26, position: { top: '44%', left: '88%' } },
  { id: 'papgun', name: 'Papua Pegunungan', slug: 'papua-pegunungan', islandGroup: 'papua', region: 'Papua', image: '/images/galeri-bali.jpg', description: 'Lembah Baliem dengan suku Dani dan tradisi unik.', cultureCount: 29, position: { top: '40%', left: '92%' } },
  { id: 'papsel', name: 'Papua Selatan', slug: 'papua-selatan', islandGroup: 'papua', region: 'Papua', image: '/images/tinutuan.jpg', description: 'Merauke dengan budaya Asmat dan pesisir Papua.', cultureCount: 24, position: { top: '52%', left: '88%' } },
];

export function getProvincesByIslandGroup(islandGroup: IslandGroup): ProvinceData[] {
  return PROVINCE_DATA.filter(p => p.islandGroup === islandGroup);
}

export function searchProvinces(query: string, islandGroup?: IslandGroup): ProvinceData[] {
  let results = query.trim() ? PROVINCE_DATA.filter(p => 
    p.name.toLowerCase().includes(query.toLowerCase().trim())
  ) : PROVINCE_DATA;
  
  if (islandGroup) {
    results = results.filter(p => p.islandGroup === islandGroup);
  }
  
  return results;
}

export function getProvinceBySlug(slug: string): ProvinceData | undefined {
  return PROVINCE_DATA.find(p => p.slug === slug);
}

function normalizeProvinceName(value: string): string {
  return value.trim().toLowerCase().replace(/sumatera/g, 'sumatra');
}

/** Cocokkan nama provinsi dari API (mis. "Sumatra Barat") dengan data statis. */
export function getProvinceByName(name: string | null | undefined): ProvinceData | undefined {
  if (!name) {
    return undefined;
  }

  const target = normalizeProvinceName(name);

  return PROVINCE_DATA.find(province => normalizeProvinceName(province.name) === target);
}

export function getTotalProvincesByGroup(islandGroup: IslandGroup): number {
  return getProvincesByIslandGroup(islandGroup).length;
}
