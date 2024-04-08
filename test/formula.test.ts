import { describe, it, expect } from 'bun:test';
import van from 'vanjs-core';
import { createForm } from '../formula';

describe('Should properly control the state', () => {
    it('Should properly display the form', () => {
        const { form, inputs: { username, password }, buttons: { submit, reset } } = createForm({});
        expect(form().outerHTML).toEqual('<form></form>');
        expect(username().outerHTML).toEqual('<input type="text" name="username">');
        expect(password().outerHTML).toEqual('<input type="text" name="password">');
        expect(submit().outerHTML).toEqual('<button type="submit"></button>');
        expect(reset().outerHTML).toEqual('<button type="reset"></button>');
    });
});

describe('Should handle changes to the state', () => {

    it('Should handle submissions', async () => {
        const { form, inputs: { username, password }, buttons: { submit, reset }, state } = createForm({});
        const submitBtn = submit('Login');
        document.body.innerHTML = '';
        van.add(
            document.body,
            form(
                {
                    id: 'login-form',
                },
                username({ placeholder: 'Username' }),
                password({ placeholder: 'Password' }),
                submitBtn
            )
        )
        const uuname = document.querySelector('input[name="username"]') as HTMLInputElement;
        const pass = document.querySelector('input[name="password"]') as HTMLInputElement;
        expect(state.val).toEqual({});
        uuname.value = 'test';
        pass.value = 'test';
        const valForm = document.getElementById('login-form') as HTMLFormElement;
        valForm.dispatchEvent(new Event('submit', {
            // target: valForm,
        }));

        await Bun.sleep(100);
        expect(state.val).toEqual({ username: 'test', password: 'test' });
    });

    it('Should handle submissions', async () => {
        const { form, inputs: { username, password }, buttons: { submit, reset }, state } = createForm({});
        const submitBtn = submit('Login');
        document.body.innerHTML = '';
        van.add(
            document.body,
            form(
                {
                    id: 'login-form',
                },
                username({ placeholder: 'Username' }),
                password({ placeholder: 'Password' }),
                submitBtn
            )
        )
        expect(state.val).toEqual({});
        const uuname = document.querySelector('input[name="username"]') as HTMLInputElement;
        const pass = document.querySelector('input[name="password"]') as HTMLInputElement;
        const submitBtn2 = document.querySelector('button[type="submit"]') as HTMLButtonElement;
        uuname.value = 'test';
        pass.value = 'test';
        submitBtn2.click();
        await Bun.sleep(100);
        expect(state.val).toEqual({ username: 'test', password: 'test' });
    });


    it('Should handle upper submissions', async () => {
        const { form, inputs: { username, password }, buttons: { submit, reset }, state } = createForm({
            onSubmit: (valls) => {
                expect(valls).toEqual({ username: 'test', password: 'test' });
            }
        });
        const submitBtn = submit('Login');
        document.body.innerHTML = '';
        van.add(
            document.body,
            form(
                {
                    id: 'login-form',
                },
                username({ placeholder: 'Username' }),
                password({ placeholder: 'Password' }),
                submitBtn
            )
        )
        expect(state.val).toEqual({});
        const uuname = document.querySelector('input[name="username"]') as HTMLInputElement;
        const pass = document.querySelector('input[name="password"]') as HTMLInputElement;
        const submitBtn2 = document.querySelector('button[type="submit"]') as HTMLButtonElement;
        uuname.value = 'test';
        pass.value = 'test';
        submitBtn2.click();
        await Bun.sleep(100);
        expect(state.val).toEqual({ username: 'test', password: 'test' });
    });

    it('Should handle changes to the state', async () => {
        const { form, inputs: { username, password }, buttons: { submit, reset }, state } = createForm({});
        document.body.innerHTML = '';
        van.add(
            document.body,
            form(
                {
                    id: 'login-form',
                },
                username({ placeholder: 'Username' }),
                password({ placeholder: 'Password' }),
            )
        )
        expect(state.val).toEqual({});
        const uuname = document.querySelector('input[name="username"]') as HTMLInputElement;
        const pass = document.querySelector('input[name="password"]') as HTMLInputElement;
        uuname.value = 'test';
        uuname.dispatchEvent(new Event('change'));
        pass.value = 'test';
        pass.dispatchEvent(new Event('change'));
        await Bun.sleep(100);
        expect(state.val).toEqual({ username: 'test', password: 'test' });
    });
});