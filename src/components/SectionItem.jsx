import { teamColor } from "../utils";
import { useI18n } from "../i18n";
import { useAuth } from "../hooks/useAuth";
import { useSupabaseSectionProgress } from "../hooks/useSupabaseProgress";

export default function SectionItem({ section, active, onClick }) {
  const { t } = useI18n();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { collected } = useSupabaseSectionProgress(userId, section.code);
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

      <span
        className={[
          "text-[16px] font-bold font-mono tracking-wide leading-none",
          active ? `text-${teamColor(section.code)}-300` : "text-slate-500",
        ].join(" ")}
      >
        {section.code}
      </span>

      <span className='text-[14px] shrink-0'>
        {done ? (
          <span className='text-emerald-400 font-bold'>✓</span>
        ) : collected > 0 ? (
          <span className='text-slate-600 tabular-nums'>{collected}</span>
        ) : null}
      </span>
    </button>
  );
}
