import { execute, rel, Selector } from 'sandstone'

interface HitboxOptions {
    type?: string;  //default #arcane_arts:targetable
    width?: number; // default 0.9
    height?: number; // default 2.0
    onHit: () => void
}

export const checkHit = (opts: HitboxOptions) => {
    const w = opts.width || 0.9
    const h = opts.height || 2.0
    const type = opts.type || '#arcane_arts:targetable'

    execute.positioned(rel(-w, -h / 2, -w)).run(() => {
        execute.as(Selector('@e', {
            type,
            dx: w * 2,
            dy: h,
            dz: w * 2
        })).if.entity('@s').run(() => {
            opts.onHit()
        })
    })
}