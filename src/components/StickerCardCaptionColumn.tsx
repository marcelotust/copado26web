import type { MouseEvent } from "react";
import StickerButtons from "./StickerButtons";
import StickerFace from "./StickerFace";

type AlbumFace = "featured-wide" | "default";

type SilhouetteType =
  | "player"
  | "team-photo"
  | "shield"
  | "ball"
  | "trophy"
  | "none";

type StickerCardCaptionColumnProps = {
  teamCode: string;
  collected: boolean;
  primary: string;
  secondary: string;
  numLabel: string;
  albumFace: AlbumFace;
  silhouetteType: SilhouetteType;
  labelColor: string;
  displayLabel: string | null;
  qty: number;
  onAdd: (e: MouseEvent) => void;
  onRemove: (e: MouseEvent) => void;
};

export default function StickerCardCaptionColumn({
  teamCode,
  collected,
  primary,
  secondary,
  numLabel,
  albumFace,
  silhouetteType,
  labelColor,
  displayLabel,
  qty,
  onAdd,
  onRemove,
}: StickerCardCaptionColumnProps) {
  return (
    <div className='relative z-10 flex flex-col h-full min-h-0'>
      <StickerFace
        collected={collected}
        primary={primary}
        secondary={secondary}
        albumFace={albumFace}
        silhouetteType={silhouetteType}
      />

      <div className='mb-0.5 shrink-0 flex justify-center relative z-20'>
        <div
          className='flex items-center justify-center gap-1 px-3 pt-[5px] pb-[3px]'
          style={{ borderRadius: "0 14px 0 14px", background: collected ? labelColor : `${primary}25` }}
        >
          <span
            className='text-[22px] font-normal leading-none tracking-wide whitespace-nowrap'
            style={{
              color: collected ? '#fff' : '#94a3b8',
              fontFamily: "'Bebas Neue', Impact, sans-serif",
            }}
          >
            {teamCode}
          </span>
          <span
            className='text-[22px] font-black leading-none tracking-wide whitespace-nowrap'
            style={{
              color: collected ? '#fff' : '#94a3b8',
              fontFamily: "'Bebas Neue', Impact, sans-serif",
            }}
          >
            {numLabel}
          </span>
        </div>
      </div>

      {((silhouetteType !== "shield" && silhouetteType !== "team-photo") ||
        teamCode === "WAP" ||
        teamCode === "FWC") && (
        <div
          className='mx-1.5 mb-1 shrink-0 rounded-full px-2 py-1 text-center'
          style={{ background: collected ? labelColor : `${primary}25` }}
        >
          <p
            className='text-[11px] font-bold leading-tight truncate'
            style={{ color: collected ? "#fff" : "#94a3b8" }}
            title={displayLabel ?? teamCode}
          >
            {displayLabel ?? teamCode}
          </p>
        </div>
      )}

      <StickerButtons
        qty={qty}
        collected={collected}
        onAdd={onAdd}
        onRemove={onRemove}
      />
    </div>
  );
}
