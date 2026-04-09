import { useRef, useState, useCallback } from 'react';

/**
 * useDragSort — pointer-events drag-to-reorder hook.
 * Works on both desktop (mouse) and mobile (touch/fingers).
 *
 * How it works:
 *  1. User presses a drag handle → setPointerCapture ensures all subsequent
 *     pointer events fire on that element even if the finger slides away.
 *  2. onPointerMove computes which item slot the pointer is closest to.
 *  3. onPointerUp / onPointerCancel commits or cancels the reorder.
 */
export function useDragSort<T>(
  items: T[],
  onReorder: (newItems: T[]) => void
) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Store refs to each rendered item so we can measure their positions
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const setItemRef = (i: number) => (el: HTMLDivElement | null) => {
    itemRefs.current[i] = el;
  };

  /** Find the item whose vertical centre is closest to clientY */
  const getClosestIndex = useCallback((clientY: number): number => {
    let closest = 0;
    let minDist = Infinity;
    itemRefs.current.forEach((ref, i) => {
      if (!ref) return;
      const rect = ref.getBoundingClientRect();
      const centreY = rect.top + rect.height / 2;
      const dist = Math.abs(clientY - centreY);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });
    return closest;
  }, []);

  const onPointerDown = useCallback(
    (index: number) => (e: React.PointerEvent<HTMLElement>) => {
      // Prevent browser defaults like text selection or native drag-and-drop
      e.preventDefault();
      
      const rect = e.currentTarget.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });

      // Lock all future pointer events to this element (works on touch too)
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragIndex(index);
      setHoverIndex(index);
      setPointerPos({ x: e.clientX, y: e.clientY });
    },
    []
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (dragIndex === null) return;
      setPointerPos({ x: e.clientX, y: e.clientY });
      setHoverIndex(getClosestIndex(e.clientY));
    },
    [dragIndex, getClosestIndex]
  );

  const commit = useCallback(() => {
    if (dragIndex !== null && hoverIndex !== null && dragIndex !== hoverIndex) {
      const next = [...items];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(hoverIndex, 0, moved);
      onReorder(next);
    }
    setDragIndex(null);
    setHoverIndex(null);
    setPointerPos(null);
  }, [dragIndex, hoverIndex, items, onReorder]);

  // Cancel means we dropped outside — reset without reordering
  const cancel = useCallback(() => {
    setDragIndex(null);
    setHoverIndex(null);
    setPointerPos(null);
  }, []);

  return {
    dragIndex,
    hoverIndex,
    pointerPos,
    dragOffset,
    itemRefs,
    setItemRef,
    onPointerDown,
    onPointerMove,
    onPointerUp: commit,
    onPointerCancel: cancel,
  };
}
