import { SECTIONS } from "../db/seed";
import { useSwaps } from "../hooks/useSwaps";
import { teamColor } from "../utils";
import { useI18n } from "../i18n";
import SwapCard from "./SwapCard";

export default function SwapsView() {
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

      <div className='flex-1 overflow-y-auto p-4'>
        {swaps.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-48 text-center gap-3'>
            <span className='text-5xl'>✨</span>
            <p className='text-slate-400 font-semibold'>{t("swaps.empty")}</p>
            <p className='text-slate-600 text-sm'>{t("swaps.emptyDesc")}</p>
          </div>
        ) : (
          <div className='space-y-4'>
            {teams.map((teamCode) => {
              const section = SECTIONS.find((s) => s.code === teamCode);
              const name = t(`teams.${teamCode}`);
              return (
                <div key={teamCode}>
                  <div className='flex items-center gap-2 mb-2'>
                    <span className='text-lg'>{section?.flag ?? "🏳️"}</span>
                    <span
                      className={`text-xs font-bold tracking-wide text-${teamColor(teamCode)}-300`}
                    >
                      {name}
                    </span>
                    <span className='text-slate-600 text-xs'>
                      · {byTeam[teamCode].length} {t("swaps.dupes")}
                    </span>
                  </div>
                  <div className='grid grid-cols-2 sm:grid-cols-3 gap-2'>
                    {byTeam[teamCode].map((s) => (
                      <SwapCard key={s.id} sticker={s} />
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
