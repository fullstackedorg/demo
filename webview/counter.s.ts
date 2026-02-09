import style from "../style.ts"

export const counterClass = style.createClass("counter", {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    div: {
        display: "flex",
        alignItems: "center",
        gap: 20,
        fontSize: 24
    }
})
