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
  isFoil: boolean;
  useDarkGrayLabel?: boolean;
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
  isFoil,
  useDarkGrayLabel = false,
}: StickerCardCaptionColumnProps) {
  const activeLabelBg = useDarkGrayLabel ? '#6b7280' : labelColor
  const inactiveLabelBg = useDarkGrayLabel ? '#374151' : `${primary}25`
  return (
    <div className='relative z-10 flex flex-col h-full min-h-0'>
      <StickerFace
        collected={collected}
        primary={primary}
        secondary={secondary}
        albumFace={albumFace}
        silhouetteType={silhouetteType}
        isFoil={isFoil}
      />

      <div className='mb-[10px] shrink-0 flex justify-center relative z-20'>
        <div
          className='flex items-center justify-center gap-1 px-3 pt-[5px] pb-[3px]'
          style={{ borderRadius: "0 14px 0 14px", background: collected ? activeLabelBg : inactiveLabelBg }}
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
          className='mx-1.5 mb-[10px] shrink-0 rounded-full px-2 py-1 text-center'
          style={{ background: collected ? activeLabelBg : inactiveLabelBg }}
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
    </div>
  );
}
