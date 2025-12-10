import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Collapse } from 'antd';

const { Panel } = Collapse;

const Help: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const helpCategories = [
    {
      key: 'account',
      title: '账号与登录',
      items: [
        {
          question: '如何注册账号？',
          answer: '点击登录页面的"注册"按钮，填写用户名、邮箱和密码即可完成注册。注册后会自动登录到系统。'
        },
        {
          question: '忘记密码怎么办？',
          answer: '点击登录页面的"忘记密码"链接，输入您的注册邮箱，系统会发送重置密码的链接到您的邮箱。'
        },
        {
          question: '如何修改个人信息？',
          answer: '点击左下角头像，选择"个人主页"，在个人主页中可以修改头像、用户名、个性签名等信息。'
        }
      ]
    },
    {
      key: 'chatroom',
      title: '聊天室功能',
      items: [
        {
          question: '如何创建聊天室？',
          answer: '点击左侧边栏底部的"添加聊天室"按钮，填写聊天室名称、描述，选择聊天室类型（公开/受保护/私密），即可创建。'
        },
        {
          question: '如何加入聊天室？',
          answer: '公开聊天室可以直接搜索加入；受保护聊天室需要输入密码；私密聊天室需要邀请链接或邀请码。'
        },
        {
          question: '如何退出聊天室？',
          answer: '在聊天室列表中右键点击要退出的聊天室，选择"退出聊天室"，确认后即可退出。'
        },
        {
          question: '聊天室的角色权限有哪些？',
          answer: '聊天室有三种角色：群主（创建者）、管理员、普通成员。群主拥有所有权限；管理员可以管理普通成员（禁言、踢出等）；普通成员只能发送消息和查看内容。'
        }
      ]
    },
    {
      key: 'message',
      title: '消息管理',
      items: [
        {
          question: '如何撤回消息？',
          answer: '右键点击自己发送的消息，选择"撤回消息"。注意：只能撤回自己的消息，且撤回后所有成员都会看到撤回提示。'
        },
        {
          question: '如何回复消息？',
          answer: '右键点击要回复的消息，选择"回复消息"，输入框会显示引用的消息内容，发送后会以引用形式显示。'
        },
        {
          question: '如何复制消息内容？',
          answer: '右键点击消息，选择"复制文本"，消息内容会自动复制到剪贴板。'
        },
        {
          question: '管理员可以撤回他人消息吗？',
          answer: '管理员可以撤回普通成员的消息，但不能撤回群主和其他管理员的消息。撤回操作会显示为警告样式。'
        }
      ]
    },
    {
      key: 'admin',
      title: '管理员功能',
      items: [
        {
          question: '如何禁言成员？',
          answer: '右键点击用户头像或在成员列表中右键点击成员，选择"禁言"，设置禁言时长和原因即可。'
        },
        {
          question: '如何踢出成员？',
          answer: '右键点击用户头像或在成员列表中右键点击成员，选择"踢出聊天室"，确认后该成员会被移出聊天室。'
        },
        {
          question: '如何设置管理员？',
          answer: '群主可以右键点击成员，选择"设为管理员"，该成员将获得管理员权限。同样可以选择"解除管理员"来撤销权限。'
        },
        {
          question: '管理员可以管理其他管理员吗？',
          answer: '不可以。管理员只能管理普通成员，不能对群主和其他管理员进行禁言、踢出等操作。'
        }
      ]
    },
    {
      key: 'features',
      title: '其他功能',
      items: [
        {
          question: '如何查看聊天室详情？',
          answer: '右键点击聊天室，选择"查看详情"，可以查看聊天室的类型、描述、成员数、创建时间等信息。'
        },
        {
          question: '如何标记未读消息？',
          answer: '右键点击聊天室，选择"标记为未读"，该聊天室会显示未读标记。点击"标记为已读"可清除标记。'
        },
        {
          question: '如何@提及某人？',
          answer: '在消息中输入"@"符号，然后输入用户名，或者右键点击用户头像选择"艾特"功能。'
        },
        {
          question: '如何查看其他用户的资料？',
          answer: '点击用户头像或右键选择"查看资料"，可以查看该用户的个人信息、在线状态等。'
        }
      ]
    },
    {
      key: 'privacy',
      title: '隐私与安全',
      items: [
        {
          question: '我的聊天记录安全吗？',
          answer: '所有消息都通过加密传输，您的聊天记录只有聊天室成员可以看到。服务器会定期备份数据确保安全。'
        },
        {
          question: '如何举报不当内容？',
          answer: '右键点击消息或用户，选择"举报"，填写举报原因，管理团队会及时处理。'
        },
        {
          question: '如何屏蔽某个用户？',
          answer: '右键点击用户头像，选择"屏蔽用户"（功能开发中），屏蔽后将不会看到该用户的消息。'
        }
      ]
    }
  ];

  // 过滤帮助内容
  const filteredCategories = searchQuery
    ? helpCategories.map(category => ({
        ...category,
        items: category.items.filter(
          item =>
            item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(category => category.items.length > 0)
    : helpCategories;

  return (
    <div className="min-h-screen bg-ground">
      {/* 头部导航 */}
      <div className="bg-sidebar/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-400 hover:text-white transition-colors"
              title="返回"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">帮助中心</h1>
              <p className="text-sm text-gray-400">常见问题与使用指南</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-6xl mx-auto px-6 py-8 overflow-y-auto max-h-[calc(100vh-128px)]">
        {/* 搜索框 */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="搜索帮助内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-12 py-4 bg-gray-800 border border-gray-700 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* 帮助分类 */}
        <div className="space-y-6">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category) => (
              <div key={category.key} className="bg-ground/50 rounded-2xl border  border-gray-700 overflow-hidden">
                <div className="px-6 py-4 bg-gray-800/70 border-b border-gray-700">
                  <h2 className="text-lg font-semibold text-white flex items-center">
                    <span className="w-1 h-6 bg-blue-500 mr-3 rounded"></span>
                    {category.title}
                  </h2>
                </div>
                <Collapse
                  ghost
                  className="help-collapse"
                  expandIconPosition="end"
                >
                  {category.items.map((item, index) => (
                    <Panel
                      header={
                        <span className="text-gray-200 font-medium">
                          {item.question}
                        </span>
                      }
                      key={index}
                      className="text-gray-400 border-b border-gray-700/50 last:border-b-0"
                    >
                      <div className="text-gray-300 leading-relaxed pl-4 border-l-2 border-blue-500/30">
                        {item.answer}
                      </div>
                    </Panel>
                  ))}
                </Collapse>
              </div>
            ))
          ) : (
            <div className="text-center py-16">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mx-auto text-gray-600 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 text-lg">没有找到相关帮助内容</p>
              <p className="text-gray-600 text-sm mt-2">尝试使用其他关键词搜索</p>
            </div>
          )}
        </div>

        {/* 底部联系信息 */}
        <div className="mt-12 p-6 bg-gray-800/50 rounded-2xl border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">还有问题？</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/feedback')}
              className="flex items-center space-x-3 p-4 bg-gray-700/50 hover:bg-gray-700 rounded-2xl transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <div className="text-left">
                <p className="text-white font-medium">反馈建议</p>
                <p className="text-gray-400 text-sm">向我们提出您的意见</p>
              </div>
            </button>
            <div className="flex items-center space-x-3 p-4 bg-gray-700/50 rounded-2xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <div className="text-left">
                <p className="text-white font-medium">联系我们</p>
                <p className="text-gray-400 text-sm">support@tink.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .help-collapse .ant-collapse-item {
          border-bottom: 1px solid rgba(55, 65, 81, 0.5);
        }
        .help-collapse .ant-collapse-item:last-child {
          border-bottom: none;
        }
        .help-collapse .ant-collapse-header {
          padding: 16px 24px !important;
          color: #e5e7eb !important;
        }
        .help-collapse .ant-collapse-header:hover {
          background-color: rgba(55, 65, 81, 0.3) !important;
        }
        .help-collapse .ant-collapse-content-box {
          padding: 16px 24px !important;
        }
        .help-collapse .ant-collapse-expand-icon {
          padding-inline-end: 12px !important;
        }
      `}</style>
    </div>
  );
};

export default Help;
