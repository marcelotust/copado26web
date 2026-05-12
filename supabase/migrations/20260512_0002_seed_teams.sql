-- Seed data for the teams table.
-- Order matches the printed Panini WC 2026 album:
--   1) WAP  — "We Are Panini" opening section
--   2) Groups A through L, each with 4 teams in printed order
--   3) FWC  — "World Cup History" closing section (FWC9-FWC19)
--   4) CC   — Coca-Cola exclusive set (CC1-CC14)

insert into public.teams (code, name_key, flag, conf, group_letter, sort_order) values
  -- ── Opening ──
  ('WAP', 'sections.wap',  '🏆',     'WAP',      null, 0),

  -- ── Group A: MEX · RSA · KOR · CZE ──
  ('MEX', 'teams.MEX', '🇲🇽', 'CONCACAF', 'A', 10),
  ('RSA', 'teams.RSA', '🇿🇦', 'CAF',      'A', 11),
  ('KOR', 'teams.KOR', '🇰🇷', 'AFC',      'A', 12),
  ('CZE', 'teams.CZE', '🇨🇿', 'UEFA',     'A', 13),

  -- ── Group B: CAN · BIH · QAT · SUI ──
  ('CAN', 'teams.CAN', '🇨🇦', 'CONCACAF', 'B', 20),
  ('BIH', 'teams.BIH', '🇧🇦', 'UEFA',     'B', 21),
  ('QAT', 'teams.QAT', '🇶🇦', 'AFC',      'B', 22),
  ('SUI', 'teams.SUI', '🇨🇭', 'UEFA',     'B', 23),

  -- ── Group C: BRA · MAR · HAI · SCO ──
  ('BRA', 'teams.BRA', '🇧🇷', 'CONMEBOL', 'C', 30),
  ('MAR', 'teams.MAR', '🇲🇦', 'CAF',      'C', 31),
  ('HAI', 'teams.HAI', '🇭🇹', 'CONCACAF', 'C', 32),
  ('SCO', 'teams.SCO', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'UEFA',     'C', 33),

  -- ── Group D: USA · PAR · AUS · TUR ──
  ('USA', 'teams.USA', '🇺🇸', 'CONCACAF', 'D', 40),
  ('PAR', 'teams.PAR', '🇵🇾', 'CONMEBOL', 'D', 41),
  ('AUS', 'teams.AUS', '🇦🇺', 'AFC',      'D', 42),
  ('TUR', 'teams.TUR', '🇹🇷', 'UEFA',     'D', 43),

  -- ── Group E: GER · CUW · CIV · ECU ──
  ('GER', 'teams.GER', '🇩🇪', 'UEFA',     'E', 50),
  ('CUW', 'teams.CUW', '🇨🇼', 'CONCACAF', 'E', 51),
  ('CIV', 'teams.CIV', '🇨🇮', 'CAF',      'E', 52),
  ('ECU', 'teams.ECU', '🇪🇨', 'CONMEBOL', 'E', 53),

  -- ── Group F: NED · JPN · SWE · TUN ──
  ('NED', 'teams.NED', '🇳🇱', 'UEFA',     'F', 60),
  ('JPN', 'teams.JPN', '🇯🇵', 'AFC',      'F', 61),
  ('SWE', 'teams.SWE', '🇸🇪', 'UEFA',     'F', 62),
  ('TUN', 'teams.TUN', '🇹🇳', 'CAF',      'F', 63),

  -- ── Group G: BEL · EGY · IRN · NZL ──
  ('BEL', 'teams.BEL', '🇧🇪', 'UEFA',     'G', 70),
  ('EGY', 'teams.EGY', '🇪🇬', 'CAF',      'G', 71),
  ('IRN', 'teams.IRN', '🇮🇷', 'AFC',      'G', 72),
  ('NZL', 'teams.NZL', '🇳🇿', 'OFC',      'G', 73),

  -- ── Group H: ESP · CPV · KSA · URU ──
  ('ESP', 'teams.ESP', '🇪🇸', 'UEFA',     'H', 80),
  ('CPV', 'teams.CPV', '🇨🇻', 'CAF',      'H', 81),
  ('KSA', 'teams.KSA', '🇸🇦', 'AFC',      'H', 82),
  ('URU', 'teams.URU', '🇺🇾', 'CONMEBOL', 'H', 83),

  -- ── Group I: FRA · SEN · IRQ · NOR ──
  ('FRA', 'teams.FRA', '🇫🇷', 'UEFA',     'I', 90),
  ('SEN', 'teams.SEN', '🇸🇳', 'CAF',      'I', 91),
  ('IRQ', 'teams.IRQ', '🇮🇶', 'AFC',      'I', 92),
  ('NOR', 'teams.NOR', '🇳🇴', 'UEFA',     'I', 93),

  -- ── Group J: ARG · ALG · AUT · JOR ──
  ('ARG', 'teams.ARG', '🇦🇷', 'CONMEBOL', 'J', 100),
  ('ALG', 'teams.ALG', '🇩🇿', 'CAF',      'J', 101),
  ('AUT', 'teams.AUT', '🇦🇹', 'UEFA',     'J', 102),
  ('JOR', 'teams.JOR', '🇯🇴', 'AFC',      'J', 103),

  -- ── Group K: POR · COD · UZB · COL ──
  ('POR', 'teams.POR', '🇵🇹', 'UEFA',     'K', 110),
  ('COD', 'teams.COD', '🇨🇩', 'CAF',      'K', 111),
  ('UZB', 'teams.UZB', '🇺🇿', 'AFC',      'K', 112),
  ('COL', 'teams.COL', '🇨🇴', 'CONMEBOL', 'K', 113),

  -- ── Group L: ENG · CRO · GHA · PAN ──
  ('ENG', 'teams.ENG', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'UEFA',     'L', 120),
  ('CRO', 'teams.CRO', '🇭🇷', 'UEFA',     'L', 121),
  ('GHA', 'teams.GHA', '🇬🇭', 'CAF',      'L', 122),
  ('PAN', 'teams.PAN', '🇵🇦', 'CONCACAF', 'L', 123),

  -- ── Closing ──
  ('FWC', 'sections.fwc', '🏅', 'FWC', null, 200),
  ('CC',  'sections.cc',  '🥤', 'CC',  null, 210);
