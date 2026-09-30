const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const { JSDOM } = require("jsdom");

function createHarness(url = "http://localhost:3000/discover", extraMocks = {}) {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { url, pretendToBeVisual: true });
  global.window = dom.window;
  global.document = dom.window.document;
  global.localStorage = dom.window.localStorage;
  global.sessionStorage = dom.window.sessionStorage;
  global.HTMLElement = dom.window.HTMLElement;
  global.SVGElement = dom.window.SVGElement;
  global.Element = dom.window.Element;
  Object.defineProperty(global, "navigator", { configurable: true, value: dom.window.navigator });
  global.IS_REACT_ACT_ENVIRONMENT = true;
  window.matchMedia = (media) => ({ media, matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
  window.scrollTo = () => {};
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};
  // jsdom does not implement native modal layout/focus trapping. These shims only
  // test the application's open/close state and scroll-lock behavior.
  dom.window.HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  dom.window.HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
  const React = require("react");
  const { createRoot } = require("react-dom/client");
  const { Simulate } = require("react-dom/test-utils");
  const { act } = React;
  const navigations = [];
  const replaceState = window.history.replaceState.bind(window.history);
  window.history.replaceState = (...args) => { replaceState(...args); window.dispatchEvent(new window.PopStateEvent("popstate")); };
  const subscribe = (callback) => { window.addEventListener("popstate", callback); return () => window.removeEventListener("popstate", callback); };
  const mocks = {
    "next/navigation": {
      useSearchParams() { const value = React.useSyncExternalStore(subscribe, () => window.location.search, () => ""); return new URLSearchParams(value); },
      useRouter() { return { push: (href) => navigations.push(href), replace: (href) => navigations.push(href) }; },
      usePathname() { return window.location.pathname; },
    },
    "next/link": { __esModule: true, default: React.forwardRef(function Link({ href, children, prefetch, scroll, replace, ...props }, ref) { return React.createElement("a", { ...props, href, ref }, children); }) },
  };
  Object.assign(mocks, extraMocks);
  const cache = new Map();
  const project = path.resolve(__dirname, "../..");
  function load(relative) {
    let filename = path.resolve(project, relative);
    if (!path.extname(filename)) filename += fs.existsSync(`${filename}.ts`) ? ".ts" : ".tsx";
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), { fileName: filename, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } });
    new Function("require", "module", "exports", outputText)((specifier) => {
      if (mocks[specifier]) return mocks[specifier];
      if (specifier.startsWith("@/")) return load(specifier.slice(2));
      if (specifier.startsWith(".")) return load(path.resolve(path.dirname(filename), specifier));
      return require(specifier);
    }, module, module.exports);
    return module.exports;
  }
  function mount(Component, props = {}) {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const { DataModeProvider } = load("lib/data/mode.tsx");
    const { RealWorkspaceProvider } = load("lib/data/real-workspace.tsx");
    act(() => root.render(React.createElement(DataModeProvider, { initialMode: "demo" }, React.createElement(RealWorkspaceProvider, null, React.createElement(Component, props)))));
    return { container, close() { act(() => root.unmount()); container.remove(); } };
  }
  function click(element) { if (!element) throw new Error("Missing click target"); act(() => element.click()); }
  function change(element, value) {
    if (!element) throw new Error("Missing input target");
    act(() => {
      element.value = value;
      Simulate.change(element, { target: element });
    });
  }
  return { dom, React, act, load, mount, click, change, navigations, close() { dom.window.close(); } };
}

module.exports = { createHarness };
