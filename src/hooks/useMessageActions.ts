/**
 * 消息操作 Hook
 * 负责消息的撤回、编辑、回复等操作
 */

import { useCallback } from 'react';
import { messageService, type ApiError } from '../services';
import type { User } from '../types';

export interface UseMessageActionsReturn {
  handleRecallMessage: (roomId: string, messageId: string) => Promise<void>;
  handleEditMessage: (roomId: string, messageId: string, newText: string) => Promise<void>;
  handleCopyMessage: (text: string) => void;
  handleReplyMessage: (messageId: string, callback: (messageId: string) => void) => void;
}

interface UseMessageActionsOptions {
  user: User | null;
  onSuccess?: (message: string, description: string, duration?: number) => void;
  onError?: (message: string, description: string, duration?: number) => void;
}

export const useMessageActions = ({
  user,
  onSuccess,
  onError,
}: UseMessageActionsOptions): UseMessageActionsReturn => {
  
  // 撤回消息
  const handleRecallMessage = useCallback(async (roomId: string, messageId: string) => {
    if (!user) {
      onError?.('操作失败', '用户未登录', 2);
      return;
    }
    
    try {
      const response = await messageService.deleteMessage(roomId, messageId);
      if (response.code === 200) {
        onSuccess?.('消息已撤回', '消息已从聊天记录中删除', 2);
      } else {
        onError?.('撤回失败', response.message || '无法撤回消息', 2);
      }
    } catch (err) {
      const apiError = err as ApiError;
      onError?.('撤回失败', apiError.message || '撤回消息时发生错误', 2);
    }
  }, [user, onSuccess, onError]);
  
  // 编辑消息
  const handleEditMessage = useCallback(async (roomId: string, messageId: string, newText: string) => {
    if (!user) {
      onError?.('操作失败', '用户未登录', 2);
      return;
    }
    
    if (!newText.trim()) {
      onError?.('编辑失败', '消息内容不能为空', 2);
      return;
    }
    
    try {
      const response = await messageService.editMessage(roomId, messageId, { text: newText });
      if (response.code === 200) {
        onSuccess?.('消息已编辑', '消息内容已更新', 2);
      } else {
        onError?.('编辑失败', response.message || '无法编辑消息', 2);
      }
    } catch (err) {
      const apiError = err as ApiError;
      onError?.('编辑失败', apiError.message || '编辑消息时发生错误', 2);
    }
  }, [user, onSuccess, onError]);
  
  // 复制消息
  const handleCopyMessage = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      onSuccess?.('复制成功', '消息内容已复制到剪贴板', 2);
    }).catch(err => {
      console.error('复制失败:', err);
      onError?.('复制失败', '请手动复制消息内容', 2);
    });
  }, [onSuccess, onError]);
  
  // 回复消息
  const handleReplyMessage = useCallback((messageId: string, callback: (messageId: string) => void) => {
    callback(messageId);
  }, []);
  
  return {
    handleRecallMessage,
    handleEditMessage,
    handleCopyMessage,
    handleReplyMessage,
  };
};
