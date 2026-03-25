import React, { useMemo } from 'react';

interface WeatherBackgroundProps {
  temperature: number;
}

export const WeatherBackground: React.FC<WeatherBackgroundProps> = ({ temperature }) => {
  const weatherType = useMemo(() => {
    if (temperature <= 20) return 'ice';
    if (temperature <= 40) return 'rain';
    if (temperature <= 60) return 'cloudy';
    if (temperature <= 75) return 'clear';
    return 'sunny';
  }, [temperature]);

  return (
    <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none">
      {/* Base Gradient - Dynamic transition between atmospheric states */}
      <div 
        className={`absolute inset-0 transition-all duration-[3000ms] ease-in-out ${
          weatherType === 'ice' ? 'bg-[#020617]' :
          weatherType === 'rain' ? 'bg-[#050a1f]' :
          weatherType === 'cloudy' ? 'bg-[#0a0f24]' :
          weatherType === 'clear' ? 'bg-[#071129]' :
          'bg-[#0c0a1a]'
        }`}
      />

      {/* Global Atmospheric Depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(56,189,248,0.08),transparent_70%)]" />

      {/* Weather Effects */}
      {weatherType === 'ice' && (
        <div className="absolute inset-0">
          {[...Array(80)].map((_, i) => (
            <div 
              key={i}
              className="snow-particle"
              style={{
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
                animationDuration: `${Math.random() * 4 + 3}s`,
                animationDelay: `${Math.random() * 5}s`,
                opacity: Math.random() * 0.6 + 0.2
              }}
            />
          ))}
        </div>
      )}

      {weatherType === 'rain' && (
        <div className="absolute inset-0">
          {[...Array(150)].map((_, i) => (
            <div 
              key={i}
              className="rain-drop"
              style={{
                left: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 0.3 + 0.2}s`,
                animationDelay: `${Math.random() * 2}s`,
                opacity: Math.random() * 0.4 + 0.1
              }}
            />
          ))}
          <div className="lightning-flash" />
        </div>
      )}

      {weatherType === 'cloudy' && (
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <div 
              key={i}
              className="cloud"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 800 + 400}px`,
                height: `${Math.random() * 400 + 200}px`,
                animationDuration: `${Math.random() * 80 + 60}s`,
                animationDelay: `-${Math.random() * 100}s`,
                opacity: 0.15,
                filter: 'blur(100px)'
              }}
            />
          ))}
        </div>
      )}

      {weatherType === 'clear' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[100vw] h-[100vh] bg-gradient-to-tr from-blue-500/5 via-cyan-500/5 to-transparent animate-pulse duration-[10000ms]" />
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(14,165,233,0.1),transparent_50%)]" />
        </div>
      )}

      {weatherType === 'sunny' && (
        <div className="absolute inset-0">
          <div className="sun-bg absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(251,191,36,0.1),transparent_60%)] animate-sun-glow" />
          <div className="sun-core" />
        </div>
      )}

      {/* Cinematic Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#020617]/90" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
    </div>
  );
};
