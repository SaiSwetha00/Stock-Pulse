'use client'

interface StockPulseLogoProps {
  className?: string
  iconOnly?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showSubtitle?: boolean
}

export default function StockPulseLogo({
  className = '',
  iconOnly = false,
  size = 'md',
  showSubtitle = true,
}: StockPulseLogoProps) {
  const iconDimensions = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10 md:w-11 md:h-11',
    lg: 'w-14 h-14 md:w-16 md:h-16',
    xl: 'w-20 h-20 md:w-24 md:h-24',
  }[size]

  const textSize = {
    sm: 'text-sm',
    md: 'text-lg md:text-xl',
    lg: 'text-2xl md:text-3xl',
    xl: 'text-3xl md:text-4xl',
  }[size]

  const subtitleSize = {
    sm: 'text-[7px]',
    md: 'text-[9px]',
    lg: 'text-xs',
    xl: 'text-sm',
  }[size]

  return (
    <div className={`inline-flex items-center gap-3.5 select-none ${className}`}>
      {/* 3D Metallic Emblem Icon */}
      <div className={`relative ${iconDimensions} flex-shrink-0 group cursor-pointer`}>
        {/* Subtle Ambient Gold Glow */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-[#edc155] via-[#ffe8a3] to-[#93000a] opacity-30 blur-md group-hover:opacity-75 transition-opacity duration-300 pointer-events-none" />

        {/* Golden Metallic Beveled Container */}
        <div className="relative w-full h-full rounded-2xl p-[1.5px] bg-gradient-to-br from-[#fff2a8] via-[#edc155] via-60% to-[#7a5910] shadow-[0_8px_25px_rgba(0,0,0,0.8)] transition-transform duration-300 group-hover:scale-105">
          <div className="w-full h-full bg-gradient-to-b from-[#181b24] to-[#0a0c12] rounded-[14px] flex items-center justify-center p-1.5 relative overflow-hidden">
            {/* Fine Brushed Metal Texture */}
            <div className="absolute inset-0 bg-[radial-gradient(#edc155_0.6px,transparent_0.6px)] [background-size:6px_6px] opacity-15 pointer-events-none" />

            <svg
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.95)]"
            >
              <defs>
                {/* 3D Metallic Gold Linear Gradient */}
                <linearGradient id="logoGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFF9D6" />
                  <stop offset="25%" stopColor="#F7D369" />
                  <stop offset="50%" stopColor="#C99D2E" />
                  <stop offset="75%" stopColor="#FFEA9F" />
                  <stop offset="100%" stopColor="#75530E" />
                </linearGradient>

                {/* Bevel Highlight */}
                <linearGradient id="logoHighlight" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#5E4008" />
                  <stop offset="50%" stopColor="#EDC155" />
                  <stop offset="100%" stopColor="#FFFFFF" />
                </linearGradient>

                {/* Drop Glow Filter */}
                <filter id="goldPulseGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Outer Leaf Shield Boundary */}
              <path
                d="M 22 18 C 22 18, 52 8, 80 18 C 86 18, 92 24, 92 34 L 92 56 C 92 78, 76 92 50 92 C 24 92, 8 78, 8 56 L 8 34 C 8 24, 14 18, 22 18 Z"
                fill="none"
                stroke="url(#logoGoldGrad)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Inner Parallel Shield Border */}
              <path
                d="M 28 24 C 28 24, 52 16, 74 24 C 79 24, 83 28, 83 36 L 83 54 C 83 70, 69 82 50 82 C 31 82, 17 70, 17 54 L 17 36 C 17 28, 21 24, 28 24 Z"
                fill="none"
                stroke="url(#logoHighlight)"
                strokeWidth="2"
                opacity="0.85"
              />

              {/* Upper-Left Leaf Silhouette */}
              <path
                d="M 28 48 C 28 32, 42 26, 48 26 C 48 38, 40 48, 28 48 Z"
                fill="url(#logoGoldGrad)"
                stroke="url(#logoHighlight)"
                strokeWidth="1.2"
              />
              {/* Leaf Center Vein */}
              <path
                d="M 30 46 Q 38 38 46 28"
                fill="none"
                stroke="#3B2603"
                strokeWidth="1.8"
                strokeLinecap="round"
              />

              {/* ECG Heartbeat Pulse Line */}
              <path
                d="M 24 62 H 34 L 40 50 L 48 72 L 56 36 L 64 68 L 70 62 H 82"
                fill="none"
                stroke="url(#logoGoldGrad)"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#goldPulseGlow)"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Brand Typography */}
      {!iconOnly && (
        <div className="flex flex-col">
          <span className={`font-brand font-bold uppercase tracking-[0.1em] text-gold-3d ${textSize} leading-none tracking-wider`}>
            STOCK PULSE
          </span>
          {showSubtitle && (
            <span className={`font-serif-brand uppercase tracking-[0.3em] text-[#d1c5b0]/80 ${subtitleSize} mt-1 font-semibold`}>
              Grocery Intelligence
            </span>
          )}
        </div>
      )}
    </div>
  )
}
