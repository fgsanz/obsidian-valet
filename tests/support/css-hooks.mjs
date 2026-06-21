// Node module loader hook: stub out CSS-module imports during tests. Components do
// `import styles from './X.module.css'`; Node can't import CSS, so we return a proxy whose keys
// resolve to the class name itself (e.g. styles.foo === 'foo'). That keeps className assertions
// meaningful in tests without any CSS bundling.
export async function load(url, context, nextLoad) {
  if (url.endsWith('.css')) {
    return {
      format: 'module',
      shortCircuit: true,
      source: 'export default new Proxy({}, { get: (_t, k) => (typeof k === "string" ? k : undefined) })',
    }
  }
  return nextLoad(url, context)
}
