import { functionCmd, MCFunction, sandstonePack } from 'sandstone'
import { ticking } from '@shared'

const mirrorTicked = (runEvery: '1t' | '5t' | '10t') => {
    MCFunction(`ticked/${runEvery}`, () => {
        if (runEvery === '1t') {
            functionCmd(ticking)
        }
        for (const value of sandstonePack.ticked[runEvery]?.tagJSON.values ?? []) {
            functionCmd(typeof value === 'string' ? value : (value as { id: string }).id)
        }
    })
}

mirrorTicked('1t')
mirrorTicked('5t')
mirrorTicked('10t')
