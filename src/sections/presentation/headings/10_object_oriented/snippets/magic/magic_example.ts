import { damage, execute, rel, Selector } from 'sandstone'

// TODO: Add more comments

// == snippet start ==
import { Targetable } from '../Spells/Common'

type HitboxOptions = {
    /**
     * @default type `#sandstone_summit_booth:targetable`
     */
    type?: string,
    /**
     * @default width `0.9`
     */
    width?: number,
    /**
     * @default height `2.0`
     */
    height?: number,
    onHit: () => void
}

export const checkHit = (opts: HitboxOptions) => {
    const w = opts.width || 0.9
    const h = opts.height || 2.0
    const type = opts.type || Targetable

    execute.positioned(rel(-w, -h / 2, -w)).as(Selector('@e', {
        type,
        dx: w * 2,
        dy: h,
        dz: w * 2
    })).if.entity('@s').run(() => opts.onHit())
}

// ...

checkHit({
    width: 6,
    height: 6,
    onHit: () => damage('@s', 6, 'lightning_bolt')
})

// ...
// == snippet end ==

const placeholder = 'placeholder'

export default placeholder