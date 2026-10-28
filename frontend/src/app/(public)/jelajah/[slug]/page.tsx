import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProvinceBySlug, PROVINCE_DATA } from '@/data/provinceData';
import { ProvinceDetailContent } from '@/components/jelajah/ProvinceDetailContent';

interface ProvinceDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return PROVINCE_DATA.map((province) => ({ slug: province.slug }));
}

export async function generateMetadata({ params }: ProvinceDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const province = getProvinceBySlug(slug);
  if (!province) return { title: 'Provinsi Tidak Ditemukan - Galeri Budaya' };
  return { title: province.name + ' - Jelajah Indonesia | Galeri Budaya', description: province.description };
}

export default async function ProvinceDetailPage({ params }: ProvinceDetailPageProps) {
  const { slug } = await params;
  const province = getProvinceBySlug(slug);
  if (!province) notFound();
  return <ProvinceDetailContent province={province} />;
}

