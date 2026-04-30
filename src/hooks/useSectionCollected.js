import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";

export function useSectionCollected(teamCode) {
  return (
    useLiveQuery(
      () =>
        db.stickers
          .where("teamCode")
          .equals(teamCode)
          .filter((s) => s.quantity > 0)
          .count(),
      [teamCode],
    ) ?? 0
  );
}
