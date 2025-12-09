
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { ArrowLeft, Mail, Lock, User as UserIcon, Check, CheckSquare, Square, AlertCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface AuthProps {
  onLoginSuccess: () => void; // App component will handle user state via subscription
  initialMode?: 'login' | 'register';
  onBack: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLoginSuccess, initialMode = 'login', onBack }) => {
  const [isRegistering, setIsRegistering] = useState(initialMode === 'register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Supabase Auth metadata
  const [rememberMe, setRememberMe] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
        if (isRegistering) {
            // REGISTRÁCIA
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name, // Save name to metadata
                    }
                }
            });
            if (error) throw error;
            // Supabase auto-logins after signup usually, depending on email confirmation settings
            if (data.session) {
                onLoginSuccess();
            } else {
                 setError('Registrácia úspešná! Skontrolujte si email pre potvrdenie.');
            }

        } else {
            // PRIHLÁSENIE
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            if (data.session) {
                onLoginSuccess();
            }
        }
    } catch (err: any) {
        setError(err.message || 'Nastala neočakávaná chyba');
    } finally {
        setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                // Po prihlásení presmeruje späť na tvoju stránku
                redirectTo: window.location.origin 
            }
        });
        if (error) throw error;
      } catch (err: any) {
          setError(err.message);
      }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden flex flex-col animate-fade-in">
       {/* Background Ambience */}
       <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-100/50 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
       <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-100/50 rounded-full blur-[80px] -ml-20 -mb-20 pointer-events-none" />

       {/* Navbar */}
       <div className="px-6 pt-8 pb-4 flex items-center relative z-10">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
          >
              <ArrowLeft size={20} />
          </button>
       </div>

       {/* Content */}
       <div className={`flex-1 px-8 pt-4 pb-12 flex flex-col transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
           
           <div className="mb-8">
               <h1 className="text-3xl font-light text-gray-900 mb-2">
                   {isRegistering ? 'Vytvoriť' : 'Vitajte'} <br />
                   <span className="font-bold">{isRegistering ? 'Nový Účet' : 'Späť'}</span>
               </h1>
               <p className="text-gray-400">
                   {isRegistering 
                    ? 'Zadajte svoje údaje pre registráciu' 
                    : 'Zadajte svoje údaje pre prihlásenie'}
               </p>
           </div>

           {error && (
               <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 animate-fade-in">
                   <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={20} />
                   <p className="text-sm text-rose-600 font-medium">{error}</p>
               </div>
           )}

           <form onSubmit={handleSubmit} className="space-y-4">
              {isRegistering && (
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Meno</label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                            <UserIcon size={20} />
                        </div>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-[20px] py-4 pl-12 pr-4 font-bold text-gray-800 outline-none focus:bg-white focus:border-blue-200 focus:shadow-lg focus:shadow-blue-500/10 transition-all"
                            placeholder="Ján Novák"
                        />
                    </div>
                </div>
              )}

              <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email</label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                            <Mail size={20} />
                        </div>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-[20px] py-4 pl-12 pr-4 font-bold text-gray-800 outline-none focus:bg-white focus:border-blue-200 focus:shadow-lg focus:shadow-blue-500/10 transition-all"
                            placeholder="meno@firma.sk"
                        />
                    </div>
              </div>

              <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Heslo</label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                            <Lock size={20} />
                        </div>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-[20px] py-4 pl-12 pr-4 font-bold text-gray-800 outline-none focus:bg-white focus:border-blue-200 focus:shadow-lg focus:shadow-blue-500/10 transition-all"
                            placeholder="••••••••"
                        />
                    </div>
              </div>

              {/* Remember Me Checkbox - Only for Login */}
              {!isRegistering && (
                  <div className="flex items-center gap-3 py-2 pl-1 cursor-pointer group" onClick={() => setRememberMe(!rememberMe)}>
                      <div className={`transition-colors ${rememberMe ? 'text-blue-600' : 'text-gray-300 group-hover:text-gray-400'}`}>
                          {rememberMe ? <CheckSquare size={20} /> : <Square size={20} />}
                      </div>
                      <span className="text-sm font-bold text-gray-500 select-none">Zostať prihlásený</span>
                  </div>
              )}

              <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-4 bg-gray-900 text-white rounded-[24px] font-bold text-lg shadow-xl shadow-gray-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-80' : ''}`}
                  >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <span>{isRegistering ? 'Registrovať' : 'Prihlásiť sa'}</span>
                            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                                <Check size={14} />
                            </div>
                        </>
                    )}
                  </button>
              </div>
           </form>

           {/* Divider */}
           <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-gray-100"></div>
                <span className="flex-shrink-0 mx-4 text-gray-300 text-[10px] font-bold uppercase tracking-widest">alebo</span>
                <div className="flex-grow border-t border-gray-100"></div>
           </div>

           {/* Google Button */}
           <button 
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-4 bg-white border border-gray-200 text-gray-700 rounded-[24px] font-bold text-lg shadow-sm hover:shadow-md hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group relative overflow-hidden"
           >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 flex items-center gap-3">
                    <svg className="w-6 h-6 transition-transform group-hover:scale-110 duration-300" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                    <span>Pokračovať cez Google</span>
                </div>
           </button>

           <div className="mt-auto text-center pt-6">
              <p className="text-gray-500 text-sm">
                  {isRegistering ? 'Už máte účet?' : 'Ešte nemáte účet?'}
                  <button
                    onClick={() => {
                        setIsRegistering(!isRegistering);
                        setError(null);
                    }}
                    className="ml-2 font-bold text-blue-600 hover:underline"
                  >
                    {isRegistering ? 'Prihláste sa' : 'Registrujte sa'}
                  </button>
              </p>
           </div>
       </div>
    </div>
  );
};

export default Auth;
