import React, { useState } from 'react';
import { CloseOutlined, PlusOutlined, LoginOutlined } from '@ant-design/icons';

interface AddChatRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinRoom: (roomId: string, password: string) => void;
  onCreateRoom: (name: string, description: string, password: string) => void;
}

const AddChatRoomModal: React.FC<AddChatRoomModalProps> = ({
  isOpen,
  onClose,
  onJoinRoom,
  onCreateRoom
}) => {
  const [activeTab, setActiveTab] = useState<'join' | 'create'>('join');
  const [formData, setFormData] = useState({
    // 加入聊天室
    joinRoomId: '',
    joinPassword: '',
    // 创建聊天室
    createName: '',
    createDescription: '',
    createPassword: ''
  });
  const [errors, setErrors] = useState({
    joinRoomId: '',
    joinPassword: '',
    createName: '',
    createDescription: '',
    createPassword: ''
  });

  // 重置表单
  const resetForm = () => {
    setFormData({
      joinRoomId: '',
      joinPassword: '',
      createName: '',
      createDescription: '',
      createPassword: ''
    });
    setErrors({
      joinRoomId: '',
      joinPassword: '',
      createName: '',
      createDescription: '',
      createPassword: ''
    });
  };

  // 关闭弹窗
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // 验证加入表单
  const validateJoinForm = () => {
    const newErrors = {
      joinRoomId: '',
      joinPassword: '',
      createName: '',
      createDescription: '',
      createPassword: ''
    };
    let isValid = true;

    if (!formData.joinRoomId.trim()) {
      newErrors.joinRoomId = '请输入聊天室ID';
      isValid = false;
    } else if (!/^\d{9}$/.test(formData.joinRoomId)) {
      newErrors.joinRoomId = '聊天室ID必须是9位数字';
      isValid = false;
    }

    if (!formData.joinPassword.trim()) {
      newErrors.joinPassword = '请输入密码';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // 验证创建表单
  const validateCreateForm = () => {
    const newErrors = {
      joinRoomId: '',
      joinPassword: '',
      createName: '',
      createDescription: '',
      createPassword: ''
    };
    let isValid = true;

    if (!formData.createName.trim()) {
      newErrors.createName = '请输入聊天室名称';
      isValid = false;
    } else if (formData.createName.length < 2) {
      newErrors.createName = '聊天室名称至少2个字符';
      isValid = false;
    }

    if (!formData.createDescription.trim()) {
      newErrors.createDescription = '请输入聊天室简介';
      isValid = false;
    } else if (formData.createDescription.length < 5) {
      newErrors.createDescription = '聊天室简介至少5个字符';
      isValid = false;
    }

    if (!formData.createPassword.trim()) {
      newErrors.createPassword = '请设置聊天室密码';
      isValid = false;
    } else if (formData.createPassword.length < 6) {
      newErrors.createPassword = '密码至少6个字符';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // 处理加入聊天室
  const handleJoin = () => {
    if (!validateJoinForm()) return;
    
    onJoinRoom(formData.joinRoomId, formData.joinPassword);
    handleClose();
  };

  // 处理创建聊天室
  const handleCreate = () => {
    if (!validateCreateForm()) return;
    
    onCreateRoom(formData.createName, formData.createDescription, formData.createPassword);
    handleClose();
  };

  // 处理输入变化
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setErrors(prev => ({
      ...prev,
      [field]: ''
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩层 */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-70"
        onClick={handleClose}
      ></div>

      {/* 弹窗内容 */}
      <div className="relative bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-gray-700">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">添加聊天室</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors focus:outline-none text-gray-400 hover:text-white"
          >
            <CloseOutlined className="text-lg" />
          </button>
        </div>

        {/* 标签页 */}
        <div className="flex border-b border-gray-700">
          <button
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors focus:outline-none bg-transparent  ${
              activeTab === 'join'
                ? 'text-blue-600 border-2 border-blue-600 bg-gray-750'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-750'
            }`}
            onClick={() => setActiveTab('join')}
          >
            <LoginOutlined className="mr-2" />
            加入聊天室
          </button>
          <button
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors focus:outline-none bg-transparent ${
              activeTab === 'create'
                ? 'text-blue-600 border-2 border-blue-600 bg-gray-750'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-750'
            }`}
            onClick={() => setActiveTab('create')}
          >
            <PlusOutlined className="mr-2" />
            创建聊天室
          </button>
        </div>

        {/* 表单内容 */}
        <div className="p-6">
          {activeTab === 'join' ? (
            // 加入聊天室表单
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  聊天室ID
                </label>
                <input
                  type="text"
                  value={formData.joinRoomId}
                  onChange={(e) => handleInputChange('joinRoomId', e.target.value)}
                  className={`w-full bg-gray-700 text-white rounded-lg py-3 px-4 focus:outline-none focus:ring-2 ${
                    errors.joinRoomId ? 'focus:ring-red-500 border border-red-500' : 'focus:ring-blue-500'
                  }`}
                  placeholder="请输入9位数字聊天室ID"
                  maxLength={9}
                />
                {errors.joinRoomId && (
                  <p className="mt-1 text-sm text-red-500">{errors.joinRoomId}</p>
                )}
                <p className="mt-1 text-xs text-gray-400">聊天室ID由9位数字组成</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  聊天室密码
                </label>
                <input
                  type="password"
                  value={formData.joinPassword}
                  onChange={(e) => handleInputChange('joinPassword', e.target.value)}
                  className={`w-full bg-gray-700 text-white rounded-lg py-3 px-4 focus:outline-none focus:ring-2 ${
                    errors.joinPassword ? 'focus:ring-red-500 border border-red-500' : 'focus:ring-blue-500'
                  }`}
                  placeholder="请输入聊天室密码"
                />
                {errors.joinPassword && (
                  <p className="mt-1 text-sm text-red-500">{errors.joinPassword}</p>
                )}
              </div>

              <button
                onClick={handleJoin}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors focus:outline-none mt-4"
              >
                <LoginOutlined className="mr-2" />
                加入聊天室
              </button>
            </div>
          ) : (
            // 创建聊天室表单
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  聊天室名称
                </label>
                <input
                  type="text"
                  value={formData.createName}
                  onChange={(e) => handleInputChange('createName', e.target.value)}
                  className={`w-full bg-gray-700 text-white rounded-lg py-3 px-4 focus:outline-none focus:ring-2 ${
                    errors.createName ? 'focus:ring-red-500 border border-red-500' : 'focus:ring-blue-500'
                  }`}
                  placeholder="请输入聊天室名称"
                />
                {errors.createName && (
                  <p className="mt-1 text-sm text-red-500">{errors.createName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  聊天室简介
                </label>
                <textarea
                  value={formData.createDescription}
                  onChange={(e) => handleInputChange('createDescription', e.target.value)}
                  className={`w-full bg-gray-700 text-white rounded-lg py-3 px-4 focus:outline-none focus:ring-2 resize-none ${
                    errors.createDescription ? 'focus:ring-red-500 border border-red-500' : 'focus:ring-blue-500'
                  }`}
                  rows={3}
                  placeholder="请输入聊天室简介"
                />
                {errors.createDescription && (
                  <p className="mt-1 text-sm text-red-500">{errors.createDescription}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  聊天室密码
                </label>
                <input
                  type="password"
                  value={formData.createPassword}
                  onChange={(e) => handleInputChange('createPassword', e.target.value)}
                  className={`w-full bg-gray-700 text-white rounded-lg py-3 px-4 focus:outline-none focus:ring-2 ${
                    errors.createPassword ? 'focus:ring-red-500 border border-red-500' : 'focus:ring-blue-500'
                  }`}
                  placeholder="设置聊天室密码（至少6位）"
                />
                {errors.createPassword && (
                  <p className="mt-1 text-sm text-red-500">{errors.createPassword}</p>
                )}
                <p className="mt-1 text-xs text-gray-400">此密码用于其他用户加入聊天室</p>
              </div>

              <button
                onClick={handleCreate}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors focus:outline-none mt-4 bg-transparent border-0"
              >
                <PlusOutlined className="mr-2" />
                创建聊天室
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddChatRoomModal;
