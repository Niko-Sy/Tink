import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_AVATAR_URL } from '../config/constants';
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
  CameraOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { notification } from 'antd';
import { 
  userService, 
  authService,
  type UpdateUserProfileRequest,
  type ChangePasswordRequest,
  type ApiError 
} from '../services';

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
  systemRole: 'super_admin' | 'user';
  globalMuteStatus?: 'muted' | 'unmuted';
  globalMuteEndTime?: string;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshUserInfo } = useAuth();
  const [api, notificationContextHolder] = notification.useNotification();
  
  // 用户数据
  const [profile, setProfile] = useState<UserProfile>({
    userId: user?.userId || '',
    username: user?.username || '',
    password: '******',
    nickname: user?.nickname || user?.username || '',
    phone: user?.phone || '',
    email: user?.email || '',
    avatar: user?.avatar || DEFAULT_AVATAR_URL,
    signature: user?.signature || '这个人很懒，什么都没有留下~',
    onlineStatus: user?.onlineStatus || 'online',
    accountStatus: user?.accountStatus || 'active',
    systemRole: user?.systemRole || 'user',
    globalMuteStatus: user?.globalMuteStatus || 'unmuted',
    globalMuteEndTime: user?.globalMuteEndTime
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);
  const [showPasswordEdit, setShowPasswordEdit] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 同步 user 变化到 profile
  useEffect(() => {
    if (user) {
      setProfile({
        userId: user.userId || '',
        username: user.username || '',
        password: '******',
        nickname: user.nickname || user.username || '',
        phone: user.phone || '',
        email: user.email || '',
        avatar: user.avatar || DEFAULT_AVATAR_URL,
        signature: user.signature || '这个人很懒，什么都没有留下~',
        onlineStatus: user.onlineStatus || 'online',
        accountStatus: user.accountStatus || 'active',
        systemRole: user.systemRole || 'user',
        globalMuteStatus: user.globalMuteStatus || 'unmuted',
        globalMuteEndTime: user.globalMuteEndTime
      });
    }
  }, [user]);

  // 从后端获取最新用户信息
  useEffect(() => {
    const fetchUserInfo = async () => {
      setIsLoading(true);
      try {
        const response = await userService.getCurrentUser();
        if (response.code === 200 && response.data) {
          const userData = response.data;
          setProfile({
            userId: userData.userId || '',
            username: userData.username || '',
            password: '******',
            nickname: userData.nickname || userData.username || '',
            phone: userData.phone || '',
            email: userData.email || '',
            avatar: userData.avatar || DEFAULT_AVATAR_URL,
            signature: userData.signature || '这个人很懒，什么都没有留下~',
            onlineStatus: userData.onlineStatus || 'online',
            accountStatus: userData.accountStatus || 'active',
            systemRole: userData.systemRole || 'user',
            globalMuteStatus: userData.globalMuteStatus || 'unmuted',
            globalMuteEndTime: userData.globalMuteEndTime
          });
        }
      } catch (err) {
        console.error('获取用户信息失败:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserInfo();
  }, []);

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
    { value: 'super_admin', label: '超级管理员', color: 'text-purple-400' },
    { value: 'user', label: '普通用户', color: 'text-gray-400' }
  ];

  // 处理编辑
  const handleEdit = () => {
    setIsEditing(true);
    setEditedProfile(profile);
  };

  // 处理保存
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // 准备更新数据（包含头像）
      const updateData: UpdateUserProfileRequest = {
        nickname: editedProfile.nickname,
        signature: editedProfile.signature,
        phone: editedProfile.phone,
        email: editedProfile.email,
        avatar: editedProfile.avatar !== profile.avatar ? editedProfile.avatar : undefined,
      };
      
      const response = await userService.updateUserProfile(updateData);
      
      if (response.code === 200) {
        setProfile(editedProfile);
        setIsEditing(false);
        
        // 刷新 AuthContext 中的用户信息
        await refreshUserInfo();
        
        api.success({
          message: '保存成功',
          description: '个人资料已更新',
          duration: 2,
        });
        
        // 如果修改了密码
        if (showPasswordEdit && newPassword && oldPassword) {
          await handleChangePassword();
        }
      } else {
        api.error({
          message: '保存失败',
          description: response.message || '无法保存资料',
          duration: 2,
        });
      }
    } catch (err) {
      const apiError = err as ApiError;
      api.error({
        message: '保存失败',
        description: apiError.message || '保存资料时发生错误',
        duration: 2,
      });
    } finally {
      setIsSaving(false);
      setShowPasswordEdit(false);
      setNewPassword('');
      setOldPassword('');
    }
  };

  // 处理修改密码
  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      api.warning({
        message: '密码不能为空',
        description: '请输入旧密码和新密码',
        duration: 2,
      });
      return;
    }
    
    if (newPassword.length < 6) {
      api.warning({
        message: '密码太短',
        description: '新密码至少6个字符',
        duration: 2,
      });
      return;
    }
    
    try {
      const data: ChangePasswordRequest = {
        oldPassword,
        newPassword,
      };
      
      const response = await authService.changePassword(data);
      
      if (response.code === 200) {
        api.success({
          message: '密码修改成功',
          description: '请使用新密码重新登录',
          duration: 3,
        });
        setShowPasswordEdit(false);
        setNewPassword('');
        setOldPassword('');
        
        // 2秒后自动退出登录并跳转到登录页
        setTimeout(async () => {
          try {
            await authService.logout();
            navigate('/login');
          } catch (err) {
            console.error('Logout after password change failed:', err);
            navigate('/login');
          }
        }, 2000);
      } else {
        api.error({
          message: '密码修改失败',
          description: response.message || '无法修改密码',
          duration: 2,
        });
      }
    } catch (err) {
      const apiError = err as ApiError;
      api.error({
        message: '密码修改失败',
        description: apiError.message || '修改密码时发生错误',
        duration: 2,
      });
    }
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
  const handleAvatarUpload = async () => {
    // 创建一个隐藏的 file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/gif,image/webp';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      // 验证文件
      const validation = userService.validateAvatarFile(file);
      if (!validation.valid) {
        api.error({
          message: '上传失败',
          description: validation.message,
          duration: 2,
        });
        return;
      }
      
      setIsSaving(true);
      
      try {
        const response = await userService.uploadAvatar(file);
        
        if (response.code === 200 && response.data) {
          // API 返回完整 URL，直接使用
          const avatarUrl = response.data.url;
          
          // 立即更新编辑状态的头像用于预览
          setEditedProfile(prev => ({ ...prev, avatar: avatarUrl }));
          
          api.success({
            message: '头像上传成功',
            description: '预览已更新，点击保存以应用更改',
            duration: 3,
          });
        } else {
          api.error({
            message: '上传失败',
            description: response.message || '无法上传头像',
            duration: 2,
          });
        }
      } catch (err) {
        const apiError = err as ApiError;
        api.error({
          message: '上传失败',
          description: apiError.message || '上传头像时发生错误',
          duration: 2,
        });
      } finally {
        setIsSaving(false);
      }
    };
    
    input.click();
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {notificationContextHolder}
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
      <div className="max-w-6xl mx-auto py-8 px-6 h-[calc(100vh-88px)] overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧 - 头像和基本信息 */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              {/* 头像 */}
              <div className="relative w-48 h-48 mx-auto mb-6">
                <img
                  src={isEditing ? editedProfile.avatar : profile.avatar}
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover border-4 border-gray-700"
                />
                {isEditing && (
                  <button
                    onClick={handleAvatarUpload}
                    disabled={isSaving}
                    className="absolute inset-0 w-full h-full bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full transition-all focus:outline-none flex items-center justify-center"
                    title="更换头像"
                  >
                    <div className="text-center">
                      <CameraOutlined className="text-4xl text-white mb-2" />
                      <p className="text-white text-sm">{isSaving ? '上传中...' : '点击更换'}</p>
                    </div>
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
                  roleOptions.find(opt => opt.value === profile.systemRole)?.color
                } bg-gray-900`}>
                  {roleOptions.find(opt => opt.value === profile.systemRole)?.label}
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
                    账号
                  </label>
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={profile.username}
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
                      <div className="space-y-2">
                        <input
                          type="password"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          placeholder="输入旧密码"
                          className="w-full bg-gray-700 text-white rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="输入新密码"
                          className="w-full bg-gray-700 text-white rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={handleChangePassword}
                            disabled={isSaving}
                            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors focus:outline-none disabled:opacity-50"
                          >
                            {isSaving ? <LoadingOutlined className="mr-2" /> : null}
                            确认修改
                          </button>
                          <button
                            onClick={() => {
                              setShowPasswordEdit(false);
                              setOldPassword('');
                              setNewPassword('');
                            }}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors focus:outline-none"
                          >
                            取消
                          </button>
                        </div>
                      </div>
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
                        roleOptions.find(opt => opt.value === profile.systemRole)?.color
                      }`}>
                        {roleOptions.find(opt => opt.value === profile.systemRole)?.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 全局禁言状态 */}
                {profile.globalMuteStatus === 'muted' && (
                  <div className="grid grid-cols-3 gap-4 items-center">
                    <label className="text-gray-400">禁言状态</label>
                    <div className="col-span-2">
                      <div className="bg-red-900/20 border border-red-500/30 rounded-lg py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-red-400 font-semibold">已被全局禁言</span>
                        </div>
                        {profile.globalMuteEndTime && (
                          <p className="text-xs text-red-300 mt-1">
                            解除时间: {new Date(profile.globalMuteEndTime).toLocaleString('zh-CN')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
