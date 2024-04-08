# momvan

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

# What is this?

Momvan is a set of utilities that make working with vanjs much easier for me. All of the utilities are designed to work together, and provide a compact system for expressing frontend GUIs.

You can use the whole system easily like so:

```html
<html>
    <head>
        <!-- Just an example, momvan works with any css! -->
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body>
        <script type="module">
            import van from 'https://cdn.jsdelivr.net/npm/momvan@1.0.2/dist/index.js';

            // setup tags the standard van way
            const {
                div,
                button,
                h2
            } = van.tags;

            // setup some classes
            const bigRed = div.bgRed500.textLg;

            // setup some routes
            const route = van.createRouter();

            // setup a form
            const {
                state,
                form,
                inputs,
                submit,
            } = van.createForm({
                onSubmit: (values) => {
                    if (values.password === 'correct') {
                        van.routeTo('profile', values.username);
                    } else {
                        van.routeTo('error');
                    }
                }
            });

            // Put it all together!
            van.add(
                document.body,
                div(
                    route.login(
                        form.container.bgGray800(
                            inputs.username.w24(),
                            inputs.password.w24(),
                            submit('Log In')
                        )
                    ),
                    route.profile[':user'](
                        (params) => {
                            return div.wFull(
                                p.textXl.textBlue600(
                                    () => `Welcome ${params?.user}`
                                ),
                                button.bgRed500(
                                    {
                                        onclick: () => routeTo('login')
                                    },
                                    'Logout'
                                )
                            );
                        }
                    ),
                    route.error(
                        div.hFull.wFull(
                            h4.p8(
                                () => `Error, user: ${state.val.username} entered an incorrect password!`
                            ),
                            button.bgRed500(
                                {
                                    onclick: () => routeTo('login')
                                },
                                'Go back'
                            )
                        )
                    )
                )
            );


        </script>
    </body>
</html>
```

## Classes
Wrap each result of van.tags with a Proxy that on each get request returns another proxy
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

## Router

This is a router that can be used to create a single page application.
It is designed to be used with the `vanjs` library, and to be very compact.

An example of how to use this router is as follows:

```typescript
import van from 'momvan'

const { div } = van.tags

const route = van.createRouter({
   baseRoute: 'app',
});

const App = div(
 route.home(
  div('Home Page')
),
route.about(
 div('About Page')
)
route.user[':id'](params => div(`User ${params?.id}`))
)
```

## Formula

This is a system for writing forms in vanjs.

First you call "createForm", like so:

```typescript
import van from 'momvan';

const {
    state,
    inputs: {
        username,
        password
    },
    submit,
    reset
} = van.createForm();

const App = div(

   form(
     username({ placeholder: 'Username' }),
    password({ placeholder: 'Password' }),
   submit('Login'),
  ),
)

```