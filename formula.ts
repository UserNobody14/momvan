// ///////
// // Aliased Vars
// ///////

// let protoOf = Object.getPrototypeOf;

// let alwaysConnectedDom = { isConnected: 1 };

// let objProto = protoOf(alwaysConnectedDom);


// ///////
// // Config
// ///////

// var config = {
//     underScoreToDash: true,
//     camelCaseToDash: true,
//     alignDigitToDash: true,
//     prefix: "",
//     suffix: "",
// }

// ///////
// // Correct the class name
// ///////

// const correctClassName = (className: string) => {
//     let result = className;
//     if (config.underScoreToDash)
//         result = result.replace(/_/g, "-");
//     if (config.camelCaseToDash)
//         result = result.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
//     if (config.alignDigitToDash)
//         result = result.replace(/([a-z])(\d+)/g, "$1-$2");
//     return config.prefix + result + config.suffix;
// }
// ///////////////
// //
// // Wrapper
// //
// ///////////////

// const wrapperFn = (target: TagMap, opts: WrappedFnTypes = { }): TagMap => {
//     const { pathway = [], classes: classes1 = [], namespace = false } = opts;
//     return new Proxy(target, {
//         get: (target, prop, _receiver) => {
//           // Ignore the $$typeof and prototype properties
//           if (prop === '$$typeof' || prop === 'prototype')
//             return (target)[prop];
//           if (typeof prop === 'symbol')
//             return target[prop as any];
//           let result = target;
//           let classes = [...classes1, correctClassName(prop)];
//           // if at the top level, use the top level tag
//           if (pathway.length === 0) {
//               // if the tag is a math tag, use the math namespace
//               if (mathSet.has(prop))
//                   result = (target as any)(mathNs)[prop];
//               // if the tag is an svg tag, use the svg namespace
//               else if (svgSet.has(prop))
//                   result = (target as any)(svgNs)[prop];
//               else
//                   result = (target as any)[prop];
//               classes = [];
//           }
  
//           return wrapperFn(result, {
//               pathway: [...pathway, prop],
//               classes,
//           });
//         },
  
//         /**
//          * Apply the classes to the element
//          */
//           apply: (target, _thisArg, args) => {
//               if (pathway.length === 0)
//                   return wrapperFn((target as any)(...args), { pathway: [], classes: [] });
//               let [props, ...children] =
//               protoOf(args[0] ?? 0) === objProto ? args : [{}, ...args];
//               const newProps = { ...props, class: `${props.class ?? ''} ${classes1.join(' ')}` }
//               return (target as any)(newProps, ...children)
//           }
//       });
// }

// // const vantw = new Wrapper(van.tags as any, { classes: [], pathway: [] }).proxy;
// const momvan = wrapperFn(van.tags as any, { classes: [], pathway: [] });

// export default { tags: momvan, add: van.add, derive: van.derive, state: van.state, config, createRouter: createRouter, routeTo: routeTo};

/**
 * Form wrapper library to make creating forms easier
 * Example:
 * 
 * ```typescript
 * import { createForm } from 'momvan';
 * 
 * const {
 *      form,
 *     inputs: {
 *        username,
 *       password,
 *     },
 *      buttons: {
 *       submit,
 *       reset,
 * 
 *     },
 * } = createForm();
 * 
 * const App = div(
 * 
 *    form(
 *      username({ placeholder: 'Username' }),
 *     password({ placeholder: 'Password' }),
 *    submit('Login'),
 *   ),
 * )
 */

import van from 'vanjs-core';

import { wrapperFn, type TagMap } from './wrapperFn';

/**
 * 
 * TODO: get the form to hold and sync a state
 * TODO: get submit and reset to sync w/ state
 * TODO: sync up events to trigger state changes
  * TODO: add default states?
 * 
 * Alternate form elements:
 * checkbox
 * color
 * date
 * datetime-local
 * email
 * file
 * hidden
 * image
 * month
 * number
 * password
 * radio
 * range
 * search
 * textarea
 */

export interface FormConfig {
    onSubmit?: (e: any) => void;
}

export const createForm = (formInputs: FormConfig) => {

    const state = van.state<any>({});

    const inputs = new Proxy<Record<string, TagMap["input"]>>({}, {
        get: (target, p, rec) => {
            const customInput = wrapperFn(van.tags as any, { 
                classes: [], pathway: [],
                carryOtherProps: { 
                    // TODO: add more input types
                    type: 'text',
                    // TODO: make input change only the field it's associated with
                    onchange: van.derive(() => (e: any) => {
                        const cc = state.val
                        const newCC = { ...cc, [p]: e.target.value };
                        state.val = newCC;
                    }),
                    value: () => state.val[p],
                    name: p,
                },
            });
            // select type?
            return customInput.input;
        }
    });

    const customSubmit = wrapperFn(van.tags as any, { 
        classes: [], pathway: [],
        carryOtherProps: { 
            type: 'submit',
        },
    });
    const customReset = wrapperFn(van.tags as any, { 
        classes: [], pathway: [],
        carryOtherProps: { 
            type: 'reset',
        },
    });

    const customForm = wrapperFn(van.tags as any, {
        classes: [], pathway: [],
        carryOtherProps: {
            onsubmit: (e: { preventDefault: () => void; target: HTMLFormElement | undefined; }) => {
                const formData = new FormData(e.target);
                // output as an object
                const values = Object.fromEntries(formData as any);
                state.val = values;
                if (formInputs.onSubmit) {
                    e.preventDefault();
                    formInputs.onSubmit(values);
                }
            }
        },
    });

    return {
        form: customForm.form,
        inputs,
        buttons: {
            submit: customSubmit.button,
            reset: customReset.button,
        },
        submit: customSubmit.button,
        reset: customReset.button,
        state,
    };
}