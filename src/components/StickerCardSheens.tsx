type StickerCardSheensProps = {
  useEscudoSheen: boolean
  useWideCyanSheen: boolean
  primary: string
  secondary: string
}

export default function StickerCardSheens({
  useEscudoSheen,
  useWideCyanSheen,
  primary,
  secondary,
}: StickerCardSheensProps) {
  return (
    <>
      {useEscudoSheen && (
        <div
          className='pointer-events-none absolute inset-0 opacity-[0.14]'
          style={{
            background: `radial-gradient(circle at 30% 20%, ${primary}, transparent 55%), radial-gradient(circle at 80% 90%, ${secondary}, transparent 50%)`,
          }}
        />
      )}
      {useWideCyanSheen && (
        <div
          className='pointer-events-none absolute inset-0 opacity-[0.18]'
          style={{
            background: `radial-gradient(ellipse 90% 70% at 50% 15%, ${primary}99, transparent 58%), radial-gradient(ellipse 65% 55% at 85% 100%, ${secondary}aa, transparent 55%), linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.04) 50%, transparent 60%)`,
          }}
        />
      )}
    </>
  )
}
