import type { IntrinsicRootElements, IntrinsicMessageComponents } from "./elements/index.js";
import type { IntrinsicMarkdownElements } from "./elements/markdown.js";

declare global {
    namespace React {
        namespace JSX {
            interface IntrinsicElements extends IntrinsicRootElements, IntrinsicMessageComponents, IntrinsicMarkdownElements {}
            interface IntrinsicAttributes {
                key?: React.Key | null | undefined;
            }
        }
    }
}
