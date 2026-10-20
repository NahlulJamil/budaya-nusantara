"use client";

import { useCallback, useEffect, useState } from "react";

import {
  FALLBACK_CULTURE_CARDS,
  FALLBACK_GALLERY,
} from "@/data/homeFallback";
import { fetchHomeCultureCards, fetchHomeGallery } from "@/lib/api";
import type { HomeCultureCard, HomeGalleryItem } from "@/lib/types";

export type PreviewReason = "empty" | "error" | null;

interface HomeData {
  culture: HomeCultureCard[];
  gallery: HomeGalleryItem[];
  culturePreview: boolean;
  galleryPreview: boolean;
  cultureReason: PreviewReason;
  galleryReason: PreviewReason;
}

const INITIAL_DATA: HomeData = {
  culture: [],
  gallery: [],
  culturePreview: false,
  galleryPreview: false,
  cultureReason: null,
  galleryReason: null,
};

export function useHomeData() {
  const [data, setData] = useState<HomeData>(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  const reload = useCallback(() => {
    setLoading(true);
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([fetchHomeCultureCards(), fetchHomeGallery()]).then(
      ([cultureResult, galleryResult]) => {
        if (cancelled) {
          return;
        }

        const cultureFromApi =
          cultureResult.status === "fulfilled" && cultureResult.value.length > 0;
        const galleryFromApi =
          galleryResult.status === "fulfilled" && galleryResult.value.length > 0;

        setData({
          culture: cultureFromApi
            ? cultureResult.value
            : FALLBACK_CULTURE_CARDS,
          gallery: galleryFromApi ? galleryResult.value : FALLBACK_GALLERY,
          culturePreview: !cultureFromApi,
          galleryPreview: !galleryFromApi,
          cultureReason: cultureFromApi
            ? null
            : cultureResult.status === "rejected"
              ? "error"
              : "empty",
          galleryReason: galleryFromApi
            ? null
            : galleryResult.status === "rejected"
              ? "error"
              : "empty",
        });
        setLoading(false);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return { ...data, loading, reload };
}
