import { createContext, useContext, useState, useMemo } from 'react'

// ── Translations ─────────────────────────────────────────────────────────────

const en = {
  appSubtitle: 'Sticker Album',
  loading: 'Setting up your album…',

  // Confederations
  'conf.CONMEBOL': 'South America',
  'conf.CONCACAF': 'N/C America',
  'conf.UEFA':     'Europe',
  'conf.CAF':      'Africa',
  'conf.AFC':      'Asia',
  'conf.OFC':      'Oceania',
  'conf.PLAYOFF':  'Playoffs',
  'conf.SPECIAL':  'Special',

  // Team / section names
  'teams.ARG': 'Argentina',   'teams.BRA': 'Brazil',        'teams.COL': 'Colombia',
  'teams.URU': 'Uruguay',     'teams.ECU': 'Ecuador',       'teams.PAR': 'Paraguay',
  'teams.USA': 'United States','teams.MEX': 'Mexico',       'teams.CAN': 'Canada',
  'teams.PAN': 'Panama',      'teams.CRC': 'Costa Rica',   'teams.JAM': 'Jamaica',
  'teams.FRA': 'France',      'teams.ENG': 'England',       'teams.ESP': 'Spain',
  'teams.GER': 'Germany',     'teams.POR': 'Portugal',      'teams.NED': 'Netherlands',
  'teams.BEL': 'Belgium',     'teams.ITA': 'Italy',         'teams.AUT': 'Austria',
  'teams.SUI': 'Switzerland', 'teams.DEN': 'Denmark',       'teams.SCO': 'Scotland',
  'teams.SRB': 'Serbia',      'teams.SVK': 'Slovakia',      'teams.CRO': 'Croatia',
  'teams.HUN': 'Hungary',     'teams.MAR': 'Morocco',       'teams.EGY': 'Egypt',
  'teams.SEN': 'Senegal',     'teams.CMR': 'Cameroon',      'teams.CIV': "Côte d'Ivoire",
  'teams.TUN': 'Tunisia',     'teams.GHA': 'Ghana',         'teams.NGA': 'Nigeria',
  'teams.COD': 'DR Congo',    'teams.JPN': 'Japan',         'teams.KOR': 'South Korea',
  'teams.IRN': 'Iran',        'teams.AUS': 'Australia',     'teams.SAU': 'Saudi Arabia',
  'teams.QAT': 'Qatar',       'teams.UZB': 'Uzbekistan',    'teams.IRQ': 'Iraq',
  'teams.NZL': 'New Zealand', 'teams.PL1': 'Playoff 1',    'teams.PL2': 'Playoff 2',
  'teams.PL3': 'Playoff 3',   'teams.STD': 'Stadiums',      'teams.SPC': 'Specials',

  // Header
  'header.swaps': 'Swaps',
  'header.scan':  'Scan',

  // Grid
  'grid.loading': 'Loading stickers…',
  'grid.hint':    'Left-click to add · Right-click to remove',

  // Scanner
  'scanner.title':      'Scanner',
  'scanner.ocrLoading': 'Loading OCR…',
  'scanner.scanning':   'Scanning…',
  'scanner.ready':      'Ready',
  'scanner.capture':    '📸 Capture Now',
  'scanner.typeLabel':  '✏️ Type code manually',
  'scanner.placeholder':'e.g. BRA 10',
  'scanner.add':        'Add',
  'scanner.logTitle':   'Scan log',
  'scanner.empty':      'Nothing scanned yet',
  'scanner.added':      '+1 added',
  'scanner.notFound':   'not found',
  'scanner.showRaw':    '▼ Show raw OCR text',
  'scanner.hideRaw':    '▲ Hide',
  'scanner.alignHint':  'Align the sticker code in the box · codes like',
  'scanner.camError':   'Camera unavailable',
  'scanner.useManual':  'Use the manual input below instead.',

  // Swaps
  'swaps.title':      'Swaps',
  'swaps.sticker':    'sticker',
  'swaps.stickers':   'stickers',
  'swaps.toTrade':    'to trade',
  'swaps.dupes':      'dupes',
  'swaps.empty':      'No duplicates yet!',
  'swaps.emptyDesc':  'Keep collecting stickers and your extras will appear here.',
}

const ptBR = {
  appSubtitle: 'Álbum de Figurinhas',
  loading: 'Configurando seu álbum…',

  'conf.CONMEBOL': 'América do Sul',
  'conf.CONCACAF': 'América C/N',
  'conf.UEFA':     'Europa',
  'conf.CAF':      'África',
  'conf.AFC':      'Ásia',
  'conf.OFC':      'Oceania',
  'conf.PLAYOFF':  'Playoffs',
  'conf.SPECIAL':  'Especial',

  'teams.ARG': 'Argentina',       'teams.BRA': 'Brasil',          'teams.COL': 'Colômbia',
  'teams.URU': 'Uruguai',         'teams.ECU': 'Equador',         'teams.PAR': 'Paraguai',
  'teams.USA': 'Estados Unidos',  'teams.MEX': 'México',          'teams.CAN': 'Canadá',
  'teams.PAN': 'Panamá',          'teams.CRC': 'Costa Rica',      'teams.JAM': 'Jamaica',
  'teams.FRA': 'França',          'teams.ENG': 'Inglaterra',      'teams.ESP': 'Espanha',
  'teams.GER': 'Alemanha',        'teams.POR': 'Portugal',        'teams.NED': 'Países Baixos',
  'teams.BEL': 'Bélgica',         'teams.ITA': 'Itália',          'teams.AUT': 'Áustria',
  'teams.SUI': 'Suíça',           'teams.DEN': 'Dinamarca',       'teams.SCO': 'Escócia',
  'teams.SRB': 'Sérvia',          'teams.SVK': 'Eslováquia',      'teams.CRO': 'Croácia',
  'teams.HUN': 'Hungria',         'teams.MAR': 'Marrocos',        'teams.EGY': 'Egito',
  'teams.SEN': 'Senegal',         'teams.CMR': 'Camarões',        'teams.CIV': 'Costa do Marfim',
  'teams.TUN': 'Tunísia',         'teams.GHA': 'Gana',            'teams.NGA': 'Nigéria',
  'teams.COD': 'RD Congo',        'teams.JPN': 'Japão',           'teams.KOR': 'Coreia do Sul',
  'teams.IRN': 'Irã',             'teams.AUS': 'Austrália',       'teams.SAU': 'Arábia Saudita',
  'teams.QAT': 'Catar',           'teams.UZB': 'Uzbequistão',     'teams.IRQ': 'Iraque',
  'teams.NZL': 'Nova Zelândia',   'teams.PL1': 'Playoff 1',       'teams.PL2': 'Playoff 2',
  'teams.PL3': 'Playoff 3',       'teams.STD': 'Estádios',        'teams.SPC': 'Especiais',

  'header.swaps': 'Trocas',
  'header.scan':  'Escanear',

  'grid.loading': 'Carregando figurinhas…',
  'grid.hint':    'Clique para adicionar · Clique direito para remover',

  'scanner.title':      'Scanner',
  'scanner.ocrLoading': 'Carregando OCR…',
  'scanner.scanning':   'Escaneando…',
  'scanner.ready':      'Pronto',
  'scanner.capture':    '📸 Capturar Agora',
  'scanner.typeLabel':  '✏️ Digite o código manualmente',
  'scanner.placeholder':'ex: BRA 10',
  'scanner.add':        'Adicionar',
  'scanner.logTitle':   'Registro',
  'scanner.empty':      'Nenhum scan ainda',
  'scanner.added':      '+1 adicionada',
  'scanner.notFound':   'não encontrada',
  'scanner.showRaw':    '▼ Mostrar texto OCR',
  'scanner.hideRaw':    '▲ Ocultar',
  'scanner.alignHint':  'Alinhe o código da figurinha na caixa · como',
  'scanner.camError':   'Câmera indisponível',
  'scanner.useManual':  'Use a entrada manual abaixo.',

  'swaps.title':      'Trocas',
  'swaps.sticker':    'figurinha',
  'swaps.stickers':   'figurinhas',
  'swaps.toTrade':    'para trocar',
  'swaps.dupes':      'duplicatas',
  'swaps.empty':      'Nenhuma duplicata ainda!',
  'swaps.emptyDesc':  'Continue coletando e seus extras aparecerão aqui.',
}

const es = {
  appSubtitle: 'Álbum de Cromos',
  loading: 'Configurando tu álbum…',

  'conf.CONMEBOL': 'América del Sur',
  'conf.CONCACAF': 'América C/N',
  'conf.UEFA':     'Europa',
  'conf.CAF':      'África',
  'conf.AFC':      'Asia',
  'conf.OFC':      'Oceanía',
  'conf.PLAYOFF':  'Playoffs',
  'conf.SPECIAL':  'Especial',

  'teams.ARG': 'Argentina',       'teams.BRA': 'Brasil',          'teams.COL': 'Colombia',
  'teams.URU': 'Uruguay',         'teams.ECU': 'Ecuador',         'teams.PAR': 'Paraguay',
  'teams.USA': 'Estados Unidos',  'teams.MEX': 'México',          'teams.CAN': 'Canadá',
  'teams.PAN': 'Panamá',          'teams.CRC': 'Costa Rica',      'teams.JAM': 'Jamaica',
  'teams.FRA': 'Francia',         'teams.ENG': 'Inglaterra',      'teams.ESP': 'España',
  'teams.GER': 'Alemania',        'teams.POR': 'Portugal',        'teams.NED': 'Países Bajos',
  'teams.BEL': 'Bélgica',         'teams.ITA': 'Italia',          'teams.AUT': 'Austria',
  'teams.SUI': 'Suiza',           'teams.DEN': 'Dinamarca',       'teams.SCO': 'Escocia',
  'teams.SRB': 'Serbia',          'teams.SVK': 'Eslovaquia',      'teams.CRO': 'Croacia',
  'teams.HUN': 'Hungría',         'teams.MAR': 'Marruecos',       'teams.EGY': 'Egipto',
  'teams.SEN': 'Senegal',         'teams.CMR': 'Camerún',         'teams.CIV': 'Costa de Marfil',
  'teams.TUN': 'Túnez',           'teams.GHA': 'Ghana',           'teams.NGA': 'Nigeria',
  'teams.COD': 'R.D. Congo',      'teams.JPN': 'Japón',           'teams.KOR': 'Corea del Sur',
  'teams.IRN': 'Irán',            'teams.AUS': 'Australia',       'teams.SAU': 'Arabia Saudita',
  'teams.QAT': 'Qatar',           'teams.UZB': 'Uzbekistán',      'teams.IRQ': 'Irak',
  'teams.NZL': 'Nueva Zelanda',   'teams.PL1': 'Playoff 1',       'teams.PL2': 'Playoff 2',
  'teams.PL3': 'Playoff 3',       'teams.STD': 'Estadios',        'teams.SPC': 'Especiales',

  'header.swaps': 'Cambios',
  'header.scan':  'Escanear',

  'grid.loading': 'Cargando cromos…',
  'grid.hint':    'Clic para agregar · Clic derecho para quitar',

  'scanner.title':      'Scanner',
  'scanner.ocrLoading': 'Cargando OCR…',
  'scanner.scanning':   'Escaneando…',
  'scanner.ready':      'Listo',
  'scanner.capture':    '📸 Capturar Ahora',
  'scanner.typeLabel':  '✏️ Escribe el código manualmente',
  'scanner.placeholder':'ej: BRA 10',
  'scanner.add':        'Agregar',
  'scanner.logTitle':   'Registro',
  'scanner.empty':      'Nada escaneado aún',
  'scanner.added':      '+1 agregado',
  'scanner.notFound':   'no encontrado',
  'scanner.showRaw':    '▼ Mostrar texto OCR',
  'scanner.hideRaw':    '▲ Ocultar',
  'scanner.alignHint':  'Alinea el código del cromo en el recuadro · como',
  'scanner.camError':   'Cámara no disponible',
  'scanner.useManual':  'Usa la entrada manual a continuación.',

  'swaps.title':      'Cambios',
  'swaps.sticker':    'cromo',
  'swaps.stickers':   'cromos',
  'swaps.toTrade':    'para cambiar',
  'swaps.dupes':      'duplicados',
  'swaps.empty':      '¡Sin duplicados aún!',
  'swaps.emptyDesc':  'Sigue coleccionando y tus extras aparecerán aquí.',
}

const LOCALES = { en, 'pt-BR': ptBR, es }

// ── Locale detection ──────────────────────────────────────────────────────────

export function detectLocale() {
  const lang = (navigator.languages?.[0] || navigator.language || 'en').toLowerCase()
  if (lang.startsWith('pt')) return 'pt-BR'
  if (lang.startsWith('es')) return 'es'
  return 'en'
}

// ── Context ───────────────────────────────────────────────────────────────────

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState(detectLocale)

  const t = useMemo(() => (key) => {
    return LOCALES[locale]?.[key] ?? LOCALES.en[key] ?? key
  }, [locale])

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}

export const LOCALE_META = {
  en:     { label: 'EN', flag: '🇺🇸' },
  'pt-BR':{ label: 'PT', flag: '🇧🇷' },
  es:     { label: 'ES', flag: '🇪🇸' },
}
