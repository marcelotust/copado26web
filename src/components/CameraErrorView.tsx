import { useI18n } from "../i18n";

export default function CameraErrorView({ error }: { error: string }) {
  const { t } = useI18n();

  return (
    <div className='w-full max-w-lg rounded-2xl bg-slate-900 flex items-center justify-center h-48 text-center px-4'>
      <div>
        <p className='text-red-400 font-semibold'>{t("scanner.camError")}</p>
        <p className='text-slate-500 text-xs mt-1'>{error}</p>
        <p className='text-slate-600 text-xs mt-2'>{t("scanner.useManual")}</p>
      </div>
    </div>
  );
}
