import { useSectionCollected } from "../hooks/useSectionCollected";
import { teamColor } from "../utils";
import { useI18n } from "../i18n";

export default function SectionItem({ section, active, onClick }) {
  const { t } = useI18n();
  const collected = useSectionCollected(section.code);
  const total = section.count;
  const done = collected === total && total > 0;
  const name = t(`teams.${section.code}`);

  return (
    <button
      onClick={onClick}
      title={name}
      className={[
        "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all duration-100",
        "hover:bg-slate-700/60 active:scale-95",
        active ? "bg-slate-700 ring-1 ring-slate-600" : "",
      ].join(" ")}
    >
      <span className='text-lg shrink-0 leading-none w-6 text-center'>
        {section.flag}
      </span>

      <div className='hidden lg:flex flex-col flex-1 min-w-0'>
        <span
          className={[
            "text-[11px] font-semibold truncate leading-tight",
            active ? `text-${teamColor(section.code)}-300` : "text-slate-200",
          ].join(" ")}
        >
          {name}
        </span>
        <span className='text-[9px] text-slate-600 font-mono leading-none'>
          {section.code}
        </span>
      </div>

      <span
        className={[
          "lg:hidden text-[9px] font-bold font-mono tracking-wide leading-none",
          active ? `text-${teamColor(section.code)}-300` : "text-slate-500",
        ].join(" ")}
      >
        {section.code}
      </span>

      <span className='hidden lg:inline text-[9px] shrink-0'>
        {done ? (
          <span className='text-emerald-400 font-bold'>✓</span>
        ) : collected > 0 ? (
          <span className='text-slate-600 tabular-nums'>{collected}</span>
        ) : null}
      </span>
    </button>
  );
}
