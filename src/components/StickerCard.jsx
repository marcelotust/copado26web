import { useI18n } from "../i18n";
import { useStickerActions } from "../hooks/useStickerActions";
import { teamColors } from "../utils";
import StickerButtons from "./StickerButtons";

const LABEL_KEYS = {
  Shield: "sticker.shield",
  "Team Photo": "sticker.teamPhoto",
};

// Panini-blue strip — same for all teams, like the original card
const PANINI_BLUE = "#1a56c4";

// Stack configs: up to 3 cards behind, with alternating rotations and more spacing
const STACK_LAYERS = [
  { rotate:  5, tx:  6, ty:  8, opacity: 0.75 },
  { rotate: -4, tx: -5, ty: 14, opacity: 0.5  },
  { rotate:  7, tx:  9, ty: 20, opacity: 0.32 },
];

/** @param {{ sticker: { id: string, number: number, quantity: number, label?: string|null }, teamCode: string, userId?: string }} props */
export default function StickerCard({ sticker, teamCode, userId }) {
  const { t } = useI18n();
  const { popping, floats, handleAdd, handleRemove } = useStickerActions(sticker, userId);
  const qty = sticker.quantity;
  const collected = qty > 0;
  const dupes = qty - 1;
  const numLabel = String(sticker.number).padStart(2, "0");
  const { primary, secondary } = teamColors(teamCode);

  const rawLabel = sticker.label;
  const displayLabel = rawLabel
    ? rawLabel in LABEL_KEYS
      ? t(LABEL_KEYS[/** @type {keyof typeof LABEL_KEYS} */ (rawLabel)])
      : rawLabel
    : null;

  const visibleLayers = Math.min(dupes, 3);

  return (
    // Outer wrapper — defines layout slot, padding-bottom gives room for the stack to peek out
    <div
      className={[
        "relative select-none aspect-[2/3]",
        popping ? "animate-pop" : "",
      ].join(" ")}
      style={{ paddingBottom: collected && dupes > 0 ? "6px" : undefined }}
    >
      {/* ── Stacked cards behind (duplicates) ─────────────────────────── */}
      {collected && visibleLayers > 0 && STACK_LAYERS.slice(0, visibleLayers).map((layer, i) => (
        <div
          key={i}
          className="absolute inset-0 rounded-xl"
          style={{
            background: `linear-gradient(135deg, ${primary}cc, ${secondary}99)`,
            transform: `rotate(${layer.rotate}deg) translate(${layer.tx}px, ${layer.ty}px)`,
            opacity: layer.opacity,
            boxShadow: `0 2px 8px #0006`,
          }}
        />
      ))}

      {/* ── Main card ─────────────────────────────────────────────────── */}
      <div
        className={[
          "absolute inset-0 rounded-xl overflow-hidden flex flex-col z-10",
          "transition-all duration-150",
          collected ? "shadow-lg" : "",
        ].join(" ")}
        style={
          collected
            ? { boxShadow: `0 0 0 2px ${primary}90, 0 4px 20px ${primary}35` }
            : { boxShadow: `0 0 0 1px ${primary}50` }
        }
      >
        {/* Base background */}
        <div className="absolute inset-0 bg-slate-900" />

        {/* Color wash — stronger when collected, subtle hint when not */}
        <div
          className="absolute inset-0"
          style={{
            background: collected
              ? `linear-gradient(160deg, ${primary}20 0%, ${secondary}14 100%)`
              : `linear-gradient(160deg, ${primary}10 0%, ${secondary}08 100%)`,
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">

          {/* Circle */}
          <div className="flex-1 flex items-center justify-center px-3 pt-3 pb-1">
            <div
              className="w-full aspect-square rounded-full flex flex-col items-center justify-center gap-0.5 transition-all duration-150"
              style={
                collected
                  ? {
                      background: `linear-gradient(135deg, ${primary} 50%, ${secondary} 50%)`,
                      boxShadow: `0 3px 16px ${primary}55, inset 0 1px 0 #ffffff30`,
                    }
                  : {
                      background: `linear-gradient(135deg, ${primary}40 50%, ${secondary}30 50%)`,
                      boxShadow: `inset 0 1px 0 #ffffff08, 0 2px 8px ${primary}20`,
                    }
              }
            >
              {/* Number */}
              <span
                className="font-black leading-none tabular-nums"
                style={{
                  fontFamily: "'Bebas Neue', Impact, sans-serif",
                  fontSize: "clamp(26px, 8vw, 38px)",
                  color: collected ? "#fff" : "#64748b",
                  textShadow: collected
                    ? "0 0 12px #000a, 0 2px 6px #0008, 0 0 24px #0006"
                    : "none",
                }}
              >
                {numLabel}
              </span>
              {/* Team code */}
              <span
                className="font-black tracking-widest uppercase leading-none"
                style={{
                  fontSize: "clamp(9px, 2.5vw, 13px)",
                  color: collected ? "#fff" : "#475569",
                  textShadow: collected
                    ? "0 0 8px #000a, 0 1px 4px #0008"
                    : "none",
                }}
              >
                {teamCode}
              </span>
            </div>
          </div>

          {/* Bottom strip — Panini blue, white text */}
          <div
            className="mx-1.5 mb-1 rounded-lg px-2 py-1 text-center"
            style={{ background: collected ? PANINI_BLUE : `${primary}25` }}
          >
            <p
              className="text-[11px] font-bold leading-tight truncate"
              style={{ color: collected ? "#fff" : "#94a3b8" }}
              title={displayLabel ?? teamCode}
            >
              {displayLabel ?? teamCode}
            </p>
          </div>

          {/* Buttons */}
          <StickerButtons
            qty={qty}
            collected={collected}
            onAdd={handleAdd}
            onRemove={handleRemove}
          />
        </div>

        {/* Float +1 */}
        {floats.map((key) => (
          <span
            key={key}
            className="absolute pointer-events-none animate-floatUp font-black z-30"
            style={{
              top: "50%",
              left: "50%",
              fontSize: "clamp(18px, 5vw, 24px)",
              color: "#fff",
              textShadow: `0 0 12px ${primary}, 0 2px 4px #000a`,
            }}
          >
            +1
          </span>
        ))}
      </div>

      {/* ── Dupe badge — sits above the stack ─────────────────────────── */}
      {collected && dupes > 0 && (
        <div
          className="absolute z-20 flex flex-col items-center"
          style={{ top: "-6px", right: "-6px" }}
        >
          {/* Badge circle — grows slightly with count */}
          <div
            className="rounded-full flex items-center justify-center font-black leading-none shadow-lg transition-all duration-200"
            style={{
              background: primary,
              color: "#fff",
              border: `2px solid ${secondary}`,
              boxShadow: `0 2px 8px ${primary}80`,
              // Size grows: 1→24px, 2→26px, 3→28px, 4+→30px
              width:  `${Math.min(24 + (dupes - 1) * 2, 30)}px`,
              height: `${Math.min(24 + (dupes - 1) * 2, 30)}px`,
              fontSize: dupes >= 10 ? "9px" : "11px",
            }}
          >
            {dupes > 9 ? "9+" : `+${dupes}`}
          </div>
        </div>
      )}
    </div>
  );
}
