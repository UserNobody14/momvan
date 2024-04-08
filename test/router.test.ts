import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mathSvgAuto } from "../mathTags";
import van from "vanjs-core";
import { createRouter } from '../router';

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