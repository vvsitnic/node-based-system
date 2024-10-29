import { useCallback, useEffect, useState } from 'react';
import { Pos } from '../utils';

interface CursorSelectionBoxInterface {
  isActive: boolean;
  startPos: Pos;
  endPos: Pos;
}

const findPositiveBoxSpace = (cursorStart: Pos, cursorEnd: Pos) => {
  const width = Math.abs(cursorEnd.left - cursorStart.left);
  const height = Math.abs(cursorEnd.top - cursorStart.top);

  const left =
    cursorEnd.left - cursorStart.left < 0 ? cursorEnd.left : cursorStart.left;
  const top =
    cursorEnd.top - cursorStart.top < 0 ? cursorEnd.top : cursorStart.top;

  return { width, height, left, top };
};

const CursorSelectionBox = ({
  context,
  onMouseUp,
}: {
  context: HTMLDivElement;
  onMouseUp: (
    width: number,
    height: number,
    startLeft: number,
    startTop: number
  ) => void;
}) => {
  const [cursorSelectionBox, setCursorSelectionBox] =
    useState<CursorSelectionBoxInterface>({
      isActive: false,
      startPos: { top: 0, left: 0 },
      endPos: { top: 0, left: 0 },
    });

  // Activate box
  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (e.target === context) {
        setCursorSelectionBox(prev => {
          return {
            ...prev,
            isActive: true,
            startPos: {
              top: e.clientY,
              left: e.clientX,
            },
            endPos: {
              top: e.clientY,
              left: e.clientX,
            },
          };
        });
      }
    },
    [context]
  );

  // Resize box
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!cursorSelectionBox.isActive) return;

      setCursorSelectionBox(prev => {
        return {
          ...prev,
          endPos: {
            top: e.clientY,
            left: e.clientX,
          },
        };
      });
    },
    [cursorSelectionBox]
  );

  // Deactivate box, call event
  const handleMouseUp = useCallback(() => {
    setCursorSelectionBox(prev => {
      if (!prev.isActive) return prev;

      return {
        ...prev,
        isActive: false,
      };
    });
  }, []);

  useEffect(() => {
    if (!cursorSelectionBox.isActive) {
      const { width, height, left, top } = findPositiveBoxSpace(
        cursorSelectionBox.startPos,
        cursorSelectionBox.endPos
      );

      onMouseUp(width, height, left, top);
    }
  }, [cursorSelectionBox]);

  // Listen to the events
  useEffect(() => {
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp, handleMouseDown]);

  const { width, height, left, top } = findPositiveBoxSpace(
    cursorSelectionBox.startPos,
    cursorSelectionBox.endPos
  );

  return (
    <div
      className={`pointer-events-none absolute rounded-lg border-dashed border-2 border-sky-500 bg-sky-300/15 size-16 ${
        cursorSelectionBox.isActive ? 'block' : 'hidden'
      }`}
      style={{
        top: top,
        left: left,
        width: width,
        height: height,
      }}
    ></div>
  );
};

export default CursorSelectionBox;
