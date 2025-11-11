import React, { useState, useEffect } from 'react';
import { SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { User } from '../types';

interface UserListPanelProps {
  users: User[];
}

interface ContextMenu {
  x: number;
  y: number;
  userId: string; // 改为string类型
}

const UserListPanel: React.FC<UserListPanelProps> = ({ users }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);

  // 关闭菜单
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    const handleScroll = () => setContextMenu(null);
    
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      document.addEventListener('scroll', handleScroll, true);
    }
    
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [contextMenu]);

  // 计算菜单位置，防止超出屏幕边界
  const calculateMenuPosition = (x: number, y: number) => {
    const menuWidth = 160;
    const menuHeight = 200; // 5个菜单项的高度
    
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

  // 处理用户点击
  const handleUserClick = (e: React.MouseEvent, userId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const position = calculateMenuPosition(e.clientX, e.clientY);
    setContextMenu({
      x: position.x,
      y: position.y,
      userId
    });
  };

  // 处理菜单操作
  const handleMenuAction = (action: string, userId: string) => {
    console.log(`执行操作: ${action}`, userId);
    setContextMenu(null);
    const user = users.find(u => u.userId === userId);
    
    switch(action) {
      case 'privateMessage':
        console.log('私信用户:', user);
        break;
      case 'addFriend':
        console.log('添加好友:', user);
        break;
      case 'viewProfile':
        console.log('查看用户资料:', user);
        // 跳转到用户资料页面
        navigate(`/user/${userId}`);
        break;
      case 'report':
        console.log('举报用户:', user);
        break;
      case 'mute':
        console.log('禁言用户:', user);
        break;
    }
  };

  // 过滤用户
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 排序:在线用户排在前面
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (a.status === 'online' && b.status !== 'online') return -1;
    if (a.status !== 'online' && b.status === 'online') return 1;
    return 0;
  });

  // 获取在线用户
  const onlineUsers = users.filter(user => user.status === 'online');

  return (
    <div className="w-64 bg-gray-900 flex flex-col border-l border-gray-800">
      {/* 在线用户头像区 */}
      <div className="px-6 pt-5 border-gray-800">
        <div className="flex justify-between items-center ">
          <h3 className="font-medium">在线用户</h3>
          <span className="w-5 h-5 text-xs bg-gray-700 text-green-500 flex justify-center items-center rounded-full">
            {onlineUsers.length}
          </span>
        </div>
      </div>
      
      {/* 用户搜索 */}
      <div className="px-4 pb-4 pt-4 border-b border-gray-800">
        <div className="relative">
          <SearchOutlined className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="搜索用户..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-800 text-white rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-gray-600"
          />
        </div>
      </div>
      
      {/* 用户列表 */}
      <div className="flex-1 overflow-y-auto py-2 relative">
        {sortedUsers.length > 0 ? (
          sortedUsers.map(user => (
            <div 
              key={user.userId} 
              className="flex items-center mx-2 my-1 px-4 py-2 hover:bg-gray-800 transition-colors cursor-pointer rounded-list"
              onClick={(e) => handleUserClick(e, user.userId)}
            >
              <div className="relative mr-3">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2.5 border-gray-900 ${
                  user.status === 'online' ? 'bg-green-500' :
                  user.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                }`}></div>
              </div>
              <div className="flex-1">
                <div className="text-gray-300 text-sm">{user.name}</div>
                <div className="text-xs text-gray-500">
                  {user.status === 'online' ? '在线' : 
                   user.status === 'away' ? '离开' : '离线'}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-8">
            未找到匹配的用户
          </div>
        )}

        {/* 用户菜单 */}
        {contextMenu && (
          <div
            className="fixed bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-1 z-50 min-w-[160px]"
            style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center space-x-2 bg-transparent"
              onClick={() => handleMenuAction('privateMessage', contextMenu.userId)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>私信</span>
            </button>
            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center space-x-2 bg-transparent"
              onClick={() => handleMenuAction('addFriend', contextMenu.userId)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span>添加好友</span>
            </button>
            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center space-x-2 bg-transparent"
              onClick={() => handleMenuAction('viewProfile', contextMenu.userId)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>查看资料</span>
            </button>
            <div className="border-t border-gray-700 my-1"></div>
            <button
              className="w-full text-left px-4 py-2 text-sm text-yellow-400 hover:bg-gray-700 transition-colors flex items-center space-x-2 bg-transparent"
              onClick={() => handleMenuAction('report', contextMenu.userId)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>举报</span>
            </button>
            <button
              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors flex items-center space-x-2 bg-transparent"
              onClick={() => handleMenuAction('mute', contextMenu.userId)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
              <span>禁言</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserListPanel;
