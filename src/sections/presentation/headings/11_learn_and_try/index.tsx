import { Texture } from 'sandstone'

import { screenshot } from '../../utils'

const docs = Texture('item', 'presentation/docs', screenshot('assets/presentation/sandstone_docs', 4))

export const slides = [(<>
	<h2 id="header">How do I learn more and try it?</h2>
	<p id="last-slide-p-0">Try the live interactive code snippets on the docs</p>
	<img src={docs} height="55vh" />
	<p id="last-slide-p-1">↓ Links Below ↓</p>
</>)]
