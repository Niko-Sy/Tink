import React, { useState, useRef, useEffect } from 'react';
import { CloseOutlined, SaveOutlined } from '@ant-design/icons';

interface ChatRoomSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: ChatRoomSettings) => void;
  currentSettings: ChatRoomSettings;
}

export interface ChatRoomSettings {
  name: string;
  description: string;
  icon: string;
  type: 'public' | 'private' | 'protected';
  password: string;
}

const ChatRoomSettingsModal: React.FC<ChatRoomSettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentSettings
}) => {
  const [formData, setFormData] = useState<ChatRoomSettings>(currentSettings);
  const [errors, setErrors] = useState({
    name: '',
    description: '',
    icon: '',
    password: ''
  });
  const passwordSectionRef = useRef<HTMLDivElement>(null);

  // 当类型改为protected时,自动滚动到密码输入区域
  useEffect(() => {
    if (formData.type === 'protected' && passwordSectionRef.current) {
      // 延迟一小段时间以确保DOM已更新
      setTimeout(() => {
        passwordSectionRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest' 
        });
      }, 100);
    }
  }, [formData.type]);

  // 图标选项
  const iconOptions = [
    { value: 'fas fa-home', label: '🏠 主页', icon: 'fas fa-home' },
    { value: 'fas fa-comments', label: '💬 聊天', icon: 'fas fa-comments' },
    { value: 'fas fa-users', label: '👥 社区', icon: 'fas fa-users' },
    { value: 'fas fa-gamepad', label: '🎮 游戏', icon: 'fas fa-gamepad' },
    { value: 'fas fa-music', label: '🎵 音乐', icon: 'fas fa-music' },
    { value: 'fas fa-film', label: '🎬 影视', icon: 'fas fa-film' },
    { value: 'fas fa-book', label: '📚 阅读', icon: 'fas fa-book' },
    { value: 'fas fa-code', label: '💻 编程', icon: 'fas fa-code' },
    { value: 'fas fa-heart', label: '❤️ 兴趣', icon: 'fas fa-heart' },
    { value: 'fas fa-star', label: '⭐ 特别', icon: 'fas fa-star' },
  ];

  // 聊天室类型选项
  const typeOptions = [
    { value: 'public', label: '公开', description: '任何人都可以查看和加入' },
    { value: 'protected', label: '受保护', description: '需要密码才能加入' },
    { value: 'private', label: '私密', description: '仅受邀请的成员可以加入' },
  ];

  // 验证表单
  const validateForm = () => {
    const newErrors = {
      name: '',
      description: '',
      icon: '',
      password: ''
    };
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = '聊天室名称不能为空';
      isValid = false;
    } else if (formData.name.length < 2) {
      newErrors.name = '聊天室名称至少2个字符';
      isValid = false;
    }

    if (!formData.description.trim()) {
      newErrors.description = '聊天室描述不能为空';
      isValid = false;
    } else if (formData.description.length < 5) {
      newErrors.description = '聊天室描述至少5个字符';
      isValid = false;
    }

    if (formData.type === 'protected' && !formData.password.trim()) {
      newErrors.password = '受保护的聊天室需要设置密码';
      isValid = false;
    } else if (formData.type === 'protected' && formData.password.length < 6) {
      newErrors.password = '密码至少6个字符';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // 处理保存
  const handleSave = () => {
    if (!validateForm()) return;
    onSave(formData);
    onClose();
  };

  // 处理取消
  const handleCancel = () => {
    setFormData(currentSettings);
    setErrors({
      name: '',
      description: '',
      icon: '',
      password: ''
    });
    onClose();
  };

  // 处理输入变化
  const handleInputChange = (field: keyof ChatRoomSettings, value: string) => {
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
        className="absolute inset-0 bg-black bg-opacity-70 animate-fade-in-overlay"
        onClick={handleCancel}
      ></div>

      {/* 弹窗内容 */}
      <div className="relative bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 border border-gray-700 max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
          <h2 className="text-xl font-bold text-white">聊天室设置</h2>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors focus:outline-none text-gray-400 hover:text-white bg-transparent border-0"
          >
            <CloseOutlined className="text-lg" />
          </button>
        </div>

        {/* 表单内容 */}
        <div className="p-6 space-y-6">
          {/* 聊天室名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              聊天室名称 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full bg-gray-700 text-white rounded-lg py-3 px-4 focus:outline-none focus:ring-2 ${
                errors.name ? 'focus:ring-red-500 border border-red-500' : 'focus:ring-blue-500'
              }`}
              placeholder="请输入聊天室名称"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* 聊天室描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              聊天室描述 *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`w-full bg-gray-700 text-white rounded-lg py-3 px-4 focus:outline-none focus:ring-2 resize-none ${
                errors.description ? 'focus:ring-red-500 border border-red-500' : 'focus:ring-blue-500'
              }`}
              rows={4}
              placeholder="请输入聊天室描述"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {/* 聊天室图标 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              聊天室图标
            </label>
            <div className="grid grid-cols-5 gap-3">
              {iconOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleInputChange('icon', option.value)}
                  className={`p-4 rounded-lg transition-all focus:outline-none flex flex-col items-center justify-center ${
                    formData.icon === option.value
                      ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <i className={`${option.icon} text-2xl mb-1`}></i>
                  <span className="text-xs">{option.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 聊天室类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              聊天室类型
            </label>
            <div className="space-y-2">
              {typeOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleInputChange('type', option.value as 'public' | 'private' | 'protected')}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    formData.type === option.value
                      ? 'bg-blue-600 border-2 border-blue-400'
                      : 'bg-gray-700 border-2 border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${
                      formData.type === option.value
                        ? 'border-white'
                        : 'border-gray-400'
                    }`}>
                      {formData.type === option.value && (
                        <div className="w-3 h-3 rounded-full bg-white"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white">{option.label}</div>
                      <div className="text-sm text-gray-300">{option.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 访问密码（仅在受保护类型时显示） */}
          {formData.type === 'protected' && (
            <div ref={passwordSectionRef}>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                访问密码 *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`w-full bg-gray-700 text-white rounded-lg py-3 px-4 focus:outline-none focus:ring-2 ${
                  errors.password ? 'focus:ring-red-500 border border-red-500' : 'focus:ring-blue-500'
                }`}
                placeholder="设置聊天室访问密码（至少6位）"
                autoFocus
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
              <p className="mt-1 text-xs text-gray-400">用户需要输入此密码才能加入聊天室</p>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-700 bg-gray-800 sticky bottom-0">
          <button
            onClick={handleCancel}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors focus:outline-none"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors focus:outline-none"
          >
            <SaveOutlined />
            <span>保存设置</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoomSettingsModal;
