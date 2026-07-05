import { _, Advancement, MCFunction, Objective } from 'sandstone'

/**
 * Title: What can Sandstone’s features do for me?
 */

/** -- Example -- */
const wandCooldown = Objective.create('wand_cooldown')

const cooldownAdvancement = Advancement('input/wand_use_cooldown', {
    criteria: {
        tick: {
            trigger: 'minecraft:tick'
        }
    },
    rewards: {
        function: MCFunction('sections/magic/input/wand_use_cooldown', () => {
            wandCooldown('@s').remove(1)
            _.if(wandCooldown('@s').greaterThanOrEqualTo(1), () => {
                cooldownAdvancement.revoke('@s')
            }).else(() => {
                wandCooldown('@s').reset()
            })
        })
    }
})

// [insert good asyncContext example here]
/** -- Example -- */