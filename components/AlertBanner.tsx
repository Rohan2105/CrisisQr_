'use client';

import { useAlert } from '@/context/AlertContext';
import { AlertTriangle, Info, Bell } from 'lucide-react';

export default function AlertBanner() {
  const { alert } = useAlert();

  if (!alert.type || !alert.message) return null;

  const bgStyles = {
    CRITICAL: 'bg-status-critical border-status-critical text-white',
    WARNING: 'bg-status-high border-status-high text-white',
    INFO: 'bg-status-low border-status-low text-white',
  };

  const Icons = {
    CRITICAL: AlertTriangle,
    WARNING: Bell,
    INFO: Info,
  };

  const Icon = Icons[alert.type];

  return (
    <div className={`w-full p-3 border-b-2 flex items-center justify-center gap-3 font-bold uppercase tracking-tight z-[100] relative ${bgStyles[alert.type]}`}>
      <Icon size={20} />
      <span>GOVERNMENT ALERT: {alert.message}</span>
    </div>
  );
}
