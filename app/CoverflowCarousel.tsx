"use client";

import { useRef, type ReactNode } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperInstance } from "swiper";
import { EffectCoverflow, Keyboard } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import ChevronIcon from "./ChevronIcon";
import type { Locale } from "../content/i18n";
import { carouselLabels } from "../content/carousel";

type Props<T> = {
  items: readonly T[];
  shellClassName: string;
  carouselClassName: string;
  slideClassName: string;
  arrowClassName?: string;
  prevClassName?: string;
  nextClassName?: string;
  locale?: Locale;
  previousLabel?: string;
  nextLabel?: string;
  label: string;
  initialIndex?: number;
  onActiveChange?: (index: number) => void;
  renderSlide: (item: T, index: number, select: () => void) => ReactNode;
};

/** One gesture/loop implementation; each site keeps its own card markup and CSS. */
export default function CoverflowCarousel<T>({ items, shellClassName, carouselClassName, slideClassName,
  arrowClassName = "", prevClassName = "", nextClassName = "", previousLabel, nextLabel, label,
  initialIndex = 0, onActiveChange, renderSlide, locale = "en" }: Props<T>) {
  const carousel = useRef<SwiperInstance | null>(null);
  if (!items.length) return null;
  const slides = items.length > 1 ? Array.from({ length: 3 }, () => items).flat() : items;
  return <div className={shellClassName} onDragStartCapture={event => event.preventDefault()}>
    <button type="button" className={`${arrowClassName} ${prevClassName}`.trim()} disabled={items.length < 2}
      onClick={() => carousel.current?.slidePrev()} aria-label={previousLabel || carouselLabels[locale].previous}><ChevronIcon direction="left" /></button>
    <Swiper key={items.length} className={carouselClassName} modules={[EffectCoverflow, Keyboard]} effect="coverflow"
      initialSlide={(items.length > 1 ? items.length : 0) + Math.min(initialIndex, items.length - 1)}
      centeredSlides centeredSlidesBounds={false} slidesPerView="auto" speed={650}
      loop={items.length > 1} loopAdditionalSlides={items.length} simulateTouch grabCursor allowTouchMove={items.length > 1}
      touchStartPreventDefault={false} touchMoveStopPropagation={false} touchReleaseOnEdges touchAngle={35}
      threshold={10} longSwipesRatio={0.2} preventClicks preventClicksPropagation keyboard={{ enabled: true, onlyInViewport: true }}
      coverflowEffect={{ rotate: 0, stretch: 8, depth: 90, modifier: 1, slideShadows: false }}
      onSwiper={instance => { carousel.current = instance; }}
      onSlideChange={instance => onActiveChange?.(instance.realIndex % items.length)} aria-label={label}>
      {slides.map((item, slideIndex) => <SwiperSlide className={slideClassName} key={slideIndex}>
        {renderSlide(item, slideIndex % items.length, () => carousel.current?.slideToLoop(slideIndex))}
      </SwiperSlide>)}
    </Swiper>
    <button type="button" className={`${arrowClassName} ${nextClassName}`.trim()} disabled={items.length < 2}
      onClick={() => carousel.current?.slideNext()} aria-label={nextLabel || carouselLabels[locale].next}><ChevronIcon direction="right" /></button>
  </div>;
}
