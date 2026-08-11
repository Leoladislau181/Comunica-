import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Message, Profile } from '../types';
import { addPendingMessage, getPendingMessages, removePendingMessage } from '../lib/offline';
import { ArrowLeft, Send, AlertCircle, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

const QUICK_PHRASES = [
  "Estou com dor",
  "Preciso de ajuda",
  "Estou com sede",
  "Estou com fome",
  "Preciso ir ao banheiro",
  "Quero falar com você",
  "Venha aqui, por favor",
  "Estou bem",
  "Não estou bem",
  "Preciso de alguma coisa"
];

export default function Chat() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [contactName, setContactName] = useState<string>('Contato');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversationId || !profile) return;
    
    fetchContact();
    fetchMessages();
    loadPendingMessages();

    // Listen to network changes
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingMessages();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Subscribe to realtime messages
    const subscription = supabase
      .channel(`chat:${conversationId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, payload => {
        const newMsg = payload.new as Message;
        // Só adiciona se não for minha própria mensagem recém enviada (para evitar duplicidade visual)
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        scrollToBottom();
      })
      .subscribe();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      subscription.unsubscribe();
    };
  }, [conversationId, profile]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, pending]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchContact = async () => {
    const { data } = await supabase
      .from('conversation_participants')
      .select('profiles(display_name)')
      .eq('conversation_id', conversationId)
      .neq('user_id', profile!.id)
      .single();
    
    if (data && data.profiles) {
      setContactName((data.profiles as any).display_name);
    }
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
      
    if (data) setMessages(data as Message[]);
  };

  const loadPendingMessages = async () => {
    const pendings = await getPendingMessages();
    setPending(pendings.filter(p => p.conversation_id === conversationId));
  };

  const syncPendingMessages = async () => {
    const allPending = await getPendingMessages();
    if (allPending.length === 0) return;

    for (const msg of allPending) {
      const { error } = await supabase.from('messages').insert({
        conversation_id: msg.conversation_id,
        sender_id: msg.sender_id,
        content: msg.content,
      });

      if (!error) {
        await removePendingMessage(msg.id);
      }
    }
    loadPendingMessages();
    fetchMessages();
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || !profile || !conversationId) return;
    
    const content = text.trim();
    setInputText(''); // Limpa o campo imediatamente

    if (isOnline) {
      // Otimista
      const tempId = crypto.randomUUID();
      const newMsg: Message = {
        id: tempId,
        conversation_id: conversationId,
        sender_id: profile.id,
        content,
        created_at: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, newMsg]);

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: profile.id,
          content,
        })
        .select()
        .single();

      if (error) {
        // Se falhar online (ex: queda repentina), joga pra fila
        await saveOfflineMessage(newMsg);
        setMessages(prev => prev.filter(m => m.id !== tempId));
      } else {
        // Atualiza a ID temporária com a real do banco
        setMessages(prev => prev.map(m => m.id === tempId ? data as Message : m));
      }
    } else {
      const offlineMsg = {
        id: crypto.randomUUID(),
        conversation_id: conversationId,
        sender_id: profile.id,
        content,
        created_at: new Date().toISOString(),
      };
      await saveOfflineMessage(offlineMsg);
    }
  };

  const saveOfflineMessage = async (msg: any) => {
    await addPendingMessage(msg);
    loadPendingMessages();
  };

  const allMessages = [...messages, ...pending.map(p => ({ ...p, pending: true }))].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className="flex flex-col h-screen w-full bg-white font-sans text-slate-900 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-8 py-4 bg-slate-900 text-white shadow-lg z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center font-bold text-xl hover:bg-blue-600 transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft size={28} className="text-white" />
          </button>
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight uppercase line-clamp-1">{contactName}</span>
            <span className="text-sm text-blue-300 font-medium tracking-widest uppercase">
              {isOnline ? 'Conectado' : 'Sem internet'}
            </span>
          </div>
        </div>
        
        {!isOnline && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></span>
            <span className="hidden md:inline text-lg font-semibold uppercase text-orange-400">Offline</span>
          </div>
        )}
      </header>

      {/* Messages */}
      <main className="flex-1 p-4 md:p-8 space-y-6 overflow-y-auto bg-slate-50 flex flex-col">
        {allMessages.map((msg) => {
          const isMine = msg.sender_id === profile?.id;
          return (
            <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
              <div 
                className={cn(
                  "p-6 rounded-3xl shadow-md max-w-[85%] md:max-w-md",
                  isMine 
                    ? "bg-blue-600 text-white rounded-tr-none border-4 border-blue-500" 
                    : "bg-white text-slate-900 rounded-tl-none border-2 border-slate-200"
                )}
              >
                <p className={cn(
                  "text-2xl md:text-3xl leading-snug break-words whitespace-pre-wrap",
                  isMine ? "font-bold italic" : "font-medium"
                )}>
                  {msg.content}
                </p>
                <div className={cn(
                  "text-sm font-bold uppercase mt-4 flex items-center gap-2",
                  isMine ? "text-blue-200" : "text-slate-400"
                )}>
                  {isMine ? 'Você' : contactName} • {format(new Date(msg.created_at), 'HH:mm')}
                  {msg.pending && (
                    <span className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded font-black text-xs uppercase">
                      <Clock size={12} /> Aguardando
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area Container */}
      <div className="p-4 md:p-6 bg-white border-t-4 border-slate-100 shadow-2xl z-10 flex flex-col">
        {/* Quick Phrases */}
        <div className="overflow-x-auto whitespace-nowrap flex gap-3 mb-6 pb-2 scrollbar-hide">
          {QUICK_PHRASES.map((phrase, i) => {
            const isEmergency = phrase.toLowerCase().includes('dor') || phrase.toLowerCase().includes('ajuda');
            return (
              <button
                key={i}
                onClick={() => setInputText(phrase)}
                className={cn(
                  "p-4 rounded-xl font-black text-lg uppercase leading-tight shrink-0 transition-colors border-4",
                  isEmergency
                    ? "bg-red-100 text-red-700 border-red-300 hover:bg-red-200"
                    : "bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200"
                )}
              >
                {phrase}
              </button>
            );
          })}
        </div>

        {/* Input Form */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(inputText); }}
          className="flex gap-4 items-center"
        >
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="ESCREVA AQUI..."
              className="w-full bg-slate-100 border-4 border-slate-200 rounded-3xl py-4 px-6 md:py-6 md:px-8 text-2xl md:text-3xl font-black text-slate-800 focus:outline-none focus:border-blue-500 uppercase placeholder:text-slate-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSend(inputText);
                }
              }}
            />
          </div>
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="bg-blue-600 text-white rounded-3xl px-8 md:px-12 py-4 md:py-6 text-2xl md:text-4xl font-black uppercase shadow-xl hover:bg-blue-700 border-b-8 border-blue-800 active:border-b-0 active:translate-y-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
            aria-label="Enviar mensagem"
          >
            <Send size={36} className="md:hidden" />
            <span className="hidden md:inline">ENVIAR</span>
          </button>
        </form>
      </div>
    </div>
  );
}
