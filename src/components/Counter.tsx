import React from 'react';

type CounterProps = {
    theme: string;
    count: number;
    setCount: React.Dispatch<React.SetStateAction<number>>;
};

export default function Counter({ theme, count, setCount }: CounterProps) {
    return (
        <div className="flex-shrink-0 flex justify-center w-full mt-4 lg:mt-0">
            <div className={`p-8 rounded-[2rem] backdrop-blur-xl border flex flex-col items-center gap-6 transition-all duration-500 w-80 relative group
         ${theme === 'dark' ? 'bg-slate-900/40 border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:border-sky-500/40 hover:bg-slate-900/60 hover:shadow-[0_8px_40px_rgba(14,165,233,0.15)]' : 'bg-white/60 border-white hover:border-sky-200 shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:bg-white/80'}
         `}>
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 rounded-[2rem] transition-opacity duration-500 pointer-events-none"></div>

                <div className="flex items-center gap-8 relative z-10 w-full justify-center">
                    <button
                        onClick={() => setCount(c => c - 1)}
                        className={`w-14 h-14 aspect-square flex items-center justify-center rounded-full text-3xl font-light transition-all hover:scale-110 active:scale-95 ${theme === 'dark' ? 'text-sky-400 bg-sky-500/10 hover:bg-sky-500/20' : 'text-sky-600 bg-sky-50 hover:bg-sky-100'}`}
                        aria-label="Decrease"
                    >
                        −
                    </button>
                    <div className={`text-6xl font-light tabular-nums tracking-tighter w-24 text-center transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {count}
                    </div>
                    <button
                        onClick={() => setCount(c => c + 1)}
                        className={`w-14 h-14 aspect-square flex items-center justify-center rounded-full text-3xl font-light transition-all hover:scale-110 active:scale-95 ${theme === 'dark' ? 'text-sky-400 bg-sky-500/10 hover:bg-sky-500/20' : 'text-sky-600 bg-sky-50 hover:bg-sky-100'}`}
                        aria-label="Increase"
                    >
                        +
                    </button>
                </div>

                <button
                    onClick={() => setCount(0)}
                    className={`p-2 rounded-full transition-all hover:-rotate-180 duration-500 relative z-10 flex items-center justify-center gap-2 text-sm font-medium
            ${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                    title="Reset counter"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
