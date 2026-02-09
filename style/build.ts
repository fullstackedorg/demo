import type {
    CSSAnimationProperties,
    CSSProperties
} from "./types.ts";
import {
    propertiesDefaultingToPx } from "./types.ts"
import { cssProperties } from "./css.ts";

const propertiesDefaultingToPxArr = Object.keys(propertiesDefaultingToPx);
const allCSSProperties = cssProperties

type StyleItem = {
    element: {
        style: Record<string, string>
    };
    order: number;
    children: StyleTree;
    type: "style";
};

type StyleTree = {
    [name: string]: StyleItem | AnimationItem;
};

type AnimationItem = {
    element: null;
    order: number;
    children: StyleTree;
    type: "animation";
};

const styles: StyleTree = {};
let order = 0;

function getOrCreateParentFromPath(path: string[], parent = styles): StyleTree {
    if (path.length === 0) {
        return parent;
    }

    const child = path.shift();
    if (!parent[child]) {
        parent[child] = {
            element: {
                style: {}
            },
            order: order++,
            children: {},
            type: "style"
        };
    }

    return getOrCreateParentFromPath(path, parent[child].children);
}

function toStyleAttribute(attr: string) {
    return attr.replace(/([A-Z])/g, '-$1').toLowerCase()
}

function toCssText(style: Record<string, string>) {
    return Object.entries(style).map(([k, v]) => toStyleAttribute(k) + ":" + v).join(";")
}

function createStyle(
    cssProperties: CSSProperties,
    path: string[],
    existing: StyleItem
) {
    const styleItem: StyleItem = existing || {
        element: {
            style: {},
        },
        order: order++,
        children: {},
        type: "style"
    };

    Object.entries(cssProperties).forEach(([property, value]) => {
        if (
            !allCSSProperties.includes(property) &&
            !property.startsWith("Webkit") &&
            !property.startsWith("Moz")
        ) {
            if (property.startsWith("@media")) {
                const parentPath = [property, ...path];
                _createClass(
                    parentPath,
                    value,
                    getOrCreateParentFromPath(parentPath.slice(0, -1))
                );
            } else {
                _createClass([...path, property], value, styleItem.children);
            }
        } else {
            if (
                propertiesDefaultingToPxArr.includes(property) &&
                value &&
                typeof value === "number"
            ) {
                value = value + "px";
            }

            styleItem.element.style[property] = value;
        }
    });

    return styleItem;
}

function _createClass(
    path: string[],
    cssProperties: CSSProperties,
    parent = styles
) {
    parent[path.at(-1)] = createStyle(
        cssProperties,
        path,
        parent[path.at(-1)] as StyleItem
    );
}

export function createClass(name: string, cssProperties: CSSProperties) {
    _createClass(["." + name], cssProperties);
    return name;
}

export function createGlobalStyle(globalCssProperties: CSSProperties) {
    Object.entries(globalCssProperties).forEach(([name, cssProperties]) => {
        styles[name] = createStyle(
            cssProperties,
            [name],
            styles[name] as StyleItem
        );
    });
}

export function createAnimation(
    name: string,
    cssAnimationProperties: CSSAnimationProperties
) {
    styles[name] = {
        ...(createStyle(
            cssAnimationProperties,
            [name],
            styles[name] as StyleItem
        ) as any),
        order: -1,
        type: "animation"
    };
    return name;
}

function constructClassName(path: string[]) {
    return path.reduce(
        (str, item) =>
            str + (item.startsWith("&") ? item.slice(1) : ` ${item}`),
        ""
    );
}

function generateStyleRecusively(path: string[] = [], parent = styles): string {
    return Object.entries(parent)
        .sort(([tagA, itemA], [tagB, itemB]) => {
            const tagAisMedia = tagA.startsWith("@media");
            const tabBisMedia = tagB.startsWith("@media");
            if (tagAisMedia && !tabBisMedia) return 1;
            else if (!tagAisMedia && tabBisMedia) return -1;
            else if (tagAisMedia && tabBisMedia) {
                let numberA = parseInt(tagA.match(/\d+/g)?.[0] || "0");
                let numberB = parseInt(tagB.match(/\d+/g)?.[0] || "0");
                if (isNaN(numberA)) numberA = 0;
                if (isNaN(numberB)) numberB = 0;
                return numberB - numberA;
            } else return itemA.order - itemB.order;
        })
        .map(([tag, styleItem]) => {
            if (styleItem.type === "animation") {
                return `@keyframes ${tag} { ${generateStyleRecusively([], styleItem.children)} }`;
            }

            let css = "";

            const currentPath = [...path, tag];

            const cssString = toCssText(styleItem.element.style);

            if (cssString) {
                css += `${constructClassName(currentPath)} { ${cssString} } `;
            }

            if (styleItem.children) {
                if (tag.startsWith("@media")) {
                    css += `${tag} { ${generateStyleRecusively(
                        currentPath.slice(1),
                        styleItem.children
                    )} }`;
                } else {
                    css += generateStyleRecusively(
                        currentPath,
                        styleItem.children
                    );
                }
            }

            return css;
        })
        .flat()
        .join("");
}

export function exportStyles() {
    return generateStyleRecusively();
}

const style = {
    createClass,
    createGlobalStyle,
    createAnimation
};

export default style;