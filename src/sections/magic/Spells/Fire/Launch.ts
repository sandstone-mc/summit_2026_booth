import { functionCmd, MCFunction, raw } from 'sandstone'
import { castSpell } from '../Common'

const spellPath = 'spells/fire/launch'

MCFunction(`sections/magic/${spellPath}/cast`, () => {
    castSpell('launch', 'fire', () => {
        raw("scoreboard players set $strength player_motion.api.launch 10000")
        functionCmd('player_motion:api/launch_looking')
    })
})
