import { SECTIONS, GROUP_ORDER } from "../db/seed";
import { useI18n } from "../i18n";
import SectionItem from "./SectionItem";

export default function Sidebar({ selected, onSelect }) {
  const { t } = useI18n();

  const grouped = GROUP_ORDER.reduce((acc, group) => {
    const items = SECTIONS.filter((s) => s.group === group);
    if (items.length) acc[group] = items;
    return acc;
  }, {});

  return (
    <aside className='w-14 sm:w-52 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden'>
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
              <p className='hidden sm:block text-[10px] text-slate-600 font-bold tracking-widest uppercase px-2 pt-2 pb-1'>
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
