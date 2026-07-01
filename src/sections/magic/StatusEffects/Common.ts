import { MCFunction, Label, Objective, execute, Selector, damage, Score, Macro, _ } from 'sandstone'

interface StatusEffectOptions {
    name: string
    damageType: string
    damageAmount: number
    damageInterval: number // ticks
    particles: () => void

    onApply: () => void
    onEnd: () => void
    onTick: () => void
}

const $ = Macro

export function createStatusEffect(opts: StatusEffectOptions) {
  const statusTag = Label(`status.${opts.name}`)
  const statusTime = Objective.create(`status.${opts.name}_timer`)

  const apply = MCFunction(`status/${opts.name}/apply`, (_loop: any, duration: Score) => {
    $.scoreboard.players.set('@s', statusTime.name, duration)
    statusTime('@s').multiply(20)
    statusTag('@s').add()
    opts.onApply?.()
  })

  const end = MCFunction(`status/${opts.name}/end`, () => {
    statusTime('@s').reset()
    statusTag('@s').remove()
    opts.onEnd?.()
  })

  MCFunction(`status/${opts.name}/update`, () => {
    execute.as(Selector('@e', { tag: statusTag })).at('@s').run(() => {
      opts.particles()
      opts.onTick?.()

      _.if(statusTime('@s').lessOrEqualThan(0), () => end())
      _.if(statusTime('@s').moduloBy(opts.damageInterval).equalTo(0), () => {
        damage('@s', opts.damageAmount, opts.damageType)
      })

      statusTime('@s').remove(1)
    })
  }, { runEveryTick: true })

  return { apply, end, statusTag, statusTime }
}