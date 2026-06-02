# Ranking Widget Refactor — Design

**Date:** 2026-06-02  
**Status:** Approved

## Problem

The dashboard ranking widget (`RankingMyRankWidget`) consistently fails to display content. Users report seeing only the component border with no content inside. Root cause: the widget depends on three concurrent async sources (`useMyRank`, `useProfile`, `usePublicRanking`), creating fragile loading states. The `get_public_ranking` RPC is slow, and the combination of `rankingPublic=true` + `myRank=null` + empty `top3` renders an invisible container.

## Scope

- Simplify `RankingMyRankWidget` to depend only on `useMyRank` + `rankingPublic` from `useProfile`.
- Remove `usePublicRanking` from `DashboardPage` entirely.
- Remove `top3` and `currentUserId` props.
- Keep the "not opted in" card with link to settings.
- Add link to full ranking page.

## Non-Goals

- Do not change the `/ranking` page.
- Do not change `useMyRank` or `useProfile` hooks.
- Do not add new RPCs or data sources.
- Do not redesign the full ranking flow.

## Acceptance Criteria

1. Widget renders with visible content in all three states (loading, not-opted-in, ranked).
2. Top 3 users list is gone from the widget.
3. Medal (🥇🥈🥉) shown for positions 1–3; `#N` for others.
4. Link "ver ranking completo" → `/ranking` visible when ranked.
5. "Not opted in" card with link to `/settings` when `ranking_public=false`.
6. `usePublicRanking` is no longer called in `DashboardPage`.
7. All 5 unit tests pass (updated) + 1 new medal test.
8. `npm run ai:harness` passes.

## Component API (after refactor)

```ts
type Props = {
  myRank: MyRank | null
  rankingPublic: boolean
  loading: boolean
}
```

## Render States

| State | Condition | Content |
|---|---|---|
| Loading | `loading=true` | Skeleton (`animate-pulse`) |
| Not opted in | `!rankingPublic` | Card with "não participando" + link `/settings` |
| Ranked | `rankingPublic=true, myRank!=null` | Medal/position large + link `/ranking` |
| Opted in, no rank yet | `rankingPublic=true, myRank=null` | Empty state text |

## Layout (ranked state)

```
╔══════════════════════════════╗
║ 🏆 Ranking          ver tudo ║
║                              ║
║         🥈 #2                ║
║                              ║
╚══════════════════════════════╝
```

Position displayed large (`text-2xl font-bold`). Medal emoji and `#N` shown together via existing `rankIcon()` helper. Link "ver tudo" aligned to the right.

## Files Changed

| File | Change |
|---|---|
| `src/components/ranking/RankingMyRankWidget.tsx` | Remove `top3`, `currentUserId` props and top3 rendering logic |
| `src/components/ranking/RankingMyRankWidget.test.tsx` | Update tests, remove top3 cases, add medal test |
| `src/pages/DashboardPage.tsx` | Remove `usePublicRanking` import/call, remove `top3`/`currentUserId` props |

## Data Flow (after)

```
DashboardPage
  ├── useMyRank()          → { myRank, loading: myRankLoading }
  ├── useProfile(userId)   → { profile, loading: profileLoading }
  └── RankingMyRankWidget
        props: myRank, rankingPublic, loading=(myRankLoading || profileLoading)
```

## Risks

- `useMyRank` (`get_my_rank` RPC) could also be slow or fail — the empty state handles null gracefully.
- No visual regression on `/ranking` page (untouched).

## Verification

```bash
npm run test:ci          # unit tests must pass
npm run typecheck        # no type errors
npm run ai:harness       # harness check
```

Manual: open dashboard, confirm widget shows position and medal; test with `ranking_public=false` in settings.
