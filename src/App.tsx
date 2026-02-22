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

    const platform = os.platform();

    useEffect(() => {
        fs.readFile("data.json", "utf-8")
            .then((data) => {
                const parsed = JSON.parse(data);
                if (parsed.theme) setTheme(parsed.theme);
                if (typeof parsed.count === "number") setCount(parsed.count);
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
        fs.writeFile("data.json", JSON.stringify({ theme, count }, null, 2))
            .catch(err => console.error("Error saving data:", err));
    }, [theme, count, isLoaded]);

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
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-500/10 blur-[120px] rounded-full animate-blob"></div>
                <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-sky-500/10 blur-[120px] rounded-full animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[60%] bg-cyan-500/10 blur-[120px] rounded-full animate-blob animation-delay-4000"></div>
            </div>

            <div className="w-full relative z-20 flex justify-center">
                <Header theme={theme} toggleTheme={toggleTheme} />
            </div>
            <div className="w-full flex-1 flex flex-col justify-center relative z-10 my-auto pointer-events-none">
                <main className="flex flex-col lg:flex-row items-center justify-center w-full max-w-7xl mx-auto px-4 sm:px-8 gap-12 lg:gap-20 flex-1 py-12 pointer-events-auto">
                    <div className="w-full lg:w-1/2 flex justify-center lg:justify-end xl:pr-12">
                        <Hero theme={theme} platform={platform} />
                    </div>
                    <div className="w-full lg:w-1/2 flex justify-center lg:justify-start xl:pl-12">
                        <Counter theme={theme} count={count} setCount={setCount} />
                    </div>
                </main>
            </div>

            <div className="w-full relative z-10 flex justify-center mt-auto">
                <Footer theme={theme} />
            </div>
        </div>
    );
}
