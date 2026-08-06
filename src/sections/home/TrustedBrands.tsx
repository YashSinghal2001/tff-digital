const brands = Array.from({ length: 8 }, (_, i) => `Halcyon ${i + 1}`);

export function TrustedBrands() {
  return (
    <section className="border-y border-border-subtle py-8">
      <p className="mb-6 text-center font-body text-xs tracking-[0.2em] text-muted">
        TRUSTED BY AMBITIOUS BRANDS WORLDWIDE
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 px-5">
        {brands.map((brand) => (
          <span key={brand} className="font-heading text-sm font-semibold text-white/50">
            Halcyon
          </span>
        ))}
      </div>
    </section>
  );
}
