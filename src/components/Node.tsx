import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Pos } from '../utils';

export interface NodeComponentInterface extends Pos {
  id: number;
  isActive: boolean;
  drag: boolean;
  root: Pos;
  onFirstMove: () => void;
  onMouseDown: (
    isActive: boolean,
    isPressed: boolean,
    isBeingDragged: boolean,
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => void;
  onMouseUp: (
    isActive: boolean,
    isPressed: boolean,
    isBeingDragged: boolean
  ) => void;
}

export interface NodeRef {
  getNodeMargins: () => {
    right: number;
    bottom: number;
    top: number;
    left: number;
  } | null;
}

const Node = forwardRef<NodeRef, NodeComponentInterface>(
  (
    {
      // id,
      top: initTop = 0,
      left: initLeft = 0,
      isActive = true,
      drag,
      root,
      onFirstMove,
      onMouseDown,
      onMouseUp,
    },
    ref
  ) => {
    const nodeRef = useRef<HTMLDivElement>(null);
    const isPressed = useRef(false);
    const isBeingDragged = useRef(false);

    const [pos, setPos] = useState<Pos>({
      top: initTop,
      left: initLeft,
    });

    const [mouseOffset, setMouseOffset] = useState<Pos>({
      top: 0,
      left: 0,
    });

    useImperativeHandle(ref, () => ({
      getNodeMargins() {
        if (!nodeRef.current) return null;
        return {
          ...pos,
          right: pos.left + nodeRef.current.offsetWidth,
          bottom: pos.top + nodeRef.current.offsetHeight,
        };
      },
    }));

    // Set mouse offset when rootMousePos changes
    // Its needed when there are many nodes dragged or just to make experience smoother
    useEffect(() => {
      setMouseOffset({
        top: pos.top - root.top,
        left: pos.left - root.left,
      });
    }, [root]);

    const handleMouseUp = useCallback(() => {
      if (!isPressed.current) return;

      // Fire event when cursor lets off the node
      onMouseUp(isActive, isPressed.current, isBeingDragged.current);
      isPressed.current = false;
      isBeingDragged.current = false;
    }, [onMouseUp]);

    const handleMouseMove = useCallback(
      (e: MouseEvent) => {
        // Fires event when node has just began being dragged
        if (isPressed.current && !isBeingDragged.current) {
          isBeingDragged.current = true;
          onFirstMove();
        }

        // Move node to cursor
        if (drag && isActive) {
          setPos({
            top: e.clientY + mouseOffset.top,
            left: e.clientX + mouseOffset.left,
          });
        }
      },
      [drag, isActive, onFirstMove]
    );

    // Handle key press events
    useEffect(() => {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }, [handleMouseUp, handleMouseMove]);

    const onMouseDownHandle = (
      e: React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
      onMouseDown(isActive, isPressed.current, isBeingDragged.current, e);

      isPressed.current = true;
    };

    return (
      <div
        ref={nodeRef}
        className={`absolute min-w-60 min-h-44 w-fit h-fit pt-5 flex content-between border-2 border-violet-950 text-white rounded-lg ${
          isActive ? 'bg-emerald-300' : 'bg-violet-600'
        } ${drag && isActive ? 'cursor-move' : ''}`}
        style={pos}
        onMouseDown={onMouseDownHandle}
      >
        {/* <ul className="flex-none bg-blue-200 pr-2 text-black"></ul>
        <div className="flex-1 p-2 text-black">
          <input type="text" className="w-full" />
        </div>
        <ul className="flex-none bg-blue-200 pl-2 text-black"></ul> */}
      </div>
    );
  }
);

export default Node;
