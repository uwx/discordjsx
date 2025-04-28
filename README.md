# discord-jsx-renderer

![Discord](https://img.shields.io/discord/1197520507617153064?logo=discord)
[![Static Badge](https://img.shields.io/badge/view_on-github-blue?logo=github)](https://github.com/deniz-blue/discordjsx)
![NPM Version](https://img.shields.io/npm/v/discord-jsx-renderer)
![NPM Last Update](https://img.shields.io/npm/last-update/discord-jsx-renderer)
![GitHub Repo stars](https://img.shields.io/github/stars/deniz-blue/discordjsx)

Render react components for Discord interactions (Components V2 supported!)

You can use all sorts of react features including state, context and more.

> [Known issue: @types/react IntrinsicElements pollution](#known-issues)

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

Simply install `discord-jsx-renderer` with your package manager of choice:

```sh
pnpm add discord-jsx-renderer
```
```sh
npm add discord-jsx-renderer
```
```sh
yarn add discord-jsx-renderer
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

```tsx
client.on(Events.InteractionCreate, (interaction) => {
    if(!interaction.isChatInputCommand()) return;
    // Also do command handling logic etc.
    
    djsx.create(interaction, <MyComponent />);
});
```

## Elements

- Root Elements
  - [`<message>`](#message)
  - `<modal>` **WIP**
- Discord Layout Components
  - [`<container>`](#container)
  - [`<section>`](#section)
  - [`<row>`](#row)
- Discord Interactive Components
  - [`<button>`](#button)
  - [`<select>`](#select)
  - `<textInput>` **WIP**
- Discord Content Components
  - [`<text>`](#text)
  - [`<separator>`](#separator)
  - [`<thumbnail>`](#thumbnail)
  - [`<gallery>`](#gallery)
  - [`<file>`](#file)

---

### message

| prop       | type      | description          |
|------------|-----------|----------------------|
| ephemeral? | `boolean` | Make reply ephemeral |
| v2?        | `boolean` | Use Components v2    |

---

### container

| prop     | type                | description            |
|----------|---------------------|------------------------|
| color?   | [`ColorResolvable`] | Container accent color |
| spoiler? | `boolean`           |                        |

### row

Action Row component, no props.

### section

```tsx
<section>
    <accessory>
        {/* <thumbnail> or <button> */}
    </accessory>
    {/* components... */}
</section>
```

---

### button

Children will become button label

| prop      | type                                                | description                                |
|-----------|-----------------------------------------------------|--------------------------------------------|
| onClick?  | `(`[`ButtonInteraction`]`) => void`                 | click event                                |
| style?    | `"primary" \| "secondary" \| "success" \| "danger"` | style if normal button                     |
| disabled? | `boolean`                                           | disabled state                             |
| url?      | `string`                                            | if specified, will become a link button    |
| skuId?    | `string`                                            | if specified, will become a premium button |
| customId? | `string`                                            | experimental                               |

### select

| prop           | type                                                          | description                                      |
|----------------|---------------------------------------------------------------|--------------------------------------------------|
| type           | `"string" \| "user" \| "role" \| "mentionable" \| "channel"`  | Select component type                            |
| onSelect?      | `(`[`Snowflake`]`[], `[`AnySelectMenuInteraction`]`) => void` | interaction type is derived from `type` prop     |
| min?           | `number`                                                      | minimum amount                                   |
| max?           | `number`                                                      | maximum amount                                   |
| disabled?      | `boolean`                                                     | disabled state                                   |
| placeholder?   | `string`                                                      |                                                  |
| options?       | `Omit<`[`APISelectMenuOption`]`, "default">[]`                | only on `type="select"`                          |
| defaultValues? | [`Snowflake`]`[]`                                             | only on `type="user"` or `"role"` or `"channel"` |
| defaultValues? | `{ id: `[`Snowflake`]`, type: "user" \| "role" }[]`           | only on `type="mentionable"`                     |
| channelTypes?  | [`ChannelType`]`[]`                                           | only on `type="channel"`                         |
| customId?      | `string`                                                      | experimental                                     |

---

### text

Children will become content. No props.

### separator

| prop     | type           | description |
|----------|----------------|-------------|
| divider? | `boolean`      |             |
| spacing? | `"sm" \| "lg"` |             |

### thumbnail

| prop         | type      | description |
|--------------|-----------|-------------|
| description? | `string`  | alt text    |
| spoiler?     | `boolean` |             |
| media?       | `string`  | url         |

### gallery

| prop   | type                        | description   |
|--------|-----------------------------|---------------|
| items? | [`APIMediaGalleryItem`]`[]` | gallery items |

### file

| prop     | type      | description               |
|----------|-----------|---------------------------|
| file?    | `string`  | url as `attachment://...` |
| spoiler? | `boolean` |                           |

## Known Issues

> AKA To-Do

- `@types/react` pollutes `React.JSX.IntrinsicElements`
  - going to publish a new package for react types without DOM or HTML stuff
- `<modal>`s are still in development
- Message v1 - `<embed>` not implemented yet
- Uploading files via components not supported yet

[`ButtonInteraction`]: https://discord.js.org/docs/packages/discord.js/14.19.1/ButtonInteraction:Class
[`ColorResolvable`]: https://discord.js.org/docs/packages/discord.js/14.19.1/ColorResolvable:TypeAlias
[`APISelectMenuOption`]: https://discord.js.org/docs/packages/discord.js/14.19.1/APISelectMenuOption:Interface
[`Snowflake`]: https://discord.js.org/docs/packages/discord.js/14.19.1/Snowflake:TypeAlias
[`Snowflake`]: https://discord.js.org/docs/packages/discord.js/14.19.1/Snowflake:TypeAlias
[`AnySelectMenuInteraction`]: https://discord.js.org/docs/packages/discord.js/14.19.1/AnySelectMenuInteraction:TypeAlias
[`ChannelType`]: https://discord.js.org/docs/packages/discord.js/14.19.1/ChannelType:Enum
[`APIMediaGalleryItem`]: https://discord.js.org/docs/packages/discord.js/14.19.1/APIMediaGalleryItem:Interface
