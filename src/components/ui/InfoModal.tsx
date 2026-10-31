import type { ReactNode } from 'react';
import { Info } from 'lucide-react';
import { Modal, Button } from '@/components/ui';

interface InfoModalProps {
  item: { title: string; description: string; details?: ReactNode } | null;
  onClose: () => void;
}

export function InfoModal({ item, onClose }: InfoModalProps) {
  return (
    <Modal
      open={Boolean(item)}
      onClose={onClose}
      title={item?.title || ''}
      subtitle="Information and next steps"
      icon={<Info className="w-5 h-5" />}
      footer={<Button onClick={onClose}>Close</Button>}
    >
      <p className="text-sm leading-relaxed text-neutral-600">{item?.description}</p>
      {item?.details && <div className="rounded-xl bg-primary-50 border border-primary-100 p-4 text-sm text-primary-800">{item.details}</div>}
    </Modal>
  );
}
