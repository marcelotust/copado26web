import playerSvg from "../assets/silhouette-player.svg";
import shieldSvg from "../assets/silhouette-shield.svg";
import teamSvg from "../assets/silhouette-team.svg";
// TODO: replace with real SVGs when provided
import ballSvg from "../assets/silhouette-ball.svg";
import trophySvg from "../assets/silhouette-trophy.svg";

// The circular number + team-code badge in the center of every sticker card.
// Heavily styled — split out so StickerCard can stay readable.

type AlbumFace = "default" | "featured-wide";
type SilhouetteType = "player" | "team-photo" | "shield" | "ball" | "trophy" | "none";

const silhouetteSrc: Record<Exclude<SilhouetteType, "none">, string> = {
  player: playerSvg,
  "team-photo": teamSvg,
  shield: shieldSvg,
  ball: ballSvg,
  trophy: trophySvg,
};

function isWhite(color: string): boolean {
  const c = color.toLowerCase().replace(/\s/g, "");
  return c === "#fff" || c === "#ffffff" || c === "white";
}

type StickerFaceProps = {
  collected: boolean;
  primary: string;
  secondary: string;
  /** Album grid: wide cell caps the disc so it does not clip one row tall */
  albumFace?: AlbumFace;
  silhouetteType?: SilhouetteType;
  isFoil?: boolean;
};

export default function StickerFace({
  collected,
  primary,
  secondary,
  albumFace = "default",
  silhouetteType = "none",
  isFoil = false,
}: StickerFaceProps) {
  const wrapPad =
    albumFace === "featured-wide" ? "px-3 py-2" : "px-3 pt-3 pb-1";

  const circleClass =
    albumFace === "featured-wide"
      ? "aspect-square h-full max-h-[9.25rem] w-auto max-w-[min(9.25rem,100%)] shrink-0 mx-auto"
      : "w-full aspect-square";

  return (
    <div
      className={`flex-1 flex min-h-0 items-center justify-center ${wrapPad}`}
    >
      <div
        className={`${circleClass} relative rounded-full flex flex-col items-center justify-center gap-0.5 transition-all duration-150`}
        style={
          isFoil
            ? { background: 'transparent' }
            : collected
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
        {silhouetteType !== "none" && (
          <div
            className={`absolute inset-0 rounded-full overflow-hidden flex justify-center ${
              silhouetteType === "shield" || silhouetteType === "ball" || silhouetteType === "trophy"
                ? "items-center p-[12%]"
                : "items-end"
            }`}
          >
            <img
              src={silhouetteSrc[silhouetteType]}
              className={`${
                silhouetteType === "shield" || silhouetteType === "ball" || silhouetteType === "trophy"
                  ? "w-full h-full"
                  : silhouetteType === "player"
                    ? "w-[70%]"
                    : "w-[110%]"
              }`}
              style={
                isWhite(primary) || isWhite(secondary)
                  ? { filter: "brightness(0.914)" }
                  : undefined
              }
              aria-hidden
              alt=''
            />
          </div>
        )}
      </div>
    </div>
  );
}
