

import van from "vanjs-core";
import { activeRoute, createRouter, routeTo } from "./router";
import { wrapperFn } from "./wrapperFn";
import { createForm } from "./formula";
import { mathSvgAuto } from "./mathTags";


// const vantw = new Wrapper(van.tags as any, { classes: [], pathway: [] }).proxy;
const momvan = wrapperFn(van.tags as any, { 
    classes: [], 
    pathway: [],
    changeResultFn: mathSvgAuto
});

export default { tags: momvan, add: van.add, derive: van.derive, state: van.state, 
    createForm: createForm,
    internal: {
        wrapperFn
    }, createRouter: createRouter, routeTo: routeTo, activeRoute};