"use client";

import { useEffect, useRef, useState } from "react";

export default function HeroVideo({ locale }: { locale: "en" | "de" | "ru" | "it" | "pl" }) {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      if (media.matches) video.current?.pause();
      else void video.current?.play().catch(() => {});
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const labels = {
    en: ["Pause background video", "Play background video"],
    de: ["Hintergrundvideo pausieren", "Hintergrundvideo abspielen"],
    ru: ["Приостановить фоновое видео", "Воспроизвести фоновое видео"],
    it: ["Metti in pausa il video", "Riproduci il video"],
    pl: ["Wstrzymaj film w tle", "Odtwórz film w tle"],
  }[locale];
  return <>
    <video ref={video} className="light-hero-image light-hero-video" muted loop playsInline preload="metadata" poster="/hero-mediterranean-sunset.jpg" aria-hidden="true" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}>
      <source src="/hero-mediterranean-sunset.mp4" type="video/mp4" />
    </video>
    <button className="hero-video-toggle" type="button" aria-label={labels[playing ? 0 : 1]} onClick={() => {
      if (playing) video.current?.pause();
      else void video.current?.play().catch(() => {});
    }}>
      <svg viewBox="0 0 24 24" aria-hidden="true">{playing ? <><path d="M8 5v14M16 5v14" /></> : <path d="m9 5 10 7-10 7Z" />}</svg>
    </button>
  </>;
}
