export default function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return <svg className="mlt-chevron-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d={direction === "left" ? "m15 5-7 7 7 7" : "m9 5 7 7-7 7"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
