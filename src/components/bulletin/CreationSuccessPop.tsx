import React from 'react';

export interface CreationSuccessItem {
  type: 'story' | 'reel' | 'post';
  title?: string;
  description?: string;
  mediaUrl?: string;
  videoUrl?: string;
  gradientClass?: string;
  authorName?: string;
  authorAvatar?: string;
  id?: string | number;
}

interface CreationSuccessPopProps {
  item: CreationSuccessItem | null;
  onClose: () => void;
  onViewItem?: (item: CreationSuccessItem) => void;
  isRtl?: boolean;
}

/**
  Deprecated popup modal component.
  Replaced by the central unified system toast notification engine (`toast.success` / `toast.notifySuccess`).
 */
export const CreationSuccessPop: React.FC<CreationSuccessPopProps> = () => {
  return null;
};
