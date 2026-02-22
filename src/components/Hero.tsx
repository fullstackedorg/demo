import React from 'react';

type HeroProps = {
    theme: string;
    platform: string;
};

export default function Hero({ theme, platform }: HeroProps) {
    return (
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left w-full">
            {/* Logo / Icon */}
            <div className="relative mb-8 lg:mb-10 group cursor-default">
                <div className="relative w-24 h-24 lg:w-32 lg:h-32 flex items-center justify-center transform group-hover:scale-[1.03] transition duration-500 rounded-[2rem]">
                    <img src={"src/app-icon.png"} alt="FullStacked Logo" className="w-full h-full object-cover" />
                </div>
            </div>

            <h1 className="w-full text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 drop-shadow-sm pb-1 leading-tight">
                Welcome to FullStacked
            </h1>

            <p className={`text-lg sm:text-xl lg:text-2xl mb-10 leading-relaxed max-w-xl font-light ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                Create, run and share projects built with web technologies in a fully cross-platform, local-first environment.
            </p>

            <div className={`inline-block px-5 py-2.5 rounded-full border backdrop-blur-md shadow-sm transition-colors duration-500 ${theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-black/5 border-black/10 text-slate-700'}`}>
                <span className="text-sm sm:text-base align-middle mr-1">You are currently running FullStacked on</span>
                <kbd className={`inline-block px-2.5 py-1 -my-1 align-middle rounded-lg text-sm font-mono font-medium shadow-sm transition-colors duration-500 border ${theme === 'dark' ? 'bg-slate-800/80 text-sky-400 border-white/10' : 'bg-white/80 text-sky-600 border-black/5'}`}>
                    {platform}
                </kbd>
            </div>
        </div>
    );
}
