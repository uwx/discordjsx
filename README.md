# discord-jsx-renderer

![Discord](https://img.shields.io/discord/1197520507617153064?logo=discord)
[![Static Badge](https://img.shields.io/badge/view_on-github-blue?logo=github)](https://github.com/deniz-blue/discordjsx)
![NPM Version](https://img.shields.io/npm/v/discord-jsx-renderer)
![NPM Last Update](https://img.shields.io/npm/last-update/discord-jsx-renderer)
![GitHub Repo stars](https://img.shields.io/github/stars/deniz-blue/discordjsx)

Render react components for Discord interactions (Components V2 supported!)

You can use all sorts of react features including **state**, **context**, **effects** and more.

## Example

![Screenshot](./example/screenshot.png)

**Code:**

```jsx
export const Counter = () => {
    const [count, setCount] = useState(0);

    return (
        <message v2 ephemeral>
            <container>
                <text>
                    Counter: **{count}**
                </text>
                <row>
                    <button
                        style="danger"
                        onClick={() => setCount(c => c - 1)}
                    >
                        -1
                    </button>
                    <button
                        style="success"
                        onClick={() => setCount(c => c + 1)}
                    >
                        +1
                    </button>
                </row>
            </container>
        </message>
    )
};
```

## Installation

Simply install `discord-jsx-renderer` and `react` with your package manager of choice:

```sh
npm add discord-jsx-renderer react
```

For types, install `pure-react-types`:

```sh
npm add --save-dev pure-react-types
```

Don't install `@types/react` because it has a lot of DOM/HTML types built in that make everything difficult.

Finally, you can add these to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "types": ["pure-react-types"],
  },
}
```

## Usage

You should create a single `DJSXRendererManager` - it handles every instance of rendered responses to interactions and handles message component events.

```ts
import { DJSXRendererManager } from "discord-jsx-renderer";

export const djsx = new DJSXRendererManager();
```

On your `InteractionCreate` event, call `dispatchInteraction` - this will handle all rendered event callbacks, edit the message if neccesary and so on.

```ts
client.on(Events.InteractionCreate, (interaction: Interaction) => {
    djsx.dispatchInteraction(interaction);
});
```

Thats all you need for the setup.

To render a component in reply to a `ChatInputInteraction` (slash command), use `create`:

```jsx
client.on(Events.InteractionCreate, (interaction) => {
    if(!interaction.isChatInputCommand()) return;
    // Also do command handling logic etc.
    
    djsx.create(interaction, <MyComponent />);
});
```

```jsx
// or if youre using the discordjs.guide way
module.exports = {
    data: ...,
    async execute(interaction) {
        djsx.create(interaction, <MyComponent />);
    },
};
```

You can also reply to `ModalSubmitInteraction`s.

## Elements

See [docs/Elements.md](./docs/Elements.md) for a list of the JSX elements you can use to structure your components.

## API

How does it work?

`discord-jsx-renderer` is compromised of 4 things:
- `reconciler` (`JSXRenderer`) is a custom react renderer that renders the jsx into our own internal structure and also handles other stuff such as effects/state/hooks managment, re-rendering, commits, scheduling etc.
- `PayloadBuilder` parses the output from reconciler and builds a discord payload to use for the REST API. It also collects all the event handlers attached to the JSX. *If you are going to use it, please make a new class per message/payload*
- `DJSXRenderer` uses reconciler and PayloadBuilder to update the message and handle any attached events like `onClick` on a button component.
- `DJSXRendererManager` manages multiple renderers and helps dispatch any new interaction events from the `discord.js` client to the renderer. You can use the renderer itself but you will need to handle dispatching interactions and cleanup yourself too.

**Custom Ids:** If you use the `customId` prop on a jsx element, the `onClick` will **not** work. This is because the renderer creates its own customId's when they are missing and the generated ones include a prefix identifying that renderer. This was done so that the renderer can use `interaction.deferUpdate` if the react component does not re-render to cause a reply to the message component interaction.

Generated customId's will be in the format of `djsx:A:B` where `A` is the UUID key of the renderer and B is a random UUID unique to the message component.

Also, If you want to implement something like hot-reloading:

```jsx
let node = <MyComponent />;
let renderer = new DJSXRenderer(interaction, node);

// Somehow get value of updated node
let newNode = <MyComponent />;
renderer.setNode(newNode);
```

## Known Issues

> AKA To-Do

- `<modal>`s are still in development
- Message v1 - `<embed>` not implemented yet
- Uploading files via components not supported yet
