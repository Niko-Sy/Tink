import React, { useState } from 'react';
import { Modal, Select, Input } from 'antd';

interface MuteMemberModalProps {
  isOpen: boolean;
  userName: string;
  onClose: () => void;
  onConfirm: (duration: number, reason?: string) => void;
}

const MuteMemberModal: React.FC<MuteMemberModalProps> = ({
  isOpen,
  userName,
  onClose,
  onConfirm,
}) => {
  const [duration, setDuration] = useState<number>(10);
  const [reason, setReason] = useState('');

  const handleOk = () => {
    onConfirm(duration, reason.trim() || undefined);
    handleClose();
  };

  const handleClose = () => {
    setDuration(300);
    setReason('');
    onClose();
  };

  const durationOptions = [
    { label: '5分钟', value: 5*60 },
    { label: '10分钟', value: 10*60 },
    { label: '30分钟', value: 30*60 },
    { label: '1小时', value: 60*60 },
    { label: '12小时', value: 720*60 },
    { label: '1天', value: 1440*60 },
    { label: '7天', value: 10080*60 },
    { label: '永久', value: -1 },
  ];

  return (
    <Modal
      title={`禁言用户: ${userName}`}
      open={isOpen}
      onOk={handleOk}
      onCancel={handleClose}
      okText="确定"
      cancelText="取消"
      width={400}
    >
      <div className="space-y-4 py-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            禁言时长
          </label>
          <Select
            value={duration}
            onChange={setDuration}
            style={{ width: '100%' }}
            options={durationOptions}
            placeholder="选择禁言时长"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            禁言原因（可选）
          </label>
          <Input.TextArea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="请输入禁言原因..."
            rows={3}
            maxLength={200}
            showCount
          />
        </div>

        <div className="text-xs text-gray-500 mt-2">
          <p>• 禁言后该用户将无法在聊天室发送消息</p>
          <p>• 选择"永久"表示无限期禁言，需手动解除</p>
        </div>
      </div>
    </Modal>
  );
};

export default MuteMemberModal;
