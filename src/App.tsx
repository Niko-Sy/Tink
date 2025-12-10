
import React, { useState, useEffect } from 'react';
import { SettingOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { notification } from 'antd';
import { HOME_ROOM_ID } from './config/constants';
import logger from './utils/logger';
// import LoadingScreen from './components/LoadingScreen';
import MessageArea from './components/MessageArea';
import UserListPanel from './components/UserListPanel';
import Sidebar from './components/Sidebar';
import AddChatRoomModal from './components/AddChatRoomModal';
import ChatRoomSettingsModal from './components/ChatRoomSettingsModal';
import HomePage from './components/HomePage';
import MessageInput from './components/MessageInput';
import { useAuth } from './context/AuthContext';
import { permissionChecker } from './utils/permissions';
import { useChatRooms } from './hooks/useChatRooms';
import { useMessages } from './hooks/useMessages';
import { useRoomMembers } from './hooks/useRoomMembers';
import { useWebSocketEvents } from './hooks/useWebSocketEvents';
import { wsClient } from './services/websocket';

const App: React.FC = () => {
  const { user, currentRoomMember, setCurrentRoomMember } = useAuth();
  const [api, contextHolder] = notification.useNotification({
    placement: 'topRight',
    top: 24,
    duration: 3,
    maxCount: 3,
  });
  
  // 应用加载动画已关闭
  // const [isAppLoading, setIsAppLoading] = useState(true);
  // const [loadingProgress, setLoadingProgress] = useState(0);
  // const [loadingMessage, setLoadingMessage] = useState('正在初始化...');
  
  // 通知回调函数
  const showSuccess = (message: string, description: string | React.ReactNode, duration = 2) => {
    api.success({ message, description, duration });
  };
  
  const showError = (message: string, description: string, duration = 2) => {
    api.error({ message, description, duration });
  };
  
  const showWarning = (message: string, description: string, duration = 3) => {
    api.warning({ message, description, duration });
  };
  
  const showInfo = (message: string, description: string, duration = 2) => {
    api.info({ message, description, duration });
  };
  
  // 聊天室管理
  const {
    chatRooms,
    activeChatRoom,
    setActiveChatRoom,
    handleJoinRoom,
    handleCreateRoom,
    handleSaveSettings,
    handleDeleteRoom,
    getCurrentRoomSettings,
    updateRoomUnread,
    clearRoomUnread,
    removeRoom,
  } = useChatRooms({
    user,
    setCurrentRoomMember,
    onSuccess: showSuccess,
    onError: showError,
    onWarning: showWarning,
  });
  
  // 消息管理
  const {
    roomMessages,
    isLoadingMoreMessages,
    hasMoreMessages,
    fetchMessages,
    fetchMoreMessages,
    sendMessage,
    addMessageToRoom,
    updateMessage,
    deleteMessage,
    clearRoomCache,
  } = useMessages({
    user,
    onError: showError,
  });
  
  // 成员管理
  const {
    users,
    fetchRoomMembers,
    fetchCurrentMemberInfo,
    updateUserStatus,
    updateUserMuteStatus,
    updateUserRole,
    removeUser,
  } = useRoomMembers({
    user,
    setCurrentRoomMember,
  });
  
  // WebSocket 事件处理
  useWebSocketEvents({
    user,
    activeChatRoom,
    addMessageToRoom,
    updateMessage,
    deleteMessage,
    updateRoomUnread,
    updateUserStatus,
    updateUserMuteStatus,
    updateCurrentMemberMuteStatus: (roomId: string, isMuted: boolean, muteUntil?: string | null) => {
      // 更新当前房间成员的禁言状态
      if (currentRoomMember) {
        if (currentRoomMember.roomId === roomId) {
          const updatedMember = {
            ...currentRoomMember,
            isMuted,
            muteUntil: muteUntil || undefined, // 将 null 转换为 undefined
          };
          setCurrentRoomMember(updatedMember);
        } else {
          // 房间不匹配时，强制重新获取成员信息
          fetchCurrentMemberInfo(roomId);
        }
      } else {
        // currentRoomMember 为空时，尝试获取
        fetchCurrentMemberInfo(roomId);
      }
    },
    fetchRoomMembers,
    removeUser,
    removeRoom,
    onWarning: showWarning,
    onInfo: showInfo,
  });
  
  // 当前聊天室的消息
  const messages = roomMessages[activeChatRoom] || [];
  
  // UI 状态
  const [inputValue, setInputValue] = useState('');
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showUserPanel, setShowUserPanel] = useState(true);
  const [replyingToMessageId, setReplyingToMessageId] = useState<string | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(true);
  
  // 速率限制状态
  const [messageTimes, setMessageTimes] = useState<number[]>([]);
  
  // 禁用全局右键菜单
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // 监听加载状态,确保所有关键数据加载完成
  // useEffect(() => {
  //   if (!user) {
  //     setIsAppLoading(false);
  //     return;
  //   }
  //   let progress = 0;
  //   let message = '正在初始化...';
  //   if (wsClient.isConnected) {
  //     progress += 25;
  //     message = '正在连接服务器...';
  //   }
  //   if (chatRooms.length > 0) {
  //     progress += 25;
  //     message = '正在加载聊天室...';
  //   }
  //   if (activeChatRoom) {
  //     progress += 25;
  //     message = '正在准备聊天室...';
  //   }
  //   if (activeChatRoom === HOME_ROOM_ID || (messages.length >= 0 && users.length >= 0)) {
  //     progress += 25;
  //     message = '正在加载消息...';
  //   }
  //   setLoadingProgress(progress);
  //   setLoadingMessage(message);
  //   if (progress >= 100) {
  //     setLoadingMessage('加载完成!');
  //     const timer = setTimeout(() => {
  //       setIsAppLoading(false);
  //     }, 500);
  //     return () => clearTimeout(timer);
  //   }
  // }, [user, wsClient.isConnected, chatRooms.length, activeChatRoom, messages.length, users.length]);

  // WebSocket 连接管理
  useEffect(() => {
    logger.log('[App] WebSocket 连接管理 useEffect', { user: user?.userId, isConnected: wsClient.isConnected });
    if (user && !wsClient.isConnected) {
      logger.log('[App] 用户已登录，建立 WebSocket 连接');
      wsClient.connect();
    }

    return () => {
      // 组件卸载时断开连接
      if (wsClient.isConnected) {
        logger.log('[App] 组件卸载，断开 WebSocket 连接');
        wsClient.disconnect();
      }
    };
  }, [user]);

  // 切换聊天室时获取成员信息和消息
  useEffect(() => {
    if (activeChatRoom !== HOME_ROOM_ID) {
      logger.log('[App] 切换到聊天室:', activeChatRoom);
      fetchRoomMembers(activeChatRoom);
      fetchCurrentMemberInfo(activeChatRoom);
      // 每次切换房间时强制刷新消息历史
      clearRoomCache(activeChatRoom);
      fetchMessages(activeChatRoom, true);
      clearRoomUnread(activeChatRoom);
    }
  }, [activeChatRoom, fetchRoomMembers, fetchCurrentMemberInfo, fetchMessages, clearRoomUnread, clearRoomCache]);
  
  // 发送消息（添加权限检查）
  const handleSend = async () => {
    logger.log('[App] handleSend 被调用', { inputValue, user: user?.userId, activeChatRoom });
    
    if (inputValue.trim() === '' || !user) {
      logger.log('[App] 发送被阻止: 输入为空或用户未登录');
      return;
    }
    
    // 权限检查：是否可以发送消息
    if (!permissionChecker.canSendMessage(user, currentRoomMember)) {
      const muteReason = permissionChecker.getMuteReason(user, currentRoomMember);
      logger.log('[App] 发送被阻止: 权限检查失败', muteReason);
      showError('无法发送消息', muteReason || '你没有发送消息的权限', 3);
      return;
    }
    
    // 速率限制检查
    const now = Date.now();
    const oneSecondAgo = now - 1000;
    const oneMinuteAgo = now - 60000;
    
    // 清理1分钟之前的记录
    const recentTimes = messageTimes.filter(time => time > oneMinuteAgo);
    
    // 检查1秒内发送次数（最多2次）
    const lastSecondCount = recentTimes.filter(time => time > oneSecondAgo).length;
    if (lastSecondCount >= 2) {
      logger.log('[App] 发送被阻止: 发送过于频繁（1秒内超过2次）');
      showWarning('您说话太快了', '请稍后再试（1秒内最多发送2条消息）', 2);
      return;
    }
    
    // 检查1分钟内发送次数（最多60次）
    if (recentTimes.length >= 60) {
      logger.log('[App] 发送被阻止: 发送过于频繁（1分钟内超过60次）');
      showWarning('您说话太快了', '请稍后再试（1分钟内最多发送60条消息）', 2);
      return;
    }
    
    const messageText = inputValue.trim();
    logger.log('[App] 准备发送消息:', { messageText, activeChatRoom, replyingTo: replyingToMessageId });
    setInputValue('');
    
    try {
      await sendMessage(activeChatRoom, messageText, replyingToMessageId || undefined);
      logger.log('[App] 消息发送成功');
      
      // 更新发送时间记录
      setMessageTimes([...recentTimes, now]);
      
      setReplyingToMessageId(null); // 发送成功后清除回复状态
    } catch (err) {
      logger.error('[App] 消息发送失败:', err);
      // 发送失败，恢复输入框内容
      setInputValue(messageText);
    }
  };
  
  // 复制聊天室ID
  const copyRoomId = (roomId: string) => {
    navigator.clipboard.writeText(roomId).then(() => {
      showSuccess('复制成功', `聊天室ID ${roomId} 已复制到剪贴板`, 2);
    }).catch(err => {
      logger.error('复制失败:', err);
      showError('复制失败', '请手动复制聊天室ID', 2);
    });
  };
  
  // 添加聊天室处理函数
  const handleAddChatRoom = () => {
    setShowAddRoomModal(true);
  };

  // 处理邀请好友
  const handleInviteFriend = () => {
    logger.log('邀请好友');
    showInfo('邀请好友', '邀请好友功能开发中，敬请期待！', 2);
  };
  
  // 包装聊天室设置保存（添加权限检查）
  const handleSaveSettingsWithPermission = async (settings: Parameters<typeof handleSaveSettings>[0]) => {
    if (!permissionChecker.canEditRoomInfo(user, currentRoomMember)) {
      showError('无法保存设置', '你没有编辑聊天室信息的权限（需要管理员权限）', 3);
      return;
    }
    await handleSaveSettings(settings);
  };

  // 包装聊天室删除（添加权限检查）
  const handleDeleteRoomWithPermission = async () => {
    if (!currentRoomMember || currentRoomMember.roomRole !== 'owner') {
      showError('无法解散聊天室', '只有房主才能解散聊天室', 3);
      return;
    }
    await handleDeleteRoom();
    setShowSettingsModal(false);
  };

  return (
    <>
      {/* 应用加载动画已关闭 */}
      {/*
      {isAppLoading && (
        <LoadingScreen 
          message={`${loadingMessage} ${loadingProgress}%`}
        />
      )}
      */}
      
      <div className="flex h-screen w-screen bg-ground text-white">
        {contextHolder}
      
      {/* 调试面板 */}
      {showDebugPanel && false && (
        <div className="fixed top-2 left-1/2 transform -translate-x-1/2 z-50 bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs font-mono shadow-lg max-w-2xl">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-yellow-400">调试信息</span>
            <button 
              onClick={() => setShowDebugPanel(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1 text-gray-300">
            <div>用户ID: <span className="text-green-400">{user?.userId || '未登录'}</span></div>
            <div>当前房间: <span className="text-blue-400">{activeChatRoom}</span></div>
            <div>WebSocket状态: <span className={wsClient.isConnected ? 'text-green-400' : 'text-red-400'}>
              {wsClient.isConnected ? '已连接' : '未连接'}
            </span></div>
            <div>消息数量: <span className="text-purple-400">{messages.length}</span></div>
            <div>房间消息缓存: <span className="text-orange-400">{Object.keys(roomMessages).join(', ') || '无'}</span></div>
          </div>
        </div>
      )}
      
      {/* 左侧边栏 */}
      <Sidebar
        chatRooms={chatRooms}
        activeChatRoom={activeChatRoom}
        users={users}
        onChatRoomChange={setActiveChatRoom}
        onAddChatRoom={handleAddChatRoom}
      />

      {/* 右侧主体区域 */}
      <div className="flex flex-1 h-screen">
        {/* 中间内容区域 */}
        <div className="flex-1 flex flex-col">
          {/* 顶部信息栏 */}
          <div className="flex items-center justify-between px-6 py-3 bg-ground  border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="text-xl font-semibold">
                <i className={`${chatRooms.find(room => room.roomId === activeChatRoom)?.icon} mr-3 text-lg`}></i>
                {chatRooms.find(room => room.roomId === activeChatRoom)?.name}
              </div>
              {activeChatRoom !== HOME_ROOM_ID && (<div className="flex items-center pt-3 space-x-2 text-sm text-gray-500">
                <span>ID: {chatRooms.find(room => room.roomId === activeChatRoom)?.roomId}</span>
                <button
                  className="p-1 hover:text-gray-300 rounded transition-colors focus:outline-none bg-transparent"
                  onClick={() => {
                    const roomId = chatRooms.find(room => room.roomId === activeChatRoom)?.roomId;
                    if (roomId) copyRoomId(roomId);
                  }}
                  title="复制聊天室ID"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>)}
            </div>
            
            {/* 右侧操作按钮组 */}
            <div className="flex items-center space-x-2">
              {activeChatRoom !== HOME_ROOM_ID && permissionChecker.canEditRoomInfo(user, currentRoomMember) && (
                <button
                  className="p-1 hover:bg-gray-800 rounded-lg transition-colors focus:outline-none bg-transparent text-gray-400 hover:text-white"
                  onClick={() => setShowSettingsModal(true)}
                  title="聊天室设置"
                >
                  <SettingOutlined className="text-lg" />
              </button>)}
              <button
                className="p-1 hover:bg-gray-800 rounded-lg transition-colors focus:outline-none bg-transparent text-gray-400 hover:text-white"
                onClick={() => setShowUserPanel(!showUserPanel)}
                title={showUserPanel ? '收起用户列表' : '展开用户列表'}
              >
                {showUserPanel ? (
                  <MenuUnfoldOutlined className="text-lg" />
                ) : (
                  <MenuFoldOutlined className="text-lg" />
                )}
              </button>
            </div>
          </div>
          
          {/* 主体内容区 */}
          <div className="flex flex-1 overflow-hidden">
            {/* 根据当前聊天室显示不同内容 */}
            {activeChatRoom === HOME_ROOM_ID ? (
              /* 主页显示 */
              <HomePage
                onCreateRoom={() => {
                  setShowAddRoomModal(true);
                  // 在弹窗中默认选择"创建"标签
                }}
                onJoinRoom={() => {
                  setShowAddRoomModal(true);
                  // 在弹窗中默认选择"加入"标签
                }}
                onInviteFriend={handleInviteFriend}
              />
            ) : (
              /* 消息记录区域 */
              <div className="flex-1 flex flex-col">
                {/* 消息展示区 */}
                <MessageArea 
                  messages={messages} 
                  users={users}
                  activeChatRoom={activeChatRoom}
                  onDeleteMessage={deleteMessage}
                  onUpdateMessage={updateMessage}
                  onReplyMessage={(messageId) => {
                    setReplyingToMessageId(messageId);
                    // 聚焦到输入框
                    document.querySelector<HTMLInputElement>('input[type="text"]')?.focus();
                  }}
                  onMentionUser={(userName) => {
                    setInputValue(`@${userName} `);
                    // 聚焦到输入框
                    document.querySelector<HTMLInputElement>('input[type="text"]')?.focus();
                  }}
                  onRemoveUser={removeUser}
                  onUpdateUserRole={updateUserRole}
                  onLoadMoreMessages={fetchMoreMessages}
                  isLoadingMore={isLoadingMoreMessages}
                  hasMore={hasMoreMessages[activeChatRoom] ?? true}
                />
              {/* 输入控制区 */}
              <MessageInput
                inputValue={inputValue}
                onInputChange={setInputValue}
                onSend={handleSend}
                users={users}
                currentUserId={user?.userId}
                messages={messages}
                canSendMessage={permissionChecker.canSendMessage(user, currentRoomMember)}
                muteReason={permissionChecker.getMuteReason(user, currentRoomMember)}
                replyingToMessageId={replyingToMessageId}
                onCancelReply={() => setReplyingToMessageId(null)}
              />
            </div>
            )}
          </div>
        </div>
        
        {/* 右侧用户列表面板（带过渡动画容器） */}
        <div
          className={`flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${showUserPanel ? 'w-60 opacity-100' : 'w-0 opacity-0 pointer-events-none'}`}
          aria-hidden={!showUserPanel}
        >
          <UserListPanel 
            users={users} 
            onRemoveUser={removeUser}
            onUpdateUserRole={updateUserRole}
          />
        </div>
      </div>

      {/* 添加聊天室弹窗 */}
      <AddChatRoomModal
        isOpen={showAddRoomModal}
        onClose={() => setShowAddRoomModal(false)}
        onJoinRoom={handleJoinRoom}
        onCreateRoom={handleCreateRoom}
      />
      
      {/* 聊天室设置弹窗 */}
      <ChatRoomSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onSave={handleSaveSettingsWithPermission}
        onDelete={handleDeleteRoomWithPermission}
        currentSettings={getCurrentRoomSettings()}
        canDelete={currentRoomMember?.roomRole === 'owner'}
      />
      </div>
    </>
  );
};

export default App;