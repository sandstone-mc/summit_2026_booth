import { _, execute, kill, Label, loc, MCFunction, rel, Selector, tp } from 'sandstone'
import { BlockStatic, ExecuteItemsCommand } from 'sandstone/commands'

interface RaycastOptions {
    maxSteps: number
    onStep?: () => void
    onHit?: () => void
    onComplete?: () => void
    shouldStop?: () => void
    stepSize?: number; // default 0.5
    passesThrough?: BlockStatic // default minecraft:replaceable
}

export const createRaycast = (path: string, opts: RaycastOptions) => {
    const RayActive = Label(`${path.replaceAll('/', '.')}.ray_active`)
    const stepSize = opts.stepSize ?? 0.5
    let passesThrough: BlockStatic = opts.passesThrough ?? '#minecraft:replaceable'

    const step = MCFunction(`sections/magic/${path}/raycast_step`, () => {
        tp('@s', loc(0, 0, stepSize))
        opts.onStep?.()
        opts.shouldStop?.()
        execute.unless.block(rel(0, 0, 0), passesThrough).run(() => {
            tp('@s', loc(0, 0, -stepSize))
            opts.onHit?.()
            RayActive('@s').remove()
        })
    }, { lazy: true })

    // return a function to start the raycast
    return MCFunction(`sections/magic/${path}/raycast`, () => {
        for (let i = 0; i < opts.maxSteps; i++) {
            _.if(RayActive('@s'), () => {
                execute.at('@s').run(() => {
                    step()
                })
            })
        }

        _.if(RayActive('@s'), () => {
            opts.onComplete?.()
            RayActive('@s').remove()
        })
    }, { lazy: true })
}

// helper to handle boilderplate
export function fireRaycast(
    path: string,
    opts: RaycastOptions & { 
        onFinish?: () => void,  // runs as caster after ray resolves
        onStart?: () => void
    }
) {
    const raycast = createRaycast(path, opts)

    return MCFunction(`sections/magic/${path}/fire_raycast`, () => {
        execute.anchored('eyes').rotated.as('@s').run(() => {
            const CasterRef = Label(`${path.replaceAll('/', '.')}.ray_caster`)
            CasterRef('@s').add()
            
        execute.summon('minecraft:marker').run(() => {
            const RayActive = Label(`${path.replaceAll('/', '.')}.ray_active`)
            RayActive('@s').add()

            execute.as(Selector('@e', {tag: `sandstone_summit_booth.${CasterRef.name}`, limit: 1 })).at('@s')
                .anchored('eyes').rotated().as('@s').run.rotate(Selector('@n', { tag: `sandstone_summit_booth.${RayActive.name}` }), '~ ~')

            opts.onStart?.()
            
            raycast()
            
            // Teleport caster to marker if onFinish provided
            if (opts.onFinish) {
                execute.at('@s').as(Selector('@e', {
                    tag: CasterRef,
                    distance: [0, opts.maxSteps + 2]
                })).run(() => {
                    opts.onFinish!()
                })
            }
            
            kill('@s')
        })

        CasterRef('@s').remove()
        })
    }, { lazy: true })
}