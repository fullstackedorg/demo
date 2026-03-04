import React from "react";

type FooterProps = {
    theme: string;
};

export default function Footer({ theme }: FooterProps) {
    return (
        <footer className="w-full z-10 mt-auto pt-4 pb-0 flex flex-wrap justify-center gap-5">
            {[
                {
                    name: "Website",
                    color: "indigo",
                    url: "https://fullstacked.org"
                },
                {
                    name: "Documentation",
                    color: "blue",
                    url: "https://docs.fullstacked.org"
                },
                {
                    name: "Roadmap",
                    color: "sky",
                    url: "https://fullstacked.notion.site/FullStacked-v1-21d47d89d19a80429cb2f85dcf71fdc9"
                },
                {
                    name: "GitHub",
                    color: "cyan",
                    url: "https://github.com/fullstackedorg/fullstacked"
                }
            ].map((link) => {
                const darkClassMap: any = {
                    indigo: "bg-fs-blue-800/10 text-fs-blue-400 border-fs-blue-600/20 hover:bg-fs-blue-800/20 hover:border-fs-blue-600/40 hover:text-fs-blue-300 hover:shadow-[0_0_20px_rgba(15,127,212,0.15)]",
                    blue: "bg-fs-blue-600/10 text-fs-blue-400 border-fs-blue-500/20 hover:bg-fs-blue-600/20 hover:border-fs-blue-500/40 hover:text-fs-blue-300 hover:shadow-[0_0_20px_rgba(33,158,242,0.15)]",
                    sky: "bg-fs-blue-500/10 text-fs-blue-400 border-fs-blue-400/20 hover:bg-fs-blue-500/20 hover:border-fs-blue-400/40 hover:text-fs-blue-300 hover:shadow-[0_0_20px_rgba(72,188,255,0.15)]",
                    cyan: "bg-fs-blue-400/10 text-fs-blue-300 border-fs-blue-300/20 hover:bg-fs-blue-400/20 hover:border-fs-blue-300/40 hover:text-fs-blue-200 hover:shadow-[0_0_20px_rgba(142,210,255,0.15)]"
                };
                const lightClassMap: any = {
                    indigo: "bg-white text-fs-blue-900 border-black/5 shadow-sm hover:bg-fs-blue-50 hover:border-fs-blue-200 hover:shadow-md hover:-translate-y-0.5",
                    blue: "bg-white text-fs-blue-800 border-black/5 shadow-sm hover:bg-fs-blue-50 hover:border-fs-blue-200 hover:shadow-md hover:-translate-y-0.5",
                    sky: "bg-white text-fs-blue-700 border-black/5 shadow-sm hover:bg-fs-blue-50 hover:border-fs-blue-200 hover:shadow-md hover:-translate-y-0.5",
                    cyan: "bg-white text-fs-blue-600 border-black/5 shadow-sm hover:bg-fs-blue-50 hover:border-fs-blue-200 hover:shadow-md hover:-translate-y-0.5"
                };

                return (
                    <a
                        key={link.name}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`group flex items-center gap-2.5 px-7 py-3.5 rounded-2xl font-medium transition-all duration-300 border backdrop-blur-sm ${theme === "dark" ? darkClassMap[link.color] : lightClassMap[link.color]}`}
                    >
                        {link.name}
                        <svg
                            className="w-4 h-4 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 opacity-70 group-hover:opacity-100"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                        </svg>
                    </a>
                );
            })}
        </footer>
    );
}
