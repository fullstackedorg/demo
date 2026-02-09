import type { CSSProperties } from "./style/types.ts"
import style from "./style.ts"

export const typography = {
    h1: 36,
    h2: 30,
    h3: 24,
    m: 16,
    s: 12,
    xs: 9,
}

export const fontFamily =
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif'

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
}

export function opacity(color: string, opacity: number) {
    return [
        "rgba(" + parseInt(color.slice(1, 3), 16),
        parseInt(color.slice(3, 5), 16),
        parseInt(color.slice(5), 16),
        opacity / 100 + ")",
    ].join(",")
}

const spacing = {
    xs: 5,
    s: 10,
    m: 20,
    l: 30,
}

const bgDark = "#081233"
const bgLight = "#9cd1ec"

const backgroundColorDarkStyle: CSSProperties = {
    backgroundColor: bgDark
}
const backgroundColorLightStyle: CSSProperties = {
    backgroundColor: bgLight
}

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
}

const lightTheme: CSSProperties = {
    backgroundImage: `linear-gradient(to top, #fafbfb 0%, ${bgLight} 100%)`,
    color: colors.dark,

    "& label": {
        color: colors.dark
    }
}

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
})

export const buttonColors = ["red"] as const
export const buttonStyles = [
    "default",
    "text",
    "icon-small",
    "icon-large",
] as const

const textIconStyle: CSSProperties = {
    backgroundColor: "transparent",
    color: colors.blue.main,

    "&:active": {
        backgroundColor: colors.gray.dark,
    },

    "&:disabled": {
        color: colors.gray.main,
        backgroundColor: "transparent",
    },
    [`&.${buttonColors[0]}`]: {
        color: colors.red,
    },
}

const iconStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
}

style.createGlobalStyle({
    button: {
        fontWeight: "bold",
        fontSize: typography.m,
        fontFamily,

        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xs,

        padding: `7px ${spacing.s}px`,
        borderRadius: spacing.xs,
        backgroundColor: colors.blue.main,
        color: colors.light,
        border: 0,

        cursor: "pointer",

        ".icon": {
            height: 20,
            width: 20,
        },

        "&:active": {
            backgroundColor: "#0055b3",
        },

        [`&.${buttonColors[0]}`]: {
            backgroundColor: colors.red,

            "&:active": {
                backgroundColor: "#DB0C00",
            },
        },

        "&:disabled": {
            backgroundColor: colors.gray.main,
            color: opacity(colors.light, 70),
            cursor: "default",
        },

        [`&.${buttonStyles[1]}`]: textIconStyle,
        [`&.${buttonStyles[2]}`]: {
            ...textIconStyle,
            ...iconStyle,
            height: 24,
            width: 24,

            ".icon": {
                height: 20,
                width: 20,
            },
        },
        [`&.${buttonStyles[3]}`]: {
            ...textIconStyle,
            ...iconStyle,
            height: 38,
            width: 38,

            ".icon": {
                height: 30,
                width: 30,
            },
        },
    },
})