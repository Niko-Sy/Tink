import React from 'react';
import { PlusOutlined, LoginOutlined, UserAddOutlined } from '@ant-design/icons';

interface HomePageProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onInviteFriend: () => void;
}

const HomePage: React.FC<HomePageProps> = ({
  onCreateRoom,
  onJoinRoom,
  onInviteFriend
}) => {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-950">
      <div className="max-w-4xl w-full px-8">
        {/* 欢迎标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">欢迎来到 Tink ChatRoom</h1>
          <p className="text-gray-400 text-lg">开始你的聊天之旅</p>
        </div>

        {/* 三个大按钮 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 创建聊天室 */}
          <button
            onClick={onCreateRoom}
            className="group relative bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50"
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center group-hover:bg-opacity-30 transition-all">
                <PlusOutlined className="text-4xl" />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">创建聊天室</h3>
                <p className="text-blue-100 text-sm">创建你自己的聊天空间</p>
              </div>
            </div>
            {/* 装饰元素 */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-full -mr-10 -mt-10 group-hover:opacity-20 transition-opacity"></div>
          </button>

          {/* 加入聊天室 */}
          <button
            onClick={onJoinRoom}
            className="group relative bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-opacity-50"
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center group-hover:bg-opacity-30 transition-all">
                <LoginOutlined className="text-4xl" />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">加入聊天室</h3>
                <p className="text-green-100 text-sm">通过ID加入现有聊天室</p>
              </div>
            </div>
            {/* 装饰元素 */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-full -mr-10 -mt-10 group-hover:opacity-20 transition-opacity"></div>
          </button>

          {/* 邀请好友 */}
          <button
            onClick={onInviteFriend}
            className="group relative bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-opacity-50"
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center group-hover:bg-opacity-30 transition-all">
                <UserAddOutlined className="text-4xl" />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">邀请好友</h3>
                <p className="text-purple-100 text-sm">邀请朋友一起聊天</p>
              </div>
            </div>
            {/* 装饰元素 */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-full -mr-10 -mt-10 group-hover:opacity-20 transition-opacity"></div>
          </button>
        </div>

        {/* 底部提示信息 */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-2 bg-gray-800 rounded-full px-6 py-3 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">点击左侧已有聊天室开始聊天</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
