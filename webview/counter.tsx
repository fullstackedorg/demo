import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import fs from "fs";
import { counterClass } from "./counter.s";

const countFile = "data/count.txt";
fs.mkdirSync("data");

function Icon(props: { iconName: string }) {
    return <span dangerouslySetInnerHTML={{ __html: fs.readFileSync(`assets/images/${props.iconName}.svg`, {encoding: "utf8"}) }} />;
}

async function loadCount() {
    if (!fs.existsSync(countFile)) return 0;
    return parseInt(fs.readFileSync(countFile, { encoding: "utf8" }));
}

const initialCount = await loadCount();
function Counter() {
    const [count, setCount] = useState(initialCount);

    useEffect(() => {
        fs.writeFileSync(countFile, count.toString());
    }, [count]);

    const decr = () => {
        setCount(count - 1);
    };
    const incr = () => {
        setCount(count + 1);
    };
    const reset = async () => {
        fs.unlinkSync(countFile);
        setCount(0);
    };

    return (
        <div className={counterClass}>
            <div>
                <button className="icon-large" onClick={decr}>
                    <Icon iconName={"minus"} />
                </button>
                <div>
                    {count}
                </div>
                <button className="icon-large" onClick={incr}>
                    <Icon iconName={"plus"} />
                </button>
            </div>
            <button className="icon-large" onClick={reset}>
                <Icon iconName={"reset"} />
            </button>
        </div>
    );
}

createRoot(document.getElementById("counter")).render(<Counter />);
