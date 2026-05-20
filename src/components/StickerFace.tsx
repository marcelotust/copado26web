import { SilhouetteSvg } from "./SilhouetteIcons";
import { SILHOUETTE } from "./silhouetteData";

type AlbumFace = "default" | "featured-wide";
type SilhouetteType = "player" | "team-photo" | "shield" | "ball" | "trophy" | "none";

type StickerFaceProps = {
  collected: boolean;
  primary: string;
  secondary: string;
  albumFace?: AlbumFace;
  silhouetteType?: SilhouetteType;
  isFoil?: boolean;
};

const centeredTypes = new Set<SilhouetteType>(["shield", "ball", "trophy"]);

export default function StickerFace({
  collected,
  primary,
  secondary,
  albumFace = "default",
  silhouetteType = "none",
  isFoil = false,
}: StickerFaceProps) {
  const wrapPad = albumFace === "featured-wide" ? "px-3 py-2" : "px-3 pt-3 pb-1";
  const circleClass =
    albumFace === "featured-wide"
      ? "aspect-square h-full max-h-[9.25rem] w-auto max-w-[min(9.25rem,100%)] shrink-0 mx-auto"
      : "w-full aspect-square";

  const spec = silhouetteType !== "none" ? SILHOUETTE[silhouetteType] : null;
  const isCentered = centeredTypes.has(silhouetteType);
  const svgCls = isCentered ? "w-full h-full" : silhouetteType === "player" ? "w-[70%]" : "w-[110%]";

  return (
    <div className={`flex-1 flex min-h-0 items-center justify-center ${wrapPad}`}>
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
        {spec && (
          <div
            className={`absolute inset-0 rounded-full overflow-hidden flex justify-center ${
              isCentered ? "items-center p-[12%]" : "items-end"
            }`}
          >
            <SilhouetteSvg
              viewBox={spec.viewBox}
              pathD={spec.pathD}
              className={svgCls}
              foilTint={isFoil && collected}
              collected={collected}
            />
          </div>
        )}
      </div>
    </div>
  );
}
