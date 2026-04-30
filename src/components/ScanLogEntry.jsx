import { useI18n } from "../i18n";

export default function ScanLogEntry({ entry }) {
  const { t } = useI18n();
  const success = !!entry.id;

  return (
    <div
      className={[
        "flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm",
        success
          ? "bg-emerald-500/10 border border-emerald-500/20"
          : "bg-red-500/10 border border-red-500/20",
      ].join(" ")}
    >
      <span>{success ? "✅" : "❌"}</span>
      <span className='font-mono font-semibold text-white flex-1'>
        {entry.code}
      </span>
      <span
        className={`text-[10px] shrink-0 ${success ? "text-emerald-400" : "text-red-400"}`}
      >
        {success ? t("scanner.added") : t("scanner.notFound")}
      </span>
    </div>
  );
}
