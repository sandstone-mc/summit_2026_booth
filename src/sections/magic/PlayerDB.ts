// The macro fns need to be invoked via: function <name> with storage mypack:macro
// Use functionCmd for this

import {
  MCFunction, Objective, Data, execute, _, Selector, raw, functionCmd
} from 'sandstone'

export const uid     = Objective.create('pdb.uid', 'dummy')
const nextId  = uid('#next')
const macroStore = Data('storage', 'arcane_arts:macro')
export const io  = Data('storage', 'arcane_arts:io', 'data')

MCFunction('playerdb/load', () => {
  _.if(nextId.equalTo(0), () => nextId.set(1))
}, { runOnLoad: true })

MCFunction('playerdb/tick', () => {
  execute
    .as(Selector('@a', { scores: { 'arcane_arts.pdb.uid': [null, 0] } }))
    .run(() => {
      uid('@s').set(nextId)
      nextId.add(1)
      _callWithUID(_initEntry)
    })
}, { runEveryTick: true })

// Macro functions: raw $ lines, invoked via `function X with storage arcane_arts:macro`
const _initEntry = MCFunction('playerdb/_init_entry', () => {
  raw('$data modify storage arcane_arts:pdb players.$(uid) set value {}')
}, { lazy: true })

const _getByUID = MCFunction('playerdb/_get_by_uid', () => {
  raw('$data modify storage arcane_arts:io data set from storage arcane_arts:pdb players.$(uid)')
}, { lazy: true })

const _saveByUID = MCFunction('playerdb/_save_by_uid', () => {
  raw('$data modify storage arcane_arts:pdb players.$(uid) set from storage arcane_arts:io data')
}, { lazy: true })

// Store @s uid into macro storage, then invoke fn with macro context
function _callWithUID(fn: ReturnType<typeof MCFunction>) {
  execute
    .store.result(macroStore.select('uid'))
    .run.scoreboard.players.get('@s', uid)
  functionCmd(fn, 'with', 'storage', 'arcane_arts:macro')
}

export const getSelf = MCFunction('playerdb/get_self', () => {
  execute.as('@s').run(() => _callWithUID(_getByUID))
})

export const saveSelf = MCFunction('playerdb/save_self', () => {
  execute.as('@s').run(() => _callWithUID(_saveByUID))
})

export const clearSelf = MCFunction('playerdb/clear_self', () => {
  execute.as('@s').run(() => _callWithUID(_initEntry))
})