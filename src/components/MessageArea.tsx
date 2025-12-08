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
import { DEFAULT_AVATAR_URL } from '../config/constants';

interface MessageAreaProps {
  messages: Message[];
  users: User[];
  activeChatRoom: string;
  onDeleteMessage?: (roomId: string, messageId: string) => void;
  onUpdateMessage?: (roomId: string, messageId: string, text: string) => void;
  onReplyMessage?: (messageId: string) => void;
  onRemoveUser?: (userId: string) => void;
  onUpdateUserRole?: (userId: string, roomRole: 'owner' | 'admin' | 'member') => void;
  onLoadMoreMessages?: (roomId: string) => void;
  isLoadingMore?: boolean;
  hasMore?: boolean;
}

const MessageArea: React.FC<MessageAreaProps> = ({ 
  messages, 
  users, 
  activeChatRoom,
  onDeleteMessage,
  onUpdateMessage,
  onReplyMessage,
  onRemoveUser,
  onUpdateUserRole,
  onLoadMoreMessages,
  isLoadingMore = false,
  hasMore = true,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
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
  const lastScrollTopRef = useRef<number>(0);
  const isLoadingMoreRef = useRef<boolean>(false);
  const previousMessageCountRef = useRef<number>(0);
  const isInitialLoadRef = useRef<boolean>(true);
  const anchorMessageIdRef = useRef<string | null>(null);
  const shouldRestoreScrollRef = useRef<boolean>(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
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

  // 监听消息变化，智能滚动
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const messageCount = messages.length;
    const previousCount = previousMessageCountRef.current;

    // 初始加载或切换房间时滚动到底部
    if (isInitialLoadRef.current && messageCount > 0) {
      // 使用 requestAnimationFrame 确保 DOM 渲染完成
      requestAnimationFrame(() => {
        scrollToBottom();
      });
      isInitialLoadRef.current = false;
      previousMessageCountRef.current = messageCount;
      return;
    }

    // 如果需要恢复滚动位置（加载历史消息后）
    if (shouldRestoreScrollRef.current && anchorMessageIdRef.current) {
      // 使用 requestAnimationFrame 确保 DOM 已更新
      requestAnimationFrame(() => {
        const anchorElement = document.querySelector(
          `[data-message-id="${anchorMessageIdRef.current}"]`
        );
        if (anchorElement && container) {
          // 计算锚点元素距离容器顶部的距离
          const anchorTop = (anchorElement as HTMLElement).offsetTop;
          // 恢复到加载前的视觉位置
          container.scrollTop = anchorTop - 100; // 保持一些顶部边距
          
          // 恢复滚动位置后重新检查按钮显示状态
          const scrollHeight = container.scrollHeight;
          const clientHeight = container.clientHeight;
          const scrollTop = container.scrollTop;
          const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
          const lastTenMessagesHeight = 10 * 80;
          setShowScrollToBottom(distanceFromBottom > lastTenMessagesHeight);
        }
        // 重置标记
        shouldRestoreScrollRef.current = false;
        anchorMessageIdRef.current = null;
        isLoadingMoreRef.current = false;
      });
      previousMessageCountRef.current = messageCount;
      return;
    }

    // 如果正在加载更多消息（但还未完成），不做任何滚动
    if (isLoadingMoreRef.current) {
      previousMessageCountRef.current = messageCount;
      return;
    }

    // 如果消息数量增加（新消息到达）
    if (messageCount > previousCount) {
      // 检查用户是否在底部附近（容差 100px）
      const isNearBottom = 
        container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      
      // 只有在底部附近才自动滚动
      if (isNearBottom) {
        requestAnimationFrame(() => {
          scrollToBottom();
        });
      }
    }

    previousMessageCountRef.current = messageCount;
  }, [messages]);

  // 切换聊天室时重置初始加载标记
  useEffect(() => {
    isInitialLoadRef.current = true;
    previousMessageCountRef.current = 0;
  }, [activeChatRoom]);

  // 滚动事件处理 - 加载更多历史消息
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    let scrollTimer: ReturnType<typeof setTimeout>;
    const handleScroll = () => {
      // 防抖处理
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        const scrollTop = container.scrollTop;
        const scrollThreshold = 100; // 滚动阈值（像素）
        
        // 检查是否需要显示"回到底部"按钮
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        
        // 计算最后10条消息的大概高度（假设每条消息平均80px）
        const lastTenMessagesHeight = 10 * 80;
        
        // 当距离底部超过最后10条消息的高度时显示按钮
        setShowScrollToBottom(distanceFromBottom > lastTenMessagesHeight);
        
        // 检查是否接近顶部且正在向上滚动
        if (
          scrollTop < scrollThreshold &&
          scrollTop < lastScrollTopRef.current &&
          !isLoadingMoreRef.current &&
          hasMore &&
          messages.length > 0
        ) {
          console.log('[MessageArea] 触发加载更多历史消息');
          isLoadingMoreRef.current = true;
          
          // 找到当前可见的第一条消息作为锚点（大厂方案）
          const visibleMessages = Array.from(
            container.querySelectorAll('[data-message-id]')
          );
          
          // 找到第一个在视口中的消息
          let anchorMessage = null;
          for (const msg of visibleMessages) {
            const rect = msg.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            if (rect.top >= containerRect.top && rect.top <= containerRect.bottom) {
              anchorMessage = msg;
              break;
            }
          }
          
          // 如果没找到可见消息，使用第一条消息作为锚点
          if (!anchorMessage && messages.length > 0) {
            anchorMessageIdRef.current = messages[0].messageId;
          } else if (anchorMessage) {
            anchorMessageIdRef.current = anchorMessage.getAttribute('data-message-id');
          }
          
          // 标记需要恢复滚动位置
          shouldRestoreScrollRef.current = true;
          
          // 触发加载
          onLoadMoreMessages?.(activeChatRoom);
        }
        
        lastScrollTopRef.current = scrollTop;
      }, 150); // 150ms 防抖延迟
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimer);
    };
  }, [activeChatRoom, messages, hasMore, onLoadMoreMessages]);

  // 同步 isLoadingMore 状态到 ref
  useEffect(() => {
    isLoadingMoreRef.current = isLoadingMore;
  }, [isLoadingMore]);

  // 生成消息菜单项
  const generateMessageMenuItems = (messageId: string, isOwn: boolean): MenuItemType[] => {
    const message = messages.find(m => m.messageId === messageId);
    if (!message) return [];

    const items: MenuItemType[] = [];

    // 自己的消息
    if (isOwn) {
      // 撤回/删除自己的消息
      if (permissionChecker.canDeleteMessage(user, currentRoomMember, message)) {
        items.push(MenuItems.recall(() => {
          handleRecallMessage(activeChatRoom, messageId).then(() => {
            onDeleteMessage?.(activeChatRoom, messageId);
          });
          closeContextMenu();
        }));
      }
      
      // 编辑自己的消息（2分钟内）
      if (permissionChecker.canEditMessage(user, currentRoomMember, message)) {
        items.push(MenuItems.edit(() => {
          setEditingMessageId(messageId);
          setEditText(message.text);
          closeContextMenu();
        }));
      }
    } else {
      // 他人的消息 - 管理员和房主只能删除，不能编辑
      if (permissionChecker.canDeleteMessage(user, currentRoomMember, message)) {
        items.push(MenuItems.delete(() => {
          handleRecallMessage(activeChatRoom, messageId).then(() => {
            onDeleteMessage?.(activeChatRoom, messageId);
          });
          closeContextMenu();
        }));
      }
    }

    // 回复功能对所有消息可用
    items.push(MenuItems.reply(() => {
      handleReplyMessage(messageId, (id) => {
        onReplyMessage?.(id);
      });
      closeContextMenu();
    }));
    
    // 复制功能对所有消息可用
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
        closeContextMenu();
        api.info({ 
          message: '功能开发中', 
          description: '此功能正在开发中，敬请期待！', 
          duration: 2 
        });
        break;
      case 'mention':
        closeContextMenu();
        api.info({ 
          message: '功能开发中', 
          description: '此功能正在开发中，敬请期待！', 
          duration: 2 
        });
        break;
      case 'addFriend':
        closeContextMenu();
        api.info({ 
          message: '功能开发中', 
          description: '此功能正在开发中，敬请期待！', 
          duration: 2 
        });
        break;
      case 'accountSettings':
        closeContextMenu();
        api.info({ 
          message: '功能开发中', 
          description: '此功能正在开发中，敬请期待！', 
          duration: 2 
        });
        break;
      case 'privacy':
        closeContextMenu();
        api.info({ 
          message: '功能开发中', 
          description: '此功能正在开发中，敬请期待！', 
          duration: 2 
        });
        break;
      case 'notifications':
        closeContextMenu();
        api.info({ 
          message: '功能开发中', 
          description: '此功能正在开发中，敬请期待！', 
          duration: 2 
        });
        break;
      case 'help':
        closeContextMenu();
        api.info({ 
          message: '功能开发中', 
          description: '此功能正在开发中，敬请期待！', 
          duration: 2 
        });
        break;
      case 'feedback':
        closeContextMenu();
        api.info({ 
          message: '功能开发中', 
          description: '此功能正在开发中，敬请期待！', 
          duration: 2 
        });
        break;
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
        // 乐观更新：立即更新本地用户列表
        onUpdateUserRole?.(userId, 'admin');
        
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
        // 乐观更新：立即更新本地用户列表
        onUpdateUserRole?.(userId, 'member');
        
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

  // 格式化消息时间 - 智能显示
  const formatMessageTime = (isoTime: string): string => {
    if (!isoTime) return '';
    
    try {
      const date = new Date(isoTime);
      // 检查日期是否有效
      if (isNaN(date.getTime())) {
        return isoTime;
      }
      
      const now = new Date();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;
      
      // 计算日期差异（忽略具体时间，只看日期）
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const diffTime = today.getTime() - messageDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        // 今天：仅显示时间
        return timeStr;
      } else if (diffDays === 1) {
        // 昨天
        return `昨天 ${timeStr}`;
      } else if (diffDays === 2) {
        // 前天
        return `前天 ${timeStr}`;
      } else {
        // 3天前：显示日期
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        
        // 如果是今年，显示 MM-DD HH:MM
        if (date.getFullYear() === now.getFullYear()) {
          return `${month}-${day} ${timeStr}`;
        } else {
          // 如果是往年，显示 YYYY-MM-DD HH:MM
          return `${date.getFullYear()}-${month}-${day} ${timeStr}`;
        }
      }
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
        <div 
          ref={messagesContainerRef}
          className="h-full overflow-y-auto"
        >
        {/* 加载更多指示器 */}
        {isLoadingMore && (
          <div className="flex justify-center py-4">
            <div className="flex items-center space-x-2 text-gray-400">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm">加载历史消息...</span>
            </div>
          </div>
        )}
      
      {!hasMore && messages.length > 0 && (
        <div className="flex justify-center py-2">
          <span className="text-xs text-gray-500">没有更多历史消息了</span>
        </div>
      )}
      <div className="space-y-4">
        {messages.map((message, index) => {
          const isVisible = visibleMessages.has(message.messageId);
          // 获取消息发送者的头像
          const senderAvatar = message.isOwn 
            ? (user?.avatar || DEFAULT_AVATAR_URL)
            : (users.find(u => u.userId === message.userId)?.avatar || DEFAULT_AVATAR_URL);
          
          // 查找被引用的消息
          const quotedMessage = message.quotedMessageId 
            ? messages.find(m => m.messageId === message.quotedMessageId)
            : null;
          
          // 系统通知消息特殊处理
          if (message.type === 'system_notification') {
            // 判断是否显示时间：检查前一条系统消息
            let showTime = true;
            if (index > 0) {
              const prevMessage = messages[index - 1];
              if (prevMessage.type === 'system_notification') {
                // 计算时间差
                const currentTime = new Date(message.time).getTime();
                const prevTime = new Date(prevMessage.time).getTime();
                const timeDiff = Math.abs(currentTime - prevTime) / 1000 / 60; // 分钟
                
                // 如果两条系统消息间隔小于2分钟，不显示当前消息的时间
                if (timeDiff < 2) {
                  showTime = false;
                }
              }
            }
            
            return (
              <div
                key={message.messageId}
                data-message-id={message.messageId}
                className={`flex flex-col items-center ${
                  isVisible ? 'animate-fade-in' : 'opacity-0'
                }`}
                style={isVisible ? { animationDelay: '0s' } : undefined}
              >
                {showTime && (
                  <div className="text-xs text-gray-600 mb-1">
                    {formatMessageTime(message.time)}
                  </div>
                )}
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
            <div className={`flex flex-col ${message.isOwn ? 'items-end' : 'items-start'} max-w-xs md:max-w-md`}>
              {!message.isOwn && (
                <div className="text-xs text-gray-500 mb-1 whitespace-nowrap flex items-center gap-1">
                  <span>{message.userName || '匿名用户'}</span>
                  {(() => {
                    const sender = users.find(u => u.userId === message.userId);
                    if (sender?.roomRole === 'owner') {
                      return (
                        <span className="text-xs px-1  rounded bg-yellow-600/40 text-yellow-400  ">
                          群主
                        </span>
                      );
                    }
                    if (sender?.roomRole === 'admin') {
                      return (
                        <span className="text-xs px-1  rounded bg-blue-600/40 text-blue-400  ">
                          管理员
                        </span>
                      );
                    }
                    return null;
                  })()}
                  <span>{formatMessageTime(message.time)}</span>
                </div>
              )}
              <div
                className={`px-4 py-2 rounded-2xl cursor-default inline-block ${
                  message.isOwn
                    ? 'bg-gray-700 text-white rounded-tr-none'
                    : 'bg-gray-800 text-gray-300 rounded-tl-none'
                }`}
                onContextMenu={(e) => handleMessageContextMenu(e, message)}
                >
                {/* 引用的消息显示 */}
                {quotedMessage && (
                  <div className={`mb-2 pb-2 border-l-2 pl-2 text-xs ${
                    message.isOwn 
                      ? 'border-gray-500 bg-gray-600/30' 
                      : 'border-gray-600 bg-gray-700/30'
                  } rounded p-2`}>
                    <div className="text-gray-400 mb-1">
                      回复 {quotedMessage.userName || '匿名用户'}:
                    </div>
                    <div className={`${
                      message.isOwn ? 'text-gray-300' : 'text-gray-400'
                    } truncate`}>
                      {quotedMessage.text.length > 50 
                        ? `${quotedMessage.text.substring(0, 50)}...` 
                        : quotedMessage.text}
                    </div>
                  </div>
                )}
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
      </div>
      
      {/* 回到底部按钮 - 浮动在外层容器上 */}
      {showScrollToBottom && (
        <button
          onClick={() => {
            scrollToBottom();
            setShowScrollToBottom(false);
          }}
          className="absolute bottom-6 right-6 z-10 bg-gray-700 hover:bg-gray-600 text-white rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-110 group"
          title="回到底部"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" 
              clipRule="evenodd" 
            />
          </svg>
        </button>
      )}

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
      centered
      destroyOnClose
      keyboard={true}
    >
      <Input.TextArea
        value={editText}
        onChange={(e) => setEditText(e.target.value)}
        placeholder="请输入消息内容"
        autoSize={{ minRows: 3, maxRows: 8 }}
        maxLength={500}
        showCount={{
        formatter: ({ count, maxLength }) => (
          <span style={{ color: '#efefef' }}>   {/* 这里决定颜色 */}
            {count} / {maxLength}
          </span>
        ),
      }}
      />
    </Modal>
    </>
  );
};

export default MessageArea;
