import { SECTIONS, CONF_ORDER } from "../db/seed";
import { useI18n } from "../i18n";
import SectionItem from "./SectionItem";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Sidebar({ selected, onSelect }) {
  const { t } = useI18n();

  const grouped = CONF_ORDER.reduce((acc, conf) => {
    const items = SECTIONS.filter((s) => s.conf === conf);
    if (items.length) acc[conf] = items;
    return acc;
  }, {});

  return (
    <aside className='w-14 lg:w-40 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden'>
      <div className='flex items-center gap-2 px-2 lg:px-3 py-3 border-b border-slate-800 shrink-0'>
        <span className='text-xl shrink-0'>⚽</span>
        <div className='hidden lg:block min-w-0'>
          <p className='text-white font-black text-xs leading-none tracking-tight'>
            WC 2026
          </p>
          <p className='text-slate-600 text-[9px] leading-none mt-0.5'>
            {t("appSubtitle")}
          </p>
        </div>
      </div>

      <nav className='flex-1 overflow-y-auto py-1 px-1'>
        {CONF_ORDER.map((conf) => {
          const items = grouped[conf];
          if (!items) return null;
          return (
            <div key={conf} className='mb-1'>
              <p className='hidden lg:block text-[8px] text-slate-600 font-bold tracking-widest uppercase px-2 pt-2 pb-1'>
                {t(`conf.${conf}`)}
              </p>
              <div className='lg:hidden h-px bg-slate-800 mx-1 my-1' />
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

      <LanguageSwitcher />
    </aside>
  );
}
