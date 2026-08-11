import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Profile } from '../types';
import { LogOut, User as UserIcon, Settings } from 'lucide-react';

interface ContactView {
  conversation_id: string;
  contact: Profile;
}

export default function Dashboard() {
  const { profile, signOut } = useAuth();
  const [contacts, setContacts] = useState<ContactView[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile) return;
    fetchConversations();
  }, [profile]);

  const fetchConversations = async () => {
    try {
      // Pega todas as conversas que o usuário participa
      const { data: myParticipants, error: partError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', profile!.id);

      if (partError) throw partError;
      if (!myParticipants || myParticipants.length === 0) {
        setContacts([]);
        setLoading(false);
        return;
      }

      const conversationIds = myParticipants.map(p => p.conversation_id);

      // Pega os OUTROS participantes dessas conversas
      const { data: otherParticipants, error: otherError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          profiles ( id, display_name, role )
        `)
        .in('conversation_id', conversationIds)
        .neq('user_id', profile!.id);

      if (otherError) throw otherError;

      const formattedContacts: ContactView[] = otherParticipants.map((p: any) => ({
        conversation_id: p.conversation_id,
        contact: p.profiles as Profile
      }));

      setContacts(formattedContacts);
    } catch (error) {
      console.error('Erro ao buscar contatos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-3xl text-center">Carregando contatos...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 overflow-hidden bg-slate-50">
      <header className="flex items-center justify-between px-4 md:px-8 py-4 bg-slate-900 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center font-bold text-xl uppercase">
            {profile?.display_name.substring(0, 2)}
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight uppercase line-clamp-1">{profile?.display_name}</h1>
            <p className="text-sm text-blue-300 font-medium tracking-widest uppercase">Escolha com quem falar</p>
          </div>
        </div>
        <div className="flex gap-4">
          {profile?.role === 'admin' && (
            <button 
              onClick={() => navigate('/admin')}
              className="px-4 py-2 bg-slate-700 rounded-lg font-bold border border-slate-600 uppercase text-sm flex items-center gap-2 hover:bg-slate-600 transition-colors"
              aria-label="Administração"
            >
              <Settings size={20} className="hidden md:block" /> Admin
            </button>
          )}
          <button 
            onClick={signOut}
            className="px-4 py-2 bg-red-900/50 text-red-100 rounded-lg font-bold border border-red-800 uppercase text-sm hover:bg-red-800 transition-colors flex items-center gap-2"
            aria-label="Sair"
          >
            <LogOut size={20} className="hidden md:block" /> Sair
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full max-w-4xl mx-auto space-y-6">
        <div className="p-4 bg-slate-200 rounded-2xl mb-8">
          <h2 className="text-xl font-black text-slate-700 uppercase tracking-wide">Seus Contatos</h2>
        </div>

        <div className="space-y-4">
          {contacts.length === 0 ? (
            <div className="text-center p-12 bg-white rounded-3xl shadow-sm border-4 border-dashed border-slate-300">
              <p className="text-2xl font-bold text-slate-500 uppercase">Nenhum contato disponível.</p>
              <p className="text-xl font-medium text-slate-400 mt-2 uppercase">O administrador precisa liberar seus contatos.</p>
            </div>
          ) : (
            contacts.map((c) => (
              <button
                key={c.conversation_id}
                onClick={() => navigate(`/chat/${c.conversation_id}`)}
                className="w-full flex items-center p-6 md:p-8 bg-white text-slate-700 rounded-3xl border-4 border-slate-200 hover:border-blue-400 hover:shadow-lg active:bg-slate-100 transition-all text-left"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-200 rounded-full flex items-center justify-center font-black text-3xl md:text-4xl mr-6 text-slate-700">
                  {c.contact.display_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="text-2xl md:text-3xl font-bold leading-tight uppercase">{c.contact.display_name}</div>
                  <div className="text-sm md:text-base font-bold text-slate-400 uppercase mt-1">Toque para conversar</div>
                </div>
              </button>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
