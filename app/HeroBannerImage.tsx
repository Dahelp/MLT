type HeroName = "contact" | "investments" | "smart-map" | "motorhomes" | "capsule-home";

/** Only the selected format and responsive size are fetched by the browser. */
export default function HeroBannerImage({ name }: { name: HeroName }) {
  const base = `/hero-banners/${name === "motorhomes" ? "motorhomes-v2" : name}-hero`;
  return <picture className={`page-hero-picture page-hero-${name}`}>
    <source type="image/avif" srcSet={`${base}-mobile.avif 768w, ${base}.avif 1376w`} sizes="100vw" />
    <img src={`${base}.webp`} srcSet={`${base}-mobile.webp 768w, ${base}.webp 1376w`} sizes="100vw" width={1376} height={name === "contact" ? 763 : 768} alt="" fetchPriority="high" loading="eager" decoding="async" />
  </picture>;
}
