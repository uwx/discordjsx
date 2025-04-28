import type { DJSXElements } from "./elements";

declare global {
    namespace React {
        namespace JSX {
            interface IntrinsicElements extends DJSXElements {}
            interface IntrinsicAttributes {
                key?: React.Key | null | undefined;
            }
        }
    }
}
