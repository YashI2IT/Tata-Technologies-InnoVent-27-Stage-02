import React, { useEffect, useState } from 'react';
import { api, NotificationItem } from '@/services/api';
import { CheckCheck, Bell, AlertTriangle, AlertCircle, Info, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { slideDownPop } from '@/lib/motion';

interface NotificationPanelProps {
 isOpen: boolean;
 onClose: () => void;
 refreshTrigger: number; // Used to manually trigger a refresh from parent
 onUnreadCountChange: (count: number) => void;
}

export function NotificationPanel({ isOpen, onClose, refreshTrigger, onUnreadCountChange }: NotificationPanelProps) {
 const [notifications, setNotifications] = useState<NotificationItem[]>([]);
 const [isLoading, setIsLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const fetchNotifications = async () => {
 setIsLoading(true);
 setError(null);
 try {
 const data = await api.getNotifications();
 setNotifications(data);
 const unreadCount = data.filter((n) => !n.is_read).length;
 onUnreadCountChange(unreadCount);
 } catch (err) {
 console.error(err);
 setError('Unable to load notifications.');
 } finally {
 setIsLoading(false);
 }
 };

 useEffect(() => {
 fetchNotifications();
 }, [isOpen, refreshTrigger]);

 const handleMarkAllRead = async () => {
 try {
 await api.markNotificationsRead();
 setNotifications(notifications.map(n => ({ ...n, is_read: true })));
 onUnreadCountChange(0);
 } catch (err) {
 console.error(err);
 }
 };

 const handleNotificationClick = (notification: NotificationItem) => {
 // Navigate or open report based on entity
 if (notification.entity_type === 'inspection') {
 window.open(api.getReportUrl(notification.entity_id), '_blank');
 }
 // We don't mark individual read yet since backend only supports mark all read,
 // but a real production app would have individual read marks.
 // For now we'll just close it.
 onClose();
 };

 const formatTime = (isoString: string) => {
 const date = new Date(isoString);
 const now = new Date();
 const diffMs = now.getTime() - date.getTime();
 const diffMins = Math.floor(diffMs / 60000);
 if (diffMins < 1) return 'Just now';
 if (diffMins < 60) return `${diffMins} min ago`;
 const diffHrs = Math.floor(diffMins / 60);
 if (diffHrs < 24) return `${diffHrs} hr ago`;
 return date.toLocaleDateString();
 };

 return (
 <AnimatePresence>
 {isOpen && (
 <>
 <div className="fixed inset-0 z-40" onClick={onClose}></div>
 <motion.div 
 variants={slideDownPop}
 initial="initial"
 animate="animate"
 exit="exit"
 className="absolute top-[64px] right-6 w-[380px] bg-surface rounded-xl shadow-xl border border-border-subtle overflow-hidden flex flex-col z-50 origin-top-right"
 >
 <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-surface-secondary/50">
 <div className="flex items-center gap-2">
 <h3 className="font-semibold text-text-primary text-[14px]">Notifications</h3>
 {notifications.filter(n => !n.is_read).length > 0 && (
 <span className="bg-brand text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
 {notifications.filter(n => !n.is_read).length}
 </span>
 )}
 </div>
 <button 
 onClick={handleMarkAllRead}
 className="text-[12px] font-medium text-brand hover:text-[#000080] transition-colors flex items-center gap-1"
 >
 <CheckCheck size={14} />
 Mark all read
 </button>
 </div>

 <div className="max-h-[400px] overflow-y-auto">
 {isLoading && notifications.length === 0 ? (
 <div className="py-8 text-center text-sm text-text-muted">Loading notifications...</div>
 ) : error ? (
 <div className="py-8 flex flex-col items-center justify-center text-center">
 <span className="text-sm text-text-muted mb-2">{error}</span>
 <button onClick={fetchNotifications} className="text-xs text-brand font-medium hover:underline">Retry</button>
 </div>
 ) : notifications.length === 0 ? (
 <div className="py-12 flex flex-col items-center justify-center text-center">
 <div className="w-10 h-10 bg-surface-secondary rounded-full flex items-center justify-center mb-3">
 <Bell size={20} className="text-gray-300" />
 </div>
 <p className="text-sm font-medium text-text-primary">You're all caught up.</p>
 <p className="text-xs text-text-muted mt-1">No new system or inspection events.</p>
 </div>
 ) : (
 <div className="divide-y divide-gray-100">
 {notifications.map((notification) => {
 let Icon = Info;
 let iconColor = 'text-brand bg-blue-50';
 
 if (notification.severity === 'high' || notification.severity === 'critical') {
 Icon = AlertCircle;
 iconColor = 'text-red-600 bg-red-50';
 } else if (notification.severity === 'warning') {
 Icon = AlertTriangle;
 iconColor = 'text-[#FF9C00] bg-orange-50';
 } else if (notification.severity === 'success') {
 Icon = FileText;
 iconColor = 'text-teal bg-teal-50';
 }

 return (
 <div 
 key={notification.id} 
 className={`p-4 flex gap-3 cursor-pointer hover:bg-surface-secondary transition-colors ${!notification.is_read ? 'bg-blue-50/30' : ''}`}
 onClick={() => handleNotificationClick(notification)}
 >
 <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${iconColor}`}>
 <Icon size={16} />
 </div>
 <div className="flex flex-col flex-1">
 <div className="flex items-start justify-between gap-2">
 <span className={`text-[13px] font-medium leading-snug ${!notification.is_read ? 'text-text-primary' : 'text-text-secondary'}`}>
 {notification.title}
 </span>
 </div>
 <span className="text-[12px] text-text-muted mt-1 leading-snug">
 {notification.message}
 </span>
 <span className="text-[11px] text-text-disabled mt-2 font-medium">
 {formatTime(notification.created_at)}
 </span>
 </div>
 {!notification.is_read && (
 <div className="w-2 h-2 bg-brand rounded-full mt-1.5 shrink-0"></div>
 )}
 </div>
 );
 })}
 </div>
 )}
 </div>
 </motion.div>
 </>
 )}
 </AnimatePresence>
 );
}
