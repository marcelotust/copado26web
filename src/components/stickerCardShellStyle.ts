type ShellOpts = {
  collected: boolean
  useEscudoSheen: boolean
  useWideCyanSheen: boolean
  primary: string
}

export function stickerCardShellStyle({
  collected,
  useEscudoSheen,
  useWideCyanSheen,
  primary,
}: ShellOpts): { boxShadow: string } {
  if (collected) {
    const boxShadow = useEscudoSheen
      ? `0 0 0 3px ${primary}, 0 0 0 6px rgba(251,191,36,0.35), 0 8px 28px ${primary}40`
      : useWideCyanSheen
        ? `0 0 0 3px ${primary}, 0 0 0 5px rgba(165,243,252,0.2), 0 8px 28px ${primary}38`
        : `0 0 0 3px ${primary}, 0 4px 20px ${primary}35`
    return { boxShadow }
  }
  const boxShadow = useEscudoSheen
    ? `0 0 0 1px ${primary}55, inset 0 0 0 1px rgba(251,191,36,0.25)`
    : useWideCyanSheen
      ? `0 0 0 1px ${primary}50, inset 0 0 0 1px rgba(165,243,252,0.12)`
      : `0 0 0 1px ${primary}50`
  return { boxShadow }
}
