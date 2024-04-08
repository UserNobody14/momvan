import { describe, it, expect } from 'bun:test';
import van from "vanjs-core";
import { createRouter, routeTo } from '../router';

const route = createRouter();

describe("Basic string route matches",
    () => {
        it("Should match the right string", () => {
            expect(route.main.getRoute()).toEqual("/main");
        });

        it("Should match home", () => {
            expect(route.home.getRoute()).toEqual("/");
        });

    }
);

describe("Route matcher should match the right string", () => {
    it("Should match home correctly", () => {
        expect(route.home.getRouteMatchTest('/')).toEqual(true);
    });
    it("Should match main correctly", () => {
        expect(route.main.getRouteMatchTest('/main')).toEqual(true);
    });
    it("Should not match main correctly", () => {
        expect(route.main.getRouteMatchTest('/')).toEqual(false);
    });
    it("Should not match home correctly", () => {
        expect(route.home.getRouteMatchTest('/main')).toEqual(false);
    });

});

describe("Route matcher should match the right regex", () => {
    it("Should match simple regex correctly", () => {
        expect(route.regex(/example/).getRouteMatchTest('/example')).toEqual(true);
    });
    it("Should not match simple regex correctly", () => {
        expect(route.regex(/exampwe/).getRouteMatchTest('/example/')).toEqual(false);
    });
    it("Should match complex regex correctly", () => {
        expect(route.regex(/example\d+/).getRouteMatchTest('/example123')).toEqual(true);
    });

    it("Should not match complex regex correctly", () => {
        expect(route.regex(/example\d+/).getRouteMatchTest('/example')).toEqual(false);
    });

    it('Should enforce match size', () => {
        const rpasst = route.regex(/\w+/).getPassthrough;
        const rrg = rpasst.currentRoute.path[0];
        if (typeof rrg === 'object' && 'regex' in rrg) {
            const ve = rrg.regex;
            if (ve instanceof RegExp) {
                expect(ve.test('')).toEqual(false);
                expect(ve.test('a')).toEqual(true);
                expect(ve.test('ab')).toEqual(true);
                expect(ve.test('abc')).toEqual(true);
            }
        }
        console.log(JSON.stringify(rpasst, null, 2));
        expect(route.regex(/\w+/).getRouteMatchTest('/')).toEqual(false);
    });

    it('Should not match regex exclusions', () => {
        expect(route.notRegex(/example\d+/).getRouteMatchTest('/example123')).toEqual(false);
    });

});

describe("Route matcher should match not values", () => {
    it("Should match not correctly", () => {
        expect(route.not('example').getRouteMatchTest('/example')).toEqual(false);
    });
    it("Should not match not correctly", () => {
        expect(route.not('example3').getRouteMatchTest('/example')).toEqual(true);
    });
    it("Should match not correctly", () => {
        expect(route.not('example').getRouteMatchTest('/example123')).toEqual(true);
    });
    it("Should not match not correctly", () => {
        expect(route.not('example').getRouteMatchTest('/example')).toEqual(false);
    });
    it("Should match not correctly on home", () => {
        expect(route.not('example').getRouteMatchTest('/')).toEqual(true);
    });
});


describe("Route matcher should match oneof and allof statements", () => {
    it("Should match oneof correctly", () => {
        expect(route.oneOf('example', 'example2').getRouteMatchTest('/example')).toEqual(true);
    });
    it("Should not match oneof correctly", () => {
        expect(route.oneOf('example', 'example2').getRouteMatchTest('/example3')).toEqual(false);
    });
    it("Should not match allof correctly", () => {
        expect(route.allOf('example', 'example2').getRouteMatchTest('/example')).toEqual(false);
    });
    it("Should match allof correctly", () => {
        expect(route.allOf({
            regex: /example\d+/
        }, 'example2').getRouteMatchTest('/example2')).toEqual(true);
    });
    it("Should match allof correctly", () => {
        expect(route.allOf({
            regex: /example\d+/
        }, 'example2').getRouteMatchTest('/example123')).toEqual(false);
    });
});

describe("Route matcher should return the right match strings", () => {
    it("Should match the right string", () => {
        expect(route.main.getRouteMatchString).toEqual('main');
    });
    it("Should match the right string", () => {
        expect(route.main[':param'].getRouteMatchString).toEqual('main/:param');
    });
    it("Should match the right string", () => {
        expect(route.main[':param1'][':param2'].getRouteMatchString).toEqual('main/:param1/:param2');
    });
});

describe("Route matcher should get the correct params", () => {
    it("Should not have params", () => {
        expect(route.main.getRouteMatchFull('/main').hasParams).toEqual(false);
    });
    it("Should have params", () => {
        expect(route.main[':param'].getRouteMatchFull('/main/123').hasParams).toEqual(true);
    });
    it("Should have correct params 1", () => {
        expect(route.main[':param'].getRouteMatchFull('/main/123').params).toEqual({ param: '123' });
    });
    it("Should have 2 correct params", () => {
        expect(route.main[':param1'][':param2'].getRouteMatchFull('/main/123/456').params).toEqual({ 
            param1: '123',
            param2: '456'
         });
    });
    it("Should have correct params alt", () => {
        expect(route.main.param('param1', '123').param('param2', '456').getRouteMatchFull('/main/123/456').params).toEqual({ 
            param1: '123',
            param2: '456'
         });
    });
});

describe("Should handle escape, multiple, and optional routes", () => {
    it("Should handle escape routes", () => {
        expect(route.escape('a:vb').getRouteMatchTest('/a:vb')).toEqual(true);
    });
    it("Should handle multiple routes", () => {
        // TODO: Fix this
        expect(route.multiple('').getRouteMatchTest('/')).toEqual(true);
    });
    it("Should handle multiple routes", () => {
        expect(route.multiple('').getRouteMatchTest('/main')).toEqual(true);
    });
    // it("Should handle multiple routes", () => {
    //     expect(route.multiple.getRouteMatchTest('/main/123')).toEqual(true);
    // });
    // it("Should handle multiple routes", () => {
    //     expect(route.multiple.getRouteMatchTest('/main/123/456')).toEqual(true);
    // });
    // it("Should handle multiple routes", () => {
    //     expect(route.multiple.getRouteMatchTest('/main/123/456/789')).toEqual(true);
    // });
    it("Should handle optional routes1", () => {
        expect(route.optional('main').getRouteMatchTest('/')).toEqual(true);
    });
    it("Should handle optional routes2", () => {
        expect(route.optional('main').getRouteMatchTest('/main')).toEqual(true);
    });
    it("Should handle optional routes3", () => {
        expect(route.optional('main').regex(/\d+/).getRouteMatchTest('/main/123')).toEqual(true);
    });
    it("Should handle optional routes4", () => {
        expect(route.optional('main').regex(/\d+/).getRouteMatchTest('/123')).toEqual(true);
    });
    it("Should handle optional routes5", () => {
        expect(route.optional('main').bam.regex(/\d+/).getRouteMatchTest('/bam/123')).toEqual(true);
    });

    // False optional routes
    it("Should handle optional routes6", () => {
        expect(route.optional('main').getRouteMatchTest('/bam')).toEqual(false);
    });

    it("Should handle optional routes7", () => {
        expect(route.optional('main').getRouteMatchTest('/bam/123')).toEqual(false);
    });

    it("Should handle optional routes8", () => {
        expect(route.optional('main').regex(/\d+/).getRouteMatchTest('/bam/123')).toEqual(false);
    });

    it("Should handle optional routes9", () => {
        expect(route.optional('main').valaman.regex(/\d+/).getRouteMatchTest('/123')).toEqual(false);
    });
});

// Won't work while happy dom doesn't support history

// describe("Popstate and hashchange should trigger route changes", () => {
//     // it("Pathname should be editable", () => {
//     //     location.pathname = '/main';
//     //     expect(location.pathname).toEqual('/main');
//     // });
//     // it("Should trigger popstate", async () => {
//     //     console.log('p1',location.pathname);
//     //     const nnn = nowRoute();
//     //     // console.log(nnn);
//     //     location.pathname = '/main';
//     //     const hashchange = new PopStateEvent('hashchange');
//     //     window.dispatchEvent(hashchange);
//     //     await Bun.sleep(1000);
//     //     console.log('p2',location.pathname);
//     //     expect(nnn).not.toEqual(nowRoute());
//     // });
//     // it("Should trigger hashchange", async () => {
//     //     console.log('p1',location.pathname);
//     //     const nnn = nowRoute();
//     //     // console.log(nnn);
//     //     location.pathname = '/main';
//     //     const hashchange = new HashChangeEvent('hashchange');
//     //     window.dispatchEvent(hashchange);
//     //     await Bun.sleep(1000);
//     //     console.log('p2',location.pathname);
//     //     expect(nnn).not.toEqual(nowRoute());
//     // });
// });

describe("Primitive routeto tests", () => {
    it("Should not throw an error", () => {
        expect(() => routeTo('/main')).not.toThrow();
        expect(() => 
        window.dispatchEvent(new PopStateEvent('popstate'))
        ).not.toThrow();
    });

    it("Should take an array", () => {
        expect(() => routeTo('main', 'other')).not.toThrow();
        expect(() => 
        window.dispatchEvent(new PopStateEvent('popstate'))
        ).not.toThrow();
    });

    it("Should take a route", () => {
        expect(routeTo(route.whatever)).toEqual('/whatever');
        expect(() => 
        window.dispatchEvent(new PopStateEvent('popstate'))
        ).not.toThrow();
    });

    it("Should throw", () => {
        expect(() => routeTo({ getRoute: 'bee'} as any)).toThrow();
        expect(() => routeTo({ getRouuute: 'bee'} as any)).toThrow();
    });

    it("Should not throw", () => {
        expect(() => route.blah.toPrimitive).not.toThrow();
        expect(() => route.blah[Symbol.toPrimitive as any]).not.toThrow();
        expect(() => route.blah.toString()).not.toThrow();
        expect(() => 
        window.dispatchEvent(new PopStateEvent('popstate'))
        ).not.toThrow();
    });
    
});

describe("Primitive route display tests", () => {
    it("Should display the correct route", () => {
        expect((route.any(van.tags.div('test')) as any).outerHTML).toEqual(`<div data-route="*"><div>test</div></div>`);
    });

    it("Should add extra props", () => {
        expect((route.any.addExtraProps({
            class: 'test'
        })(van.tags.div('test')) as any).outerHTML
        ).toEqual(`<div class="test" data-route="*"><div>test</div></div>`);
    });

    it("Should setup param fns", () => {
        expect((route[':param1'].addExtraProps({
            class: 'test'
        })((param: any) => van.tags.div('test', param.param1)) as any).outerHTML
        ).toEqual(`<div class="test" data-route=":param1"><div>test</div></div>`);
    });
});