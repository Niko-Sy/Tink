import React, { useState, useEffect } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { User, ChatRoom } from '../types';
import logo from '../assets/Tink_white.svg';

interface SidebarProps {
  chatRooms: ChatRoom[];
  activeChatRoom: number;
  users: User[];
  onChatRoomChange: (roomId: number) => void;
  onAddChatRoom: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  chatRooms,
  activeChatRoom,
  users,
  onChatRoomChange,
  onAddChatRoom
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isRoomListCollapsed, setIsRoomListCollapsed] = useState(false);
  const [showText, setShowText] = useState(true); // 控制文字显示

  // 点击外部关闭用户菜单
  useEffect(() => {
    const handleClick = () => setShowUserMenu(false);
    
    if (showUserMenu) {
      document.addEventListener('click', handleClick);
    }
    
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [showUserMenu]);

  // 处理菜单操作
  const handleMenuAction = (action: string) => {
    console.log(`执行操作: ${action}`);
    setShowUserMenu(false);
    // TODO: 实现具体的功能
    switch(action) {
      case 'profilePage':
        console.log('打开个人主页');
        navigate('/profile');
        break;
      case 'accountSettings':
        console.log('打开账号设置');
        break;
      case 'privacy':
        console.log('打开隐私设置');
        break;
      case 'notifications':
        console.log('打开通知设置');
        break;
      case 'help':
        console.log('打开帮助中心');
        break;
      case 'feedback':
        console.log('打开反馈建议');
        break;
      case 'logout':
        console.log('退出登录');
        logout();
        navigate('/login');
        break;
    }
  };

  // 复制用户ID到剪贴板
  const handleCopyUserId = async () => {
    const userId = user?.userId || 'U123456789';
    try {
      await navigator.clipboard.writeText(userId);
      console.log('用户ID已复制:', userId);
      // TODO: 可以添加一个提示通知
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  // 切换聊天室列表收缩状态
  const toggleRoomListCollapse = () => {
    if (isRoomListCollapsed) {
      // 展开:先展开宽度,300ms后显示文字
      setIsRoomListCollapsed(false);
      setTimeout(() => {
        setShowText(true);
      }, 300);
    } else {
      // 收缩:先隐藏文字,然后收缩宽度
      setShowText(false);
      setTimeout(() => {
        setIsRoomListCollapsed(true);
      }, 0);
    }
  };

  return (
    <div className="flex flex-col h-screen border-r border-gray-800">
      {/* 品牌标识 - 横跨两列 */}
      <div className={`flex items-center pl-8 pr-5 pb-1 pt-3 bg-gray-900 border-b border-gray-800 transition-all duration-300 ${
        isRoomListCollapsed ? 'w-auto' : ''
      }`}>
        <div className="w-16 h-16 bg-transparent rounded-btn flex items-center justify-center mr-3">
          {/* <span className="font-bold">{user?.username.charAt(0).toUpperCase()}</span> */}
          <img 
              src={logo}
              alt="User Avatar" 
              className="w-full h-full object-cover"
          />
        </div>
        {!isRoomListCollapsed && showText && (
          <div className='mx-4'>
            <div className="font-bold text-logo">Tink</div>
            <div className="text-xs text-gray-500">ChatRoom</div>
          </div>
        )}
      </div>

      {/* 下方两列区域 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧列 - 用户头像和图标 */}
        <div className="w-16 bg-gray-950 flex flex-col items-center border-r border-gray-800">
          {/* 用户头像和信息 */}
          <div className="p-3 border-gray-800 w-full flex justify-center mt-4">
            <div className="relative">
              <div 
                className="w-10 h-10 rounded-full overflow-hidden cursor-pointer border-2 border-gray-700 hover:border-gray-500 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUserMenu(!showUserMenu);
                }}
              >
                <img 
                  src={user?.avatar || users.find(u => u.userId === 'U123456789')?.avatar || 'https://ai-public.mastergo.com/ai/img_res/3b71fa6479b687f7aac043084415c2d8.jpg'} 
                  alt="User Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
              {showUserMenu && (
                <div 
                  className="absolute left-16 top-0 mt-0 min-w-[160px] bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 py-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center space-x-2 bg-transparent"
                    onClick={() => handleMenuAction('profilePage')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>个人主页</span>
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center space-x-2 bg-transparent"
                    onClick={() => handleMenuAction('accountSettings')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>账号设置</span>
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center space-x-2 bg-transparent"
                    onClick={() => handleMenuAction('privacy')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>隐私设置</span>
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center space-x-2 bg-transparent"
                    onClick={() => handleMenuAction('notifications')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span>通知设置</span>
                  </button>
                  <div className="border-t border-gray-700 my-1"></div>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center space-x-2 bg-transparent"
                    onClick={() => handleMenuAction('help')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>帮助中心</span>
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center space-x-2 bg-transparent"
                    onClick={() => handleMenuAction('feedback')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    <span>反馈建议</span>
                  </button>
                  <div className="border-t border-gray-700 my-1"></div>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors flex items-center space-x-2 bg-transparent"
                    onClick={() => handleMenuAction('logout')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>退出登录</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* 填充空间 */}
          <div className="flex-1"></div>
          
          {/* 外观设置按钮 */}
          <div className="p-3 border-gray-800 w-full flex justify-center mb-2">
            <button
              className="w-12 h-12 rounded-full flex items-center p-2 text-gray-500 hover:text-gray-300 bg-transparent transition-colors border-0 focus:outline-none justify-center cursor-pointer"
              onClick={() => {
                console.log('打开外观设置');
                // TODO: 实现外观设置功能
              }}
              title="外观设置"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* 右侧列 - 聊天室列表 */}
        <div className={`bg-gray-900 flex flex-col transition-all duration-300 ${
          isRoomListCollapsed ? 'w-16' : 'w-56'
        }`}>
          {/* 用户信息区域 - 固定在顶部 */}
          <div className="h-16 bg-gray-900 border-0 border-gray-700 pt-3 pl-6 pr-2">
            <div className={`flex items-center  ${isRoomListCollapsed ? 'justify-center' : 'justify-between'}`}>
              {!isRoomListCollapsed && showText && (
                <div className="flex-1 min-w-0 mr-2">
                  <div className="text-name  text-white truncate">
                    {user?.username || '张伟'} 
                    <span className="text-xs text-gray-300 ml-1">的聊天室</span>
                  </div>
                </div>
              )}
              <button
                onClick={toggleRoomListCollapse}
                className={` p-1 hover:bg-gray-800 rounded transition-colors flex-shrink-0 bg-transparent border-0 focus:outline-none ${isRoomListCollapsed ? 'mr-4' : 'ml-auto mr-1'} focus:text-white`}
                title={isRoomListCollapsed ? "展开" : "收起"}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${
                    isRoomListCollapsed ? 'rotate-180' : ''
                  }`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            </div>
            {!isRoomListCollapsed && showText && (
              <div className="flex items-center text-xs text-gray-400 pl-0.5">
                <span className="truncate mr-2">
                  ID: {user?.userId || 'U123456789'}
                </span>
                <button
                  onClick={handleCopyUserId}
                  className="p-1 hover:bg-gray-700 rounded transition-colors flex-shrink-0 bg-transparent border-0 focus:outline-none"
                  title="复制ID"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* 聊天室列表 */}
          <div className="flex-1 overflow-y-auto py-2 mt-0">
            {chatRooms.map(room => (
              <div
                key={room.id}
                className={` flex items-center px-3 py-3 mx-2.5 my-1.5 cursor-pointer transition-colors rounded-list ${
                  activeChatRoom === room.id
                    ? 'bg-gray-700 text-white'
                    : 'hover:bg-gray-800 text-gray-400'
                }`}
                onClick={() => onChatRoomChange(room.id)}
                title={isRoomListCollapsed ? room.name : ''}
              >
                <i className={`${room.icon} ${isRoomListCollapsed ? 'text-xl' : 'mr-3 text-xl'}`}></i>
                {!isRoomListCollapsed && showText && (
                  <>
                    <span className="flex-1 text-sm">{room.name}</span>
                    {room.unread > 0 && (
                      <span className="bg-gray-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {room.unread}
                      </span>
                    )}
                  </>
                )}
                {/* {isRoomListCollapsed && room.unread > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )} */}
              </div>
            ))}
          </div>
          
          {/* 添加按钮 */}
          <div className={`py-4 px-3 border-t border-gray-800 mb-2 `}>
            <button
              className={`w-full h-10 flex items-center justify-center py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-btn transition-colors focus:outline-none ${
                isRoomListCollapsed ? 'px-0' : ''
              }`}
              onClick={onAddChatRoom}
              title={isRoomListCollapsed ? '添加聊天室' : ''}
            >
              <PlusOutlined className={isRoomListCollapsed ? '' : ''} />
              {!isRoomListCollapsed && showText && <span>添加聊天室</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
