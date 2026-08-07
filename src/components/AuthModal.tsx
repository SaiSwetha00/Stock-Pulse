import React, { useState } from 'react';
import { PageView } from '../types';
import { ShaderBackground } from './ShaderBackground';
import { StockPulseLogo } from './StockPulseLogo';
import { Eye, EyeOff, Mail, User, ArrowLeft, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface AuthPageProps {
  initialMode: 'login' | 'signup';
  onNavigate: (page: PageView) => void;
}

export const AuthModal: React.FC<AuthPageProps> = ({ initialMode, onNavigate }) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    // Simulate authentication process
    setTimeout(() => {
      setIsLoading(false);
      if (password.length < 4) {
        setErrorMsg('Invalid password keys provided. Try demo: 1234');
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        onNavigate('dashboard');
      }, 1200);
    }, 1000);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-6 overflow-hidden bg-[#10131b]">
      {/* Background Shader */}
      <ShaderBackground />

      {/* Top Left Return to Landing Button */}
      <button
        onClick={() => onNavigate('landing')}
        className="fixed top-6 left-6 z-50 px-4 py-2 rounded-xl glass-card text-xs font-mono uppercase tracking-widest text-[#e0e2ed] hover:text-[#edc155] flex items-center gap-2 cursor-pointer border border-[#edc155]/20 hover:border-[#edc155]"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Store
      </button>

      {/* Centered Glass Container Card */}
      <div className="w-full max-w-[440px] relative z-10 py-12">
        <div
          className={`relative w-full rounded-2xl bg-[#0b0e15]/85 backdrop-blur-[24px] border border-[#edc155]/30 p-8 md:p-10 flex flex-col items-center shadow-[0_0_50px_-10px_rgba(147,0,10,0.5)] transition-all duration-500 ${
            errorMsg ? 'animate-[shake_0.4s_ease-in-out]' : ''
          }`}
        >
          {/* Mini 3D Rotating Character Header Ring & Logo */}
          <div className="mb-4 cursor-pointer" onClick={() => onNavigate('landing')}>
            <StockPulseLogo size="lg" />
          </div>

          {/* Title Header */}
          <h1 className="font-display font-bold text-2xl md:text-3xl text-[#edc155] tracking-[4px] uppercase text-center mb-2">
            {mode === 'login' ? 'WELCOME BACK' : 'JOIN THE PULSE'}
          </h1>
          <p className="font-mono text-xs text-[#d1c5b0]/60 tracking-widest uppercase mb-8 text-center">
            {mode === 'login'
              ? 'Enter credentials to access stock ledger'
              : 'Provision your store operator identity'}
          </p>

          {/* Error Message Box */}
          {errorMsg && (
            <div className="w-full mb-6 p-3 rounded-lg bg-[#93000a]/40 border border-[#ffb4ab]/50 text-[#ffb4ab] text-xs font-mono flex items-center gap-2 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
            {mode === 'signup' && (
              <div className="relative w-full group">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full Name / Store Name"
                  className="w-full bg-transparent border-b border-[#4e4636] text-[#e0e2ed] py-2.5 px-1 focus:outline-none focus:border-[#edc155] transition-colors font-sans text-sm placeholder-[#d1c5b0]/40"
                />
                <User className="absolute right-2 top-3 w-4 h-4 text-[#d1c5b0]/40 group-focus-within:text-[#edc155]" />
              </div>
            )}

            <div className="relative w-full group">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Store Email Address"
                className="w-full bg-transparent border-b border-[#4e4636] text-[#e0e2ed] py-2.5 px-1 focus:outline-none focus:border-[#edc155] transition-colors font-sans text-sm placeholder-[#d1c5b0]/40"
              />
              <Mail className="absolute right-2 top-3 w-4 h-4 text-[#d1c5b0]/40 group-focus-within:text-[#edc155]" />
            </div>

            <div className="relative w-full group">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-transparent border-b border-[#4e4636] text-[#e0e2ed] py-2.5 px-1 focus:outline-none focus:border-[#edc155] transition-colors font-sans text-sm placeholder-[#d1c5b0]/40"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-3 text-[#d1c5b0]/40 hover:text-[#edc155] transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {mode === 'login' && (
              <div className="w-full flex justify-end -mt-2">
                <button
                  type="button"
                  onClick={() => setErrorMsg('Reset link sent to store email.')}
                  className="text-[#d1c5b0]/60 hover:text-[#edc155] font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Lost Keys?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isSuccess}
              className="w-full mt-4 py-4 rounded-lg bg-gradient-to-r from-[#7d000a] via-[#93000a] to-[#7d000a] border-t-2 border-[#edc155] text-white font-mono text-xs tracking-[0.2em] uppercase relative overflow-hidden group shadow-[0_4px_25px_rgba(147,0,10,0.5)] hover:shadow-[0_4px_35px_rgba(147,0,10,0.8)] transition-all cursor-pointer"
            >
              <span className="relative z-10 font-bold flex items-center justify-center gap-2">
                {isLoading ? (
                  <span className="animate-pulse">AUTHENTICATING...</span>
                ) : isSuccess ? (
                  <span className="text-[#edc155] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> ACCESS GRANTED
                  </span>
                ) : mode === 'login' ? (
                  'SIGN IN'
                ) : (
                  'SIGN UP NOW'
                )}
              </span>
              <div className="absolute inset-0 bg-[#edc155] opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-[-30deg] group-hover:animate-[sweep_1.5s_ease-in-out_infinite]" />
            </button>
          </form>

          {/* Mode Switch Footer */}
          <div className="mt-8 pt-6 border-t border-white/5 w-full text-center font-sans text-xs text-[#d1c5b0]/70">
            {mode === 'login' ? (
              <p>
                Don’t have an account?{' '}
                <button
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg('');
                  }}
                  className="text-[#edc155] font-mono uppercase font-bold hover:underline cursor-pointer ml-1"
                >
                  Sign Up
                </button>
              </p>
            ) : (
              <p>
                Already registered?{' '}
                <button
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                  }}
                  className="text-[#edc155] font-mono uppercase font-bold hover:underline cursor-pointer ml-1"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
