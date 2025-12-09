import React, { useState } from 'react';
import { SendOutlined, SmileOutlined } from '@ant-design/icons';
import MentionInput from './MentionInput';
import type { User, Message } from '../types';

interface MessageInputProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  users: User[];
  currentUserId?: string; // 当前用户ID，用于排除自己
  messages: Message[];
  canSendMessage: boolean;
  muteReason?: string | null;
  replyingToMessageId: string | null;
  onCancelReply: () => void;
}

/**
 * 消息输入控制区组件
 * 包含禁言提示、回复提示、表情面板和输入框
 */
const MessageInput: React.FC<MessageInputProps> = ({
  inputValue,
  onInputChange,
  onSend,
  users,
  currentUserId,
  messages,
  canSendMessage,
  muteReason,
  replyingToMessageId,
  onCancelReply,
}) => {
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);

  // 表情数据
  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙃', '😉', '😊',
    '😇', '🥰', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪',
    '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏',
    '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '🤒', '🤕',
    '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓',
    '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧',
    '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫',
    '🥱', '😤', '😡', '😠', '🤬', '👍', '👏', '🙌', '👐', '🤲', '🤝',
    '🙏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👋',
    '🤚', '🖐', '✋', '🖖', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕',
    '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉', '☸️',
    '✨', '⭐', '🌟', '⚡', '💥', '💦', '💨', '🌈', '☀️', '⛅',
    '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '🏀', '🏈',
    '💯', '💢', '💬', '💭', '🗯', '💤', '💮', '♨️', '💈', '🛑', '⚠️', '🚸'
  ];

  // 添加表情到输入框
  const addEmoji = (emoji: string) => {
    onInputChange(inputValue + emoji);
  };

  // 获取回复的消息文本
  const getReplyMessageText = () => {
    if (!replyingToMessageId) return '';
    const message = messages.find(m => m.messageId === replyingToMessageId);
    return message?.text.slice(0, 30) || '消息';
  };

  return (
    <div className="border-gray-800 bg-ground p-4">
      {/* 禁言提示 */}
      {!canSendMessage && (
        <div className="mb-3 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg text-yellow-400 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {muteReason || '你没有发送消息的权限'}
        </div>
      )}

      {/* 回复消息提示 */}
      {replyingToMessageId && (
        <div className="mb-3 p-3 bg-gray-800 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            <span>回复: {getReplyMessageText()}</span>
          </div>
          <button
            className="text-gray-500 hover:text-gray-300 transition-colors focus:outline-none bg-transparent"
            onClick={onCancelReply}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* 表情面板 */}
      {showEmojiPanel && (
        <div className="mb-3 p-3 bg-gray-800 rounded-lg">
          <div className="h-24 overflow-y-auto">
            <div className="grid grid-cols-12 gap-2">
              {emojis.map((emoji, index) => (
                <button
                  key={index}
                  className="text-2xl p-1 hover:bg-gray-700 rounded transition-colors bg-transparent focus:outline-none"
                  onClick={() => addEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* 输入框和按钮 */}
      <div className="flex items-center space-x-2">
        <button
          className="p-2 text-gray-500 hover:text-gray-300 bg-transparent transition-colors border-0 focus:outline-none"
          onClick={() => setShowEmojiPanel(!showEmojiPanel)}
        >
          <SmileOutlined className="text-xl" />
        </button>
        <MentionInput
          value={inputValue}
          onChange={onInputChange}
          onSend={onSend}
          users={users}
          currentUserId={currentUserId}
          placeholder={
            !canSendMessage
              ? "你已被禁言，无法发送消息"
              : "输入消息..."
          }
          disabled={!canSendMessage}
          className={`w-full bg-gray-800 text-white rounded-full py-3 px-4 focus:outline-none focus:ring-2 focus:ring-gray-600 ${
            !canSendMessage 
              ? 'opacity-50 cursor-not-allowed' 
              : ''
          }`}
        />
        <button
          className={`w-12 h-12 text-white/80 p-3 rounded-full transition-colors rounded-button whitespace-nowrap focus:outline-none align-center flex items-center justify-center ${
            !canSendMessage
              ? 'bg-gray-600 cursor-not-allowed opacity-50'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          onClick={onSend}
          disabled={!canSendMessage}
        >
          <SendOutlined />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
