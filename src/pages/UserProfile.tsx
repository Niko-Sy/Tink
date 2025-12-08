import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { notification, Spin } from 'antd';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/user';
import { DEFAULT_AVATAR_URL } from '../config/constants';
import {
  ArrowLeftOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  UserOutlined,
  LockOutlined,
  IdcardOutlined,
  SmileOutlined,
  CameraOutlined,
} from '@ant-design/icons';

interface UserProfile {
  userId: string;
  password: string;
  nickname: string;
  avatar: string;
  signature: string;
  onlineStatus: 'online' | 'away' | 'busy' | 'offline';
  accountStatus: 'active' | 'inactive' | 'suspended';
  role: 'admin' | 'moderator' | 'user';
}

interface UserProfilePageProps {
  viewMode?: 'self' | 'other'; // self: 可编辑自己的资料, other: 只读查看他人资料
}

const UserProfilePage: React.FC<UserProfilePageProps> = ({ viewMode = 'self' }) => {
  const navigate = useNavigate();
  const { userId: urlUserId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const [api, contextHolder] = notification.useNotification({
    placement: 'topRight',
    top: 24,
    duration: 3,
  });
  
  // 判断是查看自己还是他人
  const isSelf = viewMode === 'self' || !urlUserId;
  const [loading, setLoading] = useState(!isSelf); // 查看他人时需要加载数据
  
  // 模拟用户数据（实际应该从后端获取）
  const [profile, setProfile] = useState<UserProfile>({
    userId: urlUserId || 'U' + Math.random().toString().slice(2, 11),
    password: '******',
    nickname: isSelf ? (user?.username || '张伟') : '李娜',
    avatar: DEFAULT_AVATAR_URL,
    signature: isSelf ? '这个人很懒，什么都没有留下~' : '热爱生活，享受每一天！',
    onlineStatus: 'online',
    accountStatus: 'active',
    role: 'user'
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);
  const [showPasswordEdit, setShowPasswordEdit] = useState(false);

  // 根据 URL 参数加载用户数据
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (urlUserId && !isSelf) {
        setLoading(true);
        try {
          const response = await userService.getUserById(urlUserId);
          if (response.code === 200 && response.data) {
            const userData = response.data;
            // 将API返回的User数据转换为UserProfile格式
            setProfile({
              userId: userData.userId,
              password: '******', // 不显示密码
              nickname: userData.nickname || userData.name,
              avatar: userData.avatar || DEFAULT_AVATAR_URL,
              signature: userData.signature || '这个人很懒，什么都没有留下~',
              onlineStatus: userData.onlineStatus || (userData.status as 'online' | 'away' | 'busy' | 'offline') || 'offline',
              accountStatus: userData.accountStatus || 'active',
              role: userData.systemRole === 'super_admin' ? 'admin' : 'user',
            });
          } else {
            api.error({
              message: '获取用户信息失败',
              description: response.message || '无法加载用户资料',
            });
            // 加载失败后返回上一页
            setTimeout(() => navigate(-1), 1500);
          }
        } catch (err) {
          console.error('获取用户资料失败:', err);
          api.error({
            message: '加载失败',
            description: '网络错误，请稍后重试',
          });
          setTimeout(() => navigate(-1), 1500);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchUserProfile();
  }, [urlUserId, isSelf, navigate, api]);

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
      {contextHolder}
      {loading ? (
        <div className="flex items-center justify-center h-screen">
          <Spin size="large" tip="加载用户资料中..." />
        </div>
      ) : (
      <>
      {/* 顶部导航栏 */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors focus:outline-none bg-transparent border-0 justify-center"
            >
              <ArrowLeftOutlined className="text-xl" />
            </button>
            <h1 className="text-2xl font-bold">
              {isSelf ? '个人主页' : `${profile.nickname}的主页`}
            </h1>
          </div>
          
          {/* 只有查看自己时才显示编辑按钮 */}
          {isSelf && !isEditing && (
            <button
              onClick={handleEdit}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors focus:outline-none"
            >
              <EditOutlined />
              <span>编辑资料</span>
            </button>
          )}
          
          {isSelf && isEditing && (
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
      <div className="max-w-6xl mx-auto py-8 px-6 h-[calc(100vh-88px)] overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧 - 头像和基本信息 */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              {/* 头像 */}
              <div className="relative w-48 h-48 mx-auto mb-6">
                {(!isEditing || !isSelf) && (
                  <img
                    src={profile.avatar || DEFAULT_AVATAR_URL}
                    alt="Avatar"
                    className="w-full h-full rounded-full bg-gray-700 object-cover border-4 border-gray-500"
                  />
                )}
                {isEditing && isSelf && (
                  <button
                    onClick={handleAvatarUpload}
                    className="w-full h-full p-3 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors focus:outline-none flex items-center justify-center"
                    title="更换头像"
                  >
                    <CameraOutlined className="text-6xl" />
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
                <p className="text-sm text-gray-500 mt-1">ID: {profile.userId}</p>
              </div>

              {/* 个性签名 */}
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="flex items-center text-gray-400 mb-2">
                  <SmileOutlined className="mr-2" />
                  <span className="text-sm">个性签名</span>
                </div>
                {isEditing && isSelf ? (
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
                      disabled={!isEditing || !isSelf}
                      className={`w-full rounded-lg py-3 px-4 focus:outline-none ${
                        isEditing && isSelf
                          ? 'bg-gray-700 text-white focus:ring-2 focus:ring-blue-500' 
                          : 'bg-gray-900 text-gray-400 cursor-not-allowed'
                      }`}
                    />
                  </div>
                </div>

                {/* 登录密码 - 只有查看自己时显示 */}
                {isSelf && (
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
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors focus:outline-none"
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
                )}

               

                {/* 在线状态 */}
                <div className="grid grid-cols-3 gap-4 items-center">
                  <label className="text-gray-400">在线状态</label>
                  <div className="col-span-2">
                    {isEditing && isSelf ? (
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
      </>
      )}
    </div>
  );
};

export default UserProfilePage;
