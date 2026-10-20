import Image, { type ImageProps } from "next/image";

type AppImageProps = Omit<ImageProps, "fill"> & {
  fill?: boolean;
};

/**
 * Pembungkus `next/image` dengan `unoptimized` agar URL media dari backend
 * (host/port dinamis) bisa dipakai tanpa mendaftarkan remote pattern.
 */
export function AppImage({
  alt,
  fill = true,
  sizes = "100vw",
  ...props
}: AppImageProps) {
  return (
    <Image
      alt={alt}
      fill={fill}
      sizes={fill ? sizes : undefined}
      unoptimized
      {...props}
    />
  );
}
