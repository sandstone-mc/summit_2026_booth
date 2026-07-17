// TODO: Add human comments to the below code and add it in

// import { Targetable } from '../Spells/Common'

// interface HitboxOptions {
//     type?: string;  //default #sandstone_summit_booth:targetable
//     width?: number; // default 0.9
//     height?: number; // default 2.0
//     onHit: () => void
// }
//
// export const checkHit = (opts: HitboxOptions) => {
//     const w = opts.width || 0.9
//     const h = opts.height || 2.0
//     const type = opts.type || Targetable
//
//     execute.positioned(rel(-w, -h / 2, -w)).as(Selector('@e', {
//         type,
//         dx: w * 2,
//         dy: h,
//         dz: w * 2
//     })).if.entity('@s').run(() => opts.onHit())
// }
//
// // ...
//
// checkHit({
//     width: 6,
//     height: 6,
//     onHit: () => damage('@s', 6, 'lightning_bolt')
// })
//
// // ...

export const slides = [
	(<>
		<h3 id="header">How can Object Oriented Programming help with my project?</h3>
		{/** This text-grid is not actually greedily taking the rest of the page height and centering the paragraphs, investigate */}
		<div id="text-grid">
			<p>Wrap repeated patterns behind a single call</p>
			<p>Type-safe interfaces make shared code easy to read and review</p>
			<p>Compose small pieces instead of copy-pasting huge execute chains</p>
		</div>
	</>),
	(<>
		<h3 id="header">How can Object Oriented Programming help with my project?</h3>
		{/** <insert above snippet> */}
	</>),
]
