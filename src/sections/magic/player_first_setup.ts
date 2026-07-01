import { execute, MCFunction, Objective, scoreboard, Selector, tellraw, _, say, Advancement, Data, UUID, DataVariable } from 'sandstone'
import * as player from './player_handler';

import { getSelf, saveSelf, io } from './PlayerDB'

Advancement("first_join", {
  criteria: {
    'join': {
      trigger: 'location',
    }
  },
  display: {
    announce_to_chat: false,
    icon: "blaze_powder",
    title: "join",
    description: ""
  },
  rewards: {
    function: "arcane_arts:first_join"
  }
})

MCFunction('first_join', () => {
  say("First time joining");

  player.mana('@s').set(0);
  player.manaRegen('@s').set(20);
  player.maxMana('@s').set(100);

  getSelf();

  io.merge({
    known_spells: [],
    current_school: "fire",
    selected_spell: "firebolt"
  });

  saveSelf();
})