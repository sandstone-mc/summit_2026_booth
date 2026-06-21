import { Label, Objective, rel, fill, MCFunction, execute, Selector, tp, abs, kill, _, raw, scoreboard } from "sandstone";

import { ShowcaseMarker } from ".";

export const State = Objective.create("showcase.state", 'dummy');
export const GlobalState = State("#global");

const resetTrigger = Objective.create('showcase.reset', 'trigger');

export const STATES = {
    IDLE: 0,
    INTRO: 1,
    SELECTION: 2,
    FIGHTING: 3,
    WIN: 4,
    RESETTING: 5
};

// active player tag
const SessionPlayerLabel = Label('showcase.player');
export const SessionPlayer = Selector('@a', {
    tag: SessionPlayerLabel
});

const RESET_POS = rel(9, 0, 29);

// showcase mobs
const ShowcaseMobLabel = Label('showcase.mob');
export const ShowcaseMobs = Selector('@e', {
    type: '#arcane_arts:targetable',
    tag: ShowcaseMobLabel
})

// Door config
const ENTRANCE_X = 8;
const ENTRANCE_Y = 0;
const ENTRANCE_Z = 27;
const ENTRANCE_DX = 3;
const ENTRANCE_DY = 3;
const ENTRANCE_DZ = 1;

export const closeDoor = MCFunction('showcase/door/close', () => {
    execute.as(ShowcaseMarker).at('@s').run(() => {
        fill(rel(ENTRANCE_X, ENTRANCE_Y, ENTRANCE_Z), rel(ENTRANCE_X + (ENTRANCE_DX - 1), ENTRANCE_Y + (ENTRANCE_DY - 1), ENTRANCE_Z + (ENTRANCE_DZ - 1)), "minecraft:glass");
    });
}, { lazy: true });


export const openDoor = MCFunction('showcase/door/open', () => {
    execute.as(ShowcaseMarker).at('@s').run(() => {
        fill(rel(ENTRANCE_X, ENTRANCE_Y, ENTRANCE_Z), rel(ENTRANCE_X + (ENTRANCE_DX - 1), ENTRANCE_Y + (ENTRANCE_DY - 1), ENTRANCE_Z + (ENTRANCE_DZ - 1)), "minecraft:air");
    });
}, { lazy: true });


export const reset = MCFunction('showcase/reset', () => {
    GlobalState.set(STATES.RESETTING);

    execute.as(ShowcaseMarker).at('@s').positioned(RESET_POS).run(() => {
        // teleport active player back to the start spot
        execute.as(SessionPlayer).run(() => {
            tp('@s', rel(0.5, 0, 3), abs(180, 0));
            SessionPlayerLabel('@s').remove();
        })
    })

    execute.as(ShowcaseMarker).at('@s').run(() => {
        // kill showcase mobs
        kill(ShowcaseMobs);

        openDoor();

        GlobalState.set(STATES.IDLE);
    })
});


const intro = MCFunction('showcase/intro', () => {
    GlobalState.set(STATES.INTRO);
    closeDoor();
    execute.as(ShowcaseMarker).at('@s').run(() => {
        startSelection();
    });
});

export const startSelection = MCFunction('showcase/selection/start', () => {
    GlobalState.set(STATES.SELECTION);

    // stub selection
    say("Selecting!");
});

export const startSession = MCFunction('showcase/session/start', () => {
    _.if(GlobalState.equalTo(STATES.IDLE), () => {
        SessionPlayerLabel('@s').add();
        intro();
    });
}, { lazy: true });

MCFunction('showcase/tick', () => {
    _.if(GlobalState.equalTo(STATES.IDLE), () => {
        execute.as(ShowcaseMarker).at('@s').positioned(rel(ENTRANCE_X, ENTRANCE_Y, ENTRANCE_Z - 1)).run(() => {
            execute.as(Selector('@a', {
                tag: `!arcane_arts.${SessionPlayerLabel.name}`,
                dx: ENTRANCE_DX, dy: ENTRANCE_DY, dz: ENTRANCE_DZ - 2
            })).run(() => {
                startSession();
            })
        });
    });

    _.if(GlobalState.greaterThan(STATES.IDLE), () => {
        execute.unless.entity(SessionPlayer).run(() => {
            reset();
        });
    });

    execute.as(Selector('@a', { scores: { 'arcane_arts.showcase.reset': [1, null] } })).run(() => {
        reset();
        raw(`scoreboard players reset @s arcane_arts.showcase.reset`);
        scoreboard.players.enable('@a', resetTrigger);
    });
}, { runEveryTick: true });

MCFunction('showcase/load', () => {
    GlobalState.set(STATES.IDLE);
    scoreboard.players.enable('@a', resetTrigger);
}, { runOnLoad: true });