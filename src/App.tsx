
import React, { useState, useEffect } from 'react';
import { SendOutlined, SmileOutlined, SettingOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { notification } from 'antd';
import MessageArea from './components/MessageArea';
import UserListPanel from './components/UserListPanel';
import Sidebar from './components/Sidebar';
import AddChatRoomModal from './components/AddChatRoomModal';
import ChatRoomSettingsModal from './components/ChatRoomSettingsModal';
import HomePage from './components/HomePage';
import { useAuth } from './context/AuthContext';
import { permissionChecker } from './utils/permissions';
import { useChatRooms } from './hooks/useChatRooms';
import { useMessages } from './hooks/useMessages';
import { useRoomMembers } from './hooks/useRoomMembers';
import { useWebSocketEvents } from './hooks/useWebSocketEvents';

const App: React.FC = () => {
  const { user, currentRoomMember, setCurrentRoomMember } = useAuth();
  const [api, contextHolder] = notification.useNotification({
    placement: 'topRight',
    top: 24,
    duration: 3,
    maxCount: 3,
  });
  
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
    fetchMessages,
    sendMessage,
    addMessageToRoom,
    updateMessage,
    deleteMessage,
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
    fetchRoomMembers,
    removeUser,
    removeRoom,
    onWarning: showWarning,
  });
  
  // 当前聊天室的消息
  const messages = roomMessages[activeChatRoom] || [];
  
  // UI 状态
  const [inputValue, setInputValue] = useState('');
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showUserPanel, setShowUserPanel] = useState(true);
  
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

  // 切换聊天室时获取成员信息和消息
  useEffect(() => {
    if (activeChatRoom !== '100000001') {
      fetchRoomMembers(activeChatRoom);
      fetchCurrentMemberInfo(activeChatRoom);
      fetchMessages(activeChatRoom);
      clearRoomUnread(activeChatRoom);
    }
  }, [activeChatRoom, fetchRoomMembers, fetchCurrentMemberInfo, fetchMessages, clearRoomUnread]);
  
  // 发送消息（添加权限检查）
  const handleSend = async () => {
    if (inputValue.trim() === '' || !user) return;
    
    // 权限检查：是否可以发送消息
    if (!permissionChecker.canSendMessage(user, currentRoomMember)) {
      const muteReason = permissionChecker.getMuteReason(user, currentRoomMember);
      showError('无法发送消息', muteReason || '你没有发送消息的权限', 3);
      return;
    }
    
    const messageText = inputValue.trim();
    setInputValue('');
    setShowEmojiPanel(false);
    
    try {
      await sendMessage(activeChatRoom, messageText);
    } catch (err) {
      // 发送失败，恢复输入框内容
      setInputValue(messageText);
    }
  };
  
  // 添加表情到输入框
  const addEmoji = (emoji: string) => {
    setInputValue(prev => prev + emoji);
  };
  
  // 复制聊天室ID
  const copyRoomId = (roomId: string) => {
    navigator.clipboard.writeText(roomId).then(() => {
      showSuccess('复制成功', `聊天室ID ${roomId} 已复制到剪贴板`, 2);
    }).catch(err => {
      console.error('复制失败:', err);
      showError('复制失败', '请手动复制聊天室ID', 2);
    });
  };
  
  // 添加聊天室处理函数
  const handleAddChatRoom = () => {
    setShowAddRoomModal(true);
  };

  // 处理邀请好友
  const handleInviteFriend = () => {
    console.log('邀请好友');
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

  // 表情数据
  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙃', '😉', '😊',
    '😇', '🥰', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪',
    '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏',
    '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '🤒', '🤕',
    '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓',
    '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧',
    '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫',
    '🥱', '😤', '😡', '😠', '🤬', '👍', '👏', '🙌', '👐', '🤲', '🤝',
    '🙏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👋',
    '🤚', '🖐', '✋', '🖖', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕',
    '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉', '☸️',
    '✨', '⭐', '🌟', '⚡', '💥', '💦', '💨', '🌈', '☀️', '⛅',
    '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '🏀', '🏈',
    '💯', '💢', '💬', '💭', '🗯', '💤', '💮', '♨️', '💈', '🛑', '⚠️', '🚸'
  ];
  
  return (
    <div className="flex h-screen w-screen bg-ground text-white">
      {contextHolder}
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
              <div className="flex items-center pt-3 space-x-2 text-sm text-gray-500">
                <span>ID: {chatRooms.find(room => room.roomId === activeChatRoom)?.roomId}</span>
                <button
                  className="p-1 hover:bg-gray-800 rounded transition-colors focus:outline-none bg-transparent"
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
              </div>
            </div>
            
            {/* 右侧操作按钮组 */}
            <div className="flex items-center space-x-2">
              {activeChatRoom !== '100000001' && permissionChecker.canEditRoomInfo(user, currentRoomMember) && (
                <button
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors focus:outline-none bg-transparent text-gray-400 hover:text-white"
                  onClick={() => setShowSettingsModal(true)}
                  title="聊天室设置"
                >
                  <SettingOutlined className="text-lg" />
              </button>)}
              <button
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors focus:outline-none bg-transparent text-gray-400 hover:text-white"
                onClick={() => setShowUserPanel(!showUserPanel)}
                title={showUserPanel ? '收起用户列表' : '展开用户列表'}
              >
                {showUserPanel ? (
                  <MenuFoldOutlined className="text-lg" />
                ) : (
                  <MenuUnfoldOutlined className="text-lg" />
                )}
              </button>
            </div>
          </div>
          
          {/* 主体内容区 */}
          <div className="flex flex-1 overflow-hidden">
            {/* 根据当前聊天室显示不同内容 */}
            {activeChatRoom === '100000001' ? (
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
                <MessageArea messages={messages} users={users} />
            
              {/* 输入控制区 */}
              <div className=" border-gray-800 bg-ground p-4">
                {/* 禁言提示 */}
                {!permissionChecker.canSendMessage(user, currentRoomMember) && (
                  <div className="mb-3 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg text-yellow-400 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {permissionChecker.getMuteReason(user, currentRoomMember) || '你没有发送消息的权限'}
                  </div>
                )}

                {/* 表情面板 */}
                {showEmojiPanel && (
                  <div className="mb-3 p-3 bg-gray-800 rounded-lg">
                    <div className="h-24 overflow-y-auto">
                      <div className="grid grid-cols-12 gap-2">
                        {emojis.map((emoji, index) => (
                          <button
                            key={index}
                            className="text-2xl p-1 hover:bg-gray-700 rounded transition-colors bg-transparent focus:outline-none"
                            onClick={() => addEmoji(emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 输入框和按钮 */}
                <div className="flex items-center space-x-2">
                  <button
                    className="p-2 text-gray-500 hover:text-gray-300 bg-transparent transition-colors border-0 focus:outline-none"
                    onClick={() => setShowEmojiPanel(!showEmojiPanel)}
                  >
                    <SmileOutlined className="text-xl" />
                  </button>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder={
                        !permissionChecker.canSendMessage(user, currentRoomMember)
                          ? "你已被禁言，无法发送消息"
                          : "输入消息..."
                      }
                      disabled={!permissionChecker.canSendMessage(user, currentRoomMember)}
                      className={`w-full bg-gray-800 text-white rounded-full py-3 px-4 focus:outline-none focus:ring-2 focus:ring-gray-600 ${
                        !permissionChecker.canSendMessage(user, currentRoomMember) 
                          ? 'opacity-50 cursor-not-allowed' 
                          : ''
                      }`}
                    />
                  </div>
                  <button
                    className={`w-12 h-12 text-white p-3 rounded-full transition-colors rounded-button whitespace-nowrap focus:outline-none align-center flex items-center justify-center ${
                      !permissionChecker.canSendMessage(user, currentRoomMember)
                        ? 'bg-gray-600 cursor-not-allowed opacity-50'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    onClick={handleSend}
                    disabled={!permissionChecker.canSendMessage(user, currentRoomMember)}
                  >
                    <SendOutlined />
                  </button>
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
        
        {/* 右侧用户列表面板（带过渡动画容器） */}
        <div
          className={`flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${showUserPanel ? 'w-60 opacity-100' : 'w-0 opacity-0 pointer-events-none'}`}
          aria-hidden={!showUserPanel}
        >
          <UserListPanel users={users} />
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
  );
};

export default App;