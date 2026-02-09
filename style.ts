import styleBuild from "./style/build.ts"
import type {
    CSSAnimationProperties,
    CSSProperties } from "./style/types.ts";

export const createClass = (globalThis as any).build
    ? styleBuild.createClass
    : (name: string, cssProperties: CSSProperties) => name;

export const createGlobalStyle = (globalThis as any).build
    ? styleBuild.createGlobalStyle
    : (cssProperties: CSSProperties) => { };

export const createAnimation = (globalThis as any).build
    ? styleBuild.createAnimation
    : (
        name: string,
        cssAnimationProperties: CSSAnimationProperties
    ) => name;

const style = {
    createClass,
    createGlobalStyle,
    createAnimation
};

export default style;