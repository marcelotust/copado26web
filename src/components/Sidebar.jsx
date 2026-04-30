import { SECTIONS, GROUP_ORDER } from "../db/seed";
import { useI18n } from "../i18n";
import { useProgress } from "../hooks/useStickers";
import SectionItem from "./SectionItem";

export default function Sidebar({
  selected,
  onSelect,
  view,
  onScanClick,
  onSwapsClick,
}) {
  const { t } = useI18n();
  const { swaps } = useProgress();

  const grouped = GROUP_ORDER.reduce((acc, group) => {
    const items = SECTIONS.filter((s) => s.group === group);
    if (items.length) acc[group] = items;
    return acc;
  }, {});

  return (
    <aside className='w-150 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden'>
      <div className='shrink-0 px-1 py-2 border-b border-slate-800 flex flex-col gap-1'>
        <button
          onClick={onSwapsClick}
          className={[
            "relative flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all w-full",
            view === "swaps"
              ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700",
          ].join(" ")}
        >
          🔄
          <span>{t("header.swaps")}</span>
          {swaps > 0 && (
            <span className='bg-amber-500 text-white text-[9px] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-1'>
              {swaps}
            </span>
          )}
        </button>

        <button
          onClick={onScanClick}
          className={[
            "flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all w-full",
            view === "scanner"
              ? "bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/30"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700",
          ].join(" ")}
        >
          📷
          <span>{t("header.scan")}</span>
        </button>
      </div>

      <nav className='flex-1 overflow-y-auto py-1 px-1'>
        {GROUP_ORDER.map((group) => {
          const items = grouped[group];
          if (!items) return null;
          const label =
            group === "FWC"
              ? t("sidebar.fwc")
              : `${t("sidebar.group")} ${group}`;
          return (
            <div key={group} className='mb-1'>
              <p className='lg:block text-[10px] text-slate-600 font-bold tracking-widest uppercase px-2 pt-2 pb-1'>
                {label}
              </p>
              {items.map((section) => (
                <SectionItem
                  key={section.code}
                  section={section}
                  active={selected === section.code}
                  onClick={() => onSelect(section.code)}
                />
              ))}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
