import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { wrapperFn } from "../wrapperFn";
import { mathSvgAuto } from "../mathTags";
import van from "vanjs-core";
/**
 * Wrap each result of van.tags with a Proxy that on each get request returns another proxy
that adds a tailwind (or any other) class to the "class" property of the eventual element.

So you call van.tags normally (albeit from momvan instead):

```typescript
import van from 'momvan';
const { div } = van.tags;
```

And then you can style the elements like this:

```typescript
const myTailwindDiv = div.bgRed500.textWhite("Hello, world!");
```

And the div will have the classes "bg-red-500 text-white".
This is equivalent to the below:

```typescript
const myTailwindDiv = div({ class: "bg-red-500 text-white" }, "Hello, world!");
```
 */

const momvan = wrapperFn(van.tags as any, { 
    classes: [], 
    pathway: [],
    changeResultFn: mathSvgAuto
});

const updateElementRef = <T extends HTMLElement>(element: T): T => {
    const id = element.id;
    if (!id) throw new Error('Element must have an id');
    const elementRef = document.getElementById(id);
    if (elementRef) {
        return elementRef as T;
    }
    return element;
}

describe('Should get the right classes', () => {
    it('Should get the right classes', () => {
        const { div } = momvan;
        const myTailwindDiv = div.bgRed500.textWhite("Hello, world!");
        expect(myTailwindDiv.className).toEqual(
            "bg-red-500 text-white"
        );

    });

    it('Should be the same in all other respects', () => {
        const { div } = van.tags;
        const myVanDiv = div({ class: "bg-red-500 text-white" }, "Hello, world!");
        const { div: div1 } = momvan;
        const myTailwindDiv = div1.bgRed500.textWhite("Hello, world!");
        expect(myTailwindDiv.outerHTML).toEqual(myVanDiv.outerHTML);
    })

    it('Should still work with no classes', () => {
        const { div } = momvan;
        const myTailwindDiv = div("Hello, world!");
        expect(myTailwindDiv.outerHTML).toEqual('<div>Hello, world!</div>');
    });

    it('Should work with multiple classes', () => {
        const { div } = momvan;
        const myTailwindDiv = div.bgRed500.textWhite.w6["hover:bg-green-100"]("Hello, world!");
        expect(myTailwindDiv.className).toEqual("bg-red-500 text-white w-6 hover:bg-green-100");
    });

});

describe('Should work with nested elements', () => {
    it('Should work with nested elements', () => {
        const { div, span } = momvan;
        const myTailwindDiv = div.bgRed500.textWhite(
            span.bgGreen500.textWhite("Hello, world!")
        );
        expect(myTailwindDiv.outerHTML).toEqual(
            '<div class="bg-red-500 text-white"><span class="bg-green-500 text-white">Hello, world!</span></div>'
        );
    });

    it('Should work with nested elements with classes', () => {
        const { div, span } = momvan;
        const myTailwindDiv = div.bgRed500.textWhite(
            span.bgGreen500.textWhite("Hello, world!")
        );
        expect(myTailwindDiv.outerHTML).toEqual(
            '<div class="bg-red-500 text-white"><span class="bg-green-500 text-white">Hello, world!</span></div>'
        );
    });
});

describe('Should work with math and svg tags', () => {
    it('Should work with math and svg tags', () => {
        const { math, svg } = momvan;
        const myMath = math({ class: "bg-red-500 text-white" }, "Hello, world!");
        const oldMath = van.tags('http://www.w3.org/1998/Math/MathML').math({ class: "bg-red-500 text-white" }, "Hello, world!");
        const mySvg = svg({ class: "bg-red-500 text-white" }, "Hello, world!");
        const oldSvg = van.tags('http://www.w3.org/2000/svg').svg({ class: "bg-red-500 text-white" }, "Hello, world!");
        expect(myMath.outerHTML).toEqual(oldMath.outerHTML);
        expect(mySvg.outerHTML).toEqual(oldSvg.outerHTML);
        expect(myMath.namespaceURI).toEqual('http://www.w3.org/1998/Math/MathML');
        expect(mySvg.namespaceURI).toEqual('http://www.w3.org/2000/svg');
    });
    it('Should preserve class structure with math and svg', () => {
        const { math, svg } = momvan;
        const myMath = math.bgRed500.textWhite("Hello, world!");
        const oldMath = van.tags('http://www.w3.org/1998/Math/MathML').math({ class: "bg-red-500 text-white" }, "Hello, world!");
        const mySvg = svg.bgRed500.textWhite("Hello, world!");
        const oldSvg = van.tags('http://www.w3.org/2000/svg').svg({ class: "bg-red-500 text-white" }, "Hello, world!");
        expect(myMath.outerHTML).toEqual(oldMath.outerHTML);
        expect(mySvg.outerHTML).toEqual(oldSvg.outerHTML);
        expect(myMath.namespaceURI).toEqual('http://www.w3.org/1998/Math/MathML');
        expect(mySvg.namespaceURI).toEqual('http://www.w3.org/2000/svg');
    });
});

describe('Should work with state', () => {
    const momvan = wrapperFn(van.tags as any, { 
        classes: [], 
        pathway: [],
        changeResultFn: mathSvgAuto
    });
    it('Should work with simple state', async () => {
        // expect(() => new Text('test')).not.toThrow();
        // const text = new Text('test');
        const { div } = momvan;
        const vState = van.state(0);
        const vState2 = van.derive(() => vState.val + '');
        let myTailwindDiv = div.bgRed500.textWhite(
            {
                id: "test1",
            },
            vState2
        );
        let oldStyleDiv = van.tags.div({ 
            id: "test2",
            class: "bg-red-500 text-white" }, van.derive(() => vState2.val));

        van.add(
            document.body,
            [myTailwindDiv, oldStyleDiv]
        );
        myTailwindDiv = updateElementRef(myTailwindDiv);
        oldStyleDiv = updateElementRef(oldStyleDiv);
        // expect(myTailwindDiv.outerHTML).toEqual(oldStyleDiv.outerHTML);
        // vState.val = 1;
        // for (const gg of [1,2,3,4,5,6,7,8,9,10]) {
        //     await Bun.sleep(100);
        //     vState.val = gg;
        //     console.log(myTailwindDiv.outerHTML, oldStyleDiv.outerHTML, myTailwindDiv.innerHTML, oldStyleDiv.innerHTML);
        // }
        vState.val = 1;
        await Bun.sleep(100);

        myTailwindDiv = updateElementRef(myTailwindDiv);
        oldStyleDiv = updateElementRef(oldStyleDiv);
        expect(oldStyleDiv.innerHTML).toEqual('1');
        expect(myTailwindDiv.innerHTML).toEqual('1');
        expect(myTailwindDiv.outerHTML).toEqual('<div id="test1" class="bg-red-500 text-white">1</div>');
    });

    it('Should work within', async () => {
        // expect(() => new Text('test')).not.toThrow();
        // const text = new Text('test');
        const { div } = momvan;
        const vState = van.state(0);
        const vState2 = van.derive(() => vState.val + '');
        let myTailwindDiv = div.bgRed500.textWhite(
            {id: "test1"},
            vState2
        );
        let oldStyleDiv = van.tags.div({ 
            id: "test2",
            class: "bg-red-500 text-white" }, van.derive(() => vState2.val));

        // expect(myTailwindDiv.outerHTML).toEqual(oldStyleDiv.outerHTML);
        // await Bun.sleep(2000);
        van.add(
            document.body,
            myTailwindDiv
        );
        van.add(
            document.body,
            oldStyleDiv
        );
        vState.val = 1;
        await Bun.sleep(100);
        oldStyleDiv = updateElementRef(oldStyleDiv);
        myTailwindDiv = updateElementRef(myTailwindDiv);

        expect(oldStyleDiv.innerHTML).toEqual('1');
        expect(myTailwindDiv.innerHTML).toEqual('1');
    });

    it('Should work with properties', async () => {

        const { div } = momvan;
        const vState = van.state(0);
        const vState2 = van.derive(() => vState.val + '');
        document.body.innerHTML = '';
        let myTailwindDiv = div.bgRed500.textWhite(
            {
                id: "test1",
                "data-state": () => vState2.val,
            },
            "Hello, world!"
        );
        let oldStyleDiv = van.tags.div({ 
            id: "test2",
            class: "bg-red-500 text-white", "data-state": vState2 }, "Hello, world!");

        van.add(
            document.body,
            [myTailwindDiv, oldStyleDiv]
        );
        await Bun.sleep(100);

        oldStyleDiv = updateElementRef(oldStyleDiv);
        myTailwindDiv = updateElementRef(myTailwindDiv);
        await Bun.sleep(100);
        expect(oldStyleDiv.getAttribute('data-state')).toEqual('0');
        expect(myTailwindDiv.getAttribute('data-state')).toEqual('0');
        vState.val = 1;
        await Bun.sleep(100);
        oldStyleDiv = updateElementRef(oldStyleDiv);
        myTailwindDiv = updateElementRef(myTailwindDiv);
        expect(myTailwindDiv.getAttribute('data-state')).toEqual('1');
        expect(myTailwindDiv.getAttribute('data-state')).toEqual('1');
    });

});