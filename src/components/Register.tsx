import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { UserPlus, ArrowLeft } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('contact');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: name,
          role: role,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 font-sans text-slate-900 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border-4 border-slate-700 text-center">
          <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-green-300">
            <UserPlus size={48} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-4 uppercase">Conta Criada!</h2>
          <p className="text-xl font-bold text-slate-600 mb-8 uppercase">
            Sua conta foi criada com sucesso. Você já pode fazer login.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-blue-600 text-white text-2xl font-black py-4 px-8 rounded-3xl hover:bg-blue-700 border-b-8 border-blue-800 active:border-b-0 active:translate-y-2 transition-all uppercase shadow-xl"
          >
            IR PARA LOGIN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 font-sans text-slate-900 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border-4 border-slate-700">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => navigate('/login')}
            className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center font-bold hover:bg-slate-300 transition-colors"
          >
            <ArrowLeft size={24} className="text-slate-700" />
          </button>
          <h2 className="text-3xl font-black text-slate-800 uppercase tracking-wide">NOVA CONTA</h2>
          <div className="w-12"></div> {/* Spacer */}
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-xl mb-6 text-sm font-bold border-4 border-red-300 uppercase">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xl font-black text-slate-700 mb-2 uppercase">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-6 py-4 text-xl font-bold bg-slate-100 border-4 border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 transition-colors uppercase placeholder:text-slate-400 placeholder:font-medium"
              placeholder="SEU NOME"
            />
          </div>

          <div>
            <label className="block text-xl font-black text-slate-700 mb-2 uppercase">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-6 py-4 text-xl font-bold bg-slate-100 border-4 border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 transition-colors uppercase placeholder:text-slate-400 placeholder:font-medium"
              placeholder="SEU E-MAIL"
            />
          </div>

          <div>
            <label className="block text-xl font-black text-slate-700 mb-2 uppercase">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-6 py-4 text-xl font-bold bg-slate-100 border-4 border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 transition-colors uppercase placeholder:text-slate-400 placeholder:font-medium"
              placeholder="CRIAR SENHA (MÍN. 6)"
            />
          </div>

          <div>
            <label className="block text-xl font-black text-slate-700 mb-2 uppercase">Tipo de Perfil</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-6 py-4 text-xl font-bold bg-slate-100 border-4 border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 transition-colors uppercase cursor-pointer"
            >
              <option value="patient">Paciente (Usuária Principal)</option>
              <option value="contact">Contato / Familiar</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-green-600 text-white text-2xl font-black py-6 px-8 rounded-3xl hover:bg-green-700 border-b-8 border-green-800 active:border-b-0 active:translate-y-2 transition-all disabled:opacity-50 mt-8 uppercase shadow-xl"
          >
            {loading ? 'SALVANDO...' : (
              <>
                <UserPlus size={32} />
                CADASTRAR
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
