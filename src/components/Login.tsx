import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { LogIn } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('Falha ao entrar. Verifique seu e-mail e senha.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 font-sans text-slate-900 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border-4 border-slate-700">
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white font-black text-3xl shadow-lg border-4 border-blue-300">
            C+
          </div>
        </div>
        <h2 className="text-3xl font-black text-center text-slate-800 mb-8 uppercase tracking-wide">Comunica+</h2>
        
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-xl mb-6 text-lg font-bold border-4 border-red-300 uppercase">
            {error}
          </div>
        )}

        {!import.meta.env.VITE_SUPABASE_URL && (
          <div className="bg-yellow-100 text-yellow-800 p-4 rounded-xl mb-6 text-sm font-bold border-4 border-yellow-300">
            ATENÇÃO: Você precisa configurar as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env para que o login funcione.
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xl font-black text-slate-700 mb-2 uppercase">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-6 py-4 text-2xl font-bold bg-slate-100 border-4 border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 transition-colors uppercase placeholder:text-slate-400 placeholder:font-medium"
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
              className="w-full px-6 py-4 text-2xl font-bold bg-slate-100 border-4 border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 transition-colors uppercase placeholder:text-slate-400 placeholder:font-medium"
              placeholder="SUA SENHA"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white text-3xl font-black py-6 px-8 rounded-3xl hover:bg-blue-700 border-b-8 border-blue-800 active:border-b-0 active:translate-y-2 transition-all disabled:opacity-50 mt-8 uppercase shadow-xl"
          >
            {loading ? 'ENTRANDO...' : (
              <>
                <LogIn size={36} />
                ENTRAR
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
