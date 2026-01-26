import React, { useState } from 'react';
import { UserPlus, AlertCircle, CheckCircle, Mail, Lock, User, MessageSquare, ArrowLeft } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface AccessRequestFormProps {
  onBack: () => void;
}

export default function AccessRequestForm({ onBack }: AccessRequestFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validation
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Les mots de passe ne correspondent pas');
      }

      if (formData.password.length < 6) {
        throw new Error('Le mot de passe doit contenir au moins 6 caractères');
      }

      // 1. Créer le compte utilisateur dans Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName
          }
        }
      });

      if (signUpError) throw signUpError;

      if (!authData.user) {
        throw new Error('Erreur lors de la création du compte');
      }

      // 2. Créer la demande d'accès
      const { error: requestError } = await supabase
        .from('access_requests')
        .insert({
          user_id: authData.user.id,
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          reason: formData.reason,
          status: 'pending'
        });

      if (requestError) {
        // Si erreur = limite atteinte
        if (requestError.message.includes('Limite de demandes atteinte')) {
          throw new Error('Vous avez atteint la limite de demandes pour cet email. Contactez un administrateur.');
        }
        throw requestError;
      }

      // Déconnexion immédiate (l'utilisateur ne peut pas se connecter avant approbation)
      await supabase.auth.signOut();

      setSuccess(true);
    } catch (err: any) {
      console.error('Erreur lors de la demande:', err);
      setError(err.message || 'Une erreur est survenue lors de la demande');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-green-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-10 text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Demande envoyée !</h1>
              <p className="text-green-100">Votre demande est en cours de traitement</p>
            </div>

            <div className="px-8 py-10">
              <div className="text-center mb-6">
                <p className="text-gray-700 mb-4">
                  Votre demande d'accès a été envoyée avec succès. Un administrateur va l'examiner prochainement.
                </p>
                <p className="text-sm text-gray-600">
                  Vous recevrez un email de confirmation une fois votre accès approuvé.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Note :</strong> Vous ne pourrez pas vous connecter tant que votre demande n'a pas été approuvée par un administrateur.
                </p>
              </div>

              <button
                onClick={onBack}
                className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:from-teal-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Retour à la connexion
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-500 to-emerald-600 px-8 py-10 text-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Demande d'accès</h1>
            <p className="text-teal-100">Remplissez le formulaire pour accéder à l'application</p>
          </div>

          {/* Form */}
          <div className="px-8 py-10">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Erreur</p>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nom et Prénom */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                      placeholder="Jean"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Nom *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                      placeholder="Dupont"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                    placeholder="nom@exemple.com"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Mots de passe */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={6}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                      placeholder="••••••••"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      minLength={6}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                      placeholder="••••••••"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Raison */}
              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                  Raison de la demande *
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <textarea
                    id="reason"
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none resize-none"
                    placeholder="Expliquez pourquoi vous avez besoin d'accéder à cette application..."
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Info */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>Important :</strong> Votre demande sera examinée par un administrateur. Vous recevrez un email une fois approuvée.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={onBack}
                  disabled={loading}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Retour
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:from-teal-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Envoi en cours...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <UserPlus className="w-5 h-5" />
                      <span>Envoyer la demande</span>
                    </div>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              En soumettant ce formulaire, vous acceptez que vos informations soient traitées par nos administrateurs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
