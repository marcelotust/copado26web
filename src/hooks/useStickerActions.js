import { useState, useCallback } from "react";
import { increment, decrement } from "./useStickers";

export function useStickerActions(stickerId) {
  const [popping, setPopping] = useState(false);
  const [floats, setFloats] = useState(/** @type {number[]} */ ([]));

  const handleAdd = useCallback(
    async (/** @type {React.MouseEvent} */ e) => {
      e.stopPropagation();
      await increment(stickerId);
      setPopping(true);
      const key = Date.now();
      setFloats(/** @type {function(number[]): number[]} */ (f) => [...f, key]);
      setTimeout(() => setPopping(false), 200);
      setTimeout(() => setFloats((f) => f.filter((k) => k !== key)), 600);
    },
    [stickerId],
  );

  const handleRemove = useCallback(
    async (/** @type {React.MouseEvent} */ e) => {
      e.stopPropagation();
      await decrement(stickerId);
    },
    [stickerId],
  );

  return { popping, floats, handleAdd, handleRemove };
}
