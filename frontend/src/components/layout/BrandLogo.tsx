import Image from "next/image";
import Link from "next/link";

const SIZE_CLASS = {
  sm: "h-[22px]",
  md: "h-[25px]",
  lg: "h-[30px]",
} as const;

const TEXT_SIZE_CLASS = {
  sm: "text-[19px]",
  md: "text-[22px]",
  lg: "text-[26px] sm:text-[30px]",
} as const;

const SURFACE_CLASS = {
  dark: {
    primary: "text-[#f7f2e6]",
    accent: "text-[#c9a24a]",
  },
  light: {
    primary: "text-ink",
    accent: "text-[#a67c2e]",
  },
} as const;

/**
 * Logo resmi GaleriBudaya pada permukaan gelap. Untuk permukaan terang,
 * wordmark teks dipakai karena aset logo berwarna krem.
 */
export function BrandLogo({
  href = "/",
  surface = "dark",
  size = "md",
  className = "",
  onClick,
}: {
  href?: string;
  surface?: keyof typeof SURFACE_CLASS;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
  onClick?: () => void;
}) {
  const tone = SURFACE_CLASS[surface];

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-label="GaleriBudaya — Beranda"
      className={`focus-ring inline-flex items-center leading-none ${className}`}
    >
      {surface === "dark" ? (
        <Image
          src="/images/logo-galeribudaya.png"
          alt="GaleriBudaya"
          width={162}
          height={25}
          loading="eager"
          className={`w-auto ${SIZE_CLASS[size]}`}
        />
      ) : (
        <span
          className={`font-serif tracking-[0.01em] ${TEXT_SIZE_CLASS[size]}`}
        >
          <span className={tone.primary}>Galeri</span>
          <span className={tone.accent}>Budaya</span>
        </span>
      )}
    </Link>
  );
}
