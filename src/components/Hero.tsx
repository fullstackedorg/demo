import React from "react";
import appIcon from "../app-icon.png";

type HeroProps = {
    theme: string;
};

export default function Hero({ theme }: HeroProps) {
    return (
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left w-full">
            {/* Logo / Icon */}
            <div className="relative mb-6 lg:mb-8 group cursor-default">
                <div className="relative w-24 h-24 lg:w-32 lg:h-32 flex items-center justify-center transform group-hover:scale-[1.03] transition duration-500 rounded-[2rem]">
                    <img
                        src={appIcon}
                        alt="FullStacked Logo"
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>

            <h1
                className={`w-full text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-br pb-1 leading-tight ${theme === "dark" ? "from-white via-fs-blue-400 to-fs-blue-800 drop-shadow-[0_0_35px_rgba(72,188,255,0.4)]" : "from-fs-blue-400 via-fs-blue-600 to-fs-blue-900 drop-shadow-[0_8px_16px_rgba(15,127,212,0.2)]"}`}
            >
                Welcome to FullStacked
            </h1>

            <p
                className={`text-lg sm:text-xl lg:text-2xl mb-0 leading-relaxed max-w-xl font-light ${theme === "dark" ? "text-slate-300" : "text-slate-800"}`}
            >
                Create, run and share projects built with web technologies in a
                fully cross-platform, local-first environment.
            </p>
        </div>
    );
}
