import { useState } from 'react';

export interface ContextMenuState {
  x: number;
  y: number;
  data?: any;
}

export const useContextMenu = () => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const openContextMenu = (x: number, y: number, data?: any) => {
    setContextMenu({ x, y, data });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const handleContextMenu = (e: React.MouseEvent, data?: any) => {
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
