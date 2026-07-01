import { functionCmd, MCFunction } from "sandstone";
import { castSpell } from '../Common';

const spellPath = 'spells/fire/launch';

MCFunction(`${spellPath}/cast`, () => {
    castSpell('launch', 'fire', () => {
        functionCmd("pl_impulse:execute", { func: "motion", in: { velocity: 1.5 } })
    });
})
