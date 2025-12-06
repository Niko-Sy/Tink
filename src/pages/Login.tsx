import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/LoadingScreen';
import logo from '../assets/Tink_white.svg';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, register, error, clearError, loading } = useAuth();
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
    confirmPassword: '',
    api: ''  // API 错误
  });

  // 页面加载动画
  useEffect(() => {
    // 延迟一帧确保DOM已渲染
    requestAnimationFrame(() => {
      setIsLoaded(true);
    });
  }, []);

  // 监听 AuthContext 的错误
  useEffect(() => {
    if (error) {
      setErrors(prev => ({ ...prev, api: error }));
      setIsLoggingIn(false);
    }
  }, [error]);

  // 清除错误当切换模式时
  useEffect(() => {
    clearError();
    setErrors(prev => ({ ...prev, api: '' }));
  }, [isLogin, clearError]);

  // 表单验证
  const validateForm = () => {
    const newErrors = {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      api: ''
    };
    let isValid = true;

    if (!formData.username.trim()) {
      newErrors.username = '账号不能为空';
      isValid = false;
    } else if (formData.username.length < 3) {
      newErrors.username = '账号至少3个字符';
      isValid = false;
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = '账号只能包含字母、数字和下划线';
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
    } else if (formData.password.length > 20) {
      newErrors.password = '密码最多20个字符';
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
  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    // 清除之前的本地错误（不清除 AuthContext 的错误，让它自己管理）
    setErrors(prev => ({ ...prev, api: '' }));

    // 显示加载动画
    setIsLoggingIn(true);

    try {
      const success = await login({
        username: formData.username,
        password: formData.password,
      });

      if (success) {
        // 登录成功，跳转到主页
        navigate('/');
      } else {
        // 登录失败，停止加载动画（错误信息由 useEffect 监听 error 显示）
        setIsLoggingIn(false);
      }
    } catch (err) {
      // 捕获异常，停止加载动画
      setIsLoggingIn(false);
    }
  };

  // 处理注册
  const handleRegister = async () => {
    if (!validateForm()) return;

    // 清除之前的错误
    setErrors(prev => ({ ...prev, api: '' }));
    clearError();

    // 显示加载动画
    setIsLoggingIn(true);

    try {
      const success = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        nickname: formData.username,  // 默认昵称为用户名
      });

      if (success) {
        // 注册成功，跳转到主页
        navigate('/');
      } else {
        // 注册失败，停止加载动画（错误信息由 useEffect 监听 error 显示）
        setIsLoggingIn(false);
      }
    } catch (err) {
      // 捕获异常，停止加载动画
      setIsLoggingIn(false);
    }
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
        confirmPassword: '',
        api: ''
      });
      
      // 切换完成后淡入
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 200);
  };

  // 检查是否正在加载中
  const isSubmitting = isLoggingIn || loading;

  return (
    <>
      {/* 加载屏幕 */}
      {isSubmitting && (
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

          {/* API 错误提示 */}
          {errors.api && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm animate-fade-in">
              {errors.api}
            </div>
          )}

          {/* 表单 - 添加过渡动画 */}
          <div className={`space-y-4 transition-all duration-300 ${
            isTransitioning ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'
          }`}>
            {/* 用户名输入 */}
            <div className="transform transition-all duration-300 hover:scale-[1.02]">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                账号
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserOutlined className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (isLogin ? handleLogin() : handleRegister())}
                  className={`w-full bg-gray-700 text-white rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    errors.username ? 'focus:ring-red-500 border border-red-500 shake' : 'focus:ring-blue-500 focus:shadow-lg focus:shadow-blue-500/20'
                  }`}
                  placeholder="请输入账号"
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
                    onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
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
                  onKeyDown={(e) => e.key === 'Enter' && (isLogin ? handleLogin() : handleRegister())}
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
                    onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
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
              type="button"
              onClick={isLogin ? handleLogin : handleRegister}
              disabled={isSubmitting}
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/50 active:scale-95 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
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
                type="button"
                onClick={toggleMode}
                disabled={isSubmitting}
                className={`text-blue-400 hover:text-blue-300 text-sm focus:outline-none transition-all duration-200 hover:underline transform hover:scale-105 ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
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
