import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeftOutlined, 
  EditOutlined, 
  SaveOutlined, 
  CloseOutlined,
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  SmileOutlined,
  CameraOutlined
} from '@ant-design/icons';

interface UserProfile {
  userId: string;
  username: string;
  password: string;
  nickname: string;
  phone: string;
  email: string;
  avatar: string;
  signature: string;
  onlineStatus: 'online' | 'away' | 'busy' | 'offline';
  accountStatus: 'active' | 'inactive' | 'suspended';
  role: 'admin' | 'moderator' | 'user';
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // 模拟用户数据（实际应该从后端获取）
  const [profile, setProfile] = useState<UserProfile>({
    userId: user?.userId || 'U' + Math.random().toString().slice(2, 11),
    username: user?.username || '张伟',
    password: '******',
    nickname: user?.nickname || user?.username || '张伟',
    phone: user?.phone || '138****8888',
    email: user?.email || 'zhangwei@example.com',
    avatar: user?.avatar || 'https://ai-public.mastergo.com/ai/img_res/3b71fa6479b687f7aac043084415c2d8.jpg',
    signature: user?.signature || '这个人很懒，什么都没有留下~',
    onlineStatus: user?.onlineStatus || 'online',
    accountStatus: user?.accountStatus || 'active',
    role: user?.role || 'user'
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);
  const [showPasswordEdit, setShowPasswordEdit] = useState(false);

  // 状态选项
  const onlineStatusOptions = [
    { value: 'online', label: '在线', color: 'bg-green-500' },
    { value: 'away', label: '离开', color: 'bg-yellow-500' },
    { value: 'busy', label: '忙碌', color: 'bg-red-500' },
    { value: 'offline', label: '离线', color: 'bg-gray-500' }
  ];

  const accountStatusOptions = [
    { value: 'active', label: '正常', color: 'text-green-400' },
    { value: 'inactive', label: '未激活', color: 'text-yellow-400' },
    { value: 'suspended', label: '已封禁', color: 'text-red-400' }
  ];

  const roleOptions = [
    { value: 'admin', label: '管理员', color: 'text-purple-400' },
    { value: 'moderator', label: '版主', color: 'text-blue-400' },
    { value: 'user', label: '普通用户', color: 'text-gray-400' }
  ];

  // 处理编辑
  const handleEdit = () => {
    setIsEditing(true);
    setEditedProfile(profile);
  };

  // 处理保存
  const handleSave = () => {
    setProfile(editedProfile);
    setIsEditing(false);
    setShowPasswordEdit(false);
    // TODO: 调用后端API保存数据
    console.log('保存用户资料:', editedProfile);
  };

  // 处理取消
  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
    setShowPasswordEdit(false);
  };

  // 处理输入变化
  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 处理头像上传
  const handleAvatarUpload = () => {
    // TODO: 实现头像上传功能
    console.log('上传头像');
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* 顶部导航栏 */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors focus:outline-none bg-transparent border-0 justify-center"
            >
              <ArrowLeftOutlined className="text-xl" />
            </button>
            <h1 className="text-2xl font-bold">个人主页</h1>
          </div>
          
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors focus:outline-none"
            >
              <EditOutlined />
              <span>编辑资料</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors focus:outline-none"
              >
                <SaveOutlined />
                <span>保存</span>
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors focus:outline-none"
              >
                <CloseOutlined />
                <span>取消</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 主体内容 */}
      <div className="max-w-6xl mx-auto py-8 px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧 - 头像和基本信息 */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              {/* 头像 */}
              <div className="relative w-48 h-48 mx-auto mb-6">
                {!isEditing && (<img
                  src={isEditing ? editedProfile.avatar : profile.avatar}
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover border-4 border-gray-700"
                />)}
                {isEditing && (
                  <button
                    onClick={handleAvatarUpload}
                    className="w-full h-full p-3 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors focus:outline-none"
                    title="更换头像"
                  >
                    <CameraOutlined className="text-max" />
                  </button>
                )}
                
                {/* 在线状态指示器 */}
                <div className={`absolute bottom-6 right-6 w-8 h-8 rounded-full border-4 border-gray-800 ${
                  onlineStatusOptions.find(opt => opt.value === profile.onlineStatus)?.color
                }`}></div>
              </div>

              {/* 用户名和昵称 */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">{profile.nickname}</h2>
                <p className="text-gray-400">@{profile.username}</p>
                <p className="text-sm text-gray-500 mt-1">ID: {profile.userId}</p>
              </div>

              {/* 个性签名 */}
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="flex items-center text-gray-400 mb-2">
                  <SmileOutlined className="mr-2" />
                  <span className="text-sm">个性签名</span>
                </div>
                {isEditing ? (
                  <textarea
                    value={editedProfile.signature}
                    onChange={(e) => handleInputChange('signature', e.target.value)}
                    className="w-full bg-gray-800 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                    placeholder="写点什么吧..."
                  />
                ) : (
                  <p className="text-gray-300 text-sm italic">{profile.signature}</p>
                )}
              </div>

              {/* 系统角色 */}
              <div className="mt-4 text-center">
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                  roleOptions.find(opt => opt.value === profile.role)?.color
                } bg-gray-900`}>
                  {roleOptions.find(opt => opt.value === profile.role)?.label}
                </span>
              </div>
            </div>
          </div>

          {/* 右侧 - 详细信息 */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold mb-6">账号信息</h3>
              
              <div className="space-y-6">
                {/* 用户编号 */}
                <div className="grid grid-cols-3 gap-4 items-center">
                  <label className="text-gray-400 flex items-center">
                    <IdcardOutlined className="mr-2" />
                    用户编号
                  </label>
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={profile.userId}
                      disabled
                      className="w-full bg-gray-700 text-gray-500 rounded-lg py-3 px-4 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* 用户名 */}
                <div className="grid grid-cols-3 gap-4 items-center">
                  <label className="text-gray-400 flex items-center">
                    <UserOutlined className="mr-2" />
                    用户名
                  </label>
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={isEditing ? editedProfile.username : profile.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      disabled={!isEditing}
                      className={`w-full rounded-lg py-3 px-4 focus:outline-none ${
                        isEditing 
                          ? 'bg-gray-700 text-white focus:ring-2 focus:ring-blue-500' 
                          : 'bg-gray-900 text-gray-400 cursor-not-allowed'
                      }`}
                    />
                  </div>
                </div>

                {/* 昵称 */}
                <div className="grid grid-cols-3 gap-4 items-center">
                  <label className="text-gray-400 flex items-center">
                    <UserOutlined className="mr-2" />
                    昵称
                  </label>
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={isEditing ? editedProfile.nickname : profile.nickname}
                      onChange={(e) => handleInputChange('nickname', e.target.value)}
                      disabled={!isEditing}
                      className={`w-full rounded-lg py-3 px-4 focus:outline-none ${
                        isEditing 
                          ? 'bg-gray-700 text-white focus:ring-2 focus:ring-blue-500' 
                          : 'bg-gray-900 text-gray-400 cursor-not-allowed'
                      }`}
                    />
                  </div>
                </div>

                {/* 登录密码 */}
                <div className="grid grid-cols-3 gap-4 items-center">
                  <label className="text-gray-400 flex items-center">
                    <LockOutlined className="mr-2" />
                    登录密码
                  </label>
                  <div className="col-span-2">
                    {!showPasswordEdit ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="password"
                          value={profile.password}
                          disabled
                          className="flex-1 bg-gray-900 text-gray-400 rounded-lg py-3 px-4 cursor-not-allowed"
                        />
                        {isEditing && (
                          <button
                            onClick={() => setShowPasswordEdit(true)}
                            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors focus:outline-none"
                          >
                            修改
                          </button>
                        )}
                      </div>
                    ) : (
                      <input
                        type="password"
                        placeholder="输入新密码"
                        className="w-full bg-gray-700 text-white rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>
                </div>

                {/* 手机号 */}
                <div className="grid grid-cols-3 gap-4 items-center">
                  <label className="text-gray-400 flex items-center">
                    <PhoneOutlined className="mr-2" />
                    手机号
                  </label>
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={isEditing ? editedProfile.phone : profile.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                      className={`w-full rounded-lg py-3 px-4 focus:outline-none ${
                        isEditing 
                          ? 'bg-gray-700 text-white focus:ring-2 focus:ring-blue-500' 
                          : 'bg-gray-900 text-gray-400 cursor-not-allowed'
                      }`}
                    />
                  </div>
                </div>

                {/* 电子邮箱 */}
                <div className="grid grid-cols-3 gap-4 items-center">
                  <label className="text-gray-400 flex items-center">
                    <MailOutlined className="mr-2" />
                    电子邮箱
                  </label>
                  <div className="col-span-2">
                    <input
                      type="email"
                      value={isEditing ? editedProfile.email : profile.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!isEditing}
                      className={`w-full rounded-lg py-3 px-4 focus:outline-none ${
                        isEditing 
                          ? 'bg-gray-700 text-white focus:ring-2 focus:ring-blue-500' 
                          : 'bg-gray-900 text-gray-400 cursor-not-allowed'
                      }`}
                    />
                  </div>
                </div>

                {/* 在线状态 */}
                <div className="grid grid-cols-3 gap-4 items-center">
                  <label className="text-gray-400">在线状态</label>
                  <div className="col-span-2">
                    {isEditing ? (
                      <select
                        value={editedProfile.onlineStatus}
                        onChange={(e) => handleInputChange('onlineStatus', e.target.value)}
                        className="w-full bg-gray-700 text-white rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {onlineStatusOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center space-x-3 bg-gray-900 rounded-lg py-3 px-4">
                        <div className={`w-3 h-3 rounded-full ${
                          onlineStatusOptions.find(opt => opt.value === profile.onlineStatus)?.color
                        }`}></div>
                        <span className="text-gray-300">
                          {onlineStatusOptions.find(opt => opt.value === profile.onlineStatus)?.label}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 账号状态 */}
                <div className="grid grid-cols-3 gap-4 items-center">
                  <label className="text-gray-400">账号状态</label>
                  <div className="col-span-2">
                    <div className="bg-gray-900 rounded-lg py-3 px-4">
                      <span className={`font-semibold ${
                        accountStatusOptions.find(opt => opt.value === profile.accountStatus)?.color
                      }`}>
                        {accountStatusOptions.find(opt => opt.value === profile.accountStatus)?.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 系统角色 */}
                <div className="grid grid-cols-3 gap-4 items-center">
                  <label className="text-gray-400">系统角色</label>
                  <div className="col-span-2">
                    <div className="bg-gray-900 rounded-lg py-3 px-4">
                      <span className={`font-semibold ${
                        roleOptions.find(opt => opt.value === profile.role)?.color
                      }`}>
                        {roleOptions.find(opt => opt.value === profile.role)?.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
