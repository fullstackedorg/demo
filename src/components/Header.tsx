import React from 'react';

type HeaderProps = {
    theme: string;
    toggleTheme: () => void;
};

export default function Header({ theme, toggleTheme }: HeaderProps) {
    return (
        <header className="z-20 absolute top-2 right-2 md:top-6 md:right-6 lg:top-8 lg:right-8">
            <button
                onClick={toggleTheme}
                className={`relative w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 z-20 ${theme === 'dark' ? 'bg-slate-800/80 text-sky-400 hover:bg-slate-800 border border-white/10 shadow-lg' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-md'}`}
                aria-label="Toggle theme"
            >
                {theme === 'dark' ? (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                ) : (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                )}
            </button>
        </header>
    );
}
