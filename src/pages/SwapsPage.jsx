import { SECTIONS } from "../db/seed";
import { useSwaps } from "../hooks/useSwaps";
import { teamColors } from "../utils";
import { useI18n } from "../i18n";
import StickerCard from "../components/StickerCard";

export default function SwapsPage() {
  const { t } = useI18n();
  const { swaps, byTeam, teams } = useSwaps();

  const stickerWord =
    swaps.length === 1 ? t("swaps.sticker") : t("swaps.stickers");

  return (
    <div className='flex flex-col h-full'>
      <div className='flex items-center gap-3 px-4 pt-4 pb-3 border-b border-slate-800 shrink-0'>
        <span className='text-3xl'>🔄</span>
        <div>
          <h2 className='text-white font-bold text-lg'>{t("swaps.title")}</h2>
          <p className='text-slate-400 text-xs'>
            {swaps.length} {stickerWord} {t("swaps.toTrade")}
          </p>
        </div>
      </div>

      <div className='flex-1 overflow-y-auto p-3'>
        {swaps.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-48 text-center gap-3'>
            <span className='text-5xl'>✨</span>
            <p className='text-slate-400 font-semibold'>{t("swaps.empty")}</p>
            <p className='text-slate-600 text-sm'>{t("swaps.emptyDesc")}</p>
          </div>
        ) : (
          <div className='space-y-6'>
            {teams.map((teamCode) => {
              const section = SECTIONS.find((s) => s.code === teamCode);
              const { primary, secondary } = teamColors(teamCode);
              const name = t(`teams.${teamCode}`);
              const dupeCount = byTeam[teamCode].length;

              return (
                <div key={teamCode}>
                  {/* Team header */}
                  <div className='flex items-center gap-2 mb-1'>
                    <span className='text-lg'>{section?.flag ?? "🏳️"}</span>
                    <span className='font-bold text-sm text-white truncate'>
                      {name}
                    </span>
                    <span className='text-slate-500 text-xs shrink-0'>
                      · {dupeCount} {t("swaps.dupes")}
                    </span>
                    <span
                      className='ml-auto font-bold text-xs shrink-0'
                      style={{ color: primary }}
                    >
                      {teamCode}
                    </span>
                  </div>

                  {/* Color accent bar */}
                  <div
                    className='h-0.5 rounded mb-2'
                    style={{
                      background: `linear-gradient(to right, ${primary}, ${secondary})`,
                    }}
                  />

                  {/* Sticker grid — same as AlbumPage */}
                  <div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2'>
                    {byTeam[teamCode].map((s) => (
                      <StickerCard key={s.id} sticker={s} teamCode={teamCode} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
