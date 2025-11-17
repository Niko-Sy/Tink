import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/LoadingScreen';
import logo from '../assets/Tink_white.svg';

interface LoginProps {
  onLogin?: (userData: { userId: string; username: string; token: string; email?: string }) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false); // 控制页面加载动画
  const [isTransitioning, setIsTransitioning] = useState(false); // 控制切换动画
  const [isLoggingIn, setIsLoggingIn] = useState(false); // 控制登录加载动画
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // 页面加载动画
  useEffect(() => {
    // 延迟一帧确保DOM已渲染
    requestAnimationFrame(() => {
      setIsLoaded(true);
    });
  }, []);

  // 表单验证
  const validateForm = () => {
    const newErrors = {
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    };
    let isValid = true;

    if (!formData.username.trim()) {
      newErrors.username = '用户名不能为空';
      isValid = false;
    } else if (formData.username.length < 3) {
      newErrors.username = '用户名至少3个字符';
      isValid = false;
    }

    if (!isLogin && !formData.email.trim()) {
      newErrors.email = '邮箱不能为空';
      isValid = false;
    } else if (!isLogin && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '邮箱格式不正确';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = '密码不能为空';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = '密码至少6个字符';
      isValid = false;
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次密码不一致';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // 处理登录
  const handleLogin = () => {
    if (!validateForm()) return;

    // 显示加载动画
    setIsLoggingIn(true);

    // 模拟网络请求延迟
    setTimeout(() => {
      // 生成随机userId (U + 9位数字)
      const userId = 'U' + Math.random().toString().slice(2, 11);
      // 模拟登录成功（实际应该调用后端API）
      const token = Math.random().toString(36).substring(2);
      const userData = {
        userId: userId,
        username: formData.username,
        token: token,
        email: formData.email || undefined,
        nickname: formData.username,
        onlineStatus: 'online' as const,
        accountStatus: 'active' as const,
        systemRole: 'super_admin' as const,
        signature: '这个人很懒，什么都没有留下~',
        loginTime: new Date().toISOString()
      };

      // 保存到本地存储
      localStorage.setItem('user', JSON.stringify(userData));
      
      // 更新 AuthContext
      login(userData);
      
      // 调用父组件的登录回调（如果存在）
      if (onLogin) {
        onLogin({ userId, username: formData.username, token, email: formData.email });
      }
      
      // 模拟页面资源加载
      setTimeout(() => {
        setIsLoggingIn(false);
        // 跳转到主页
        navigate('/');
      }, 1500);
    }, 800);
  };

  // 处理注册
  const handleRegister = () => {
    if (!validateForm()) return;

    // 显示加载动画
    setIsLoggingIn(true);

    // 模拟网络请求延迟
    setTimeout(() => {
      // 生成随机userId (U + 9位数字)
      const userId = 'U' + Math.random().toString().slice(2, 11);
      // 模拟注册成功（实际应该调用后端API）
      const token = Math.random().toString(36).substring(2);
      const userData = {
        userId: userId,
        username: formData.username,
        email: formData.email,
        token: token,
        nickname: formData.username,
        onlineStatus: 'online' as const,
        accountStatus: 'active' as const,
        systemRole: 'user' as const,
        signature: '这个人很懒，什么都没有留下~',
        loginTime: new Date().toISOString()
      };

      // 保存到本地存储
      localStorage.setItem('user', JSON.stringify(userData));
      
      // 更新 AuthContext
      login(userData);
      
      // 调用父组件的登录回调（如果存在）
      if (onLogin) {
        onLogin({ userId, username: formData.username, token, email: formData.email });
      }
      
      // 模拟页面资源加载
      setTimeout(() => {
        setIsLoggingIn(false);
        // 跳转到主页
        navigate('/');
      }, 1500);
    }, 800);
  };

  // 处理输入变化
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // 清除该字段的错误信息
    setErrors(prev => ({
      ...prev,
      [field]: ''
    }));
  };

  // 切换登录/注册模式
  const toggleMode = () => {
    setIsTransitioning(true);
    
    // 先淡出，然后切换模式，最后淡入
    setTimeout(() => {
      setIsLogin(!isLogin);
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
      setErrors({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
      
      // 切换完成后淡入
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 200);
  };

  return (
    <>
      {/* 加载屏幕 */}
      {isLoggingIn && (
        <LoadingScreen message={isLogin ? '正在登录...' : '正在注册...'} />
      )}
      
      {/* 登录/注册表单 */}
      <div className="flex items-center justify-center min-h-screen w-screen bg-login">
      <div className="w-full max-w-md px-4">
        {/* 卡片容器 - 添加淡入动画 */}
        <div className={`bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700 transition-all duration-500 ease-out transform ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          {/* 标题 - 添加淡入动画 */}
          <div className={`text-center mb-8 transition-all duration-300 ${
            isTransitioning ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'
          }`}>
            <h1 className="text-3xl font-bold text-white mb-2">
              {isLogin && (
                <div className='flex items-center justify-center gap-2 pr-6'>
                   <img 
                      src={logo}
                      alt="Logo" 
                      className="w-12 h-12 object-cover animate-pulse-slow"
                    />
                  <div>Tink - 登录</div>
                </div>
              )}
              {!isLogin && (
                <div className='flex items-center justify-center gap-2 pr-6'>
                   <img 
                      src={logo}
                      alt="Logo" 
                      className="w-12 h-12 object-cover animate-pulse-slow"
                    />
                  <div>Tink - 注册</div>
                </div>
              )}
            </h1>
            <p className="text-gray-400">
              {isLogin ? '登录到您的聊天室账户' : '注册一个新的聊天室账户'}
            </p>
          </div>

          {/* 表单 - 添加过渡动画 */}
          <div className={`space-y-4 transition-all duration-300 ${
            isTransitioning ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'
          }`}>
            {/* 用户名输入 */}
            <div className="transform transition-all duration-300 hover:scale-[1.02]">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                用户名
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserOutlined className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className={`w-full bg-gray-700 text-white rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    errors.username ? 'focus:ring-red-500 border border-red-500 shake' : 'focus:ring-blue-500 focus:shadow-lg focus:shadow-blue-500/20'
                  }`}
                  placeholder="请输入用户名"
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-500 animate-fade-in">{errors.username}</p>
              )}
            </div>

            {/* 邮箱输入（仅注册时显示） */}
            {!isLogin && (
              <div className="transform transition-all duration-300 hover:scale-[1.02] animate-slide-down">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  邮箱
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MailOutlined className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full bg-gray-700 text-white rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 transition-all duration-200 ${
                      errors.email ? 'focus:ring-red-500 border border-red-500 shake' : 'focus:ring-blue-500 focus:shadow-lg focus:shadow-blue-500/20'
                    }`}
                    placeholder="请输入邮箱"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500 animate-fade-in">{errors.email}</p>
                )}
              </div>
            )}

            {/* 密码输入 */}
            <div className="transform transition-all duration-300 hover:scale-[1.02]">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                密码
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockOutlined className="text-gray-400" />
                </div>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full bg-gray-700 text-white rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    errors.password ? 'focus:ring-red-500 border border-red-500 shake' : 'focus:ring-blue-500 focus:shadow-lg focus:shadow-blue-500/20'
                  }`}
                  placeholder="请输入密码"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500 animate-fade-in">{errors.password}</p>
              )}
            </div>

            {/* 确认密码输入（仅注册时显示） */}
            {!isLogin && (
              <div className="transform transition-all duration-300 hover:scale-[1.02] animate-slide-down">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  确认密码
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockOutlined className="text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`w-full bg-gray-700 text-white rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 transition-all duration-200 ${
                      errors.confirmPassword ? 'focus:ring-red-500 border border-red-500 shake' : 'focus:ring-blue-500 focus:shadow-lg focus:shadow-blue-500/20'
                    }`}
                    placeholder="请再次输入密码"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500 animate-fade-in">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {/* 登录/注册按钮 */}
            <button
              onClick={isLogin ? handleLogin : handleRegister}
              disabled={isLoggingIn}
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/50 active:scale-95 ${
                isLoggingIn ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoggingIn ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isLogin ? '登录中...' : '注册中...'}
                </span>
              ) : (
                isLogin ? '登录' : '注册'
              )}
            </button>

            {/* 切换登录/注册 */}
            <div className="text-center pt-4">
              <button
                onClick={toggleMode}
                disabled={isLoggingIn}
                className={`text-blue-400 hover:text-blue-300 text-sm focus:outline-none transition-all duration-200 hover:underline transform hover:scale-105 ${
                  isLoggingIn ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLogin ? '还没有账户？立即注册' : '已有账户？立即登录'}
              </button>
            </div>
          </div>
        </div>

        {/* 底部文字 - 添加淡入动画 */}
        <div className={`text-center mt-6 text-gray-500 text-sm transition-all duration-700 delay-300 ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <p>登录即表示您同意我们的服务条款和隐私政策</p>
        </div>
      </div>
    </div>
    </>
  );
};

export default Login;
