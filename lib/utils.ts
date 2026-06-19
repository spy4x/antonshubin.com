import { createDefine } from "fresh";

// This specifies the type of "ctx.state" which is used to share
// data among middlewares, layouts and routes.
// deno-lint-ignore no-empty-interface
export interface State {
}

export const define = createDefine<State>();
