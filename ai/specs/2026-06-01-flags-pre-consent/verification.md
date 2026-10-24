# Verification: Feature flags avaliáveis antes do consentimento

## Commands

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run test:ci`
- [ ] `npm run build`
- [ ] `npm run ai:harness`

## Manual Checks

- [ ] Dev: banner aparece, escolho **decline**, abro React DevTools,
      confirmo `telemetry.flag('social_v1')` ainda retorna `true` pros
      distinct_ids alvo (em dev é sempre `true` via `import.meta.env.DEV`).
- [ ] Dev: Network filtro `posthog.com`. Com decline, único request é
      `/flags`. Zero `/e/`, zero `/engage/`.
- [ ] Dev: grant → `/e/` aparecem (drain do queue + identify + eventos novos).
- [ ] Prod (após deploy): repetir os 3 passos acima com conta de teste.

## Evidence

- [ ] Screenshot da network filter pré-consent (só `/flags`).
- [ ] Screenshot da network filter pós-grant (`/flags` + `/e/` + `/engage/`).
- [ ] Print de React DevTools mostrando `socialEnabled === true` com `consent === 'declined'`.

## Residual Risk

- LGPD reviewer pode pedir env var pra desligar bootstrap pré-consent.
  Aceito como follow-up (1 LOC mudança).
- Flag exposure events (`$feature_flag_called`) vão dobrar/triplicar
  porque agora chegam pré-consent. Esperado e benéfico — métrica de
  adoption fica mais limpa.
