import type { CSSProperties } from "./style/types.ts";
import style from "./style.ts";

export default {
    h1: 36,
    h2: 30,
    h3: 24,
    m: 16,
    s: 12,
    xs: 9,
};

export const fontFamily =
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif';

const colors = {
    blue: {
        main: "#007aff",
        accent: "#04b8ec",
        dark: "#1e293b",
    },
    dark: "#15171b",
    red: "#ff453a",
    green: "#30d158",
    yellow: "#ffcc00",
    light: "#ffffff",
    gray: {
        main: "#8c929b",
        dark: "#404958",
    },
    overlay: "#15171b99",
};


const spacing = {
    xs: 5,
    s: 10,
    m: 20,
    l: 30,
};

const bgDark = "#081233";
const bgLight = "#9cd1ec";

const backgroundColorDarkStyle: CSSProperties = {
    backgroundColor: bgDark
};
const backgroundColorLightStyle: CSSProperties = {
    backgroundColor: bgLight
};

const htmlBodyStyle: CSSProperties = {
    backgroundImage: `linear-gradient(${bgDark}, #1e293b)`,
    fontFamily: fontFamily,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: spacing.l,
    justifyContent: "space-between",
    width: "100%",
    padding: 3,
    margin: 0,
    color: colors.light,
};

const lightTheme: CSSProperties = {
    backgroundImage: `linear-gradient(to top, #fafbfb 0%, ${bgLight} 100%)`,
    color: colors.dark,

    "& label": {
        color: colors.dark
    }
};

style.createGlobalStyle({
    "*": {
        boxSizing: "border-box"
    },

    "@media (prefers-color-scheme: light)": {
        html: backgroundColorLightStyle,
        body: backgroundColorLightStyle
    },

    "@media (prefers-color-scheme: dark)": {
        html: backgroundColorDarkStyle,
        body: backgroundColorDarkStyle
    },
    html: {
        ...htmlBodyStyle,
        "&.light": lightTheme,
        "&.light body": lightTheme
    },
    body: {
        ...htmlBodyStyle,
        minHeight: "calc(100vh - 6px)"
    },

    svg: {
        height: 24,
        width: 24
    },

    nav: {
        textAlign: "center",
        "> a": {
            display: "inline-block",
            margin: spacing.m / 2
        },
        paddingBottom: spacing.m
    },

    img: {
        height: 80,
        width: 80
    },

    h1: {
        padding: `${spacing.s}px 0 ${spacing.m}px`
    },

    header: {
        width: "100%",
        display: "flex",
        justifyContent: "flex-start",
        "> .input-switch": {
            width: "auto"
        }
    },

    main: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center"
    },

    p: {
        paddingBottom: spacing.s
    }
});
