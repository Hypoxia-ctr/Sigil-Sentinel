import React, { useState, useEffect, useRef } from 'react';
import { useSound } from '../../hooks/useSound';

// --- ICONS ---
const UserIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const BotIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8" /><rect x="4" y="8" width="16" height="12" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>;
const SendIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>;

// --- TYPES & MOCK DATA ---
type Contact = {
  id: string;
  name: string;
  status: 'online' | 'offline';
  icon: React.ReactNode;
};
type Message = {
  id: number;
  contactId: string;
  sender: 'me' | 'them';
  text: string;
  timestamp: string;
};

const CONTACTS: Contact[] = [
  { id: 'oracle', name: 'Oracle AI', status: 'online', icon: <BotIcon /> },
  { id: 'field-agent', name: 'Field Agent 7', status: 'online', icon: <UserIcon /> },
  { id: 'archive', name: 'Data Archive', status: 'offline', icon: <BotIcon /> },
];

const MESSAGE_HISTORY: Message[] = [
  { id: 1, contactId: 'oracle', sender: 'them', text: 'Connection established. Oracle is listening. How may I assist you?', timestamp: '10:30 AM' },
  { id: 2, contactId: 'field-agent', sender: 'them', text: 'Secure channel open. Reporting from sector Gamma-9. All clear.', timestamp: '10:28 AM' },
  { id: 3, contactId: 'field-agent', sender: 'me', text: 'Acknowledged. Maintain position and report any anomalies.', timestamp: '10:29 AM' },
];


const SubnetMessenger: React.FC = () => {
    const [activeContactId, setActiveContactId] = useState<string>('oracle');
    const [messages, setMessages] = useState<Message[]>(MESSAGE_HISTORY);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const { playClick, playConfirm, playHover } = useSound();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!input.trim() || isSending) return;
        
        playConfirm();
        setIsSending(true);

        const newMessage: Message = {
            id: Date.now(),
            contactId: activeContactId,
            sender: 'me',
            text: input,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, newMessage]);
        setInput('');

        // Simulate Oracle response
        setTimeout(() => {
            if (activeContactId === 'oracle') {
                 const oracleResponse: Message = {
                    id: Date.now() + 1,
                    contactId: 'oracle',
                    sender: 'them',
                    text: 'Your query is being processed through the quantum ether... Acknowledged.',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                 setMessages(prev => [...prev, oracleResponse]);
            }
            setIsSending(false);
        }, 1200);
    };

    const activeContact = CONTACTS.find(c => c.id === activeContactId);
    const activeMessages = messages.filter(m => m.contactId === activeContactId);

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
        <h1 className="text-3xl font-bold mb-4 text-green-400 drop-shadow-[0_2px_4px_rgba(74,222,128,0.3)]">Subnet Messenger</h1>
        <div className="flex-grow grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100%-80px)]">
            {/* Contacts List */}
            <div className="md:col-span-1 bg-black/30 rounded-lg border border-green-500/20 p-4 flex flex-col hx-glow-border" style={{'--glow-color':'var(--lime)'} as React.CSSProperties}>
                <h2 className="text-lg font-semibold text-green-300 border-b border-green-500/20 pb-2 mb-2">Contacts</h2>
                <ul className="space-y-2">
                    {CONTACTS.map(contact => (
                        <li key={contact.id}>
                            <button
                                onClick={() => { playClick(); setActiveContactId(contact.id); }}
                                onMouseEnter={playHover}
                                disabled={contact.status === 'offline'}
                                className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
                                    activeContactId === contact.id ? 'bg-green-500/20' : 'hover:bg-green-500/10'
                                } ${contact.status === 'offline' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <span className={`p-2 rounded-full ${activeContactId === contact.id ? 'bg-green-500/30' : 'bg-black/30'}`}>
                                    {contact.icon}
                                </span>
                                <div>
                                    <p className="font-semibold text-gray-200">{contact.name}</p>
                                    <p className={`text-xs ${contact.status === 'online' ? 'text-green-400' : 'text-gray-500'}`}>{contact.status}</p>
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Chat Area */}
            <div className="md:col-span-3 bg-black/30 rounded-lg border border-green-500/20 flex flex-col h-full hx-glow-border" style={{'--glow-color':'var(--lime)'} as React.CSSProperties}>
                <div className="p-3 border-b border-green-500/20 flex items-center gap-3">
                    <span className={`p-2 rounded-full bg-black/30`}>{activeContact?.icon}</span>
                    <div>
                         <h3 className="text-xl font-bold text-gray-100">{activeContact?.name}</h3>
                         <p className={`text-xs ${activeContact?.status === 'online' ? 'text-green-400' : 'text-gray-500'}`}>{activeContact?.status}</p>
                    </div>
                </div>
                
                <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                    {activeMessages.map(msg => (
                        <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                           {msg.sender === 'them' && <span className="p-2 rounded-full bg-black/50 text-green-400 self-start">{activeContact?.icon}</span>}
                            <div className={`max-w-md p-3 rounded-lg ${msg.sender === 'me' ? 'bg-green-800/50 text-gray-200' : 'bg-gray-800/50 text-gray-300'}`}>
                                <p>{msg.text}</p>
                                <p className="text-xs text-gray-500 text-right mt-1">{msg.timestamp}</p>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                
                <div className="p-3 border-t border-green-500/20">
                    <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isSending ? 'Encrypting...' : `Message ${activeContact?.name}...`}
                            className="flex-grow bg-black/40 border border-green-500/30 rounded-lg py-2 px-3 focus:ring-green-500 focus:border-green-500"
                            disabled={isSending}
                        />
                        <button type="submit" className="btn primary bg-green-600 hover:bg-green-500 p-3" disabled={isSending}>
                           <SendIcon />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
  );
};

export default SubnetMessenger;