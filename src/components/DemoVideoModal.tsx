import React, { useState } from 'react';
import { X, Play, Pause, Volume2, Maximize, Activity, Sparkles, CheckCircle2 } from 'lucide-react';

interface DemoVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoVideoModal: React.FC<DemoVideoModalProps> = ({ isOpen, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-8 bg-[#10131b]/90 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-5xl rounded-2xl glass-panel border border-[#edc155]/40 overflow-hidden shadow-2xl bg-[#0b0e15]">
        {/* Top Header */}
        <div className="px-6 py-4 bg-[#181b23] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#edc155] animate-ping" />
            <span className="font-mono text-xs text-[#e0e2ed] uppercase tracking-wider font-bold">
              STOCK PULSE // PLATFORM_OVERVIEW_DEMO.MP4
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#d1c5b0] hover:text-[#edc155] hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Video Stage Container */}
        <div className="relative aspect-video bg-[#000] flex items-center justify-center overflow-hidden">
          {/* Animated Video Simulation Canvas Graphic */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#10131b] via-[#1d2027] to-[#0b0e15] flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-[#edc155]/20 border border-[#edc155] flex items-center justify-center text-[#edc155] mb-6 shadow-[0_0_30px_rgba(237,193,85,0.4)] animate-pulse">
              <Activity className="w-10 h-10" />
            </div>
            <h3 className="font-display font-bold text-3xl text-[#e0e2ed] mb-3">
              Stock Pulse Autonomous Telemetry Engine
            </h3>
            <p className="font-mono text-xs text-[#d1c5b0]/70 max-w-lg mb-6 uppercase tracking-wider">
              Simulating 24/7 Produce Ethylene Monitoring & Cold-Chain Probe Safeguards
            </p>

            <div className="flex items-center gap-3 font-mono text-xs text-emerald-400 bg-emerald-950/80 px-4 py-2 rounded-xl border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4" /> Real-Time Telemetry Stream Active • 120 FPS
            </div>
          </div>

          {/* Controls Overlay Bar */}
          <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between gap-4 font-mono text-xs text-[#e0e2ed]">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-lg bg-[#edc155] text-[#10131b] font-bold hover:scale-105 transition-transform cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            {/* Time Scrubber */}
            <div className="flex-1 flex items-center gap-3">
              <span className="text-[10px] text-[#d1c5b0]">01:42</span>
              <div className="flex-1 bg-white/20 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#edc155] h-full w-2/3" />
              </div>
              <span className="text-[10px] text-[#d1c5b0]">03:00</span>
            </div>

            <div className="flex items-center gap-3">
              <Volume2 className="w-4 h-4 text-[#d1c5b0]" />
              <Maximize className="w-4 h-4 text-[#d1c5b0] cursor-pointer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
