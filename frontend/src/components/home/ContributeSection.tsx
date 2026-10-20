const STEPS = [
  {
    number: "01",
    title: "Amati & dokumentasikan",
    description:
      "Abadikan budaya dengan izin, konteks, dan penghormatan kepada pelakunya.",
  },
  {
    number: "02",
    title: "Lengkapi ceritanya",
    description:
      "Masuk, unggah foto atau video, lalu sertakan daerah, deskripsi, dan sumber.",
  },
  {
    number: "03",
    title: "Tinjau sebelum tayang",
    description:
      "Tim meninjau unggahan. Pantau statusnya melalui halaman Profil.",
  },
];

export function ContributeSection() {
  return (
    <section
      aria-labelledby="kontribusi-heading"
      className="pb-20 lg:pb-28"
    >
      <div className="shell">
        <p className="eyebrow">Merawat budaya, bersama</p>
        <h2
          id="kontribusi-heading"
          className="mt-2.5 font-serif text-[clamp(31px,3.5vw,44px)] leading-[1.1] font-normal tracking-[-0.015em] text-ink"
        >
          Cerita kecilmu punya tempat.
        </h2>

        <div className="mt-9 grid gap-8 sm:grid-cols-3 sm:gap-6 lg:mt-10 lg:gap-10">
          {STEPS.map((step) => (
            <div key={step.number}>
              <p className="text-[10px] tracking-[0.08em] text-muted">
                {step.number}
              </p>
              <h3 className="mt-2 font-serif text-[21px] leading-snug font-normal text-ink sm:text-[22px]">
                {step.title}
              </h3>
              <p className="mt-2 max-w-[280px] text-[11.5px] leading-[1.7] text-muted">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
