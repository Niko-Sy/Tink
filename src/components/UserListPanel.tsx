import React, { useState } from 'react';
import { SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { User } from '../types';
import { useAuth } from '../context/AuthContext';
import { permissionChecker } from '../utils/permissions';
import ContextMenu from './ContextMenu';
import { useContextMenu } from '../hooks/useContextMenu';
import { MenuItems, createDivider } from '../utils/menuItems';
import type { MenuItemType } from './ContextMenu';

interface UserListPanelProps {
  users: User[];
}

const UserListPanel: React.FC<UserListPanelProps> = ({ users }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { contextMenu, handleContextMenu, closeContextMenu } = useContextMenu();
  const { user, currentRoomMember } = useAuth();

  // 处理用户点击
  const handleUserClick = (e: React.MouseEvent, userId: string) => {
    handleContextMenu(e, userId);
  };

  // 处理菜单操作
  const handleMenuAction = (action: string, userId: string) => {
    console.log(`执行操作: ${action}`, userId);
    const targetUser = users.find(u => u.userId === userId);
    
    switch(action) {
      case 'privateMessage':
        console.log('私信用户:', targetUser);
        break;
      case 'addFriend':
        console.log('添加好友:', targetUser);
        break;
      case 'viewProfile':
        console.log('查看用户资料:', targetUser);
        navigate(`/user/${userId}`);
        break;
      case 'report':
        console.log('举报用户:', targetUser);
        break;
      case 'mute':
        console.log('禁言用户:', targetUser);
        break;
      case 'kick':
        console.log('踢出用户:', targetUser);
        break;
    }
  };

  // 生成菜单项
  const generateMenuItems = (userId: string): MenuItemType[] => {
    return [
      MenuItems.privateMessage(() => handleMenuAction('privateMessage', userId)),
      MenuItems.addFriend(() => handleMenuAction('addFriend', userId)),
      MenuItems.viewProfile(() => handleMenuAction('viewProfile', userId)),
      createDivider(),
      MenuItems.report(() => handleMenuAction('report', userId)),
      MenuItems.mute(
        () => handleMenuAction('mute', userId),
        !permissionChecker.canMuteMember(user, currentRoomMember)
      ),
      MenuItems.kick(
        () => handleMenuAction('kick', userId),
        !permissionChecker.canRemoveMember(user, currentRoomMember)
      ),
    ];
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
    <div className="h-full w-60 bg-ground flex flex-col border-l border-grayborder">
      {/* 在线用户头像区 */}
      <div className="px-6 pt-5 border-grayborder">
        <div className="flex justify-between items-center ">
          <h3 className="font-medium">在线用户</h3>
          <span className="w-5 h-5 text-xs bg-gray-700 text-green-500 flex justify-center items-center rounded-full">
            {onlineUsers.length}
          </span>
        </div>
      </div>
      
      {/* 用户搜索 */}
      <div className="px-4 pb-4 pt-4 ">
        <div className="relative">
          <SearchOutlined className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="搜索用户..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-secondary text-white rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-gray-600"
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
          <div className="text-center text-gray-700 py-8">
            未找到匹配的用户
          </div>
        )}

        {/* 用户菜单 */}
        {contextMenu && contextMenu.data && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            items={generateMenuItems(contextMenu.data)}
            onClose={closeContextMenu}
          />
        )}
      </div>
    </div>
  );
};

export default UserListPanel;
