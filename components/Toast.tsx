
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface ToastProps {
  messages: ToastMessage[];
  onRemove: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ messages, onRemove }) => {
  return createPortal(
    <div className="fixed top-4 left-0 right-0 z-[9999] flex flex-col items-center gap-2 pointer-events-none px-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`
            pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md animate-fade-in-down transition-all max-w-sm w-full
            ${msg.type === 'success' ? 'bg-white/90 border-teal-100 text-teal-800' : ''}
            ${msg.type === 'error' ? 'bg-white/90 border-rose-100 text-rose-800' : ''}
            ${msg.type === 'info' ? 'bg-white/90 border-blue-100 text-blue-800' : ''}
          `}
        >
          <div className={`
            p-1.5 rounded-full shrink-0
            ${msg.type === 'success' ? 'bg-teal-100 text-teal-600' : ''}
            ${msg.type === 'error' ? 'bg-rose-100 text-rose-600' : ''}
            ${msg.type === 'info' ? 'bg-blue-100 text-blue-600' : ''}
          `}>
            {msg.type === 'success' && <CheckCircle size={18} strokeWidth={2.5} />}
            {msg.type === 'error' && <AlertCircle size={18} strokeWidth={2.5} />}
            {msg.type === 'info' && <AlertCircle size={18} strokeWidth={2.5} />}
          </div>
          
          <p className="text-sm font-bold flex-1">{msg.text}</p>
          
          <button 
            onClick={() => onRemove(msg.id)}
            className="p-1 rounded-full hover:bg-gray-100/50 text-gray-400 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
};

export default Toast;
