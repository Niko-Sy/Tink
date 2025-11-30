import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User, Message } from '../types';
import { useAuth } from '../context/AuthContext';
import { permissionChecker } from '../utils/permissions';
import { useContextMenu } from '../hooks/useContextMenu';
import ContextMenu from './ContextMenu';
import { MenuItems, createDivider } from '../utils/menuItems';
import type { MenuItemType } from './ContextMenu';

interface MessageAreaProps {
  messages: Message[];
  users: User[];
}

const MessageArea: React.FC<MessageAreaProps> = ({ messages, users }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { contextMenu, openContextMenu, closeContextMenu } = useContextMenu();
  const { user, currentRoomMember } = useAuth();
  const navigate = useNavigate();
  const [visibleMessages, setVisibleMessages] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  // 设置 Intersection Observer
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const messageId = entry.target.getAttribute('data-message-id');
          if (messageId) {
            setVisibleMessages((prev) => {
              const newSet = new Set(prev);
              if (entry.isIntersecting) {
                newSet.add(messageId);
              } else {
                newSet.delete(messageId);
              }
              return newSet;
            });
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // 观察消息元素
  useEffect(() => {
    const messageElements = document.querySelectorAll('[data-message-id]');
    messageElements.forEach((element) => {
      if (observerRef.current) {
        observerRef.current.observe(element);
      }
    });

    return () => {
      if (observerRef.current) {
        messageElements.forEach((element) => {
          observerRef.current?.unobserve(element);
        });
      }
    };
  }, [messages]);

  // 滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 监听消息变化，自动滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 生成消息菜单项
  const generateMessageMenuItems = (messageId: string, isOwn: boolean): MenuItemType[] => {
    const message = messages.find(m => m.messageId === messageId);
    if (!message) return [];

    const items: MenuItemType[] = [];

    // 自己的消息
    if (isOwn) {
      if (permissionChecker.canDeleteMessage(user, currentRoomMember, message)) {
        items.push(MenuItems.recall(() => handleMenuAction('recall', messageId)));
      }
      if (permissionChecker.canEditMessage(user, currentRoomMember, message)) {
        items.push(MenuItems.edit(() => handleMenuAction('edit', messageId)));
      }
    } else {
      // 管理员可以编辑/删除他人消息
      if (permissionChecker.canEditMessage(user, currentRoomMember, message)) {
        items.push(MenuItems.adminEdit(() => handleMenuAction('edit', messageId)));
      }
      if (permissionChecker.canDeleteMessage(user, currentRoomMember, message)) {
        items.push(MenuItems.delete(() => handleMenuAction('delete', messageId)));
      }
    }

    items.push(MenuItems.reply(() => handleMenuAction('reply', messageId)));
    items.push(MenuItems.copy(() => {
      navigator.clipboard.writeText(message.text);
      console.log('已复制消息内容');
      closeContextMenu();
    }));

    return items;
  };

  // 生成用户头像菜单项（其他用户）
  const generateAvatarMenuItems = (userId: string): MenuItemType[] => [
    MenuItems.privateMessage(() => handleMenuAction('privateMessage', userId)),
    MenuItems.mention(() => handleMenuAction('mention', userId)),
    MenuItems.addFriend(() => handleMenuAction('addFriend', userId)),
    MenuItems.viewProfile(() => {
      const targetUser = users.find(u => u.userId === userId);
      if (targetUser) {
        console.log('查看用户信息:', targetUser);
      }
      closeContextMenu();
    }),
    createDivider(),
    MenuItems.report(() => handleMenuAction('report', userId)),
    MenuItems.mute(
      () => handleMenuAction('mute', userId),
      !permissionChecker.canMuteMember(user, currentRoomMember)
    ),
  ];

  // 生成自己头像菜单项
  const generateOwnAvatarMenuItems = (): MenuItemType[] => [
    MenuItems.profilePage(() => handleMenuAction('profilePage')),
    MenuItems.accountSettings(() => handleMenuAction('accountSettings')),
    MenuItems.privacy(() => handleMenuAction('privacy')),
    MenuItems.notifications(() => handleMenuAction('notifications')),
    createDivider(),
    MenuItems.help(() => handleMenuAction('help')),
    MenuItems.feedback(() => handleMenuAction('feedback')),
  ];

  // 处理消息体右键菜单
  const handleMessageContextMenu = (e: React.MouseEvent, message: Message) => {
    e.preventDefault();
    openContextMenu(e.clientX, e.clientY, {
      type: 'message',
      messageId: message.messageId,
      isOwn: message.isOwn
    });
  };

  // 处理用户头像点击（其他用户）
  const handleAvatarClick = (e: React.MouseEvent, userId: string) => {
    e.preventDefault();
    e.stopPropagation();
    openContextMenu(e.clientX, e.clientY, {
      type: 'avatar',
      userId
    });
  };

  // 处理自己头像点击
  const handleAvatarOwnClick = (e: React.MouseEvent, userId: string) => {
    e.preventDefault();
    e.stopPropagation();
    openContextMenu(e.clientX, e.clientY, {
      type: 'ownavatar',
      userId
    });
  };
  // 处理菜单操作
  const handleMenuAction = (action: string, data?: any) => {
    console.log(`执行操作: ${action}`, data);
    closeContextMenu();
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
        navigate('/profile');
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
    <div className="flex-1 overflow-y-auto p-6 bg-ground relative">
      <div className="space-y-4">
        {messages.map((message) => {
          const isVisible = visibleMessages.has(message.messageId);
          // 获取消息发送者的头像
          const senderAvatar = message.isOwn 
            ? (user?.avatar || 'https://ai-public.mastergo.com/ai/img_res/3b71fa6479b687f7aac043084415c2d8.jpg')
            : (users.find(u => u.userId === message.userId)?.avatar || 'https://ai-public.mastergo.com/ai/img_res/3b71fa6479b687f7aac043084415c2d8.jpg');
          
          return (
            <div
              key={message.messageId}
              data-message-id={message.messageId}
              className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'} ${
                isVisible
                  ? message.isOwn
                    ? 'animate-message-right'
                    : 'animate-message-left'
                  : 'opacity-0'
              }`}
              style={isVisible ? { animationDelay: '0s' } : undefined}
            >
            {!message.isOwn && (
              <div 
                className="mr-3 flex-shrink-0"
                onClick={(e) => handleAvatarClick(e, message.userId)}
              >
                <img
                  src={senderAvatar}
                  alt={message.userName || '匿名用户'}
                  className="w-8 h-8 rounded-full object-cover cursor-pointer"
                />
              </div>
            )}
            <div className="max-w-xs md:max-w-md">
              {!message.isOwn && (
                <div className="text-xs text-gray-500 mb-1">
                  {message.userName || '匿名用户'} {message.time}
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
                  src={senderAvatar}
                  alt={message.userName}
                  className="w-8 h-8 rounded-full object-cover cursor-pointer"
                />
              </div>
            )}
          </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 右键菜单 */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={
            contextMenu.data.type === 'message'
              ? generateMessageMenuItems(
                  contextMenu.data.messageId!,
                  contextMenu.data.isOwn!
                )
              : contextMenu.data.type === 'avatar'
              ? generateAvatarMenuItems(contextMenu.data.userId!)
              : generateOwnAvatarMenuItems()
          }
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
};

export default MessageArea;
