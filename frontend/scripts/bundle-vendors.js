const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const tempDir = path.resolve(__dirname, '../temp_entries');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const reactPath = require.resolve('react');
const reactDomPath = require.resolve('react-dom');
const reactDomClientPath = require.resolve('react-dom/client');
const jsxRuntimePath = require.resolve('react/jsx-runtime');

const reactAllEntry = path.join(tempDir, 'entry-react-all.js');
fs.writeFileSync(reactAllEntry, `
import * as ReactModule from ${JSON.stringify(reactPath)};
import * as ReactDOMModule from ${JSON.stringify(reactDomPath)};
import * as ReactDOMClientModule from ${JSON.stringify(reactDomClientPath)};
import * as JSXModule from ${JSON.stringify(jsxRuntimePath)};

const R = ReactModule.default || ReactModule;
const RDOM = ReactDOMModule.default || ReactDOMModule;
const RDOMClient = ReactDOMClientModule.default || ReactDOMClientModule;
const J = JSXModule.default || JSXModule;
const MergedDOM = { ...RDOM, ...RDOMClient };

// Export full objects for default exports
export { R as ReactDefault, MergedDOM as ReactDOMDefault, J as JSXDefault };

// React named exports
export const Children = R.Children;
export const Component = R.Component;
export const Fragment = R.Fragment;
export const Profiler = R.Profiler;
export const PureComponent = R.PureComponent;
export const StrictMode = R.StrictMode;
export const Suspense = R.Suspense;
export const cloneElement = R.cloneElement;
export const createContext = R.createContext;
export const createElement = R.createElement;
export const createRef = R.createRef;
export const forwardRef = R.forwardRef;
export const isValidElement = R.isValidElement;
export const lazy = R.lazy;
export const memo = R.memo;
export const startTransition = R.startTransition;
export const use = R.use;
export const useActionState = R.useActionState;
export const useCallback = R.useCallback;
export const useContext = R.useContext;
export const useDebugValue = R.useDebugValue;
export const useDeferredValue = R.useDeferredValue;
export const useEffect = R.useEffect;
export const useId = R.useId;
export const useImperativeHandle = R.useImperativeHandle;
export const useInsertionEffect = R.useInsertionEffect;
export const useLayoutEffect = R.useLayoutEffect;
export const useMemo = R.useMemo;
export const useOptimistic = R.useOptimistic;
export const useReducer = R.useReducer;
export const useRef = R.useRef;
export const useState = R.useState;
export const useSyncExternalStore = R.useSyncExternalStore;
export const useTransition = R.useTransition;
export const version = R.version;

// ReactDOM + Client exports
export const createPortal = MergedDOM.createPortal;
export const flushSync = MergedDOM.flushSync;
export const findDOMNode = MergedDOM.findDOMNode;
export const unmountComponentAtNode = MergedDOM.unmountComponentAtNode;
export const unstable_batchedUpdates = MergedDOM.unstable_batchedUpdates;
export const useFormState = MergedDOM.useFormState;
export const useFormStatus = MergedDOM.useFormStatus;
export const preload = MergedDOM.preload;
export const preinit = MergedDOM.preinit;
export const preconnect = MergedDOM.preconnect;
export const prefetchDNS = MergedDOM.prefetchDNS;

export const createRoot = MergedDOM.createRoot;
export const hydrateRoot = MergedDOM.hydrateRoot;

// JSX Runtime exports
export const jsx = J.jsx;
export const jsxs = J.jsxs;
export const jsxDEV = J.jsxDEV;

// Default export of vendor-react.js is React
export default R;

// Global window attachments
if (typeof window !== 'undefined') {
  window.React = R;
  window.ReactDOM = MergedDOM;
  window.ReactJSXRuntime = J;
}
`);

const outDir = path.resolve(__dirname, '../shell/public/assets');

async function buildVendors() {
  // Build monolithic vendor-react.js with NO external dependencies
  await esbuild.build({
    entryPoints: [reactAllEntry],
    outfile: path.join(outDir, 'vendor-react.js'),
    bundle: true,
    format: 'esm',
    target: 'es2022',
    define: {
      'process.env.NODE_ENV': '"production"'
    }
  });
  console.log('Built unified vendor-react.js!');

  // vendor-react-dom.js exports all symbols and defaults to ReactDOMDefault
  fs.writeFileSync(
    path.join(outDir, 'vendor-react-dom.js'),
    `export * from "./vendor-react.js";\nimport { ReactDOMDefault } from "./vendor-react.js";\nexport default ReactDOMDefault;\n`
  );

  // vendor-jsx-runtime.js exports all symbols and defaults to JSXDefault
  fs.writeFileSync(
    path.join(outDir, 'vendor-jsx-runtime.js'),
    `export * from "./vendor-react.js";\nimport { JSXDefault } from "./vendor-react.js";\nexport default JSXDefault;\n`
  );
  console.log('Written vendor-react-dom.js and vendor-jsx-runtime.js with proper default exports!');

  // Clean up tempDir
  fs.rmSync(tempDir, { recursive: true, force: true });
}

buildVendors().catch(err => {
  console.error(err);
  process.exit(1);
});
