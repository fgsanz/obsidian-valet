// Test bootstrap for component (React) tests, loaded via `node --import`.
// 1) Provide a DOM (jsdom) so React can render.
// 2) Stub CSS-module imports so components load under Node.
import 'global-jsdom/register'
import { register } from 'node:module'

register('./css-hooks.mjs', import.meta.url)

// Tell React this is a proper `act()` environment (silences warnings, enables effects in tests).
globalThis.IS_REACT_ACT_ENVIRONMENT = true
