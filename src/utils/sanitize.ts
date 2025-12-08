/**
 * XSS 防护工具
 * 使用 DOMPurify 清理用户输入的内容，防止 XSS 攻击
 */

import DOMPurify from 'dompurify';

/**
 * 清理 HTML 内容，移除所有危险的标签和属性
 */
export const sanitizeHTML = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [], // 不允许任何 HTML 标签
    ALLOWED_ATTR: [], // 不允许任何属性
    KEEP_CONTENT: true, // 保留文本内容
  });
};

/**
 * 清理消息文本（仅用于显示）
 * 将特殊字符转换为 HTML 实体，防止 XSS
 */
export const sanitizeText = (text: string): string => {
  if (!text) return '';
  
  // 先用 DOMPurify 清理
  const cleaned = DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
  
  // 转义 HTML 特殊字符
  return cleaned
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * 清理 URL，仅允许安全的协议
 */
export const sanitizeURL = (url: string): string => {
  if (!url) return '';
  
  const cleaned = url.trim();
  
  // 仅允许 http, https, mailto 协议
  const allowedProtocols = ['http:', 'https:', 'mailto:'];
  
  try {
    const urlObj = new URL(cleaned);
    if (!allowedProtocols.includes(urlObj.protocol)) {
      return ''; // 不安全的协议，返回空字符串
    }
    return cleaned;
  } catch {
    // 无效的 URL
    return '';
  }
};

/**
 * 清理富文本内容（允许部分安全的 HTML 标签）
 */
export const sanitizeRichText = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target'],
    ALLOW_DATA_ATTR: false,
  });
};

/**
 * 清理用户名/昵称
 * 移除特殊字符和不可见字符
 */
export const sanitizeUsername = (username: string): string => {
  if (!username) return '';
  
  return username
    .trim()
    // 移除控制字符
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
    // 移除零宽字符
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // 限制为字母、数字、中文、下划线和连字符
    .replace(/[^\w\u4e00-\u9fa5-]/g, '');
};

/**
 * 转义正则表达式特殊字符
 */
export const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
