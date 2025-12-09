import React, { useEffect } from 'react';

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  color?: 'default' | 'warning' | 'danger';
  onClick: () => void;
  hidden?: boolean;
  type?: 'item';
}

export interface MenuDivider {
  type: 'divider';
}

export type MenuItemType = MenuItem | MenuDivider;

interface ContextMenuProps {
  x: number;
  y: number;
  items: MenuItemType[];
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  // 关闭菜单
  useEffect(() => {
    const handleClick = () => onClose();
    const handleScroll = () => onClose();
    
    document.addEventListener('click', handleClick);
    document.addEventListener('scroll', handleScroll, true);
    
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose]);

  // 计算菜单位置，防止超出屏幕边界
  const calculateMenuPosition = (x: number, y: number) => {
    const menuWidth = 200;
    const visibleItems = items.filter(item => 
      item.type !== 'divider' && !(item as MenuItem).hidden
    );
    const dividerCount = items.filter(item => item.type === 'divider').length;
    const menuHeight = visibleItems.length * 40 + dividerCount * 9; // 每项约40px，分割线9px
    
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    let adjustedX = x;
    let adjustedY = y;
    
    // 检查右边界
    if (x + menuWidth > windowWidth) {
      adjustedX = x - menuWidth;
    }
    
    // 检查底部边界
    if (y + menuHeight > windowHeight) {
      adjustedY = windowHeight - menuHeight - 10;
    }
    
    // 确保不超出左边界
    if (adjustedX < 0) {
      adjustedX = 10;
    }
    
    // 确保不超出顶部边界
    if (adjustedY < 0) {
      adjustedY = 10;
    }
    
    return { x: adjustedX, y: adjustedY };
  };

  const position = calculateMenuPosition(x, y);

  // 获取颜色类
  const getColorClass = (color?: 'default' | 'warning' | 'danger') => {
    switch (color) {
      case 'warning':
        return 'text-yellow-400';
      case 'danger':
        return 'text-red-400';
      default:
        return 'text-gray-300';
    }
  };

  return (
    <div
      className="fixed bg-gray-800 border border-gray-700 rounded-lg shadow-lg  z-50 min-w-[130px] animate-expand-menu"
      style={{ left: `${position.x+10}px`, top: `${position.y+10}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, index) => {
        if (item.type === 'divider') {
          return <div key={`divider-${index}`} className="border-t border-gray-700 "></div>;
        }

        const menuItem = item as MenuItem;
        
        // 隐藏的项目不渲染
        if (menuItem.hidden) {
          return null;
        }

        return (
          <button
            key={menuItem.id}
            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors flex items-center space-x-2 bg-transparent border-0 ${getColorClass(menuItem.color)}`}
            onClick={(e) => {
              e.stopPropagation();
              menuItem.onClick();
              onClose();
            }}
          >
            {menuItem.icon}
            <span>{menuItem.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ContextMenu;
