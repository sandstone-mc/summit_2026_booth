import { damage, execute, rel, Selector } from 'sandstone'

/**
 * Title: How can Object Oriented Programming help with my project?
 */

/** -- Example -- */
import { TargetableTag } from '../../../magic/Spells/Common'

interface HitboxOptions {
    type?: string;  //default #sandstone_summit_booth:targetable
    width?: number; // default 0.9
    height?: number; // default 2.0
    onHit: () => void
}

export const checkHit = (opts: HitboxOptions) => {
    const w = opts.width || 0.9
    const h = opts.height || 2.0
    const type = opts.type || TargetableTag

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

// Output: execute positioned ~-6 ~-3 ~-6 as @e[type=#sandstone_summit_booth:targetable, dx=12, dy=6, dz=12] if entity @s run damage @s 6 lightning_bolt
/** -- Example -- */