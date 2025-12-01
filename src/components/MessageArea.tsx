import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Input, notification } from 'antd';
import type { User, Message } from '../types';
import { useAuth } from '../context/AuthContext';
import { permissionChecker } from '../utils/permissions';
import { useContextMenu } from '../hooks/useContextMenu';
import { useMessageActions } from '../hooks/useMessageActions';
import ContextMenu from './ContextMenu';
import { MenuItems, createDivider } from '../utils/menuItems';
import type { MenuItemType } from './ContextMenu';
import { memberService } from '../services/member';
import MuteMemberModal from './MuteMemberModal';

interface MessageAreaProps {
  messages: Message[];
  users: User[];
  activeChatRoom: string;
  onDeleteMessage?: (roomId: string, messageId: string) => void;
  onUpdateMessage?: (roomId: string, messageId: string, text: string) => void;
  onReplyMessage?: (messageId: string) => void;
  onRemoveUser?: (userId: string) => void;
}

const MessageArea: React.FC<MessageAreaProps> = ({ 
  messages, 
  users, 
  activeChatRoom,
  onDeleteMessage,
  onUpdateMessage,
  onReplyMessage,
  onRemoveUser,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { contextMenu, openContextMenu, closeContextMenu } = useContextMenu();
  const { user, currentRoomMember } = useAuth();
  const navigate = useNavigate();
  const [visibleMessages, setVisibleMessages] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showMuteModal, setShowMuteModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [api, contextHolder] = notification.useNotification({
    placement: 'topRight',
    top: 24,
    duration: 2,
  });
  
  // 消息操作hook
  const {
    handleRecallMessage,
    handleEditMessage,
    handleCopyMessage,
    handleReplyMessage,
  } = useMessageActions({
    user,
    onSuccess: (message, description, duration) => {
      api.success({ message, description, duration });
    },
    onError: (message, description, duration) => {
      api.error({ message, description, duration });
    },
  });

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
        items.push(MenuItems.recall(() => {
          handleRecallMessage(activeChatRoom, messageId).then(() => {
            onDeleteMessage?.(activeChatRoom, messageId);
          });
          closeContextMenu();
        }));
      }
      if (permissionChecker.canEditMessage(user, currentRoomMember, message)) {
        items.push(MenuItems.edit(() => {
          setEditingMessageId(messageId);
          setEditText(message.text);
          closeContextMenu();
        }));
      }
    } else {
      // 管理员可以编辑/删除他人消息
      if (permissionChecker.canEditMessage(user, currentRoomMember, message)) {
        items.push(MenuItems.adminEdit(() => {
          setEditingMessageId(messageId);
          setEditText(message.text);
          closeContextMenu();
        }));
      }
      if (permissionChecker.canDeleteMessage(user, currentRoomMember, message)) {
        items.push(MenuItems.delete(() => {
          handleRecallMessage(activeChatRoom, messageId).then(() => {
            onDeleteMessage?.(activeChatRoom, messageId);
          });
          closeContextMenu();
        }));
      }
    }

    items.push(MenuItems.reply(() => {
      handleReplyMessage(messageId, (id) => {
        onReplyMessage?.(id);
      });
      closeContextMenu();
    }));
    items.push(MenuItems.copy(() => {
      handleCopyMessage(message.text);
      closeContextMenu();
    }));

    return items;
  };

  // 生成用户头像菜单项（其他用户）
  const generateAvatarMenuItems = (userId: string): MenuItemType[] => {
    const targetUser = users.find(u => u.userId === userId);
    if (!targetUser) return [];
    
    // 直接从 targetUser 中获取成员信息
    const isAdmin = targetUser.roomRole === 'admin' || targetUser.roomRole === 'owner';
    const isOwner = targetUser.roomRole === 'owner';
    const isMuted = targetUser.isMuted || false;
    const canManageAdmins = permissionChecker.canSetAdmin(user, currentRoomMember);
    const canMute = permissionChecker.canMuteMember(user, currentRoomMember);
    
    const menuItems: MenuItemType[] = [
      MenuItems.privateMessage(() => handleMenuAction('privateMessage', userId)),
      MenuItems.mention(() => handleMenuAction('mention', userId)),
      MenuItems.addFriend(() => handleMenuAction('addFriend', userId)),
      MenuItems.viewProfile(() => {
        if (targetUser) {
          console.log('查看用户信息:', targetUser);
        }
        closeContextMenu();
      }),
      createDivider(),
      MenuItems.report(() => handleMenuAction('report', userId)),
    ];
    
    // 根据禁言状态显示禁言或解除禁言
    if (isMuted) {
      menuItems.push(
        MenuItems.unmute(
          () => handleMenuAction('unmute', userId),
          !canMute
        )
      );
    } else {
      menuItems.push(
        MenuItems.mute(
          () => handleMenuAction('mute', userId),
          !canMute
        )
      );
    }
    
    menuItems.push(
      MenuItems.kick(
        () => handleMenuAction('kick', userId),
        !permissionChecker.canRemoveMember(user, currentRoomMember)
      )
    );
    
    // 根据管理员状态显示设置或取消管理员（房主不显示）
    if (!isOwner) {
      if (isAdmin) {
        menuItems.push(
          MenuItems.removeAdmin(
            () => handleMenuAction('removeAdmin', userId),
            !canManageAdmins
          )
        );
      } else {
        menuItems.push(
          MenuItems.setAdmin(
            () => handleMenuAction('setAdmin', userId),
            !canManageAdmins
          )
        );
      }
    }
    
    return menuItems;
  };

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
  // 处理菜单操作（保留未实现的功能）
  const handleMenuAction = async (action: string, data?: any) => {
    console.log(`执行操作: ${action}`, data);
    
    switch(action) {
      case 'profilePage':
        closeContextMenu();
        navigate('/profile');
        break;
      case 'mute':
        // 打开禁言弹窗
        const targetUser = users.find(u => u.userId === data);
        setSelectedUserId(data);
        setSelectedUserName(targetUser?.name || '未知用户');
        setShowMuteModal(true);
        closeContextMenu();
        break;
      case 'unmute':
        closeContextMenu();
        await handleUnmuteMember(data);
        break;
      case 'setAdmin':
        closeContextMenu();
        await handleSetAdmin(data);
        break;
      case 'removeAdmin':
        closeContextMenu();
        await handleRemoveAdmin(data);
        break;
      case 'privateMessage':
      case 'mention':
      case 'addFriend':
      case 'accountSettings':
      case 'privacy':
      case 'notifications':
      case 'help':
      case 'feedback':
      case 'kick':
        closeContextMenu();
        await handleKickMember(data);
        break;
      case 'report':
        closeContextMenu();
        api.info({ 
          message: '功能开发中', 
          description: '此功能正在开发中，敬请期待！', 
          duration: 2 
        });
        break;
      default:
        closeContextMenu();
    }
  };
  
  // 确认编辑消息
  const handleConfirmEdit = async () => {
    if (!editingMessageId || !editText.trim()) return;
    
    await handleEditMessage(activeChatRoom, editingMessageId, editText);
    onUpdateMessage?.(activeChatRoom, editingMessageId, editText);
    setEditingMessageId(null);
    setEditText('');
  };

  // 禁言用户（从弹窗确认）
  const handleMuteConfirm = async (duration: number, reason?: string) => {
    if (!currentRoomMember?.roomId || !selectedUserId) return;
    
    const targetUser = users.find(u => u.userId === selectedUserId);
    if (!targetUser) {
      api.error({
        message: '操作失败',
        description: '未找到目标用户',
      });
      return;
    }
    
    try {
      const memberInfoResponse = await memberService.getMemberInfo(
        currentRoomMember.roomId,
        selectedUserId
      );
      
      if (memberInfoResponse.code !== 200 || !memberInfoResponse.data) {
        api.error({
          message: '获取用户信息失败',
          description: memberInfoResponse.message || '无法获取成员信息',
        });
        return;
      }
      
      const response = await memberService.muteMember(
        currentRoomMember.roomId,
        {
          memberid: memberInfoResponse.data.memberId,
          duration,
          reason,
        }
      );
      
      if (response.code === 200) {
        const durationText = duration === 0 ? '永久' : 
          duration < 60 ? `${duration}分钟` :
          duration < 1440 ? `${Math.floor(duration / 60)}小时` :
          `${Math.floor(duration / 1440)}天`;
        
        api.success({
          message: '禁言成功',
          description: `已禁言 ${targetUser.name} ${durationText}`,
        });
      } else {
        api.error({
          message: '禁言失败',
          description: response.message || '禁言操作失败',
        });
      }
    } catch (err) {
      console.error('禁言用户失败:', err);
      api.error({
        message: '禁言失败',
        description: '网络错误，请稍后重试',
      });
    }
  };

  // 踢出成员
  const handleKickMember = async (userId: string) => {
    if (!currentRoomMember?.roomId) return;
    
    const targetUser = users.find(u => u.userId === userId);
    if (!targetUser) {
      api.error({
        message: '操作失败',
        description: '未找到目标用户',
      });
      return;
    }
    
    try {
      // 获取目标用户的成员信息
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
      
      // 执行踢出
      const response = await memberService.kickMember(
        currentRoomMember.roomId,
        {
          memberid: memberInfoResponse.data.memberId,
          reason: '违反聊天室规则',
        }
      );
      
      if (response.code === 200) {
        // 乐观更新：立即从用户列表中移除
        onRemoveUser?.(userId);
        
        api.success({
          message: '踢出成功',
          description: `已将 ${targetUser.name} 移出聊天室`,
        });
      } else {
        api.error({
          message: '踢出失败',
          description: response.message || '踢出操作失败',
        });
      }
    } catch (err) {
      console.error('踢出成员失败:', err);
      api.error({
        message: '踢出失败',
        description: '网络错误，请稍后重试',
      });
    }
  };

  // 解除禁言
  const handleUnmuteMember = async (userId: string) => {
    if (!currentRoomMember?.roomId) return;
    
    const targetUser = users.find(u => u.userId === userId);
    if (!targetUser) {
      api.error({
        message: '操作失败',
        description: '未找到目标用户',
      });
      return;
    }
    
    try {
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
      
      const response = await memberService.unmuteMember(
        currentRoomMember.roomId,
        { memberid: memberInfoResponse.data.memberId }
      );
      
      if (response.code === 200) {
        api.success({
          message: '解除禁言成功',
          description: `已解除 ${targetUser.name} 的禁言`,
        });
      } else {
        api.error({
          message: '解除禁言失败',
          description: response.message || '解除禁言操作失败',
        });
      }
    } catch (err) {
      console.error('解除禁言失败:', err);
      api.error({
        message: '解除禁言失败',
        description: '网络错误，请稍后重试',
      });
    }
  };

  // 设置为管理员
  const handleSetAdmin = async (userId: string) => {
    if (!currentRoomMember?.roomId) return;
    
    const targetUser = users.find(u => u.userId === userId);
    if (!targetUser) {
      api.error({
        message: '操作失败',
        description: '未找到目标用户',
      });
      return;
    }
    
    try {
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
    
    const targetUser = users.find(u => u.userId === userId);
    if (!targetUser) {
      api.error({
        message: '操作失败',
        description: '未找到目标用户',
      });
      return;
    }
    
    try {
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

  // 格式化消息时间为 HH:MM
  const formatMessageTime = (isoTime: string): string => {
    if (!isoTime) return '';
    
    try {
      const date = new Date(isoTime);
      // 检查日期是否有效
      if (isNaN(date.getTime())) {
        return isoTime;
      }
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch (error) {
      return isoTime;
    }
  };

  return (
    <>
      {contextHolder}
      
      {/* 禁言弹窗 */}
      <MuteMemberModal
        isOpen={showMuteModal}
        userName={selectedUserName}
        onClose={() => {
          setShowMuteModal(false);
          setSelectedUserId(null);
          setSelectedUserName('');
        }}
        onConfirm={handleMuteConfirm}
      />
      
      <div className="flex-1 overflow-y-auto p-6 bg-ground relative">
      <div className="space-y-4">
        {messages.map((message) => {
          const isVisible = visibleMessages.has(message.messageId);
          // 获取消息发送者的头像
          const senderAvatar = message.isOwn 
            ? (user?.avatar || 'https://ai-public.mastergo.com/ai/img_res/3b71fa6479b687f7aac043084415c2d8.jpg')
            : (users.find(u => u.userId === message.userId)?.avatar || 'https://ai-public.mastergo.com/ai/img_res/3b71fa6479b687f7aac043084415c2d8.jpg');
          
          // 系统通知消息特殊处理
          if (message.type === 'system_notification') {
            return (
              <div
                key={message.messageId}
                data-message-id={message.messageId}
                className={`flex justify-center ${
                  isVisible ? 'animate-fade-in' : 'opacity-0'
                }`}
                style={isVisible ? { animationDelay: '0s' } : undefined}
              >
                <div className="px-3 py-1 rounded-full bg-gray-800/50 text-gray-400 text-xs">
                  {message.text}
                </div>
              </div>
            );
          }
          
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
                  {message.userName || '匿名用户'} {formatMessageTime(message.time)}
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
                  {formatMessageTime(message.time)}
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
    
    {/* 编辑消息对话框 */}
    <Modal
      title="编辑消息"
      open={editingMessageId !== null}
      onOk={handleConfirmEdit}
      onCancel={() => {
        setEditingMessageId(null);
        setEditText('');
      }}
      okText="确定"
      cancelText="取消"
      maskClosable={false}
    >
      <Input.TextArea
        value={editText}
        onChange={(e) => setEditText(e.target.value)}
        placeholder="请输入消息内容"
        autoSize={{ minRows: 3, maxRows: 8 }}
        maxLength={500}
        showCount
      />
    </Modal>
    </>
  );
};

export default MessageArea;
