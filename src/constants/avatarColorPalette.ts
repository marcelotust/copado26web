export type AvatarPaletteEntry = {
  id: number
  name: string
  firstColor: string
  secondColor: string
  color: string
}

export const avatarColorPalette: AvatarPaletteEntry[] = [
  { id: 1,  name: 'Tangerina & Marinho',       firstColor: '#FF9F1C', secondColor: '#FFBF69', color: '#011627' },
  { id: 2,  name: 'Rosa Choque & Esmeralda',   firstColor: '#EF476F', secondColor: '#FF8FA3', color: '#06D6A0' },
  { id: 3,  name: 'Amarelo Sol & Púrpura',     firstColor: '#FFD166', secondColor: '#FF9F1C', color: '#4D194D' },
  { id: 4,  name: 'Ciano & Coral',             firstColor: '#118AB2', secondColor: '#073B4C', color: '#EF476F' },
  { id: 5,  name: 'Verde Limão & Petróleo',    firstColor: '#A6DA00', secondColor: '#55A630', color: '#012A4A' },
  { id: 6,  name: 'Menta Suave & Floresta',    firstColor: '#D8F3DC', secondColor: '#B7E4C7', color: '#081C15' },
  { id: 7,  name: 'Pêssego & Bordô',           firstColor: '#FDE2E4', secondColor: '#FAD2E1', color: '#590D22' },
  { id: 8,  name: 'Lavanda & Índigo',          firstColor: '#E0B1CB', secondColor: '#BE95C4', color: '#231942' },
  { id: 9,  name: 'Azul Gelo & Cobalto',       firstColor: '#CAF0F8', secondColor: '#90E0EF', color: '#03045E' },
  { id: 10, name: 'Baunilha & Café',           firstColor: '#FFF3B0', secondColor: '#E09F3E', color: '#332211' },
  { id: 11, name: 'Roxo Neon & Preto Fosco',   firstColor: '#B5179E', secondColor: '#7209B7', color: '#10002B' },
  { id: 12, name: 'Azul Elétrico & Branco',    firstColor: '#4361EE', secondColor: '#3A0CA3', color: '#F8F9FA' },
  { id: 13, name: 'Verde Neon & Chumbo',       firstColor: '#39FF14', secondColor: '#00F5D4', color: '#212529' },
  { id: 14, name: 'Coral Vivo & Turquesa',     firstColor: '#FF7F50', secondColor: '#FF9F1C', color: '#004C4C' },
  { id: 15, name: 'Ouro & Ametista',           firstColor: '#FFC300', secondColor: '#FFB703', color: '#240046' },
  { id: 16, name: 'Terracota & Areia',         firstColor: '#E07A5F', secondColor: '#F4A261', color: '#F4F1DE' },
  { id: 17, name: 'Mostarda & Ardósia',        firstColor: '#E9C46A', secondColor: '#E76F51', color: '#2A9D8F' },
  { id: 18, name: 'Orquídea & Mostarda Esc.',  firstColor: '#9D4EDD', secondColor: '#C77DFF', color: '#5A3900' },
  { id: 19, name: 'Magenta & Rosa Pálido',     firstColor: '#70163C', secondColor: '#A4161A', color: '#FFB5A7' },
  { id: 20, name: 'Teal & Salmão',             firstColor: '#0081A7', secondColor: '#00AFB9', color: '#F07167' },
]

export function getPaletteEntry(id: number | null | undefined): AvatarPaletteEntry | undefined {
  if (id === null || id === undefined) return undefined
  return avatarColorPalette.find(p => p.id === id)
}
