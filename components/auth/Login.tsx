import React, { useState } from 'react';
import { LogIn, AlertCircle, Mail, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import AccessRequestForm from './AccessRequestForm';

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAccessRequest, setShowAccessRequest] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      if (data.user) {
        // Laisser App.tsx gérer la vérification du profil via onAuthStateChange
        onLoginSuccess();
      }
    } catch (err: any) {
      console.error('Erreur de connexion:', err);
      setError(err.message || 'Une erreur est survenue lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  if (showAccessRequest) {
    return <AccessRequestForm onBack={() => setShowAccessRequest(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-green-50 dark:from-dark-800 dark:via-dark-750 dark:to-dark-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-dark-700 rounded-5xl shadow-xl border border-gray-100 dark:border-dark-600 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-500 to-emerald-600 dark:from-teal-600 dark:to-emerald-700 px-8 py-10 text-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-3xl flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Bienvenue</h1>
            <p className="text-teal-100">Connectez-vous à votre espace</p>
          </div>

          {/* Form */}
          <div className="px-8 py-10">
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-3xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">Erreur de connexion</p>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-dark-100 mb-2">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-dark-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-dark-600 rounded-2xl focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent transition-all outline-none bg-white dark:bg-dark-750 text-gray-900 dark:text-dark-100 placeholder-gray-400 dark:placeholder-dark-400"
                    placeholder="nom@exemple.com"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-dark-100 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-dark-400" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-dark-600 rounded-2xl focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent transition-all outline-none bg-white dark:bg-dark-750 text-gray-900 dark:text-dark-100 placeholder-gray-400 dark:placeholder-dark-400"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 dark:from-teal-600 dark:to-emerald-700 text-white py-3 px-4 rounded-2xl font-medium hover:from-teal-600 hover:to-emerald-700 dark:hover:from-teal-700 dark:hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:ring-offset-2 dark:focus:ring-offset-dark-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Connexion en cours...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <LogIn className="w-5 h-5" />
                    <span>Se connecter</span>
                  </div>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 bg-gray-50 dark:bg-dark-750 border-t border-gray-100 dark:border-dark-600">
            <button
              onClick={() => setShowAccessRequest(true)}
              className="w-full text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium transition-colors mb-3"
            >
              Pas encore d'accès ? Faire une demande
            </button>
            <p className="text-xs text-gray-500 dark:text-dark-400 text-center">
              Protégé par Supabase Authentication
            </p>
          </div>
        </div>

        {/* Help text */}
        <p className="text-center text-sm text-gray-600 dark:text-dark-300 mt-6">
          Contactez votre administrateur si vous avez oublié vos identifiants
        </p>
      </div>
    </div>
  );
}
