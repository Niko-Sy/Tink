import React, { useRef, useEffect, useState } from 'react';
import type { User, Message } from '../types';

interface MessageAreaProps {
  messages: Message[];
  users: User[];
}

interface ContextMenu {
  x: number;
  y: number;
  type: 'message' | 'avatar' | 'ownavatar';
  messageId?: number;
  userId?: string; // 改为string类型
  isOwn?: boolean;
}

const MessageArea: React.FC<MessageAreaProps> = ({ messages, users }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);

  // 滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 监听消息变化，自动滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 关闭右键菜单
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    const handleScroll = () => setContextMenu(null);
    
    document.addEventListener('click', handleClick);
    document.addEventListener('scroll', handleScroll, true);
    
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  // 处理消息体右键菜单
  const handleMessageContextMenu = (e: React.MouseEvent, message: Message) => {
    e.preventDefault();
    const position = calculateMenuPosition(e.clientX, e.clientY, 'message');
    setContextMenu({
      x: position.x,
      y: position.y,
      type: 'message',
      messageId: message.id,
      isOwn: message.isOwn
    });
  };

  // 计算菜单位置，防止超出屏幕边界
  const calculateMenuPosition = (x: number, y: number, menuType: 'message' | 'avatar' | 'ownavatar') => {
    const menuWidth = 160;
    let menuHeight = 160; // 默认高度
    
    // 根据菜单类型计算实际高度
    if (menuType === 'message') {
      menuHeight = 180; // 消息菜单高度
    } else if (menuType === 'avatar') {
      menuHeight = 180; // 头像菜单高度
    } else if (menuType === 'ownavatar') {
      menuHeight = 320; // 自己头像菜单高度（较多项）
    }
    
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

  // 处理用户头像右键菜单
  const handleAvatarClick = (e: React.MouseEvent, userId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const position = calculateMenuPosition(e.clientX, e.clientY, 'avatar');
    setContextMenu({
      x: position.x,
      y: position.y,
      type: 'avatar',
      userId
    });
  };
  const handleAvatarOwnClick = (e: React.MouseEvent, userId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const position = calculateMenuPosition(e.clientX, e.clientY, 'ownavatar');
    setContextMenu({
      x: position.x,
      y: position.y,
      type: 'ownavatar',
      userId
    });
  }
  // 处理菜单操作
  const handleMenuAction = (action: string, data?: any) => {
    console.log(`执行操作: ${action}`, data);
    setContextMenu(null);
    // TODO: 实现具体的功能
    switch(action) {
      case 'recall':
        console.log('撤回消息:', data);
        break;
      case 'edit':
        console.log('编辑消息:', data);
        break;
      case 'reply':
        console.log('回复消息:', data);
        break;
      case 'privateMessage':
        console.log('私信用户:', data);
        break;
      case 'mention':
        console.log('艾特用户:', data);
        break;
      case 'addFriend':
        console.log('添加好友:', data);
        break;
      case 'profilePage':
        console.log('打开个人主页:', data);
        break;
      case 'accountSettings':
        console.log('打开账号设置:', data);
        break;
      case 'privacy':
        console.log('打开隐私设置:', data);
        break;
      case 'notifications':
        console.log('打开通知设置:', data);
        break;
      case 'help':
        console.log('打开帮助中心:', data);
        break;
      case 'feedback':
        console.log('打开反馈建议:', data);
        break;
      case 'report':
        console.log('举报用户:', data);
        break;
      case 'mute':
        console.log('禁言用户:', data);
        break;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-black relative">
      <div className="space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
          >
            {!message.isOwn && (
              <div 
                className="mr-3 flex-shrink-0"
                onClick={(e) => handleAvatarClick(e, message.userId)}
              >
                <img
                  src={users.find(u => u.userId === message.userId)?.avatar}
                  alt={message.userName}
                  className="w-8 h-8 rounded-full object-cover cursor-pointer"
                />
              </div>
            )}
            <div className="max-w-xs md:max-w-md">
              {!message.isOwn && (
                <div className="text-xs text-gray-500 mb-1">
                  {message.userName} {message.time}
                </div>
              )}
              <div
                className={`px-4 py-2 rounded-2xl cursor-default  ${
                  message.isOwn
                    ? 'bg-gray-700 text-white rounded-tr-none'
                    : 'bg-gray-800 text-gray-300 rounded-tl-none'
                }`}
                onContextMenu={(e) => handleMessageContextMenu(e, message)}
                >
                {message.text}
              </div>
              {message.isOwn && (
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {message.time}
                </div>
              )}
            </div>
            {message.isOwn && (
              <div 
                className="ml-3 flex-shrink-0"
                onClick={(e) => handleAvatarOwnClick(e, message.userId)}
              >
                <img
                  src={users.find(u => u.userId === message.userId)?.avatar}
                  alt={message.userName}
                  className="w-8 h-8 rounded-full object-cover cursor-pointer"
                />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 右键菜单 */}
      {contextMenu && (
        <div
          className="fixed bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-1 z-50 min-w-[160px]"
          style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'message' && (
            <>
              {contextMenu.isOwn && (
                <>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center space-x-2 bg-transparent"
                    onClick={() => handleMenuAction('recall', contextMenu.messageId)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    <span>撤回消息</span>
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center space-x-2 bg-transparent"
                    onClick={() => handleMenuAction('edit', contextMenu.messageId)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>编辑消息</span>
                  </button>
                </>
              )}
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center space-x-2 bg-transparent"
                onClick={() => handleMenuAction('reply', contextMenu.messageId)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                <span>回复消息</span>
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center space-x-2 bg-transparent"
                onClick={() => {
                  const message = messages.find(m => m.id === contextMenu.messageId);
                  if (message) {
                    navigator.clipboard.writeText(message.text);
                    console.log('已复制消息内容');
                  }
                  setContextMenu(null);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>复制文本</span>
              </button>
            </>
          )}
          
          {contextMenu.type === 'avatar' && (
            <>
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
                onClick={() => handleMenuAction('mention', contextMenu.userId)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                <span>艾特</span>
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
                onClick={() => {
                  const user = users.find(u => u.userId === contextMenu.userId);
                  if (user) {
                    console.log('查看用户信息:', user);
                  }
                  setContextMenu(null);
                }}
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
            </>
          )}

          {contextMenu.type === 'ownavatar' && (
            <>
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center space-x-2 bg-transparent"
                onClick={() => handleMenuAction('profilePage', contextMenu.userId)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>个人主页</span>
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center space-x-2 bg-transparent"
                onClick={() => handleMenuAction('accountSettings', contextMenu.userId)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>账号设置</span>
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center space-x-2 bg-transparent"
                onClick={() => handleMenuAction('privacy', contextMenu.userId)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>隐私设置</span>
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center space-x-2 bg-transparent"
                onClick={() => handleMenuAction('notifications', contextMenu.userId)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span>通知设置</span>
              </button>
              <div className="border-t border-gray-700 my-1"></div>
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center space-x-2 bg-transparent"
                onClick={() => handleMenuAction('help', contextMenu.userId)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>帮助中心</span>
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center space-x-2 bg-transparent"
                onClick={() => handleMenuAction('feedback', contextMenu.userId)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                <span>反馈建议</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageArea;
