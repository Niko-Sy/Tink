import React, { useState } from 'react';
import type { User } from '../types';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  users: User[];
  currentUserId?: string; // 当前用户ID，用于排除自己
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * 带 @ 提及功能的输入框组件
 * 支持输入 @ 字符时弹出用户列表，支持键盘导航和选择
 */
const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  onSend,
  users,
  currentUserId,
  placeholder = '输入消息...',
  disabled = false,
  className = '',
}) => {
  // @ 提及功能状态
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [mentionStartPos, setMentionStartPos] = useState(0);

  // 处理输入变化（检测 @ 字符）
  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    
    // 查找最后一个 @ 的位置
    const lastAtIndex = newValue.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      // 获取 @ 后面的文本
      const afterAt = newValue.substring(lastAtIndex + 1);
      
      // 如果 @ 后面没有空格，显示提及列表
      if (!afterAt.includes(' ')) {
        setMentionSearch(afterAt);
        setMentionStartPos(lastAtIndex);
        setShowMentionList(true);
        setSelectedMentionIndex(0);
        return;
      }
    }
    
    // 否则隐藏提及列表
    setShowMentionList(false);
  };

  // 选择用户进行 @ 提及
  const selectMention = (userName: string) => {
    const beforeMention = value.substring(0, mentionStartPos);
    const afterMention = value.substring(mentionStartPos + mentionSearch.length + 1);
    onChange(`${beforeMention}@${userName} ${afterMention}`);
    setShowMentionList(false);
    setMentionSearch('');
    // 聚焦回输入框
    setTimeout(() => {
      document.querySelector<HTMLInputElement>('input[type="text"]')?.focus();
    }, 0);
  };

  // 获取过滤后的用户列表（排除当前用户）
  const getFilteredUsers = () => {
    // 首先排除当前用户
    const usersExcludingSelf = currentUserId 
      ? users.filter(u => u.userId !== currentUserId)
      : users;
    
    // 然后根据搜索文本过滤
    if (!mentionSearch) return usersExcludingSelf;
    return usersExcludingSelf.filter(u => 
      u.name.toLowerCase().includes(mentionSearch.toLowerCase())
    );
  };

  // 处理键盘事件（上下箭头选择，Enter确认）
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showMentionList && getFilteredUsers().length > 0) {
      const filteredUsers = getFilteredUsers();
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev < filteredUsers.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex(prev => prev > 0 ? prev - 1 : 0);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredUsers.length > 0) {
          selectMention(filteredUsers[selectedMentionIndex].name);
        }
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentionList(false);
        return;
      }
      return; // 阻止其他按键的默认行为
    }
    
    // 原有的 Enter 发送逻辑
    if (e.key === 'Enter') {
      onSend();
    }
  };

  return (
    <div className="flex-1 relative">
      {/* @ 提及用户列表 - 仅在有匹配用户时显示 */}
      {showMentionList && getFilteredUsers().length > 0 && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
          {getFilteredUsers().map((user, index) => (
            <button
              key={user.userId}
              className={`w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors flex items-center space-x-2 focus:outline-none ${
                index === selectedMentionIndex ? 'bg-gray-700' : ''
              }`}
              onClick={() => selectMention(user.name)}
              onMouseEnter={() => setSelectedMentionIndex(index)}
            >
              <div className={`w-2 h-2 rounded-full ${
                user.onlineStatus === 'online' ? 'bg-green-500' : 'bg-gray-500'
              }`} />
              <span className="text-white">{user.name}</span>
              {user.roomRole === 'owner' && (
                <span className="text-xs text-yellow-500">房主</span>
              )}
              {user.roomRole === 'admin' && (
                <span className="text-xs text-blue-500">管理员</span>
              )}
            </button>
          ))}
        </div>
      )}
      
      <input
        type="text"
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={handleInputKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
      />
    </div>
  );
};

export default MentionInput;
