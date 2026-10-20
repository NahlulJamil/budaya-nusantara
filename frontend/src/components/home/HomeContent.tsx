"use client";

import { CultureSection } from "@/components/home/CultureSection";
import { GallerySection } from "@/components/home/GallerySection";
import { useHomeData } from "@/hooks/useHomeData";

export function HomeContent() {
  const {
    culture,
    gallery,
    culturePreview,
    galleryPreview,
    cultureReason,
    galleryReason,
    loading,
    reload,
  } = useHomeData();

  return (
    <>
      <CultureSection
        cards={culture}
        loading={loading}
        preview={culturePreview}
        reason={cultureReason}
        onRetry={reload}
      />
      <GallerySection
        items={gallery}
        loading={loading}
        preview={galleryPreview}
        reason={galleryReason}
        onRetry={reload}
      />
    </>
  );
}
