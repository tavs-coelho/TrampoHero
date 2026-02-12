import React from 'react';
import { Message, UserProfile } from '../../types';

interface EmployerChatViewProps {
  user: UserProfile;
  messages: Message[];
  inputText: string;
  setInputText: (v: string) => void;
  handleSendMessage: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  setView: (v: 'dashboard') => void;
}

export const EmployerChatView: React.FC<EmployerChatViewProps> = ({ user, messages, inputText, setInputText, handleSendMessage, messagesEndRef, setView }) => (
  <div className="flex flex-col h-[calc(100vh-12rem)] animate-in fade-in duration-500">
    <div className="flex items-center gap-4 mb-6 border-b pb-4">
        <button onClick={() => setView('dashboard')} className="w-10 h-10 bg-white border rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"><i className="fas fa-arrow-left"></i></button>
        <div>
             <h2 className="font-black text-slate-900">Suporte Empresarial</h2>
             <p className="text-[10px] font-bold text-indigo-600 uppercase">Prioridade Alta</p>
        </div>
    </div>
    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {messages.length === 0 && (
            <div className="text-center mt-10 opacity-40">
                <i className="fas fa-headset text-4xl mb-2"></i>
                <p className="text-xs font-bold">Olá! Como posso ajudar sua empresa hoje?</p>
            </div>
        )}
        {messages.map(m => (
            <div key={m.id} className={`flex flex-col ${m.senderId === user.id ? 'items-end' : 'items-start'}`}>
                <div className={`p-4 rounded-[1.8rem] max-w-[85%] text-sm font-medium ${m.senderId === user.id ? 'bg-slate-900 text-white' : 'bg-white border shadow-sm'}`}>
                    {m.text}
                </div>
            </div>
        ))}
        <div ref={messagesEndRef} />
    </div>
    <div className="mt-6 flex gap-3 bg-white p-3 rounded-[2.5rem] shadow-xl border border-slate-100">
        <input value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} className="flex-1 px-4 bg-transparent focus:outline-none text-sm font-medium" placeholder="Digite sua dúvida..." />
        <button onClick={handleSendMessage} className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-slate-700 transition-colors"><i className="fas fa-paper-plane"></i></button>
    </div>
  </div>
);
