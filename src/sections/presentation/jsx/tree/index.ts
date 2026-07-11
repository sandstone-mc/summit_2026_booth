// Public tree API.

export { flatWalk, flattenChildren, isVNode, nodeSelector, SNIPPET_START, SNIPPET_END } from './walk'
export type { NodeWithPath } from './walk'
export { extractText, extractCodeSource, codeSourceFromFunction, dedentBlock } from './extract'