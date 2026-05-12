import { teamColor } from "../utils";
import { useI18n } from "../i18n";
import { useAuth } from "../hooks/useAuth";
import { useSupabaseSectionProgress } from "../hooks/useSupabaseProgress";

const RADIUS = 11;
const CIRC = 2 * Math.PI * RADIUS;

/** @param {{ section: { code: string, flag: string, count: number }, active: boolean, onClick: () => void }} props */
export default function SectionItem({ section, active, onClick }) {
  const { t } = useI18n();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { collected } = useSupabaseSectionProgress(userId, section.code);
  const total = section.count;
  const pct = total > 0 ? collected / total : 0;
  const dash = pct * CIRC;
  const done = collected === total && total > 0;
  const name = t(`teams.${section.code}`);
  const color = teamColor(section.code);

  return (
    <button
      onClick={onClick}
      title={name}
      className={[
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-100",
        "hover:bg-slate-700/60 active:scale-95",
        active ? "bg-slate-700 ring-1 ring-slate-600" : "",
      ].join(" ")}
    >
      <span className='text-xl shrink-0 leading-none w-7 text-center'>
        {section.flag}
      </span>

      <div className='flex flex-1 min-w-0 flex-col'>
        <span
          className={[
            "text-[13px] font-bold font-mono tracking-wide leading-none block",
            active ? `text-${color}-300` : "text-slate-400",
          ].join(" ")}
        >
          {section.code}
        </span>
        <span className='text-[11px] text-slate-600 truncate block leading-tight mt-0.5'>
          {name}
        </span>
      </div>

      <svg
        width='28'
        height='28'
        viewBox='0 0 28 28'
        className='shrink-0'
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle cx='14' cy='14' r={RADIUS} fill='none' stroke='#1e293b' strokeWidth='3' />
        <circle
          cx='14'
          cy='14'
          r={RADIUS}
          fill='none'
          strokeWidth='3'
          strokeDasharray={`${dash} ${CIRC}`}
          strokeLinecap='round'
          style={{
            stroke: done ? '#34d399' : pct > 0 ? '#94a3b8' : '#1e293b',
            transition: 'stroke-dasharray 0.4s ease',
          }}
        />
        {done && (
          <g style={{ transform: 'rotate(90deg)', transformOrigin: '14px 14px' }}>
            <text x='14' y='18' textAnchor='middle' fontSize='10' fill='#34d399' fontWeight='bold'>✓</text>
          </g>
        )}
      </svg>
    </button>
  );
}
