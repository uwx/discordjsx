import { type APIMessageComponent, type BaseMessageOptions, ComponentType } from "discord.js";

/**
 * Do NOT pass in non-raw components. WILL not work.
 */
export const markComponentsDisabled = (payload: BaseMessageOptions): BaseMessageOptions => {
    const crawl = (components: readonly APIMessageComponent[]) => {
        return components.map((c): APIMessageComponent => {
            if(
                c.type === ComponentType.Button
                || c.type === ComponentType.StringSelect
                || c.type === ComponentType.UserSelect
                || c.type === ComponentType.RoleSelect
                || c.type === ComponentType.MentionableSelect
                || c.type === ComponentType.ChannelSelect
            ) {
                return {
                    ...c,
                    disabled: true,
                };
            }
            if(
                c.type === ComponentType.Container
                || c.type === ComponentType.ActionRow
            ) {
                return {
                    ...c,
                    components: crawl(c.components) as any,
                };
            }
            if(c.type === ComponentType.Section) {
                return {
                    ...c,
                    // components: only text so we can skip
                    accessory: c.accessory.type === ComponentType.Button ? crawl([c.accessory])[0] as any : c,
                };
            }
            return c;
        });
    };

    return {
        ...payload,
        components: payload.components ? crawl(payload.components as APIMessageComponent[]) : payload.components,
    };
};
