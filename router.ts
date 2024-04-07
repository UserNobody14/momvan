
import van, { type ChildDom, type TagFunc } from 'vanjs-core';
const { div: useBetterDiv } = van.tags;

// To add:
/**
 * 1. Exclusions ("not" routes) and other matching options (via extraKeys)
 * - not = ensure the next segment is not the pattern provided
 * - regex = match the pattern provided
 * - notRegex = ensure the next segment does not match the pattern provided
 * - optional = the next segment is optional
 * - multiple = the next segment can be repeated
 * - oneOf = the next segment can be one of the provided options
 * - allOf = the next segment must match all of the provided options
 * - param = next segment is a named parameter & pattern
 * - escape = next segment is a literal string, can be escaped characters and/or one of the above options
 * 2. Query parameters
 * 3. Data loaders? + loading displays
 * 4. Route guards / authentication
 * 5. Route transitions?
 */
//

export type RouteMatcherObject = { 
        not: RouteMatcher;
    } |
    { 
        regex: RegExp;
    } |
    { 
        notRegex: RegExp;
    } |
    { 
        optional: RouteMatcher;
    } |
    { 
        multiple: RouteMatcher;
    } |
    { 
        oneOf: RouteMatcher[];
    } |
    { 
        allOf: RouteMatcher[];
    } |
    { 
        param: { name: string; test: RouteMatcher; };
    } |
    { 
        escape: RouteMatcher;
    } |
    {
        matchAny: true
    } |
    { 
        fn: (segment: string) => { matches: boolean, increment?: number, params?: any, hasParams?: boolean };
    };

export type RouteMatcher = string | RouteMatcherObject;

export interface ActiveRoute {
    routePath: string[];
}

export const nowRoute = (): ActiveRoute => {
    const li = location.pathname.split('/')
    const routePath = [(li[1] === '' ? 'home' : li[1]), ...li.slice(2)];
    console.log(routePath);
    return {
        routePath,
    };
}

export const activeRoute = van.state<ActiveRoute>(nowRoute())

window.addEventListener('popstate', (ee) => {
    console.log('POPSTATE', ee);
    activeRoute.val = nowRoute()
});
window.addEventListener('hashchange', (ee) => {
    console.log('HASH', ee);
    console.log('Ev', history.state);
    activeRoute.val = nowRoute()
});

const isParamProp = (prop: RouteMatcher) => {
    if (typeof prop !== 'string') {
        if (typeof prop === 'object') {
            return prop.hasOwnProperty('param');
        } else {
            return false;
        }
    }
    return prop.startsWith(':');
}

const getParamName = (prop: RouteMatcher) => {
    if (typeof prop !== 'string') {
        if (typeof prop === 'object' && 'param' in prop) {
            return prop.param.name;
        } else {
            return '';
        }
    }
    return prop.slice(1);
}

const routeMaster = (cr: RoutePassthrough) => {
    const ll = cr.currentRoute.path
    return (ll2?: Record<string, string>, exampleRoute?: ActiveRoute) => {
        let buildPath = cr.baseRoute ?? '';
        let failure = false;
        for (let i = 0; i < ll.length; i++) {
            const v = ll[i];
            if (isParamProp(v)) {
                const paramName = getParamName(v);
                if (ll2 && paramName in ll2) {
                    buildPath += `/${ll2[paramName]}`;
                } else {
                    console.error(`Missing parameter ${paramName}`);
                    failure = true;
                }
            } else if (typeof v === 'string') {
                buildPath += `/${v}`;
            } else if (typeof v === 'object') {
                if (
                    ('matchAny' in v ) || ('multiple' in v) || ('oneOf' in v) || ('allOf' in v) || 
                    ('fn' in v) || ('escape' in v) || ('optional' in v) || ('not' in v) ||
                     ('param' in v)
                    ) {
                    continue;
                }
                if (exampleRoute) {
                    if (('regex' in v) || ('notRegex' in v)) {
                        const segment = exampleRoute.routePath[i];
                        const { matches } = matchSegment(segment, v);
                        if (matches) {
                            buildPath += `/${segment}`;
                        } else {
                            console.error(`Failed to match regex at segment ${i} with ${segment}`);
                            failure = true;
                        }
                    
                    }
                    if ('escape' in v) {
                        const segment = exampleRoute.routePath[i];
                        if (segment === v.escape) {
                            buildPath += `/${segment}`;
                        } else {
                            console.error(`Failed to match escape at segment ${i} with ${segment}`);
                            failure = true;
                        }
            
                    }
                }
            }
        }
        return failure ? '' : buildPath;
    }
}

interface SegmentMatch {
    matches: boolean;
    increment?: number;
    params?: any;
    hasParams?: boolean;
}

const matchSegment = (segment: string, prop: RouteMatcher, furtherSegments = []): SegmentMatch => {
    let params: Record<string, string> = {};
    if (typeof prop !== 'string') {
        if (typeof prop === 'object') {
            console.log("Prop", prop);
            if ('matchAny' in prop) {
                return { matches: true, increment: 1 };
            }
            if ('not' in prop) {
                const smatch = matchSegment(segment, prop.not);
                return { matches: !smatch.matches, increment: 0 };
            }
            if ('regex' in prop) {
                return {
                    matches: prop.regex.test(segment),
                };
            }
            if ('notRegex' in prop) {
                return {
                    matches: !prop.notRegex.test(segment),
                };
            }
            if ('optional' in prop) {
                const mt = matchSegment(segment, prop.optional);
                return {
                    matches: true, increment: mt.matches ? mt.increment : 0,
                    params: mt.matches ? mt.params : {},
                    hasParams: mt.matches && mt.hasParams
                };
            }
            if ('multiple' in prop) {
                /// TODO: Implement multiple
                return { matches: true };
            }
            if ('oneOf' in prop) {
                return prop.oneOf.reduce<SegmentMatch>((acc, v) => {
                    if (acc.matches) {
                        return acc;
                    }
                    return matchSegment(segment, v);
                },
                    { matches: false, params, hasParams: false }
                );
            }
            if ('allOf' in prop) {
                return prop.allOf.reduce<SegmentMatch>((acc, v) => {
                    if (!acc.matches) {
                        return acc;
                    }
                    const mm3 = matchSegment(segment, v);
                    if (mm3.matches) {
                        return {
                            matches: true, params: {
                                ...acc.params,
                                ...mm3.params,
                            }, hasParams: acc.hasParams || mm3.hasParams
                        };
                    } else {
                        return { matches: false, params: {}, hasParams: false };
                    }
                },
                    { matches: true, increment: 0, params, hasParams: false }
                );
            }
            if ('param' in prop) {
                const mmm = matchSegment(segment, prop.param.test);
                if (mmm.matches) {
                    params[prop.param.name] = segment;
                    return { matches: true, params, hasParams: true };
                } else {
                    return { matches: false, params, hasParams: false };
                }
            }
            if ('escape' in prop) {
                return { matches: segment === prop.escape };
            }
            if ('fn' in prop) {
                return prop.fn(segment);
            }
            return { matches: false };
        }
        return { matches: false };
    }
    if (isParamProp(prop)) {
        params[getParamName(prop)] = segment;
        return { matches: true, params, hasParams: true };
    }
    return { matches: segment === prop };
}

const applyRouteMatch = (activeRoute: ActiveRoute = { routePath: [] }, currentRoute: RoutePassthrough = { 
    currentRoute: {
    path: []
    }
 }) => {
    const aPath = activeRoute.routePath;
    const cPath = currentRoute.currentRoute.path;
    let show = false,
        params: Record<string, string> = {},
        hasParams = false;
    show = true;
    let aIdx = 0;
    for (let i = 0; i < cPath.length; i++) {
        if (aIdx >= aPath.length) {
            show = false;
            break;
        }
        const v = aPath[aIdx];
        const c = cPath[i];
        const { matches, increment = 1, params: newParams, hasParams: paramsFound } = matchSegment(v, c);
        if (paramsFound) {
            params = { ...params, ...newParams };
            hasParams = true;
        }

        if (matches) {
            aIdx += increment;
            continue;
        } else {
            show = false;
            break;
        }
    }
    if (aIdx < aPath.length) {
        console.log("Failed to consume all segments", aIdx, aPath.length, params, hasParams);
        show = false;
    }
    // }
    return {
        show,
        params,
        hasParams,
    }
}

export interface RoutePassthrough {
    currentRoute: {
        path: RouteMatcher[];
        hasParams?: boolean;
    };
    baseRoute?: string;
}


const addPropToRoute = (prps: RoutePassthrough, prop: RouteMatcher) => {
    const cR = prps.currentRoute;
    // const concatNext = prop?.eager ?? true;
    // const concatPrior = cR.concatNext;
    return {
        ...prps,
        currentRoute: {
            ...cR,
            hasParams: cR.hasParams || isParamProp(prop),
            path: [...cR.path, prop]
        }
    }
}

type ExtraKeys = keyof ExtraKeyObject<any>;

// Returns a map of strings to (either tag functions or other maps)
export interface RecursiveRouteMap<T extends RouteInputs> {
    [key: string]: RecursiveRouteMap<T> & TagFunc<T> & ExtraKeysAsFinal<T>;

}
export type ExtraKeysAsFinal<T extends RouteInputs> = {
    [K in ExtraKeys]: ReturnType<ExtraKeyObject<T>[K]>
};
export type FinalRouteObject<T extends RouteInputs> = RecursiveRouteMap<T> & ExtraKeysAsFinal<T> & TagFunc<T>;


class ExtraKeyObject <T extends RouteInputs> {
    not = (prps: RoutePassthrough) => (prop: RouteMatcher): FinalRouteObject<T> => {
        return withRouterFn<T>(
            addPropToRoute(prps, {
                not: prop,
                // eager: false,
            })
        )
    }

    regex = (prps: RoutePassthrough) => (prop: RegExp | string): FinalRouteObject<T> => {
        return withRouterFn<T>(
            addPropToRoute(prps, {
                regex: RegExp(prop),
            })
        )
    }

    notRegex = (prps: RoutePassthrough) => (prop: RegExp | string): FinalRouteObject<T> => {
        return withRouterFn<T>(
            addPropToRoute(prps, {
                notRegex: RegExp(prop),
            })
        )
    }

    optional = (prps: RoutePassthrough) => (prop: RouteMatcher): FinalRouteObject<T> => {
        return withRouterFn<T>(
            addPropToRoute(prps, {
                optional: prop,
            })
        )
    }

    multiple = (prps: RoutePassthrough) => (prop: RouteMatcher): FinalRouteObject<T> => {
        return withRouterFn<T>(
            addPropToRoute(prps, {
                multiple: prop,
            })
        )
    }

    oneOf = (prps: RoutePassthrough) => (...props: RouteMatcher[]): FinalRouteObject<T> => {
        return withRouterFn<T>(
            addPropToRoute(prps, {
                oneOf: props,
            })
        )
    }

    allOf = (prps: RoutePassthrough) => (...props: RouteMatcher[]): FinalRouteObject<T> => {
        return withRouterFn<T>(
            addPropToRoute(prps, {
                allOf: props,
            })
        )
    }

    param = (prps: RoutePassthrough) => (name: string, test: RouteMatcher): FinalRouteObject<T> => {
        return withRouterFn<T>(
            addPropToRoute(prps, {
                param: {
                    name,
                    test,
                },
            })
        )
    }

    escape = (prps: RoutePassthrough) => (prop: string): FinalRouteObject<T> => {
        return withRouterFn<T>(
            addPropToRoute(prps, {
                escape: prop,
            })
        )
    }

    fn = (prps: RoutePassthrough) => (fn: 
        (segment: string) => { matches: boolean, increment?: number, params?: any, hasParams?: boolean }
        ): FinalRouteObject<T> => {
        return withRouterFn<T>(
            addPropToRoute(prps, {
                fn,
            })
        )
    }

    any = (prps: RoutePassthrough): FinalRouteObject<T> => {
        return withRouterFn<T>(
            addPropToRoute(prps, {
                matchAny: true,
            })
        )
    }

    //// Get just the matcher object as a van property

    matcher = (prps: RoutePassthrough) => {
        const routeMatch = van.derive(() => applyRouteMatch(activeRoute.val, prps));
        return routeMatch;
    }

    //// Get a goto function for the route

    goto = (prps: RoutePassthrough) => {
        return (params: Record<string, string>) => {
            // Fill in the params
            return routeMaster(prps)(params, activeRoute.val);

        }
    }

};

type RouteInputs = ((params: Record<string, string>) => ChildDom | ChildDom[]) | ChildDom | ChildDom[];

const withRouterFn = <T extends RouteInputs>(prps: RoutePassthrough): FinalRouteObject<T> => {
    const extraKeys1 = new ExtraKeyObject<T>();
    const router = new Proxy(
        (...args: T[]) => {
            // display or hide the route
            const routeMatch = van.derive(() => applyRouteMatch(activeRoute.val, prps));
            const shouldNotShowRoute = van.derive(() => !routeMatch.val.show);
            const childDom: ReadonlyArray<ChildDom> = args.map<ChildDom | ChildDom[]>((arg) => {
                if (typeof arg === 'function' && prps.currentRoute.hasParams) {
                    return (() => {
                        const ffv = van.derive(() => {
                            console.log('Params', routeMatch.val.params);
                            return routeMatch.val;
                        });
                        return arg(routeMatch.val.params as any);
                    }) as (ChildDom | ChildDom[]);
                }
                return arg as (ChildDom | ChildDom[]);
            });
            return useBetterDiv(
                {
                    hidden: shouldNotShowRoute,
                },
                childDom
            );
        },
        {
            get(target, prop, receiver) {
                if (typeof prop === 'symbol') {
                    return (target as any)[prop as any];
                }
                if (prop in extraKeys1) {
                    return extraKeys1[prop as ExtraKeys](prps);
                }
                return withRouterFn(addPropToRoute(prps, prop));
            },
        }
    );
    return router as unknown as FinalRouteObject<T>;
};

export const routeTo = (path = 'home') => {
    let pathname = path;
    if (path === 'home') {
        pathname = '';
    }
    history.pushState({
        path,
        pathname,
        checkItem: "yes", // Change?
    }, '', `/${pathname}`);
    window.dispatchEvent(new HashChangeEvent('hashchange'));

}

export const createRouter = (r?: RoutePassthrough) => {
    const rr = r ?? { currentRoute: { path: [] } };
    const rrr = {
        ...rr,
        currentRoute: {
            ...rr.currentRoute,
            path: []
        }
    };
    return withRouterFn(rrr);
}

export const route = createRouter();
