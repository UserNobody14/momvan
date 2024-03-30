/**
 * Wrap each result of van.tags with a Proxy that on each get request returns another proxy
 * that adds a tailwind (or any other) class to the "class" property of the eventual element.
 * 
 * So you call van.tags normally (albeit from momvan instead):
 * 
 * const { div } = van.tags;
 * 
 * And then you can style the elements like this:
 * 
 * const myTailwindDiv = div.bgRed500.textWhite("Hello, world!");
 * 
 * And the div will have the classes "bg-red-500 text-white".
 * This is equivalent to the below:
 * 
 * const myTailwindDiv = div({ class: "bg-red-500 text-white" }, "Hello, world!");
 * 
 */

import van, { type TagFunc } from "vanjs-core";
import { mathSet, mathNs, svgSet, svgNs } from "./mathTags";

///////
// Aliased Vars
///////

let protoOf = Object.getPrototypeOf;

let alwaysConnectedDom = { isConnected: 1 };

let objProto = protoOf(alwaysConnectedDom);


///////
// Config
///////

var config = {
    underScoreToDash: true,
    camelCaseToDash: true,
    alignDigitToDash: true,
    prefix: "",
    suffix: "",
}

///////
// Correct the class name
///////

const correctClassName = (className: string) => {
    let result = className;
    if (config.underScoreToDash)
        result = result.replace(/_/g, "-");
    if (config.camelCaseToDash)
        result = result.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
    if (config.alignDigitToDash)
        result = result.replace(/([a-z])(\d+)/g, "$1-$2");
    return config.prefix + result + config.suffix;
}

///////////
// New tag type
///////////

type TagMap = RecursiveTagMap<Element> & {

    [K in keyof HTMLElementTagNameMap]: RecursiveTagMap<HTMLElementTagNameMap[K]> & TagFunc<HTMLElementTagNameMap[K]>
  
  } & ((namepaceUri: string) => RecursiveTagMap<Element>);

// Returns a map of strings to (either tag functions or other maps)
interface RecursiveTagMap<T> {
    [key: string]: RecursiveTagMap<T> & TagFunc<T>;
}





///////
// Wrapper that holds the ongoing classes
///////


class Wrapper {
  proxy: TagMap;
  pathway: string[] = []
  classes: string[] = []

  constructor(
    target: TagMap,
    opts: { pathway: string[], classes: string[] } = { pathway: [], classes: [] }
  ) {
    if (opts?.pathway)
      this.pathway = opts.pathway
    if (opts?.classes)
        this.classes = opts.classes;

    this.proxy = new Proxy(target, {
      get: (target, prop, _receiver) => {
        // Ignore the $$typeof and prototype properties
        if (prop === '$$typeof' || prop === 'prototype')
          return (target)[prop];
        if (typeof prop === 'symbol')
          return target[prop as any];
        let result = target;
        let classes = [...this.classes, correctClassName(prop)];
        // if at the top level, use the top level tag
        if (this.pathway.length === 0) {
            // if the tag is a math tag, use the math namespace
            if (mathSet.has(prop))
                result = (target as any)(mathNs)[prop];
            // if the tag is an svg tag, use the svg namespace
            else if (svgSet.has(prop))
                result = (target as any)(svgNs)[prop];
            else
                result = (target as any)[prop];
            classes = [];
        }

        return new Wrapper(result, {
            pathway: [...this.pathway, prop],
            classes,
        }).proxy;
      },

      /**
       * Apply the classes to the element
       */
        apply: (target, _thisArg, args) => {
            if (this.pathway.length === 0)
                return new Wrapper((target as any)(...args), { pathway: [], classes: [] }).proxy;
            let [props, ...children] =
            protoOf(args[0] ?? 0) === objProto ? args : [{}, ...args];
            // const [props, ...children] = args;
            const newProps = { ...props, class: `${props.class ?? ''} ${this.classes.join(' ')}` }
            return (target as any)(newProps, ...children)
        }
    })
  }
}

const vantw = new Wrapper(van.tags as any, { classes: [], pathway: [] }).proxy;


export default { tags: vantw, add: van.add, derive: van.derive, state: van.state, config};