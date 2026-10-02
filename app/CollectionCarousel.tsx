"use client";
import { useRef, type ReactNode } from "react";
import { Swiper as SwiperCarousel, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperInstance } from "swiper";
import { EffectCoverflow, Keyboard } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";

type Props<T>={items:readonly T[];shellClassName:string;carouselClassName:string;slideClassName:string;arrowClassName:string;prevClassName?:string;nextClassName?:string;previousLabel?:string;nextLabel?:string;previousIcon?:ReactNode;nextIcon?:ReactNode;renderSlide:(item:T,index:number)=>ReactNode};

export default function CollectionCarousel<T>({items,shellClassName,carouselClassName,slideClassName,arrowClassName,prevClassName="",nextClassName="",previousLabel="Previous collection",nextLabel="Next collection",previousIcon="←",nextIcon="→",renderSlide}:Props<T>){
 const carousel=useRef<SwiperInstance|null>(null),slides=Array.from({length:3},()=>items).flat();
 return <div className={shellClassName}><button className={`${arrowClassName} ${prevClassName}`.trim()} onClick={()=>carousel.current?.slidePrev()} aria-label={previousLabel}>{previousIcon}</button><SwiperCarousel className={carouselClassName} modules={[EffectCoverflow,Keyboard]} effect="coverflow" initialSlide={items.length} centeredSlides centeredSlidesBounds={false} slidesPerView="auto" speed={650} loop loopAdditionalSlides={items.length} simulateTouch grabCursor allowTouchMove touchStartPreventDefault={false} touchMoveStopPropagation={false} touchReleaseOnEdges touchAngle={35} threshold={10} longSwipesRatio={.2} preventClicks preventClicksPropagation keyboard={{enabled:true}} coverflowEffect={{rotate:0,stretch:8,depth:90,modifier:1,slideShadows:false}} onSwiper={instance=>{carousel.current=instance}} aria-label="MLT collections">{slides.map((item,index)=><SwiperSlide className={slideClassName} key={index}>{renderSlide(item,index)}</SwiperSlide>)}</SwiperCarousel><button className={`${arrowClassName} ${nextClassName}`.trim()} onClick={()=>carousel.current?.slideNext()} aria-label={nextLabel}>{nextIcon}</button></div>;
}
