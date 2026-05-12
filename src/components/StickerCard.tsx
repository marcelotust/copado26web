import { useI18n } from "../i18n";
import { useStickerActions } from "../hooks/useStickerActions";
import { teamColors } from "../utils";
import StickerButtons from "./StickerButtons";
import ConfirmModal from "./ConfirmModal";
import type { Sticker } from "../types/database";

const PANINI_BLUE = "#1a56c4";

// Mini card stack shown in the top-right corner when duplicates exist
const CORNER_LAYERS = [
  { rotate:  6, tx:  5, ty: -5, opacity: 0.65 },
  { rotate: -4, tx: -4, ty: -9, opacity: 0.4  },
];

type StickerCardProps = {
  sticker: Sticker
  teamCode: string
}

export default function StickerCard({ sticker, teamCode }: StickerCardProps) {
  const { t } = useI18n();
  const {
    qty, popping, floats, removals,
    showRemoveConfirm, handleAdd, handleRemove,
    handleConfirmRemove, handleCancelRemove,
  } = useStickerActions(sticker);
  const collected = qty > 0;
  const dupes = qty - 1;
  const numLabel = String(sticker.number).padStart(2, "0");
  const { primary, secondary } = teamColors(teamCode);

  const displayLabel = sticker.player_name
    ?? (sticker.is_special && sticker.number === 1  ? t("sticker.shield")    : null)
    ?? (sticker.is_special && sticker.number === 13 ? t("sticker.teamPhoto") : null);

  const visibleLayers = Math.min(dupes, 2);

  return (
    <div
      className={[
        "relative select-none aspect-[2/3]",
        popping ? "animate-pop" : "",
      ].join(" ")}
    >
      {/* ── Main card ─────────────────────────────────────────────────── */}
      <div
        className={[
          "absolute inset-0 overflow-hidden flex flex-col z-10 transition-all duration-150",
          collected ? "shadow-lg rounded-none" : "rounded-xl",
        ].join(" ")}
        style={
          collected
            ? { boxShadow: `0 0 0 3px ${primary}, 0 4px 20px ${primary}35` }
            : { boxShadow: `0 0 0 1px ${primary}50` }
        }
      >
        {/* Base background */}
        <div className="absolute inset-0 bg-slate-900" />

        {/* Color wash */}
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
              <span
                className="font-black leading-none tabular-nums"
                style={{
                  fontFamily: "'Bebas Neue', Impact, sans-serif",
                  fontSize: "clamp(26px, 8vw, 38px)",
                  color: collected ? "#fff" : "#64748b",
                  textShadow: collected
                    ? "0 1px 4px #0007, 0 0 10px #0004"
                    : "none",
                }}
              >
                {numLabel}
              </span>
              <span
                className="font-black tracking-widest uppercase leading-none"
                style={{
                  fontSize: "clamp(9px, 2.5vw, 13px)",
                  color: collected ? "#fff" : "#475569",
                  textShadow: collected
                    ? "0 1px 3px #0006"
                    : "none",
                }}
              >
                {teamCode}
              </span>
            </div>
          </div>

          {/* Bottom strip */}
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
              color: "#4ade80",
              textShadow: `0 0 12px #16a34a, 0 2px 4px #000a`,
            }}
          >
            +1
          </span>
        ))}
        {/* Float -1 */}
        {removals.map((key) => (
          <span
            key={key}
            className="absolute pointer-events-none animate-floatUp font-black z-30"
            style={{
              top: "50%",
              left: "50%",
              fontSize: "clamp(18px, 5vw, 24px)",
              color: "#f87171",
              textShadow: `0 0 12px #dc2626, 0 2px 4px #000a`,
            }}
          >
            −1
          </span>
        ))}
      </div>

      {/* ── Remove confirmation modal ─────────────────────────────────── */}
      <ConfirmModal
        isOpen={showRemoveConfirm}
        title={t("sticker.removeTitle")}
        description={t("sticker.removeDesc")}
        confirmLabel={t("sticker.removeConfirm")}
        cancelLabel={t("sticker.removeCancel")}
        onConfirm={handleConfirmRemove}
        onCancel={handleCancelRemove}
      />

      {/* ── Corner stack + badge (top-right, outside main card) ─────── */}
      {collected && dupes > 0 && (
        <div
          className="absolute z-20"
          style={{ top: "-4px", right: "-4px" }}
        >
          {/* Mini ghost cards fanning out behind the badge */}
          {CORNER_LAYERS.slice(0, visibleLayers).map((layer, i) => (
            <div
              key={i}
              className="absolute rounded-md"
              style={{
                width: "18px",
                height: "26px",
                background: `linear-gradient(135deg, ${primary}cc, ${secondary}99)`,
                transform: `rotate(${layer.rotate}deg) translate(${layer.tx}px, ${layer.ty}px)`,
                opacity: layer.opacity,
                boxShadow: `0 1px 4px #0006`,
                top: 0,
                right: 0,
              }}
            />
          ))}

          {/* Count badge */}
          <div
            className="relative rounded-full flex items-center justify-center font-black leading-none shadow-lg"
            style={{
              background: primary,
              color: "#fff",
              border: `2px solid ${secondary}`,
              boxShadow: `0 2px 8px ${primary}80`,
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
