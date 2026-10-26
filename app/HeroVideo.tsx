"use client";

import { useEffect, useRef, useState } from "react";

export default function HeroVideo({ locale }: { locale: "en" | "de" | "ru" | "it" | "pl" }) {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [frameReady, setFrameReady] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let startTimer: ReturnType<typeof setTimeout> | undefined;
    const start = () => {
      const element = video.current;
      if (!element) return;
      if (media.matches) { element.pause(); setPlaying(false); }
      else void element.play().then(() => {
        setPlaying(!element.paused);
        // Reveal only a decoded video frame; the still remains underneath.
        if (element.readyState >= 2) {
          if ("requestVideoFrameCallback" in element) element.requestVideoFrameCallback(() => setFrameReady(true));
          else setFrameReady(true);
        }
      }).catch(() => setPlaying(false));
    };
    const queueStart = () => {
      clearTimeout(startTimer);
      startTimer = setTimeout(start, 250);
    };
    const update = () => {
      clearTimeout(startTimer);
      window.removeEventListener("load", queueStart);
      if (media.matches) { video.current?.pause(); setPlaying(false); }
      else if (document.readyState === "complete") queueStart();
      else window.addEventListener("load", queueStart, { once: true });
    };
    update();
    media.addEventListener("change", update);
    return () => {
      clearTimeout(startTimer);
      window.removeEventListener("load", queueStart);
      media.removeEventListener("change", update);
    };
  }, []);
  const labels = {
    en: ["Pause background video", "Play background video"],
    de: ["Hintergrundvideo pausieren", "Hintergrundvideo abspielen"],
    ru: ["Приостановить фоновое видео", "Воспроизвести фоновое видео"],
    it: ["Metti in pausa il video", "Riproduci il video"],
    pl: ["Wstrzymaj film w tle", "Odtwórz film w tle"],
  }[locale];
  return <>
    <picture className="light-hero-image">
      <source media="(max-width: 700px)" srcSet="/hero-sunset-mobile-v4.webp" width={400} height={704} />
      <img className="light-hero-image hero-video-poster" src="/hero-sunset-desktop-v4.webp" width={1280} height={704} alt="" fetchPriority="high" decoding="async" />
    </picture>
    <video ref={video} className={`light-hero-image light-hero-video${frameReady ? " hero-video-ready" : ""}`} muted loop playsInline preload="none" width={1280} height={704} aria-hidden="true" onPlaying={() => {
      const element = video.current;
      if (element && "requestVideoFrameCallback" in element) element.requestVideoFrameCallback(() => setFrameReady(true));
      else setFrameReady(true);
    }} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}>
      <source media="(max-width: 700px)" src="/hero-sunset-mobile-v4.webm" type='video/webm; codecs="vp9"' />
      <source media="(max-width: 700px)" src="/hero-sunset-mobile-v4.mp4" type="video/mp4" />
      <source src="/hero-sunset-desktop-v4.webm" type='video/webm; codecs="vp9"' />
      <source src="/hero-sunset-desktop-v4.mp4" type="video/mp4" />
    </video>
    <button className="hero-video-toggle" type="button" aria-label={labels[playing ? 0 : 1]} onClick={() => {
      if (playing) video.current?.pause();
      else void video.current?.play().catch(() => {});
    }}>
      <svg viewBox="0 0 24 24" aria-hidden="true">{playing ? <><path d="M8 5v14M16 5v14" /></> : <path d="m9 5 10 7-10 7Z" />}</svg>
    </button>
  </>;
}
