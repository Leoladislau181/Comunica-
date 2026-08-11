import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Profile } from '../types';
import { ArrowLeft, ShieldAlert, Plus, Users, Shield } from 'lucide-react';

export default function Admin() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States for creating conversation
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedContact, setSelectedContact] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (profile?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchUsers();
  }, [profile]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('display_name');
      
    if (!error && data) {
      setUsers(data as Profile[]);
    }
    setLoading(false);
  };

  const handleCreateConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !selectedContact || selectedPatient === selectedContact) {
      alert("Selecione duas pessoas diferentes.");
      return;
    }

    setCreating(true);
    try {
      // 1. Cria a conversa
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .insert({})
        .select()
        .single();
        
      if (convError) throw convError;

      // 2. Adiciona os participantes
      const { error: partError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: convData.id, user_id: selectedPatient },
          { conversation_id: convData.id, user_id: selectedContact }
        ]);

      if (partError) throw partError;

      alert("Conversa liberada com sucesso!");
      setSelectedPatient('');
      setSelectedContact('');
    } catch (error: any) {
      alert("Erro ao criar conversa: " + error.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-2xl">Carregando painel...</div>;

  const patients = users.filter(u => u.role === 'patient');
  const contacts = users.filter(u => u.role === 'contact' || u.role === 'admin');

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      <header className="flex items-center gap-6 px-4 md:px-8 py-4 bg-slate-900 text-white shadow-lg">
        <button 
          onClick={() => navigate('/')}
          className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center font-bold text-xl hover:bg-blue-600 transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft size={28} className="text-white" />
        </button>
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight uppercase line-clamp-1 flex items-center gap-2">
            <Shield size={28} className="text-blue-400" />
            Administração
          </h1>
          <span className="text-sm text-blue-300 font-medium tracking-widest uppercase">Área Restrita</span>
        </div>
      </header>

      <main className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
        
        {/* Important Warning */}
        <div className="bg-yellow-100 border-4 border-yellow-400 p-6 rounded-3xl shadow-sm">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="bg-yellow-300 p-4 rounded-2xl shrink-0">
              <ShieldAlert size={40} className="text-yellow-800" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-yellow-900 uppercase">Segurança de Usuários</h3>
              <p className="text-lg text-yellow-800 mt-2 font-medium">
                Para manter a segurança e não expor chaves secretas no aplicativo (como solicitado), a <strong>Criação, Edição de Senhas e Exclusão de usuários</strong> deve ser feita exclusivamente no painel <a href="https://app.supabase.com" target="_blank" rel="noreferrer" className="underline font-bold text-blue-700 hover:text-blue-900">Supabase Dashboard &gt; Authentication</a>.
              </p>
              <p className="text-lg text-yellow-800 mt-2 font-medium">
                Após criar um usuário lá, ele aparecerá na lista abaixo e você poderá conectá-lo a uma paciente.
              </p>
            </div>
          </div>
        </div>

        {/* Link Users */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-4 border-slate-200">
          <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3 uppercase">
            <div className="bg-blue-100 p-3 rounded-2xl text-blue-700">
              <Plus size={32} />
            </div>
            Liberar nova conversa
          </h2>
          <form onSubmit={handleCreateConversation} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xl font-black text-slate-700 mb-2 uppercase">Paciente / Principal</label>
              <select 
                value={selectedPatient} 
                onChange={e => setSelectedPatient(e.target.value)}
                required
                className="w-full text-xl font-bold p-4 bg-slate-100 border-4 border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 uppercase cursor-pointer"
              >
                <option value="">SELECIONE...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.display_name} ({u.role})</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xl font-black text-slate-700 mb-2 uppercase">Contato Autorizado</label>
              <select 
                value={selectedContact} 
                onChange={e => setSelectedContact(e.target.value)}
                required
                className="w-full text-xl font-bold p-4 bg-slate-100 border-4 border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 uppercase cursor-pointer"
              >
                <option value="">SELECIONE...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.display_name} ({u.role})</option>
                ))}
              </select>
            </div>
            
            <div className="md:col-span-2 pt-4">
              <button 
                type="submit" 
                disabled={creating}
                className="w-full bg-blue-600 text-white font-black text-2xl uppercase px-8 py-6 rounded-3xl hover:bg-blue-700 border-b-8 border-blue-800 active:border-b-0 active:translate-y-2 transition-all disabled:opacity-50 shadow-lg"
              >
                {creating ? 'LIBERANDO...' : 'LIBERAR CONVERSA'}
              </button>
            </div>
          </form>
        </div>

        {/* Users List */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border-4 border-slate-200">
          <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3 uppercase">
            <div className="bg-slate-200 p-3 rounded-2xl text-slate-700">
              <Users size={32} />
            </div>
            Usuários Cadastrados
          </h2>
          <div className="overflow-x-auto rounded-xl border-4 border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-lg uppercase font-black">
                  <th className="p-4 md:p-6 border-b-4 border-slate-200">Nome</th>
                  <th className="p-4 md:p-6 border-b-4 border-slate-200">Função</th>
                  <th className="p-4 md:p-6 border-b-4 border-slate-200">ID</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b-4 border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4 md:p-6 text-xl font-bold uppercase">{u.display_name}</td>
                    <td className="p-4 md:p-6">
                      <span className={
                        `px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest border-2
                        ${u.role === 'admin' ? 'bg-purple-100 text-purple-700 border-purple-300' : 
                          u.role === 'patient' ? 'bg-green-100 text-green-700 border-green-300' : 
                          'bg-slate-200 text-slate-700 border-slate-300'}`
                      }>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 md:p-6 text-slate-400 font-mono text-sm font-bold">{u.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
