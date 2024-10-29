import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { doOverlap, Pos } from '../utils';
import Node, { NodeRef } from './Node';
import CursorSelectionBox from './CursorSelectionBox';

interface Node {
  id: number;
  isActive: boolean;
}

interface NodesContextInterface {
  activeNodesList: Node[];
  setActiveNodesList: React.Dispatch<React.SetStateAction<number[]>>;
}

export const ActiveNodesContext = createContext<NodesContextInterface>({
  activeNodesList: [],
  setActiveNodesList: () => {},
});

const Context = () => {
  const contextRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef<Pos>({ top: 0, left: 0 });
  const shiftPressedRef = useRef(false);

  const [lastClickMousePos, setLastClickMousePos] = useState<Pos>({
    top: 0,
    left: 0,
  });
  const [nodeList, setNodeList] = useState<Node[]>([]);
  const [nodesAreBeingDragged, setNodesAreBeingDragged] = useState(false);
  // Refs for each Node, stored by node id
  const nodeRefs = useRef<{ [key: string]: NodeRef | null }>({});

  // Listen to space bar key press
  const handleSpaceKeyPress = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space') {
      // Create new node
      setNodeList(prevNodeList => {
        const notActiveNodes = prevNodeList.map(node => {
          return { ...node, isActive: false };
        });

        return [...notActiveNodes, { id: Math.random(), isActive: true }];
      });
    }
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Backspace' || e.code === 'Delete') {
      setNodeList(prevNodeList => {
        return prevNodeList.filter(node => !node.isActive);
      });
    }

    shiftPressedRef.current = e.shiftKey;
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    shiftPressedRef.current = e.shiftKey;
  }, []);

  // Ensure refs are correctly set for remaining nodes
  useEffect(() => {
    for (const [key, value] of Object.entries(nodeRefs.current)) {
      if (!value) {
        delete nodeRefs.current[key];
      }
    }
  }, [nodeList]);

  // Handle key press events
  useEffect(() => {
    window.addEventListener('keypress', handleSpaceKeyPress);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keypress', handleSpaceKeyPress);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleSpaceKeyPress, handleKeyDown, handleKeyUp]);

  // Handle Mouse Move event
  const onMouseMoveHandle = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    mousePos.current.top = e.clientY;
    mousePos.current.left = e.clientX;
  };

  return (
    <div
      ref={contextRef}
      className="w-full h-screen bg-orange-100 relative overflow-hidden"
      onMouseMove={onMouseMoveHandle}
    >
      {nodeList.map(node => (
        <Node
          key={node.id}
          ref={el => (nodeRefs.current[node.id] = el)}
          id={node.id}
          left={mousePos.current.left}
          top={mousePos.current.top}
          isActive={node.isActive}
          drag={nodesAreBeingDragged}
          root={lastClickMousePos} // root is basically pos of mouse when node is clicked to calculate offset
          onFirstMove={() => {
            if (!shiftPressedRef.current) setNodesAreBeingDragged(true);
          }}
          onMouseDown={(isActive, isPressed, isBeingDragged, e) => {
            // Set mouse click pos
            // It is needed to set drag offset in node components
            setLastClickMousePos({ top: e.clientY, left: e.clientX });

            // Update node active states
            setNodeList(prevNodeList => {
              if (shiftPressedRef.current) {
                return prevNodeList.map(nodeOfList => {
                  if (nodeOfList.id === node.id) {
                    return { ...nodeOfList, isActive: !nodeOfList.isActive };
                  }

                  return nodeOfList;
                });
              }

              if (isActive) return prevNodeList;

              return prevNodeList.map(nodeOfList => {
                if (nodeOfList.id === node.id) {
                  return { ...nodeOfList, isActive: true };
                }

                return { ...nodeOfList, isActive: false };
              });
            });
          }}
          onMouseUp={(isActive, _, isBeingDragged) => {
            if (!isActive || shiftPressedRef.current) return;
            setNodesAreBeingDragged(false);

            if (!isBeingDragged) {
              setNodeList(prevNodeList => {
                return prevNodeList.map(nodeOfList => {
                  if (nodeOfList.id === node.id) {
                    return { ...nodeOfList, isActive: true };
                  }

                  return { ...nodeOfList, isActive: false };
                });
              });
            }
          }}
        />
      ))}
      <CursorSelectionBox
        context={contextRef.current!}
        onMouseUp={(width, height, left, top) => {
          const nodesToActivate: number[] = [];
          for (const nodeId in nodeRefs.current) {
            if (nodeRefs.current[nodeId] !== null) {
              const nodeMargins = nodeRefs.current[nodeId].getNodeMargins();
              if (!nodeMargins) return;
              const nodeOverlaps = doOverlap(
                { left, top, right: left + width, bottom: top + height },
                nodeMargins
              );
              if (nodeOverlaps) nodesToActivate.push(+nodeId);
            }
          }

          setNodeList(prevNodeList => {
            if (shiftPressedRef.current) {
              return prevNodeList.map(nodeOfList => {
                if (nodesToActivate.includes(nodeOfList.id)) {
                  return { ...nodeOfList, isActive: true };
                }

                return nodeOfList;
              });
            }

            return prevNodeList.map(nodeOfList => {
              if (nodesToActivate.includes(nodeOfList.id)) {
                return { ...nodeOfList, isActive: true };
              }

              return { ...nodeOfList, isActive: false };
            });
          });
        }}
      />
    </div>
  );
};

export default Context;
