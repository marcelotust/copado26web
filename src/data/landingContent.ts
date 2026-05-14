export type LandingFeature = {
  icon: string
  iconLabel: string
  title: string
  desc: string
  detail: string        // longer copy for tier-1 cards
  accent: string
  tier: 1 | 2
}

export const LANDING_FEATURES: LandingFeature[] = [
  {
    icon: '⚡',
    iconLabel: 'Raio',
    title: 'Marque em segundos',
    desc: 'Toque pra colar, toque pra desmarcar.',
    detail: 'Chega de planilha, foto do caderno ou grupo de WhatsApp desatualizado. Um toque marca, dois removem. Tudo sincronizado na nuvem em tempo real — em qualquer dispositivo.',
    accent: '#3b82f6',
    tier: 1,
  },
  {
    icon: '📤',
    iconLabel: 'Compartilhar',
    title: 'Compartilhe no WhatsApp',
    desc: 'Sua lista formatada, pronta pra mandar.',
    detail: 'Com um toque você manda pro grupo exatamente o que está faltando — com as bandeirinhas de cada seleção, organizadas por time. Ninguém mais precisa adivinhar o que você precisa.',
    accent: '#10b981',
    tier: 1,
  },
  {
    icon: '🔄',
    iconLabel: 'Setas de troca',
    title: 'Cole a lista de trocas',
    desc: 'Match instantâneo com as sobras do amigo.',
    detail: 'Recebeu a lista de repetidas de alguém no WhatsApp? Cole aqui. O app cruza com o que você precisa e mostra exatamente quem dá o quê pra quem — sem spreadsheet, sem confusão.',
    accent: '#f43f5e',
    tier: 1,
  },
  {
    icon: '📊',
    iconLabel: 'Gráfico de barras',
    title: 'Dashboard de progresso',
    desc: 'Visão geral do álbum num relance.',
    detail: '',
    accent: '#f59e0b',
    tier: 2,
  },
  {
    icon: '🏆',
    iconLabel: 'Troféu',
    title: 'Desafios temáticos',
    desc: 'Metas que tornam a coleção mais divertida.',
    detail: '',
    accent: '#f59e0b',
    tier: 2,
  },
  {
    icon: '🎉',
    iconLabel: 'Festa',
    title: 'Milestones e conquistas',
    desc: 'Cards especiais para compartilhar suas vitórias.',
    detail: '',
    accent: '#a855f7',
    tier: 2,
  },
]

export const LANDING_PRIVACY = [
  { icon: '🔒', iconLabel: 'Cadeado', text: 'Seus dados ficam no Supabase, com criptografia em trânsito e repouso' },
  { icon: '📊', iconLabel: 'Gráfico', text: 'Analytics anônimos coletados só com o seu consentimento' },
  { icon: '🗑️', iconLabel: 'Lixeira',  text: 'Exclusão de conta e dados a qualquer momento, sem burocracia' },
  { icon: '🇧🇷', iconLabel: 'Bandeira do Brasil', text: 'Operado em conformidade com a LGPD — Lei Geral de Proteção de Dados' },
] as const

export const LANDING_STATS = [
  { value: '994', label: 'figurinhas' },
  { value: '48',  label: 'seleções'   },
  { value: '12',  label: 'grupos'     },
  { value: '3',   label: 'países-sede'},
] as const
