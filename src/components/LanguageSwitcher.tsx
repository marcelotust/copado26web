import { useI18n, LOCALE_META, type Locale } from "../i18n";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className='border-t border-slate-800 px-1 py-2 flex flex-col gap-1 shrink-0'>
      {Object.entries(LOCALE_META).map(([code, meta]) => (
        <button
          key={code}
          onClick={() => setLocale(code as Locale)}
          title={meta.label}
          className={[
            "flex items-center gap-1.5 px-2 py-1 rounded-md text-left transition-colors w-full",
            locale === code
              ? "bg-slate-700 text-white"
              : "text-slate-600 hover:text-slate-300 hover:bg-slate-800",
          ].join(" ")}
        >
          <span className='text-sm leading-none'>{meta.flag}</span>
          <span className='hidden lg:inline text-[10px] font-bold'>
            {meta.label}
          </span>
        </button>
      ))}
    </div>
  );
}
