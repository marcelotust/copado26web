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
    <aside className='w-150 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden'>
      <nav className='flex-1 overflow-y-auto py-1 px-1'>
        {CONF_ORDER.map((conf) => {
          const items = grouped[conf];
          if (!items) return null;
          return (
            <div key={conf} className='mb-1'>
              <p className='hidden lg:block text-[8px] text-slate-600 font-bold tracking-widest uppercase px-2 pt-2 pb-1'>
                {t(`conf.${conf}`)}
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

      <LanguageSwitcher />
    </aside>
  );
}
