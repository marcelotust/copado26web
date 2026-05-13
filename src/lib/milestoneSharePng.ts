/** Share milestone PNG via Web Share API or trigger download. */
export async function shareOrDownloadPng(blob: Blob, title: string): Promise<void> {
  const file = new File([blob], 'meu-album-2026-conquista.png', { type: 'image/png' })
  const shareData: ShareData = { files: [file], title }

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    if (typeof navigator.canShare === 'function' && !navigator.canShare(shareData)) {
      await downloadPngBlob(blob)
      return
    }
    try {
      await navigator.share(shareData)
      return
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
    }
  }
  await downloadPngBlob(blob)
}

async function downloadPngBlob(blob: Blob): Promise<void> {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'meu-album-2026-conquista.png'
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
