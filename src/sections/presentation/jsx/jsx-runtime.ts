export const jsx = (type: any, props: any, key: any) => {
  return { type, props, key };
};

export const jsxs = jsx;

// Dev-mode JSX transform calls `jsxDEV` instead of `jsx` with extra debug
// args (source, self). We ignore those — they only matter for devtools.
export const jsxDEV = (type: any, props: any, key: any) => {
  return { type, props, key };
};

export const Fragment = (props: { children: any }) => props.children;

// TypeScript Global Namespace Extension
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
    interface Element {
      type: any;
      props: any;
      key: any;
    }
  }
}