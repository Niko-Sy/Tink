import React, { useState, useEffect } from 'react';
import logo from '../assets/Tink_white.svg';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = '正在加载...' }) => {
  const [loadingText, setLoadingText] = useState('验证身份信息');
  
  // 加载提示文字轮播
  useEffect(() => {
    const messages = [
      '验证身份信息',
      '加载用户数据',
      '初始化聊天室',
      '准备就绪'
    ];
    
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setLoadingText(messages[index]);
    }, 600);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center z-50 animate-fade-in">
      <div className="text-center">
        {/* Logo 动画 */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-24 h-24">
            <img 
              src={logo}
              alt="Logo" 
              className="w-full h-full object-cover animate-bounce-slow"
            />
            {/* 旋转光环 */}
            <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin-slow"></div>
            {/* 外层光环 */}
            <div className="absolute inset-0 rounded-full border-2 border-purple-500 border-b-transparent animate-spin-slow" style={{ animationDirection: 'reverse' }}></div>
          </div>
        </div>
        
        {/* 加载文字 */}
        <h2 className="text-2xl font-bold text-white mb-2 animate-pulse">
          {message}
        </h2>
        
        {/* 动态提示文字 */}
        <p className="text-gray-400 text-sm mb-6 h-6 transition-all duration-300">
          {loadingText}
        </p>
        
        {/* 进度条 */}
        <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden mx-auto">
          <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 animate-loading-bar"></div>
        </div>
        
        {/* 加载点动画 */}
        <div className="mt-6 flex justify-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
