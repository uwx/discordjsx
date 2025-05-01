import { Suspense } from "react";
import { jsx } from "react/jsx-runtime";
import { globalSuspense } from "src/intrinsics/elements";

export function GlobalSuspense({ children }: { children: React.ReactNode }) {
    return <Suspense fallback={jsx(globalSuspense as any, {})}>{children}</Suspense>;
}