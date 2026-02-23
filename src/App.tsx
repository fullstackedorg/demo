import React, { useState, useEffect } from "react";
import os from "os";
import fs from "fs/promises";

import Header from "./components/Header";
import Hero from "./components/Hero";
import Counter from "./components/Counter";
import Footer from "./components/Footer";
import Background3D from "./components/Background3D";

export default function App() {
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined' && window.matchMedia) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'dark';
    });
    const [count, setCount] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const platform = os.platform();

    useEffect(() => {
        fs.readFile("data.json", "utf-8")
            .then((data) => {
                const parsed = JSON.parse(data);
                if (parsed.theme) setTheme(parsed.theme);
                if (typeof parsed.count === "number") setCount(parsed.count);
                if (typeof parsed.dontShowAgain === "boolean") setDontShowAgain(parsed.dontShowAgain);
            })
            .catch(() => {
                // Ignore errors if file doesn't exist or is invalid
            })
            .finally(() => {
                setIsLoaded(true);
            });
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        fs.writeFile("data.json", JSON.stringify({ theme, count, dontShowAgain }, null, 2))
            .catch(err => console.error("Error saving data:", err));
    }, [theme, count, dontShowAgain, isLoaded]);

    useEffect(() => {
        // Match the HTML background color to the main container's background color
        document.documentElement.style.backgroundColor = theme === 'dark' ? '#020617' : '#f8fafc';
    }, [theme]);

    const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

    return (
        <div className={`min-h-screen font-sans transition-colors duration-700 ease-in-out ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'} relative overflow-hidden flex flex-col items-center justify-between p-6 m-0`}>
            {/* Background animated elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="w-full h-full pointer-events-auto">
                    <Background3D theme={theme} count={count} />
                </div>
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-fs-blue-500/10 blur-[120px] rounded-full animate-blob"></div>
                <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-fs-blue-400/10 blur-[120px] rounded-full animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[60%] bg-fs-blue-600/10 blur-[120px] rounded-full animate-blob animation-delay-4000"></div>
            </div>

            <div className="w-full relative z-20 flex justify-center">
                <Header theme={theme} toggleTheme={toggleTheme} />
            </div>
            <div className="w-full flex-1 flex flex-col justify-center relative z-10 my-auto pointer-events-none">
                <main className="grid grid-cols-1 lg:grid-cols-2 items-center w-full max-w-7xl mx-auto px-4 sm:px-8 gap-8 lg:gap-x-16 lg:gap-y-4 flex-1 py-12 lg:py-4 pointer-events-auto">
                    <div className="w-full flex justify-center lg:justify-end xl:pr-8 order-1 lg:order-1">
                        <Hero theme={theme} />
                    </div>

                    {/* Counter Area */}
                    <div className="w-full flex justify-center lg:justify-start xl:pl-8 order-3 lg:order-2">
                        <Counter theme={theme} count={count} setCount={setCount} platform={platform} />
                    </div>

                    {/* Button and Checkbox Area */}
                    <div className="flex flex-col items-center gap-4 order-2 lg:order-3 lg:col-span-2 w-full">
                        <div className="relative group/btn">
                            <div className={`absolute -inset-0.5 rounded-2xl blur opacity-40 group-hover/btn:opacity-100 transition duration-1000 group-hover/btn:duration-200 animate-tilt ${theme === 'dark' ? 'bg-gradient-to-r from-fs-blue-400 to-fs-blue-700' : 'bg-gradient-to-r from-fs-blue-500 to-fs-blue-800'}`}></div>
                            <button
                                className={`cursor-pointer relative px-8 py-3 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden border hover:shadow-lg ${theme === 'dark' ? 'bg-slate-900 border-fs-blue-400/50 text-white hover:bg-slate-800' : 'bg-fs-blue-600 border-fs-blue-500/50 text-white hover:bg-fs-blue-500'}`}
                                onClick={() => console.log("Open Terminal")}
                            >
                                <svg className={`w-6 h-6 shrink-0 transition-transform duration-300 group-hover/btn:scale-110 ${theme === 'dark' ? 'text-fs-blue-400' : 'text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="shrink-0 whitespace-nowrap">Open Terminal</span>
                            </button>
                        </div>

                        <div
                            className="flex items-center gap-3 cursor-pointer group mt-1"
                            onClick={() => setDontShowAgain(!dontShowAgain)}
                        >
                            <div className={`relative w-5 h-5 rounded-md border-2 transition-all duration-300 flex items-center justify-center
                                ${dontShowAgain
                                    ? (theme === 'dark' ? 'bg-fs-blue-500 border-fs-blue-500' : 'bg-fs-blue-600 border-fs-blue-600')
                                    : (theme === 'dark' ? 'bg-transparent border-slate-600 group-hover:border-fs-blue-400' : 'bg-transparent border-slate-400 group-hover:border-fs-blue-500')
                                }`}
                            >
                                <svg className={`w-3.5 h-3.5 text-white transition-transform duration-300 ${dontShowAgain ? 'scale-100' : 'scale-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className={`text-sm sm:text-base select-none transition-colors duration-300 ${theme === 'dark' ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-500 group-hover:text-slate-800'}`}>
                                Skip welcome on startup
                            </span>
                        </div>
                    </div>
                </main>
            </div>

            <div className="w-full relative z-10 flex flex-col items-center mt-auto shrink-0 pointer-events-auto">
                <Footer theme={theme} />
            </div>
        </div>
    );
}
