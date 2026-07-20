// Module declarations for Bun file loaders.
// Bun uses import attributes (TC39 standard) to pick a loader:
//   import lessSrc from './style.less' with { type: 'text' }
//
// `with { type: 'text' }` tells Bun to read the file as a string.
// TypeScript still needs to know the type of `.less` modules because
// the extension isn't standard.

declare module '*.less' {
	const content: string
	export default content
}

declare module '*.mcfunction' {
	const content: string
	export default content
}

declare module '*.log' {
	const content: string
	export default content
}