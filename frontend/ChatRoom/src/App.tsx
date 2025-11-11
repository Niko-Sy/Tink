
import React, { useState, useEffect } from 'react';
import { SendOutlined, SmileOutlined, SettingOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { notification } from 'antd';
import MessageArea from './components/MessageArea';
import UserListPanel from './components/UserListPanel';
import Sidebar from './components/Sidebar';
import AddChatRoomModal from './components/AddChatRoomModal';
import ChatRoomSettingsModal from './components/ChatRoomSettingsModal';
import HomePage from './components/HomePage';
import type { ChatRoomSettings } from './components/ChatRoomSettingsModal';
import type { User, Message, ChatRoom } from './types';
import { useAuth } from './context/AuthContext';
// import { useNavigate } from 'react-router-dom';

const App: React.FC = () => {
  const { user } = useAuth();
  // const navigate = useNavigate();
  const [api, contextHolder] = notification.useNotification({
    placement: 'topRight',
    top: 24,
    duration: 3,
    maxCount: 3,
  });
  
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

  // 聊天室数据
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([
    { id: 1, name: '主页', icon: 'fas fa-home', unread: 0, roomId: '100000001' },
    { id: 2, name: '综合文字', icon: 'fas fa-comments', unread: 12, roomId: '100000002' },
  ]);
  
  // 用户列表
  const [users] = useState<User[]>([
    { userId: 'U123456789', name: '张伟', status: 'online', avatar: 'https://ai-public.mastergo.com/ai/img_res/3b71fa6479b687f7aac043084415c2d8.jpg' },
    { userId: 'U123456790', name: '李娜', status: 'online', avatar: 'https://ai-public.mastergo.com/ai/img_res/945a373ac8cba538922e3056a3952a11.jpg' },
    { userId: 'U123456791', name: '王强', status: 'away', avatar: 'https://ai-public.mastergo.com/ai/img_res/7adaab35c68fc4617a58a8f92fab236e.jpg' },
    { userId: 'U123456792', name: '陈丽', status: 'offline', avatar: 'https://ai-public.mastergo.com/ai/img_res/5859f4b402a6ff0d8bea996cd06fdc92.jpg' },
    { userId: 'U123456793', name: '刘洋', status: 'online', avatar: 'https://ai-public.mastergo.com/ai/img_res/5c984aeccb5ac5c312115f2fd5156392.jpg' },
    { userId: 'U123456794', name: '赵敏', status: 'online', avatar: 'https://ai-public.mastergo.com/ai/img_res/7a980361c3d1da375258bf634ee252e2.jpg' },
    { userId: 'U123456795', name: '孙浩', status: 'offline', avatar: 'https://ai-public.mastergo.com/ai/img_res/32fc8c243d88ae9356b7c163b7a074fb.jpg' },
    { userId: 'U123456796', name: '周婷', status: 'online', avatar: 'https://ai-public.mastergo.com/ai/img_res/a6c192a6ab8c78559ecbcfa7450ea237.jpg' },
  ]);
  
  // 消息记录
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, userId: 'U123456790', userName: '李娜', text: '大家好，欢迎来到综合文字聊天室！', time: '14:30', isOwn: false },
    { id: 2, userId: 'U123456789', userName: '张伟', text: '你好李娜，很高兴加入这个聊天室', time: '14:32', isOwn: true },
    { id: 3, userId: 'U123456791', userName: '王强', text: '今天天气不错，适合聊天', time: '14:35', isOwn: false },
    { id: 4, userId: 'U123456792', userName: '陈丽', text: '确实，阳光明媚的好心情', time: '14:36', isOwn: false },
    { id: 5, userId: 'U123456789', userName: '张伟', text: '有什么好的话题推荐吗？', time: '14:40', isOwn: true },
    { id: 6, userId: 'U123456793', userName: '刘洋', text: '最近有什么好看的电影吗？', time: '14:42', isOwn: false },
    { id: 7, userId: 'U123456794', userName: '赵敏', text: '我推荐《星际穿越》，科幻迷必看', time: '14:45', isOwn: false },
    { id: 8, userId: 'U123456789', userName: '张伟', text: '谢谢推荐，周末去看看', time: '14:47', isOwn: true },
  ]);
  
  // 当前选中的聊天室
  const [activeChatRoom, setActiveChatRoom] = useState(2);
  
  // 输入框内容
  const [inputValue, setInputValue] = useState('');
  
  // 表情面板显示状态
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  
  // 添加聊天室弹窗显示状态
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  
  // 聊天室设置弹窗显示状态
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // 右侧边栏显示状态
  const [showUserPanel, setShowUserPanel] = useState(true);
  
  // 发送消息
  const handleSend = () => {
    if (inputValue.trim() !== '') {
      const newMessage = {
        id: messages.length + 1,
        userId: user?.userId || "U123456789",
        userName: user?.username || '张伟',
        text: inputValue,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: true
      };
      setMessages([...messages, newMessage]);
      setInputValue('');
      setShowEmojiPanel(false);
    }
  };
  
  // 添加表情到输入框
  const addEmoji = (emoji: string) => {
    setInputValue(prev => prev + emoji);
  };
  
  // 复制聊天室ID
  const copyRoomId = (roomId: string) => {
    navigator.clipboard.writeText(roomId).then(() => {
      api.success({
        message: '复制成功',
        description: `聊天室ID ${roomId} 已复制到剪贴板`,
        duration: 2,
      });
    }).catch(err => {
      console.error('复制失败:', err);
      api.error({
        message: '复制失败',
        description: '请手动复制聊天室ID',
        duration: 2,
      });
    });
  };
  
  // 添加聊天室处理函数
  const handleAddChatRoom = () => {
    setShowAddRoomModal(true);
  };

  // 处理加入聊天室
  const handleJoinRoom = (roomId: string, password: string) => {
    // TODO: 调用后端API验证并加入聊天室
    console.log('加入聊天室:', roomId, password);
    
    // 验证聊天室ID格式（9位数字）
    if (!/^\d{9}$/.test(roomId)) {
      api.error({
        message: '加入失败',
        description: '聊天室ID必须是9位数字！',
        duration: 2,
      });
      return;
    }
    
    // 模拟加入成功
    const newRoom = {
      id: chatRooms.length + 1,
      name: `聊天室-${roomId.slice(-4)}`,
      icon: 'fas fa-comments',
      unread: 0,
      roomId: roomId
    };
    
    setChatRooms([...chatRooms, newRoom]);
    api.success({
      message: '成功加入聊天室',
      description: `已加入聊天室 ${newRoom.name}`,
      duration: 2,
    });
  };

  // 处理创建聊天室
  const handleCreateRoom = (name: string, description: string, password: string) => {
    // TODO: 调用后端API创建聊天室
    console.log('创建聊天室:', name, description, password);
    
    // 生成9位数字的聊天室ID
    const newRoomId = Math.floor(100000000 + Math.random() * 900000000).toString();
    
    const newRoom = {
      id: chatRooms.length + 1,
      name: name,
      icon: 'fas fa-comments',
      unread: 0,
      roomId: newRoomId
    };
    
    setChatRooms([...chatRooms, newRoom]);
    
    // 复制ID到剪贴板
    navigator.clipboard.writeText(newRoomId).then(() => {
      api.success({
        message: '聊天室创建成功',
        description: (
          <div>
            <p>聊天室ID: <strong>{newRoomId}</strong></p>
            <p className="text-xs text-gray-400 mt-1">✓ ID已复制到剪贴板，请妥善保管密码</p>
          </div>
        ),
        duration: 4,
      });
    }).catch(() => {
      api.success({
        message: '聊天室创建成功',
        description: (
          <div>
            <p>聊天室ID: <strong>{newRoomId}</strong></p>
            <p className="text-xs text-yellow-400 mt-1">⚠ 请手动复制聊天室ID</p>
          </div>
        ),
        duration: 4,
      });
    });
  };

  // 处理聊天室设置保存
  const handleSaveSettings = (settings: ChatRoomSettings) => {
    // TODO: 调用后端API保存聊天室设置
    console.log('保存聊天室设置:', settings);
    
    // 更新当前聊天室信息
    setChatRooms(chatRooms.map(room => 
      room.id === activeChatRoom 
        ? { ...room, name: settings.name, icon: settings.icon }
        : room
    ));
    
    api.success({
      message: '✓ 设置保存成功',
      description: '聊天室信息已更新',
      duration: 2,
    });
  };

  // 获取当前聊天室设置
  const getCurrentRoomSettings = (): ChatRoomSettings => {
    const currentRoom = chatRooms.find(room => room.id === activeChatRoom);
    return {
      name: currentRoom?.name || '',
      description: '这是一个很棒的聊天室', // TODO: 从后端获取
      icon: currentRoom?.icon || 'fas fa-comments',
      type: 'public', // TODO: 从后端获取
      password: '', // TODO: 从后端获取
    };
  };

  // 处理邀请好友
  const handleInviteFriend = () => {
    // TODO: 实现邀请好友功能
    console.log('邀请好友');
    api.info({
      message: '邀请好友',
      description: '邀请好友功能开发中，敬请期待！',
      duration: 2,
    });
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
    <div className="flex h-screen w-screen bg-black text-white">
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
          <div className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="text-xl font-semibold">
                <i className={`${chatRooms.find(room => room.id === activeChatRoom)?.icon} mr-3 text-lg`}></i>
                {chatRooms.find(room => room.id === activeChatRoom)?.name}
              </div>
              <div className="flex items-center pt-3 space-x-2 text-sm text-gray-500">
                <span>ID: {chatRooms.find(room => room.id === activeChatRoom)?.roomId}</span>
                <button
                  className="p-1 hover:bg-gray-800 rounded transition-colors focus:outline-none bg-transparent"
                  onClick={() => {
                    const roomId = chatRooms.find(room => room.id === activeChatRoom)?.roomId;
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
              <button
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors focus:outline-none bg-transparent text-gray-400 hover:text-white"
                onClick={() => setShowSettingsModal(true)}
                title="聊天室设置"
              >
                <SettingOutlined className="text-lg" />
              </button>
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
            {activeChatRoom === 1 ? (
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
              <div className="border-t border-gray-800 bg-gray-900 p-4">
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
                      placeholder="输入消息..."
                      className="w-full bg-gray-800 text-white rounded-full py-3 px-4 focus:outline-none focus:ring-2 focus:ring-gray-600"
                    />
                  </div>
                  <button
                    className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full transition-colors rounded-button whitespace-nowrap focus:outline-none align-center flex items-center justify-center"
                    onClick={handleSend}
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
          className={`flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${showUserPanel ? 'w-64 opacity-100' : 'w-0 opacity-0 pointer-events-none'}`}
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
        onSave={handleSaveSettings}
        currentSettings={getCurrentRoomSettings()}
      />
    </div>
  );
};

export default App;