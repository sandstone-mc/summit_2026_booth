import less from 'less'

// @types/less@3.0.8 declares LessStatic globally but only covers render()
// + Options. It does NOT expose parse() or the `tree` namespace. Workaround:
// extend the global LessStatic interface directly via declare global.

declare global {
	interface LessStatic {
		parse(input: string): Promise<LessTreeNode>
		parse(input: string, options: Less.Options): Promise<LessTreeNode>
		tree: LessTree
	}

	// Source-position info carried on nodes that have one.
	interface LessFileInfo {
		currentDirectory: string
		entryPath: string
		filename: string
		rewriteUrls: boolean
		rootFilename: string
		rootpath: string
	}

	// `toCSS(context)` argument — pass `{}` outside a render.
	interface LessContext {
		paths?: string[] | string
		rewriteUrls?: boolean
		rootpath?: string
		compress?: boolean
		strictImports?: boolean
		insecure?: boolean
		dumpLineNumbers?: string
		syncImport?: boolean
		mime?: string
		useFileCache?: boolean
		processImports?: boolean
		pluginManager?: Less.PluginManager
		quiet?: boolean
		quietDeprecations?: boolean
		math?: number | 'parens' | 'always' | 'strict'
		strictUnits?: boolean
		sourceMap?: boolean | Less.SourceMapOption
		importMultiple?: boolean
		urlArgs?: string
		javascriptEnabled?: boolean
		frames?: LessTreeNode[]
		importantScope?: LessTreeNode[]
		calcStack?: boolean[]
		inCalc?: boolean
	}

	type LessToCSSContext = LessContext

	interface LessDebugInfo {
		lineNumber: number
		fileName: string
	}

	interface LessFunctionRegistry {
		_data: Record<string, LessCallNode>
		add(name: string, fn: LessCallNode): LessFunctionRegistry
		addMultiple(fns: Record<string, LessCallNode>): LessFunctionRegistry
		create(name: string): LessCallNode
		get(name: string): LessCallNode | undefined
		getLocalFunctions(): Record<string, LessCallNode>
		inherit(...parents: LessFunctionRegistry[]): LessFunctionRegistry
	}
}

// AST base. Every node carries these; fields ending in `| undefined`
// are lazily set by the evaluator or never set.
export interface LessNodeBase {
	type: string
	parent: LessTreeNode | null
	_fileInfo: LessFileInfo | undefined
	_index: number | undefined
	parsed: Set<LessTreeNode> | null
	rootNode: LessRulesetNode | null
	nodeVisible: boolean | undefined
	visibilityBlocks: number | undefined
	toCSS(context?: LessToCSSContext): string | number
}

// Root + nested rulesets. `selectors` is omitted on the synthetic root
// ruleset that wraps an `@media` body.
export interface LessRulesetNode extends LessNodeBase {
	type: 'Ruleset'
	selectors?: LessSelectorNode[]
	rules?: LessTreeNode[]
	root: boolean | undefined
	firstRoot: boolean | undefined
	isRuleset: true
	allowImports: boolean | undefined
	allowRoot: boolean
	strictImports: boolean
	debugInfo: LessDebugInfo | undefined
	evalFirst: boolean
	paths: LessSelectorNode[][] | undefined
	originalRuleset: LessRulesetNode | undefined
	functionRegistry: LessFunctionRegistry | undefined
	_lookups: Record<string, LessTreeNode>
	_properties: Record<string, LessDeclarationNode[]> | null
	_rulesets: LessRulesetNode[] | null
	_variables: Record<string, LessTreeNode> | null
	value: LessRulesetNode | undefined
}

export interface LessMediaNode extends LessNodeBase {
	type: 'Media'
	features: LessTreeNode
	rules: LessTreeNode[]
	isRooted: boolean
	simpleBlock: boolean | undefined
	allowRoot: boolean
	debugInfo: LessDebugInfo | undefined
	declarations: LessTreeNode[] | undefined
	name: string | null
	value: LessTreeNode | undefined
}

export interface LessMixinDefinitionNode extends LessNodeBase {
	type: 'MixinDefinition'
	name: string
	params: LessMixinParam[]
	optionalParameters: LessMixinParam[]
	arity: number
	required: number
	variadic: boolean
	condition: LessTreeNode | null
	rules: LessTreeNode[]
	selectors: LessSelectorNode[]
	root: boolean | undefined
	frames: LessTreeNode[] | undefined
	_lookups: Record<string, LessTreeNode>
	_properties: Record<string, LessDeclarationNode[]> | null
	_rulesets: LessRulesetNode[] | null
	_variables: Record<string, LessTreeNode> | null
	allowImports: boolean | undefined
	allowRoot: boolean
	debugInfo: LessDebugInfo | undefined
	evalFirst: boolean
	firstRoot: boolean | undefined
	functionRegistry: LessFunctionRegistry | undefined
	isRuleset: true
	originalRuleset: LessRulesetNode | undefined
	paths: LessSelectorNode[][] | undefined
	strictImports: boolean | undefined
	value: LessRulesetNode | undefined
}

export interface LessMixinCallNode extends LessNodeBase {
	type: 'MixinCall'
	selector: LessSelectorNode
	arguments: LessMixinArg[]
	important: boolean | string
	allowRoot: boolean
	value: LessRulesetNode[] | undefined
}

export interface LessImportNode extends LessNodeBase {
	type: 'Import'
	path: LessTreeNode
	features: LessTreeNode | null
	options: string | null
	root: LessRulesetNode | undefined
	importManager: Less.ImportManager & {
		less: LessStatic
		rootFilename: string
		paths: string[]
		contentsIgnoredChars: Record<string, string>
		mime: string
		error: Error | null
		context: LessContext
		queue: string[]
		files: Record<string, { root: LessRulesetNode; options: LessImportOptions }>
		push(
			path: string,
			tryAppendExtension: boolean | string,
			currentFileInfo: LessFileInfo,
			importOptions: LessImportOptions,
			callback: (err: Error | null, root?: LessRulesetNode, fullPath?: string) => void,
		): void
	}
	isLoaded: boolean
	once: boolean
	css: boolean | undefined
	layerCss: boolean | undefined
	importedFilename: string | undefined
	skip: boolean | undefined
	error: Error | undefined
	value: LessTreeNode | undefined
}

interface LessImportOptions {
	reference?: boolean
	inline?: boolean
	less?: boolean
	css?: boolean
	once?: boolean
	multiple?: boolean
	optional?: boolean
}

export interface LessAtRuleNode extends LessNodeBase {
	type: 'AtRule'
	name: string
	value: LessTreeNode | undefined
	rules: LessTreeNode[] | undefined
	debugInfo: LessDebugInfo | undefined
	simpleBlock: boolean | undefined
	declarations: LessTreeNode[] | undefined
}

// Selectors ────────────────────────────────────────────

export interface LessSelectorNode extends LessNodeBase {
	type: 'Selector'
	elements: LessElementNode[]
	evaldCondition: boolean
	condition: LessConditionNode | null
	extendList: LessExtendNode[] | undefined
	mediaEmpty: boolean | undefined
	mixinElements_: LessSelectorNode[] | undefined
	value: undefined
}

export interface LessElementNode extends LessNodeBase {
	type: 'Element'
	value: string | null
	combinator: LessCombinatorNode
	isVariable: boolean
}

export interface LessCombinatorNode extends LessNodeBase {
	type: 'Combinator'
	value: string
	emptyOrWhitespace: boolean
}

export interface LessAttributeNode extends LessNodeBase {
	type: 'Attribute'
	key: string
	op: string
	value: LessTreeNode
	cif: boolean | undefined
}

// Declarations ────────────────────────────────────────────

export interface LessDeclarationNode extends LessNodeBase {
	type: 'Declaration'
	name: string | LessKeywordNode[]
	value:
		| LessValueNode
		| LessExpressionNode
		| LessAnonymousNode
		| LessDimensionNode
		| LessColorNode
		| LessOperationNode
		| LessVariableNode
		| LessQuotedNode
		| LessCallNode
	important: string
	variable: boolean
	inline: boolean
	merge: boolean
	allowRoot: boolean
}

// Values ────────────────────────────────────────────

export interface LessValueNode extends LessNodeBase {
	type: 'Value'
	value: LessExpressionNode[]
}

export interface LessExpressionNode extends LessNodeBase {
	type: 'Expression'
	value: LessTreeNode[]
	parens: boolean | undefined
	noSpacing: boolean | undefined
	parensInOp: boolean | undefined
}

export interface LessColorNode extends LessNodeBase {
	type: 'Color'
	value: string
	rgb: number[]
	alpha: number
}

export interface LessDimensionNode extends LessNodeBase {
	type: 'Dimension'
	value: number
	unit: LessUnitNode
	parensInOp: boolean
}

export interface LessUnitNode extends LessNodeBase {
	type: 'Unit'
	value: string
	numerator: string[]
	denominator: string[]
	backupUnit: string
}

export interface LessKeywordNode extends LessNodeBase {
	type: 'Keyword'
	value: string
}

export interface LessOperationNode extends LessNodeBase {
	type: 'Operation'
	op: '+' | '-' | '*' | '/'
	operands: LessTreeNode[]
	isSpaced: boolean
	value: number | string
}

export interface LessParenNode extends LessNodeBase {
	type: 'Paren'
	value: LessTreeNode
	noSpacing: boolean | undefined
}

export interface LessQuotedNode extends LessNodeBase {
	type: 'Quoted'
	value: string
	quote: string
	escaped: boolean
	propRegex: RegExp | null
	variableRegex: RegExp | null
	allowRoot: boolean
}

export interface LessAnonymousNode extends LessNodeBase {
	type: 'Anonymous'
	value: string
	rulesetLike: boolean
	allowRoot: boolean
	mapLines: boolean | undefined
}

export interface LessVariableNode extends LessNodeBase {
	type: 'Variable'
	name: string
	evaluating: boolean | undefined
	value: LessTreeNode | undefined
}

export interface LessCallNode extends LessNodeBase {
	type: 'Call'
	name: string
	args: LessTreeNode[]
	calc: 'calc' | null
	value: LessTreeNode | null
}

// Misc ────────────────────────────────────────────

export interface LessCommentNode extends LessNodeBase {
	type: 'Comment'
	value: string
	isLineComment: boolean
	debugInfo: LessDebugInfo | undefined
	allowRoot: boolean
}

export interface LessExtendNode extends LessNodeBase {
	type: 'Extend'
	selector: LessSelectorNode
	option: string
	ruleset: LessRulesetNode
	object_id: number
	parent_ids: number[]
	allowBefore: boolean
	allowAfter: boolean
	value: undefined
}

export interface LessVariableCallNode extends LessNodeBase {
	type: 'VariableCall'
	variable: string
	value: undefined
}

export interface LessNegativeNode extends LessNodeBase {
	type: 'Negative'
	value: LessTreeNode
}

export interface LessDetachedRulesetNode extends LessNodeBase {
	type: 'DetachedRuleset'
	ruleset: LessRulesetNode
	frames: LessTreeNode[] | undefined
	value: undefined
}

export interface LessNamespaceValueNode extends LessNodeBase {
	type: 'NamespaceValue'
	value: LessCallNode
	lookups: string[]
}

export interface LessConditionNode extends LessNodeBase {
	type: 'Condition'
	op: string
	lvalue: LessTreeNode
	rvalue: LessTreeNode
	negate: boolean
}

export interface LessJavaScriptNode extends LessNodeBase {
	type: 'JavaScript'
	value: string
	escaped: boolean
	expression: string
}

export interface LessUnicodeDescriptorNode extends LessNodeBase {
	type: 'UnicodeDescriptor'
	value: string
}

// `name` is the `@name` token or null for positional args; `value` is
// the default-value expression or null for required args.
export interface LessMixinParam {
	name: string | null
	value: LessTreeNode | null
	expand: boolean | null
}

export type LessMixinArg = LessMixinParam

// CSS property names the resolver knows about. Index signature lets
// other properties through at the cost of type-checking. Keep in sync
// with what the renderer reads.
export type CssPropertyName =
	| 'height'
	| 'width'
	| 'font-size'
	| 'font-weight'
	| 'line-height'
	| 'color'
	| 'bold'
	| 'italic'
	| 'underline'
	| 'strikethrough'
	| 'obfuscated'
	| 'shadow'
	| 'see-through'
	| 'background'
	| 'opacity'
	| 'line-width'
	| 'margin'
	| 'margin-top'
	| 'margin-bottom'
	| 'border-color'
	| 'lang-color'
	| 'font'
	| 'text-align'
	| 'align-items'
	| 'row-gap'
	| 'column-gap'
	| 'grid-auto-flow'

export type CssDeclarations = {
	[K in CssPropertyName]?: string
} & {
	[key: string]: string
}

// Discriminate on `type`.
export type LessTreeNode =
	| LessRulesetNode
	| LessDeclarationNode
	| LessSelectorNode
	| LessElementNode
	| LessCombinatorNode
	| LessAttributeNode
	| LessCommentNode
	| LessMediaNode
	| LessMixinDefinitionNode
	| LessMixinCallNode
	| LessImportNode
	| LessAtRuleNode
	| LessValueNode
	| LessExpressionNode
	| LessColorNode
	| LessDimensionNode
	| LessUnitNode
	| LessKeywordNode
	| LessOperationNode
	| LessParenNode
	| LessQuotedNode
	| LessAnonymousNode
	| LessVariableNode
	| LessCallNode
	| LessExtendNode
	| LessVariableCallNode
	| LessNegativeNode
	| LessDetachedRulesetNode
	| LessNamespaceValueNode
	| LessConditionNode
	| LessJavaScriptNode
	| LessUnicodeDescriptorNode

// Constructor signatures for the `less.tree.*` namespace.
export interface LessTree {
	Node: new (value?: LessTreeNode | string | number | boolean | null) => LessTreeNode
	Ruleset: new (
		selector: LessSelectorNode[],
		rules: LessTreeNode[],
		strictImports: boolean,
	) => LessRulesetNode
	Declaration: new (
		name: string,
		value: LessTreeNode,
		important?: string,
		merge?: boolean,
		index?: number,
		currentFileInfo?: LessFileInfo,
		inline?: boolean,
		variable?: boolean,
	) => LessDeclarationNode
	Selector: new (
		elements: LessElementNode[],
		currentFileInfo?: LessFileInfo,
		index?: number,
	) => LessSelectorNode
	Element: new (
		combinator: LessCombinatorNode,
		value: string,
		index?: number,
		currentFileInfo?: LessFileInfo,
	) => LessElementNode
	Combinator: new (value: string) => LessCombinatorNode
	Attribute: new (
		key: string,
		op: string,
		value: LessTreeNode,
		currentFileInfo?: LessFileInfo,
		index?: number,
	) => LessAttributeNode
	Variable: new (name: string, index?: number, currentFileInfo?: LessFileInfo) => LessVariableNode
	Property: new (name: string, index?: number, currentFileInfo?: LessFileInfo) => LessKeywordNode
	Keyword: new (value: string) => LessKeywordNode
	Color: new (rgb: number[], alpha: number, currentFileInfo?: LessFileInfo) => LessColorNode
	Dimension: new (value: number, unit?: LessUnitNode | string) => LessDimensionNode
	Unit: new (
		numerator: string[],
		denominator?: string[],
		backupUnit?: string,
	) => LessUnitNode
	Operation: new (
		op: '+' | '-' | '*' | '/',
		operands: LessTreeNode[],
		isSpaced: boolean,
	) => LessOperationNode
	Expression: new (value: LessTreeNode[], noSpacing?: boolean) => LessExpressionNode
	Quoted: new (
		str: string,
		content?: LessTreeNode | string,
		escaped?: boolean,
		index?: number,
		currentFileInfo?: LessFileInfo,
	) => LessQuotedNode
	AtRule: new (
		name: string,
		value: string,
		rules?: LessTreeNode[],
		index?: number,
		currentFileInfo?: LessFileInfo,
		debugInfo?: LessDebugInfo,
	) => LessAtRuleNode
	Call: new (
		name: string,
		args: LessTreeNode[],
		index?: number,
		currentFileInfo?: LessFileInfo,
		important?: string,
	) => LessCallNode
	URL: new (
		value: LessTreeNode | string,
		index?: number,
		currentFileInfo?: LessFileInfo,
	) => LessTreeNode
	Import: new (
		path: LessTreeNode,
		features?: LessTreeNode,
		options?: string,
		importManager?: LessImportNode['importManager'],
		currentFileInfo?: LessFileInfo,
	) => LessImportNode
}