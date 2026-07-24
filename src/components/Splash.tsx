import React, { useEffect, useState } from 'react';
import { Bike, ShieldCheck, Zap } from 'lucide-react';

interface SplashProps {
  onFinish: () => void;
}

export const Splash: React.FC<SplashProps> = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onFinish, 300);
          return 100;
        }
        return prev + 12;
      });
    }, 120);

    return () => clearInterval(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white select-none transition-opacity duration-500">
      <div className="flex flex-col items-center text-center p-6 max-w-sm w-full animate-fade-in">
        {/* App Logo Emblem */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-2xl bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center shadow-2xl shadow-amber-500/20 animate-pulse">
            <Bike className="w-12 h-12 text-amber-400" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-slate-900 border border-slate-700 p-1.5 rounded-lg text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        <h1 className="text-2xl font-black tracking-wider uppercase text-slate-100 mb-1">
          Ride <span className="text-amber-400">&</span> Routine
        </h1>
        <p className="text-xs text-slate-400 tracking-widest uppercase mb-8 font-medium">
          Professional Rider & Routine Suite
        </p>

        {/* Loading Progress Bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-3 border border-slate-700/50">
          <div
            className="bg-amber-400 h-full transition-all duration-150 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between w-full text-[11px] text-slate-400">
          <span className="flex items-center gap-1 text-slate-500">
            <Zap className="w-3 h-3 text-amber-400" /> Pro v2.5
          </span>
          <span>{progress}%</span>
        </div>
      </div>

      <button
        onClick={onFinish}
        className="absolute bottom-8 text-xs text-slate-500 hover:text-slate-300 underline tracking-wide cursor-pointer"
      >
        Skip Intro
      </button>
    </div>
  );
};
