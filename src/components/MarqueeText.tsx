import { useRef, useEffect, useState } from "react";

type MarqueeTextProps = {
  label: string;
  color: string;
};

export default function MarqueeText({ label, color }: MarqueeTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [scrollPx, setScrollPx] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    const text = textRef.current;
    if (!container || !text) return;
    const overflow = text.scrollWidth - container.clientWidth;
    setScrollPx(overflow > 2 ? overflow : 0);
  }, [label]);

  const upper = label.toUpperCase().trim();
  const spaceIdx = upper.lastIndexOf(" ");
  const firstName = spaceIdx > -1 ? upper.slice(0, spaceIdx) : "";
  const lastName = spaceIdx > -1 ? upper.slice(spaceIdx + 1) : upper;

  return (
    <div ref={containerRef} className="overflow-hidden w-full">
      <span
        ref={textRef}
        className="inline-block whitespace-nowrap text-[11px] leading-tight"
        style={
          scrollPx > 0
            ? ({
                animation: "marquee-scroll 4s ease-in-out infinite",
                willChange: "transform",
                "--scroll-dist": `${scrollPx}px`,
              } as React.CSSProperties)
            : undefined
        }
      >
        {firstName && (
          <span style={{ color, fontWeight: 400 }}>{firstName} </span>
        )}
        <span style={{ color, fontWeight: 700 }}>{lastName}</span>
      </span>
    </div>
  );
}
