import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notification } from 'antd';

type FeedbackType = 'bug' | 'feature' | 'improvement' | 'other';

const Feedback: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contactInfo, setContactInfo] = useState(user?.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [api, contextHolder] = notification.useNotification({
    placement: 'topRight',
    top: 24,
    duration: 3,
  });

  const feedbackTypes = [
    { value: 'bug' as FeedbackType, label: '错误报告', icon: '🐛', color: 'red' },
    { value: 'feature' as FeedbackType, label: '功能建议', icon: '💡', color: 'blue' },
    { value: 'improvement' as FeedbackType, label: '改进建议', icon: '🚀', color: 'green' },
    { value: 'other' as FeedbackType, label: '其他反馈', icon: '💬', color: 'gray' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      api.warning({
        message: '请填写标题',
        description: '反馈标题不能为空',
      });
      return;
    }

    if (!description.trim()) {
      api.warning({
        message: '请填写描述',
        description: '反馈描述不能为空',
      });
      return;
    }

    setIsSubmitting(true);

    // TODO: 实际提交反馈到后端API
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500));

      const feedbackData = {
        type: feedbackType,
        title: title.trim(),
        description: description.trim(),
        contactInfo: contactInfo.trim(),
        userId: user?.userId,
        userName: user?.username,
        timestamp: new Date().toISOString(),
      };

      console.log('提交反馈:', feedbackData);

      api.success({
        message: '提交成功',
        description: '感谢您的反馈！我们会认真处理您的意见。',
        duration: 4,
      });

      // 清空表单
      setTitle('');
      setDescription('');
      setFeedbackType('bug');
      
      // 2秒后返回
      setTimeout(() => {
        navigate(-1);
      }, 2000);
    } catch (err) {
      console.error('提交反馈失败:', err);
      api.error({
        message: '提交失败',
        description: '网络错误，请稍后重试',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (title.trim() || description.trim()) {
      if (window.confirm('确定要放弃当前编辑的内容吗？')) {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-ground">
      {contextHolder}
      
      {/* 头部导航 */}
      <div className="bg-sidebar/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-white transition-colors"
              title="返回"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">反馈建议</h1>
              <p className="text-sm text-gray-400">您的意见对我们很重要</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-2xl transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-4xl mx-auto px-6 py-8 overflow-y-auto max-h-[calc(100vh-128px)]">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 反馈类型选择 */}
          <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-6">
            <label className="block text-white font-semibold mb-4">
              反馈类型 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {feedbackTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFeedbackType(type.value)}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    feedbackType === type.value
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 bg-gray-700/30 hover:border-gray-600'
                  }`}
                >
                  <div className="text-3xl mb-2">{type.icon}</div>
                  <div className="text-sm text-white font-medium">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 反馈标题 */}
          <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-6">
            <label className="block text-white font-semibold mb-3">
              反馈标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请简要描述您的反馈..."
              maxLength={100}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <div className="mt-2 text-right text-sm text-gray-500">
              {title.length}/100
            </div>
          </div>

          {/* 详细描述 */}
          <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-6">
            <label className="block text-white font-semibold mb-3">
              详细描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                feedbackType === 'bug'
                  ? '请详细描述您遇到的问题，包括：\n1. 问题出现的场景\n2. 具体的操作步骤\n3. 预期的结果和实际的结果\n4. 问题出现的频率'
                  : feedbackType === 'feature'
                  ? '请详细描述您期望的功能：\n1. 功能的使用场景\n2. 功能的具体需求\n3. 为什么需要这个功能\n4. 期望的实现方式'
                  : '请详细描述您的建议或意见...'
              }
              rows={12}
              maxLength={2000}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
            <div className="mt-2 text-right text-sm text-gray-500">
              {description.length}/2000
            </div>
          </div>

          {/* 联系方式 */}
          <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-6">
            <label className="block text-white font-semibold mb-3">
              联系方式 <span className="text-gray-500 text-sm font-normal">（可选，方便我们跟进处理）</span>
            </label>
            <input
              type="text"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder="邮箱、QQ、微信等联系方式"
              maxLength={100}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* 提交信息提示 */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4">
            <div className="flex items-start space-x-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-300">
                <p className="font-medium mb-1">提交须知：</p>
                <ul className="list-disc list-inside space-y-1 text-blue-400">
                  <li>请确保描述准确清晰，这有助于我们更快地解决问题</li>
                  <li>我们会在 1-3 个工作日内处理您的反馈</li>
                  <li>如果留下联系方式，我们会及时反馈处理结果</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>提交中...</span>
                </>
              ) : (
                <span>提交反馈</span>
              )}
            </button>
          </div>
        </form>

        {/* 快速反馈选项 */}
        <div className="mt-8 p-6 bg-gray-800/50 rounded-2xl border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">常见问题</h3>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/help')}
              className="w-full text-left p-3 bg-gray-700/50 hover:bg-gray-700 rounded-2xl transition-colors text-gray-300 flex items-center justify-between"
            >
              <span>查看帮助文档</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feedback;
