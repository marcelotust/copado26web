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

  const animName = `mq-${scrollPx}`;

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden w-full flex items-center ${scrollPx > 0 ? "justify-start" : "justify-center"}`}
    >
      {scrollPx > 0 && (
        <style>{`@keyframes ${animName}{0%{transform:translateX(0)}100%{transform:translateX(-${scrollPx}px)}}`}</style>
      )}
      <span
        ref={textRef}
        className="inline-block whitespace-nowrap text-[11px] leading-none"
        style={
          scrollPx > 0
            ? {
                animation: `${animName} 2.5s ease-in-out infinite alternate`,
                willChange: "transform",
              }
            : undefined
        }
      >
        {firstName && (
          <span style={{ color, fontWeight: 600 }}>{firstName} </span>
        )}
        <span style={{ color, fontWeight: 700 }}>{lastName}</span>
      </span>
    </div>
  );
}
