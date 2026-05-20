import { useState, useEffect, useRef } from "react";

const COLS = 20;
const SQUARES = COLS * 60;

const FOIL_COLORS = [
  "rgba(180,120,255,0.9)", // violet
  "rgba(80,200,255,0.9)", // cyan
  "rgba(120,255,180,0.9)", // mint
  "rgba(255,160,80,0.9)", // amber
  "rgba(255,100,180,0.9)", // pink
  "rgba(100,180,255,0.9)", // blue
];

function foilColor() {
  return FOIL_COLORS[Math.floor(Math.random() * FOIL_COLORS.length)];
}

// Returns [topLeft color, bottomRight color] per square.
// 60% both off, 10% top white, 10% bottom white, 10% top foil, 10% bottom foil.
function generate(): string[] {
  const out: string[] = [];
  for (let i = 0; i < SQUARES; i++) {
    const r = Math.random();
    if (r < 0.05) {
      out.push("rgba(250,250,250,0.45)", "transparent");
    } else if (r < 0.1) {
      out.push("transparent", "rgba(250,250,250,0.7)");
    } else if (r < 0.3) {
      out.push(foilColor(), "transparent");
    } else if (r < 0.5) {
      out.push("transparent", foilColor());
    } else {
      out.push("transparent", "transparent");
    }
  }
  return out;
}

export default function FoilGrid() {
  const [colors, setColors] = useState(generate);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = () => setColors(generate());
    el.addEventListener("animationiteration", handler);
    return () => el.removeEventListener("animationiteration", handler);
  }, []);

  return (
    <div
      ref={ref}
      className='absolute inset-0 pointer-events-none overflow-hidden foil-grid-mask'
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        mixBlendMode: "overlay",
        zIndex: 20,
      }}
    >
      {Array.from({ length: SQUARES }, (_, i) => {
        const a = colors[i * 2];
        const b = colors[i * 2 + 1];
        return (
          <div key={i} style={{ aspectRatio: "1", position: "relative" }}>
            {a !== "transparent" && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  clipPath: "polygon(0% 0%, 100% 0%, 0% 100%)",
                  background: a,
                }}
              />
            )}
            {b !== "transparent" && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  clipPath: "polygon(100% 0%, 100% 100%, 0% 100%)",
                  background: b,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
