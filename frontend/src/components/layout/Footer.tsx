import Link from "next/link";

const JELAJAH_LINKS = [
  { href: "/jelajah", label: "Jelajah Indonesia" },
  { href: "/galeri", label: "Galeri" },
  { href: "/aksara", label: "Belajar Aksara" },
  { href: "/kuis", label: "Kuis Aksara" },
  { href: "/chatbot", label: "Chatbot Budaya" },
];

const RUANG_LINKS = [
  { href: "/tentang", label: "Tentang Kami" },
  { href: "/panduan-kontribusi", label: "Panduan Kontribusi" },
  { href: "/privasi", label: "Privasi" },
  { href: "/ketentuan", label: "Ketentuan penggunaan" },
];

export function Footer() {
  return (
    <footer className="bg-night text-[#efeade]">
      <div className="shell pt-14 pb-7 sm:pt-16 lg:pt-20">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1.05fr] lg:gap-12">
          <div>
            <Link
              href="/"
              className="focus-ring inline-block font-serif text-[26px] tracking-[0.03em] text-[#efe6d2]"
            >
              galeri budaya
            </Link>
            <p className="mt-4 max-w-[17rem] text-[12.5px] leading-[1.85] text-[#a8a294]">
              Mengenal akar. Merawat cerita.
              <br />
              Ruang untuk budaya Indonesia yang terus hidup.
            </p>
          </div>

          <div>
            <h2 className="text-[9.5px] font-medium tracking-[0.18em] text-[#8d8779] uppercase">
              Jelajah
            </h2>
            <ul className="mt-4 space-y-1.5 text-[12.5px] text-[#d8d2c4]">
              <li className="flex flex-wrap items-center gap-1.5">
                <Link
                  href="/"
                  className="focus-ring transition-colors hover:text-white"
                >
                  Home
                </Link>
                <span className="text-[#6f6a5f]" aria-hidden="true">
                  ·
                </span>
                <Link
                  href="/jelajah"
                  className="focus-ring transition-colors hover:text-white"
                >
                  Jelajah Indonesia
                </Link>
              </li>
              {JELAJAH_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="focus-ring transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-[9.5px] font-medium tracking-[0.18em] text-[#8d8779] uppercase">
              Ruang Bersama
            </h2>
            <ul className="mt-4 space-y-1.5 text-[12.5px] text-[#d8d2c4]">
              {RUANG_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="focus-ring transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-2 max-w-[15rem] text-[11px] leading-[1.7] text-[#8d8779]">
              Upload dan profil memerlukan login.
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-[10.5px] text-[#8d8779] sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Galeri Budaya</p>
          <p>Dibuat untuk merawat ingatan.</p>
        </div>
      </div>
    </footer>
  );
}
