import { type TagFunc } from "vanjs-core";

///////
// Config
///////
const config = {
    underScoreToDash: true,
    camelCaseToDash: true,
    alignDigitToDash: true,
    prefix: "",
    suffix: "",
};

///////////
// New tag type
///////////
export type TagMap = RecursiveTagMap<Element> & {
    [K in keyof HTMLElementTagNameMap]: RecursiveTagMap<HTMLElementTagNameMap[K]> & TagFunc<HTMLElementTagNameMap[K]>;
} & ((namepaceUri: string) => RecursiveTagMap<Element>);
// Returns a map of strings to (either tag functions or other maps)
export interface RecursiveTagMap<T> {
    [key: string]: RecursiveTagMap<T> & TagFunc<T>;
}

export interface WrappedFnTypes {
    pathway?: string[];
    classes?: string[];
    namespace?: boolean;
    carryOtherProps?: any;
    classConversionConfig?: typeof config;
    changeResultFn?: (pathway: string[], prop: string, target: TagMap) => TagMap;
}
///////
// Aliased Vars
///////
let protoOf = Object.getPrototypeOf;
let alwaysConnectedDom = { isConnected: 1 };
let objProto = protoOf(alwaysConnectedDom);

///////
// Correct the class name
///////
const correctClassName = (className: string, config1: typeof config) => {
    let result = className;
    if (config1.underScoreToDash)
        result = result.replace(/_/g, "-");
    if (config1.camelCaseToDash)
        result = result.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
    if (config1.alignDigitToDash)
        result = result.replace(/([a-z])(\d+)/g, "$1-$2");
    return config1.prefix + result + config1.suffix;
};
///////////////
//
// Wrapper
//
///////////////
export const wrapperFn = (target1: TagMap, opts: WrappedFnTypes = {}): TagMap => {
    const {
        pathway = [], classes: classes1 = [], ...rest
    } = opts;
    return new Proxy(target1, {
        get: (target, prop, _receiver): any => {
            // Ignore the $$typeof and prototype properties
            if (prop === '$$typeof' || prop === 'prototype') {
                return (target)[prop];
            }
            if (typeof prop === 'symbol') {
                return target[prop as any];
            }

            let result = target;
            let classes = [...classes1, correctClassName(prop, rest.classConversionConfig ?? config)];
            if (rest.changeResultFn)
                result = rest.changeResultFn(pathway, prop as string, target);
            // if at the top level, use the top level tag
            if (pathway.length === 0) {
                result = (result as any)[prop];
                classes = [];
            }

            return wrapperFn(result, {
                pathway: [...pathway, prop],
                classes,
                ...rest
            });
        },

        /**
         * Apply the classes to the element
         */
        apply: (target2, _thisArg, args) => {
            // If this is the first call, return the result of the namespace fn
            if (pathway.length === 0)
                return wrapperFn((target2 as any)(...args), { pathway: [], classes: [], ...rest });
            let [props, ...children] = protoOf(args[0] ?? 0) === objProto ? args : [{}, ...args];
            const otherClasses1 = `${props.class ?? ''} ${classes1.join(' ')} ${rest.carryOtherProps?.class ?? ''} ${
                rest.carryOtherProps?.className ?? ''
            }`;
            const otherClasses = otherClasses1.trim();
            const withClasses = otherClasses.length > 0 ? { class: otherClasses } : {};
            const newProps = {
                ...props,
                ...(rest.carryOtherProps ?? {}),
                ...withClasses
            };
            return (target2 as any)(newProps, ...children);
        }
    });
};
