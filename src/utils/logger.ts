/**
 * 日志工具
 * 在生产环境自动禁用 console.log，避免敏感信息泄露
 */

import { IS_DEV } from '../config/constants';

class Logger {
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = IS_DEV;
  }

  /**
   * 普通日志
   */
  log(...args: any[]): void {
    if (this.isEnabled) {
      console.log(...args);
    }
  }

  /**
   * 信息日志
   */
  info(...args: any[]): void {
    if (this.isEnabled) {
      console.info(...args);
    }
  }

  /**
   * 警告日志
   */
  warn(...args: any[]): void {
    if (this.isEnabled) {
      console.warn(...args);
    }
  }

  /**
   * 错误日志（生产环境也显示）
   */
  error(...args: any[]): void {
    console.error(...args);
  }

  /**
   * 调试日志
   */
  debug(...args: any[]): void {
    if (this.isEnabled) {
      console.debug(...args);
    }
  }

  /**
   * 分组日志开始
   */
  group(label: string): void {
    if (this.isEnabled) {
      console.group(label);
    }
  }

  /**
   * 分组日志结束
   */
  groupEnd(): void {
    if (this.isEnabled) {
      console.groupEnd();
    }
  }

  /**
   * 表格日志
   */
  table(data: any): void {
    if (this.isEnabled) {
      console.table(data);
    }
  }

  /**
   * 计时开始
   */
  time(label: string): void {
    if (this.isEnabled) {
      console.time(label);
    }
  }

  /**
   * 计时结束
   */
  timeEnd(label: string): void {
    if (this.isEnabled) {
      console.timeEnd(label);
    }
  }

  /**
   * 启用日志（仅用于调试）
   */
  enable(): void {
    this.isEnabled = true;
  }

  /**
   * 禁用日志
   */
  disable(): void {
    this.isEnabled = false;
  }
}

// 导出单例
export const logger = new Logger();

// 默认导出
export default logger;
