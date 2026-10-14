import { useState } from "react";

export interface ContextMenuState<T> {
  x: number;
  y: number;
  data?: T;
}

export const useContextMenu = <T>() => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState<T> | null>(
    null,
  );

  const openContextMenu = (x: number, y: number, data?: T) => {
    setContextMenu({ x, y, data });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const handleContextMenu = (e: React.MouseEvent, data?: T) => {
    e.preventDefault();
    e.stopPropagation();
    openContextMenu(e.clientX, e.clientY, data);
  };

  return {
    contextMenu,
    openContextMenu,
    closeContextMenu,
    handleContextMenu,
  };
};
