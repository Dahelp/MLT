"use client";
import type { ComponentProps } from "react";
import CoverflowCarousel from "./CoverflowCarousel";

export function scrollCollectionCarouselIntoView(event?: { preventDefault: () => void }) {
  event?.preventDefault();
  const target = document.querySelector<HTMLElement>("[aria-label='MLT collections']");
  if (target) window.scrollTo({ top: Math.max(0, target.getBoundingClientRect().top + window.scrollY - window.innerHeight * .3), behavior: "instant" });
}

type Props<T> = Omit<ComponentProps<typeof CoverflowCarousel<T>>, "label" | "previousLabel" | "nextLabel"> & { previousLabel?: string; nextLabel?: string };
export default function CollectionCarousel<T>({ previousLabel, nextLabel, ...props }: Props<T>) {
  return <CoverflowCarousel {...props} label="MLT collections" previousLabel={previousLabel} nextLabel={nextLabel} />;
}
