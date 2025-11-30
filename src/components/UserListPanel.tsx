import React, { useState } from 'react';
import { SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { notification } from 'antd';
import type { User } from '../types';
import { useAuth } from '../context/AuthContext';
import { permissionChecker } from '../utils/permissions';
import ContextMenu from './ContextMenu';
import { useContextMenu } from '../hooks/useContextMenu';
import { MenuItems, createDivider } from '../utils/menuItems';
import type { MenuItemType } from './ContextMenu';
import { memberService } from '../services/member';

interface UserListPanelProps {
  users: User[];
}

const UserListPanel: React.FC<UserListPanelProps> = ({ users }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { contextMenu, handleContextMenu, closeContextMenu } = useContextMenu();
  const { user, currentRoomMember } = useAuth();
  const [api, contextHolder] = notification.useNotification({
    placement: 'topRight',
    top: 24,
    duration: 3,
  });

  // 处理用户点击
  const handleUserClick = (e: React.MouseEvent, userId: string) => {
    handleContextMenu(e, userId);
  };

  // 处理自己的菜单操作（与 Sidebar 相同）
  const handleSelfMenuAction = (action: string) => {
    console.log(`执行个人操作: ${action}`);
    closeContextMenu();
    
    switch(action) {
      case 'profilePage':
        console.log('打开个人主页');
        navigate('/profile');
        break;
      case 'accountSettings':
        console.log('打开账号设置');
        api.info({
          message: '账号设置',
          description: '账号设置功能开发中，敬请期待！',
        });
        break;
      case 'privacy':
        console.log('打开隐私设置');
        api.info({
          message: '隐私设置',
          description: '隐私设置功能开发中，敬请期待！',
        });
        break;
      case 'notifications':
        console.log('打开通知设置');
        api.info({
          message: '通知设置',
          description: '通知设置功能开发中，敬请期待！',
        });
        break;
      case 'help':
        console.log('打开帮助中心');
        api.info({
          message: '帮助中心',
          description: '帮助中心功能开发中，敬请期待！',
        });
        break;
      case 'feedback':
        console.log('打开反馈建议');
        api.info({
          message: '反馈建议',
          description: '反馈建议功能开发中，敬请期待！',
        });
        break;
      case 'logout':
        console.log('退出登录');
        api.warning({
          message: '退出登录',
          description: '是否确定退出登录？（此功能需要确认对话框）',
        });
        // TODO: 添加确认对话框后再执行 logout
        break;
    }
  };

  // 处理菜单操作
  const handleMenuAction = async (action: string, userId: string) => {
    console.log(`执行操作: ${action}`, userId);
    const targetUser = users.find(u => u.userId === userId);
    
    switch(action) {
      case 'privateMessage':
        console.log('私信用户:', targetUser);
        api.info({
          message: '私信功能',
          description: '私信功能开发中，敬请期待！',
        });
        break;
      case 'addFriend':
        console.log('添加好友:', targetUser);
        api.info({
          message: '添加好友',
          description: '好友功能开发中，敬请期待！',
        });
        break;
      case 'viewProfile':
        console.log('查看用户资料:', targetUser);
        // 跳转到用户资料页面，传递userId参数
        navigate(`/user/${userId}`);
        break;
      case 'report':
        console.log('举报用户:', targetUser);
        api.info({
          message: '举报功能',
          description: '举报功能开发中，敬请期待！',
        });
        break;
      case 'mute':
        console.log('禁言用户:', targetUser);
        api.info({
          message: '禁言功能',
          description: '禁言功能开发中，敬请期待！',
        });
        break;
      case 'kick':
        console.log('踢出用户:', targetUser);
        api.info({
          message: '踢出功能',
          description: '踢出功能开发中，敬请期待！',
        });
        break;
      case 'setAdmin':
        await handleSetAdmin(userId);
        break;
      case 'removeAdmin':
        await handleRemoveAdmin(userId);
        break;
    }
  };

  // 设置为管理员
  const handleSetAdmin = async (userId: string) => {
    if (!currentRoomMember?.roomId) return;
    
    // 获取目标用户的成员信息
    const targetUser = users.find(u => u.userId === userId);
    if (!targetUser) {
      api.error({
        message: '操作失败',
        description: '未找到目标用户',
      });
      return;
    }
    
    try {
      // 需要先获取该用户的memberId
      const memberInfoResponse = await memberService.getMemberInfo(
        currentRoomMember.roomId,
        userId
      );
      
      if (memberInfoResponse.code !== 200 || !memberInfoResponse.data) {
        api.error({
          message: '获取用户信息失败',
          description: memberInfoResponse.message || '无法获取成员信息',
        });
        return;
      }
      
      const response = await memberService.setAdmin(
        currentRoomMember.roomId,
        { memberid: memberInfoResponse.data.memberId }
      );
      
      if (response.code === 200) {
        api.success({
          message: '设置成功',
          description: '已将该用户设置为管理员',
        });
        // TODO: 刷新成员列表或更新本地状态
      } else {
        api.error({
          message: '设置失败',
          description: response.message || '设置管理员失败',
        });
      }
    } catch (err) {
      console.error('设置管理员失败:', err);
      api.error({
        message: '设置失败',
        description: '网络错误，请稍后重试',
      });
    }
  };

  // 解除管理员
  const handleRemoveAdmin = async (userId: string) => {
    if (!currentRoomMember?.roomId) return;
    
    // 获取目标用户的成员信息
    const targetUser = users.find(u => u.userId === userId);
    if (!targetUser) {
      api.error({
        message: '操作失败',
        description: '未找到目标用户',
      });
      return;
    }
    
    try {
      // 需要先获取该用户的memberId
      const memberInfoResponse = await memberService.getMemberInfo(
        currentRoomMember.roomId,
        userId
      );
      
      if (memberInfoResponse.code !== 200 || !memberInfoResponse.data) {
        api.error({
          message: '获取用户信息失败',
          description: memberInfoResponse.message || '无法获取成员信息',
        });
        return;
      }
      
      const response = await memberService.removeAdmin(
        currentRoomMember.roomId,
        { memberid: memberInfoResponse.data.memberId }
      );
      
      if (response.code === 200) {
        api.success({
          message: '解除成功',
          description: '已将该用户解除管理员身份',
        });
        // TODO: 刷新成员列表或更新本地状态
      } else {
        api.error({
          message: '解除失败',
          description: response.message || '解除管理员失败',
        });
      }
    } catch (err) {
      console.error('解除管理员失败:', err);
      api.error({
        message: '解除失败',
        description: '网络错误，请稍后重试',
      });
    }
  };

  // 生成菜单项
  const generateMenuItems = (userId: string): MenuItemType[] => {
    // 判断是否是点击自己
    const isSelf = user?.userId === userId;
    
    // 如果点击的是自己，显示个人菜单（与 Sidebar 相同）
    if (isSelf) {
      return [
        MenuItems.profilePage(() => handleSelfMenuAction('profilePage')),
        MenuItems.accountSettings(() => handleSelfMenuAction('accountSettings')),
        MenuItems.privacy(() => handleSelfMenuAction('privacy')),
        MenuItems.notifications(() => handleSelfMenuAction('notifications')),
        createDivider(),
        MenuItems.help(() => handleSelfMenuAction('help')),
        MenuItems.feedback(() => handleSelfMenuAction('feedback')),
        createDivider(),
        MenuItems.logout(() => handleSelfMenuAction('logout')),
      ];
    }
    
    // 如果点击的是他人，显示用户操作菜单
    const targetUser = users.find(u => u.userId === userId);
    const targetMember = targetUser as unknown as { roomRole?: string };
    const isAdmin = targetMember?.roomRole === 'admin';
    const canManageAdmins = permissionChecker.canSetAdmin(user, currentRoomMember);
    
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
      MenuItems.setAdmin(
        () => handleMenuAction('setAdmin', userId),
        !canManageAdmins || isAdmin
      ),
      MenuItems.removeAdmin(
        () => handleMenuAction('removeAdmin', userId),
        !canManageAdmins || !isAdmin
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
    <>
      {contextHolder}
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
    </>
  );
};

export default UserListPanel;
