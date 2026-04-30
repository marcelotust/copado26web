import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";

export function useSwaps() {
  const swaps =
    useLiveQuery(
      () => db.stickers.where("quantity").above(1).sortBy("teamCode"),
      [],
    ) ?? [];

  const byTeam = swaps.reduce((acc, s) => {
    if (!acc[s.teamCode]) acc[s.teamCode] = [];
    acc[s.teamCode].push(s);
    return acc;
  }, {});

  const teams = Object.keys(byTeam).sort();

  return { swaps, byTeam, teams };
}
