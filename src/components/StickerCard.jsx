import { useI18n } from "../i18n";
import { useStickerActions } from "../hooks/useStickerActions";
import { teamColors } from "../utils";
import StickerButtons from "./StickerButtons";

const LABEL_KEYS = {
  Shield: "sticker.shield",
  "Team Photo": "sticker.teamPhoto",
};

/** @param {{ sticker: { id: string, number: number, quantity: number, label?: string|null }, teamCode: string }} props */
export default function StickerCard({ sticker, teamCode }) {
  const { t } = useI18n();
  const { popping, floats, handleAdd, handleRemove } = useStickerActions(sticker.id);
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

  return (
    <div
      aria-label={`Sticker ${sticker.id}, quantity ${qty}`}
      className={[
        "relative select-none rounded-xl overflow-hidden flex flex-col",
        "aspect-[2/3] transition-all duration-150",
        collected ? "shadow-lg" : "opacity-55",
        popping ? "animate-pop" : "",
      ].join(" ")}
      style={
        collected
          ? { boxShadow: `0 0 0 2px ${primary}90, 0 4px 16px ${primary}30` }
          : { boxShadow: "0 0 0 1px #334155" }
      }
    >
      {/* Base background */}
      <div className="absolute inset-0 bg-slate-900" />

      {/* Gradient wash when collected */}
      {collected && (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(160deg, ${primary}28 0%, ${secondary}18 100%)`,
          }}
        />
      )}

      {/* Dupe badge — top-right inside card */}
      {dupes > 0 && (
        <div
          className="absolute top-1.5 right-1.5 z-20 rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 text-[10px] font-black leading-none shadow-lg"
          style={{ background: primary, color: "#fff", boxShadow: `0 2px 6px ${primary}80` }}
        >
          +{dupes}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">

        {/* Circle — takes most of the space */}
        <div className="flex-1 flex items-center justify-center px-3 pt-3 pb-1">
          <div
            className="w-full aspect-square rounded-full flex flex-col items-center justify-center gap-0.5 transition-all duration-150"
            style={
              collected
                ? {
                    background: `radial-gradient(circle at 35% 30%, ${primary}ff, ${primary}cc)`,
                    boxShadow: `0 2px 14px ${primary}55, inset 0 1px 0 ${secondary}50`,
                  }
                : {
                    background: "#1e293b",
                    boxShadow: "inset 0 1px 0 #ffffff08",
                  }
            }
          >
            {/* Sticker number */}
            <span
              className="font-black leading-none tabular-nums"
              style={{
                fontFamily: "'Bebas Neue', Impact, sans-serif",
                fontSize: "clamp(20px, 6vw, 30px)",
                color: collected ? "#fff" : "#334155",
                textShadow: collected ? `0 1px 8px ${primary}60` : "none",
              }}
            >
              {numLabel}
            </span>

            {/* Team code below number */}
            <span
              className="text-[8px] font-bold tracking-widest uppercase leading-none"
              style={{ color: collected ? "#ffffff99" : "#1e293b" }}
            >
              {teamCode}
            </span>
          </div>
        </div>

        {/* Bottom label: player name or sticker type */}
        <div
          className="mx-1.5 mb-1 rounded-lg px-2 py-1 text-center"
          style={{ background: collected ? `${secondary}dd` : "#1e293b" }}
        >
          <p
            className="text-[11px] font-bold leading-tight truncate"
            style={{ color: collected ? primary : "#334155" }}
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

      {/* Float +1 — big, centered, punchy */}
      {floats.map((key) => (
        <span
          key={key}
          className="absolute pointer-events-none animate-floatUp font-black z-30"
          style={{
            top: "50%",
            left: "50%",
            fontSize: "clamp(18px, 5vw, 24px)",
            color: collected ? "#fff" : primary,
            textShadow: `0 0 12px ${primary}, 0 2px 4px #000a`,
            letterSpacing: "-0.5px",
          }}
        >
          +1
        </span>
      ))}
    </div>
  );
}
