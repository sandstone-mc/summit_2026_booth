import { MCFunction, Label, Objective, execute, Selector, damage, Score, Macro, _, type MCFunctionClass } from 'sandstone'
import { Registry } from 'sandstone/arguments'
import { Targetable } from '../Spells/Common'

interface StatusEffectOptions {
    name: string
    damageType: Registry['minecraft:damage_type']
    damageAmount: number
    damageInterval: number // ticks
    particles: () => void

    onApply: () => void
    onEnd: () => void
    onTick: () => void
}

const $ = Macro

export const ParticleViewerSelector = Selector('@a', {
  distance: [0, 24]
})

// per-tick update functions for every status effect; called from the magic section's single tick loop (see `../tick`)
export const statusUpdaters: MCFunctionClass[] = []

export function createStatusEffect(opts: StatusEffectOptions) {
  const statusTag = Label(`status.${opts.name}`)
  const statusTime = Objective.create(`status.${opts.name}_timer`)

  const apply = MCFunction(`sections/magic/status/${opts.name}/apply`, (_loop: any, duration: Score) => {
    $.scoreboard.players.set('@s', statusTime.name, duration)
    statusTime('@s').multiply(20)
    statusTag('@s').add()
    opts.onApply?.()
  })

  const end = MCFunction(`sections/magic/status/${opts.name}/end`, () => {
    statusTime('@s').reset()
    statusTag('@s').remove()
    opts.onEnd?.()
  })

  const update = MCFunction(`sections/magic/status/${opts.name}/update`, () => {
    execute.as(Selector('@e', { tag: statusTag, type: Targetable })).at('@s').run(() => {
      opts.particles()
      opts.onTick?.()

      _.if(statusTime('@s').lessThanOrEqualTo(0), () => end())
      _.if(statusTime('@s').moduloBy(opts.damageInterval).equalTo(0), () => {
        damage('@s', opts.damageAmount, opts.damageType)
      })

      statusTime('@s').remove(1)
    })
  }, { lazy: true })
  statusUpdaters.push(update)

  return { apply, end, statusTag, statusTime }
}