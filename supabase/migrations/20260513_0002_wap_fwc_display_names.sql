-- Display names for opening (WAP) and FIFA Museum history (FWC) specials.
-- Printed album: sticker "00" + FWC 01–08 (stored as WAP-00..WAP-08); FWC 09–19 = champion team foils.
-- Labels aligned with the official Panini checklist (cross-checked May 2026).

-- WAP — printed 00 + FWC 01–08 ("We Are Panini" / host & branding specials)
update public.stickers_catalog set player_name = 'Logo Panini — We Are Panini' where id = 'WAP-00';
update public.stickers_catalog set player_name = 'Emblema oficial (FWC 1)' where id = 'WAP-01';
update public.stickers_catalog set player_name = 'Emblema oficial (FWC 2)' where id = 'WAP-02';
update public.stickers_catalog set player_name = 'Mascotes oficiais' where id = 'WAP-03';
update public.stickers_catalog set player_name = 'Slogan oficial' where id = 'WAP-04';
update public.stickers_catalog set player_name = 'Bola oficial' where id = 'WAP-05';
update public.stickers_catalog set player_name = 'Canadá — sedes e cidades' where id = 'WAP-06';
update public.stickers_catalog set player_name = 'México — sedes e cidades' where id = 'WAP-07';
update public.stickers_catalog set player_name = 'EUA — sedes e cidades' where id = 'WAP-08';

-- FWC — FIFA Museum / World Cup History (FWC 09–19); seleção campeã · ano da Copa
update public.stickers_catalog set player_name = 'Itália · 1934' where id = 'FWC-09';
update public.stickers_catalog set player_name = 'Uruguai · 1950' where id = 'FWC-10';
update public.stickers_catalog set player_name = 'Alemanha Ocidental · 1954' where id = 'FWC-11';
update public.stickers_catalog set player_name = 'Brasil · 1962' where id = 'FWC-12';
update public.stickers_catalog set player_name = 'Alemanha Ocidental · 1974' where id = 'FWC-13';
update public.stickers_catalog set player_name = 'Argentina · 1986' where id = 'FWC-14';
update public.stickers_catalog set player_name = 'Brasil · 1994' where id = 'FWC-15';
update public.stickers_catalog set player_name = 'Brasil · 2002' where id = 'FWC-16';
update public.stickers_catalog set player_name = 'Itália · 2006' where id = 'FWC-17';
update public.stickers_catalog set player_name = 'Alemanha · 2014' where id = 'FWC-18';
update public.stickers_catalog set player_name = 'Argentina · 2022' where id = 'FWC-19';
