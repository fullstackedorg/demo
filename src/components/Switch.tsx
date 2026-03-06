import React from "react";

type SwitchProps = {
    checked: boolean;
    onChange: (checked: boolean) => void;
    leftLabel: string;
    rightLabel: string;
    theme: string;
};

export default function Switch({
    checked,
    onChange,
    leftLabel,
    rightLabel,
    theme
}: SwitchProps) {
    const activeColor = theme === "dark" ? "text-white" : "text-slate-900";
    const inactiveColor =
        theme === "dark" ? "text-slate-500" : "text-slate-400";

    return (
        <div className="flex items-center gap-4 cursor-pointer group">
            <span
                className={`text-xs font-semibold uppercase tracking-wider select-none transition-all duration-300 w-[140px] text-right whitespace-nowrap ${!checked ? activeColor : inactiveColor}`}
                onClick={() => onChange(false)}
            >
                {leftLabel}
            </span>
            <div
                className={`flex-shrink-0 relative w-12 h-6 rounded-full transition-all duration-300 ease-in-out ${
                    checked
                        ? theme === "dark"
                            ? "bg-fs-blue-500"
                            : "bg-fs-blue-600"
                        : theme === "dark"
                          ? "bg-slate-700"
                          : "bg-slate-200"
                }`}
                onClick={() => onChange(!checked)}
            >
                <div
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ease-in-out shadow-sm ${
                        checked ? "transform translate-x-6" : ""
                    }`}
                ></div>
            </div>
            <span
                className={`text-xs font-semibold uppercase tracking-wider select-none transition-all duration-300 w-[140px] text-left whitespace-nowrap ${checked ? activeColor : inactiveColor}`}
                onClick={() => onChange(true)}
            >
                {rightLabel}
            </span>
        </div>
    );
}
