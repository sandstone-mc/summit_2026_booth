import {
    _,
    advancement,
    type Score,
    Variable,
    Advancement,
    execute,
    MCFunction,
    type MCFunctionClass,
    Selector,
    kill,
    tag,
    title,
} from 'sandstone'
import { type JSONTextComponent } from 'sandstone/arguments'
import { songCount, songNames } from '@rhythm/config/internal/songs'
import { mapCount, mapNames } from '@rhythm/config/internal/maps'
import { gameplay } from '@rhythm/config'
import { panels } from '@rhythm/config/internal/derived'
import { GameStatus, Tags, UIPanelEntityType, status, songSelect, mapSelect, interpSetting } from './state'
import { calOffsetMs } from '@rhythm/index'
import { startGame, cancelStart } from './start'
import { placeMap } from './arena-map'
import {
    spawnPanel,
    spawnPanelLines,
    spawnClick,
    lineY,
    clampName,
    needsScroll,
    scrollFrame,
    scrollFrameCount,
    mergeDisplayText,
} from '@rhythm/hologram'
import { NAMESPACE } from '@shared'

export const livesSetting = Variable(gameplay.lives.default)

// the panel renders 13 lines; TOTAL_LINES=12 + CLICK_Y_OFFSET is the calibrated click grid
const RENDER_LINES = 13
const SONG_LINE = 2
const LIVES_LINE = 4
const MAP_LINE = 6
const CAL_LINE = 8
const INTERP_LINE = 10
const BUTTON_LINE = 11

const TOTAL_LINES = 12
const CLICK_WIDTH = 3
const CLICK_HALF_WIDTH = 1.5
const CLICK_Y_OFFSET = 0.25

const songLineSel = Selector('@e', { tag: Tags.UI_SET_SONG_TXT, type: 'minecraft:text_display', limit: 1 })
const livesLineSel = Selector('@e', { tag: Tags.UI_SET_LIVES_TXT, type: 'minecraft:text_display', limit: 1 })
const mapLineSel = Selector('@e', { tag: Tags.UI_SET_MAP_TXT, type: 'minecraft:text_display', limit: 1 })
const interpLineSel = Selector('@e', { tag: Tags.UI_SET_INTERP_TXT, type: 'minecraft:text_display', limit: 1 })
const calLineSel = Selector('@e', { tag: Tags.UI_SET_CAL_TXT, type: 'minecraft:text_display', limit: 1 })
const buttonLineSel = Selector('@e', { tag: Tags.UI_SET_BTN_TXT, type: 'minecraft:text_display', limit: 1 })

const scrollPos = Variable(0)

const BLANK_LINE: JSONTextComponent = { text: ' ' }

function songLineText(name: string): JSONTextComponent {
    return [
        { text: `${panels.padding}♪ Song: `, color: 'gray' },
        { text: `${name}${panels.padding}`, color: 'aqua', font: 'sandstone_summit_booth:monospace' },
    ]
}

function livesLineText(lives: number): JSONTextComponent {
    return [
        { text: `${panels.padding}  Lives: `, color: 'gray' },
        { text: `${clampName(`${'❤'.repeat(lives)} ${lives}`)}${panels.padding}`, color: 'red', font: 'sandstone_summit_booth:monospace' },
    ]
}

function mapLineText(mapI: number): JSONTextComponent {
    const name = mapCount > 0 ? clampName(mapNames[mapI] ?? 'None') : clampName('No maps')
    return [
        { text: `${panels.padding}🗺 Map: `, color: 'gray' },
        { text: `${name}${panels.padding}`, color: 'green', font: 'sandstone_summit_booth:monospace' },
    ]
}

function interpLineText(serverSide: boolean): JSONTextComponent {
    return [
        { text: `${panels.padding}✥ Motion: `, color: 'gray' },
        {
            text: `${clampName(serverSide ? 'Server-side' : 'Client-side')}${panels.padding}`,
            color: serverSide ? 'yellow' : 'aqua',
            font: 'sandstone_summit_booth:monospace',
        },
    ]
}

const updateInterpLine = MCFunction(
    'sections/rhythm/settings/interp_line',
    () => {
        _.if(interpSetting.equalTo(0), () => {
            mergeDisplayText(interpLineSel, interpLineText(false))
        }).else(() => {
            mergeDisplayText(interpLineSel, interpLineText(true))
        })
    },
    { lazy: true },
)

const CALIBRATION_LINE_TEXT: JSONTextComponent = [
    { text: `${panels.padding}⌛ Calibration:       `, color: 'gray' },
    { text: `◀ ▶${panels.padding}                 `, color: 'aqua' },
]

function showMsOffset() {
    title('@s').actionbar([
        { text: '⌛ Calibration: ', color: 'aqua' },
        calOffsetMs('@s'),
        { text: 'ms  ', color: 'aqua' },
        { text: '(right-click: ±1, left-click: ±10)', color: 'gray' },
    ])
}

const CALIBRATING_TEXT: JSONTextComponent = [
    { text: `${panels.padding}⧗ `, color: 'aqua', bold: true },
    { text: `${clampName('Calibrating…')}${panels.padding}`, color: 'aqua', bold: true, font: 'sandstone_summit_booth:monospace' },
]

const START_TEXT: JSONTextComponent = { text: `${panels.padding}▶ START${panels.padding}`, color: 'green', bold: true }
const CANCEL_TEXT: JSONTextComponent = { text: `${panels.padding}✖ CANCEL${panels.padding}`, color: 'red', bold: true }
const IN_PROGRESS_TEXT: JSONTextComponent = [
    { text: `${panels.padding}🎵 `, color: 'gold', bold: true },
    { text: `${clampName('Match in progress')}${panels.padding}`, color: 'gold', bold: true, font: 'sandstone_summit_booth:monospace' },
]

function dispatch(selectScore: Score, count: number, render: (i: number) => void) {
    if (count === 0) return
    if (count === 1) {
        render(0)
        return
    }
    _.switch(
        selectScore,
        Array.from({ length: count }, (_v, i) => ['case', i, () => render(i)] as const),
    )
}

const scrollingSongs = Array.from({ length: songCount }, (_v, i) => i).filter((i) => needsScroll(songNames[i]))

const updateSongLine = MCFunction(
    'sections/rhythm/settings/song_line',
    () => {
        dispatch(songSelect, songCount, (songI) => {
            mergeDisplayText(songLineSel, songLineText(clampName(songNames[songI] ?? 'None')))
            if (scrollingSongs.includes(songI)) {
                scrollLoop.schedule.function(`${panels.scrollSpeed}t`, 'replace')
            }
        })
    },
    { lazy: true },
)

const updateLivesLine = MCFunction(
    'sections/rhythm/settings/lives_line',
    () => {
        _.switch(
            livesSetting,
            Array.from(
                { length: gameplay.lives.max - gameplay.lives.min + 1 },
                (_v, i) =>
                    [
                        'case',
                        gameplay.lives.min + i,
                        () => mergeDisplayText(livesLineSel, livesLineText(gameplay.lives.min + i)),
                    ] as const,
            ),
        )
    },
    { lazy: true },
)

const updateMapLine = MCFunction(
    'sections/rhythm/settings/map_line',
    () => {
        dispatch(mapSelect, Math.max(mapCount, 1), (mapI) => {
            mergeDisplayText(mapLineSel, mapLineText(mapI))
        })
    },
    { lazy: true },
)

export const updateSettingsPanel = MCFunction(
    'sections/rhythm/settings/update',
    () => {
        scrollPos.set(0)
        _.if(status.greaterThanOrEqualTo(GameStatus.ACTIVE), () => {
            scrollLoop.schedule.clear()
            mergeDisplayText(songLineSel, BLANK_LINE)
            _.if(status.equalTo(GameStatus.CALIBRATING), () => {
                mergeDisplayText(livesLineSel, CALIBRATING_TEXT)
            }).else(() => {
                mergeDisplayText(livesLineSel, IN_PROGRESS_TEXT)
            })
            mergeDisplayText(mapLineSel, BLANK_LINE)
            mergeDisplayText(interpLineSel, BLANK_LINE)
            mergeDisplayText(calLineSel, BLANK_LINE)
            mergeDisplayText(buttonLineSel, BLANK_LINE)
        }).else(() => {
            updateSongLine()
            updateLivesLine()
            updateMapLine()
            updateInterpLine()
            mergeDisplayText(calLineSel, CALIBRATION_LINE_TEXT)
            _.if(status.equalTo(GameStatus.STARTING), () => {
                mergeDisplayText(buttonLineSel, CANCEL_TEXT)
            }).else(() => {
                mergeDisplayText(buttonLineSel, START_TEXT)
            })
        })
    },
    { lazy: true },
)

const scrollSettingsUpdate = MCFunction(
    'sections/rhythm/settings/scroll',
    () => {
        for (const songI of scrollingSongs) {
            const name = songNames[songI]
            _.if(songSelect.equalTo(songI), () => {
                const frames = scrollFrameCount(name)
                _.if(scrollPos.greaterThanOrEqualTo(frames), () => {
                    scrollPos.set(0)
                })
                _.switch(
                    scrollPos,
                    Array.from({ length: frames }, (_v, offset) => ['case', offset, () => {
                        mergeDisplayText(songLineSel, songLineText(scrollFrame(name, offset)))
                    }] as const),
                )
            })
        }
    },
    { lazy: true },
)

// runs only while a long song name is on the panel; dies on its own otherwise
const scrollLoop = MCFunction(
    'sections/rhythm/settings/scroll_loop',
    (self: MCFunctionClass) => {
        scrollPos.add(1)
        scrollSettingsUpdate()
        _.if(status.lessThan(GameStatus.ACTIVE), () => {
            for (const songI of scrollingSongs) {
                _.if(songSelect.equalTo(songI), () => {
                    self.schedule.function(`${panels.scrollSpeed}t`, 'replace')
                })
            }
        })
    },
    { lazy: true },
)

const onSongCycle = MCFunction(
    'sections/rhythm/settings/on_song',
    () => {
        _.if(status.equalTo(GameStatus.WAITING), () => {
            songSelect.add(1)
            _.if(songSelect.greaterThanOrEqualTo(songCount), () => {
                songSelect.set(0)
            })
            scrollPos.set(0)
            updateSongLine()
            execute.at('@s').run.playsound('minecraft:ui.button.click', 'master', '@s')
        })
        advancement.revoke('@s').only(`${NAMESPACE}:ui_song_cycle`)
    },
    { lazy: true },
)

const onLivesCycle = MCFunction(
    'sections/rhythm/settings/on_lives',
    () => {
        _.if(status.equalTo(GameStatus.WAITING), () => {
            livesSetting.add(1)
            _.if(livesSetting.greaterThan(gameplay.lives.max), () => {
                livesSetting.set(gameplay.lives.min)
            })
            updateLivesLine()
            execute.at('@s').run.playsound('minecraft:ui.button.click', 'master', '@s')
        })
        advancement.revoke('@s').only(`${NAMESPACE}:ui_lives_cycle`)
    },
    { lazy: true },
)

const onMapCycle = MCFunction(
    'sections/rhythm/settings/on_map',
    () => {
        _.if(status.equalTo(GameStatus.WAITING), () => {
            if (mapCount > 0) {
                mapSelect.add(1)
                _.if(mapSelect.greaterThanOrEqualTo(mapCount), () => {
                    mapSelect.set(0)
                })
                placeMap()
            }
            updateMapLine()
            execute.at('@s').run.playsound('minecraft:ui.button.click', 'master', '@s')
        })
        advancement.revoke('@s').only(`${NAMESPACE}:ui_map_cycle`)
    },
    { lazy: true },
)

const onInterpCycle = MCFunction(
    'sections/rhythm/settings/on_interp',
    () => {
        _.if(status.equalTo(GameStatus.WAITING), () => {
            _.if(interpSetting.equalTo(0), () => {
                interpSetting.set(1)
            }).else(() => {
                interpSetting.set(0)
            })
            updateInterpLine()
            execute.at('@s').run.playsound('minecraft:ui.button.click', 'master', '@s')
        })
        advancement.revoke('@s').only(`${NAMESPACE}:ui_interp_cycle`)
    },
    { lazy: true },
)

const onMsDown = MCFunction(
    'sections/rhythm/settings/on_ms_down',
    () => {
        _.if(status.equalTo(GameStatus.WAITING), () => {
            calOffsetMs('@s').remove(1)
            showMsOffset()
            execute.at('@s').run.playsound('minecraft:ui.button.click', 'master', '@s')
        })
        advancement.revoke('@s').only(`${NAMESPACE}:ui_ms_down`)
    },
    { lazy: true },
)

const onMsDownBig = MCFunction(
    'sections/rhythm/settings/on_ms_down_big',
    () => {
        _.if(status.equalTo(GameStatus.WAITING), () => {
            calOffsetMs('@s').remove(10)
            showMsOffset()
            execute.at('@s').run.playsound('minecraft:ui.button.click', 'master', '@s')
        })
        advancement.revoke('@s').only(`${NAMESPACE}:ui_ms_down_big`)
    },
    { lazy: true },
)

const onMsUp = MCFunction(
    'sections/rhythm/settings/on_ms_up',
    () => {
        _.if(status.equalTo(GameStatus.WAITING), () => {
            calOffsetMs('@s').add(1)
            showMsOffset()
            execute.at('@s').run.playsound('minecraft:ui.button.click', 'master', '@s')
        })
        advancement.revoke('@s').only(`${NAMESPACE}:ui_ms_up`)
    },
    { lazy: true },
)

const onMsUpBig = MCFunction(
    'sections/rhythm/settings/on_ms_up_big',
    () => {
        _.if(status.equalTo(GameStatus.WAITING), () => {
            calOffsetMs('@s').add(10)
            showMsOffset()
            execute.at('@s').run.playsound('minecraft:ui.button.click', 'master', '@s')
        })
        advancement.revoke('@s').only(`${NAMESPACE}:ui_ms_up_big`)
    },
    { lazy: true },
)

const onStartGame = MCFunction(
    'sections/rhythm/settings/on_start',
    () => {
        _.if(status.equalTo(GameStatus.WAITING), () => {
            tag('@s').add(Tags.PLAYER)
            startGame()
            updateSettingsPanel()
        }).elseIf(status.equalTo(GameStatus.STARTING), () => {
            cancelStart()
            updateSettingsPanel()
        })
        execute.at('@s').run.playsound('minecraft:ui.button.click', 'master', '@s')
        advancement.revoke('@s').only(`${NAMESPACE}:ui_start_game`)
    },
    { lazy: true },
)

const onSongCycleBack = MCFunction(
    'sections/rhythm/settings/on_song_back',
    () => {
        _.if(status.equalTo(GameStatus.WAITING), () => {
            songSelect.remove(1)
            _.if(songSelect.lessThan(0), () => {
                songSelect.set(Math.max(songCount - 1, 0))
            })
            scrollPos.set(0)
            updateSongLine()
            execute.at('@s').run.playsound('minecraft:ui.button.click', 'master', '@s')
        })
        advancement.revoke('@s').only(`${NAMESPACE}:ui_song_cycle_back`)
    },
    { lazy: true },
)

const onLivesCycleBack = MCFunction(
    'sections/rhythm/settings/on_lives_back',
    () => {
        _.if(status.equalTo(GameStatus.WAITING), () => {
            livesSetting.remove(1)
            _.if(livesSetting.lessThan(gameplay.lives.min), () => {
                livesSetting.set(gameplay.lives.max)
            })
            updateLivesLine()
            execute.at('@s').run.playsound('minecraft:ui.button.click', 'master', '@s')
        })
        advancement.revoke('@s').only(`${NAMESPACE}:ui_lives_cycle_back`)
    },
    { lazy: true },
)

const onMapCycleBack = MCFunction(
    'sections/rhythm/settings/on_map_back',
    () => {
        _.if(status.equalTo(GameStatus.WAITING), () => {
            if (mapCount > 0) {
                mapSelect.remove(1)
                _.if(mapSelect.lessThan(0), () => {
                    mapSelect.set(mapCount - 1)
                })
                placeMap()
            }
            updateMapLine()
            execute.at('@s').run.playsound('minecraft:ui.button.click', 'master', '@s')
        })
        advancement.revoke('@s').only(`${NAMESPACE}:ui_map_cycle_back`)
    },
    { lazy: true },
)

const BACKDROP_TEXT: JSONTextComponent = [
    { text: `SETTINGS${panels.padding}`, color: 'white', bold: true },
    { text: `\n\n\n\n\n\n\n\n\n\n\n\n${panels.ruler}` },
]

export const spawnSettingsPanel = MCFunction(
    'sections/rhythm/settings/spawn',
    () => {
        if (Bun.env.DEV_HELPERS === 'true') {
            kill(Selector('@e', { tag: Tags.UI_SETTINGS, type: UIPanelEntityType }))
        }
        
        spawnPanel(panels.settings, [Tags.UI_SETTINGS, Tags.UI_SETTINGS_TXT], BACKDROP_TEXT, 0)
        spawnPanelLines(panels.settings, [Tags.UI_SETTINGS, Tags.UI_SET_SONG_TXT], RENDER_LINES, SONG_LINE)
        spawnPanelLines(panels.settings, [Tags.UI_SETTINGS, Tags.UI_SET_LIVES_TXT], RENDER_LINES, LIVES_LINE)
        spawnPanelLines(panels.settings, [Tags.UI_SETTINGS, Tags.UI_SET_MAP_TXT], RENDER_LINES, MAP_LINE)
        spawnPanelLines(panels.settings, [Tags.UI_SETTINGS, Tags.UI_SET_CAL_TXT], RENDER_LINES, CAL_LINE)
        spawnPanelLines(panels.settings, [Tags.UI_SETTINGS, Tags.UI_SET_INTERP_TXT], RENDER_LINES, INTERP_LINE)
        spawnPanelLines(panels.settings, [Tags.UI_SETTINGS, Tags.UI_SET_BTN_TXT], RENDER_LINES, BUTTON_LINE)
        updateSettingsPanel()

        const songY = lineY(panels.settings, TOTAL_LINES, 2)
        spawnClick(panels.settings, 0, songY, [Tags.UI_SETTINGS, Tags.UI_SONG_INT, 'summit.interactable'], CLICK_WIDTH, CLICK_Y_OFFSET, { right: onSongCycle, left: onSongCycleBack })

        const livesY = lineY(panels.settings, TOTAL_LINES, 4)
        spawnClick(panels.settings, 0, livesY, [Tags.UI_SETTINGS, Tags.UI_LIVES_INT, 'summit.interactable'], CLICK_WIDTH, CLICK_Y_OFFSET, { right: onLivesCycle, left: onLivesCycleBack })

        const mapY = lineY(panels.settings, TOTAL_LINES, 6)
        spawnClick(panels.settings, 0, mapY, [Tags.UI_SETTINGS, Tags.UI_MAP_INT, 'summit.interactable'], CLICK_WIDTH, CLICK_Y_OFFSET, { right: onMapCycle, left: onMapCycleBack })

        const calY = lineY(panels.settings, TOTAL_LINES, CAL_LINE)
        spawnClick(panels.settings, 0.18, calY, [Tags.UI_SETTINGS, Tags.UI_MS_DOWN_INT, 'summit.interactable'], CLICK_HALF_WIDTH, CLICK_Y_OFFSET, { right: onMsDown, left: onMsDownBig })
        spawnClick(panels.settings, 1.68, calY, [Tags.UI_SETTINGS, Tags.UI_MS_UP_INT, 'summit.interactable'], CLICK_HALF_WIDTH, CLICK_Y_OFFSET, { right: onMsUp, left: onMsUpBig })

        const interpY = lineY(panels.settings, TOTAL_LINES, INTERP_LINE)
        spawnClick(panels.settings, 0, interpY, [Tags.UI_SETTINGS, Tags.UI_INTERP_INT, 'summit.interactable'], CLICK_WIDTH, CLICK_Y_OFFSET, { right: onInterpCycle, left: onInterpCycle })

        const startY = lineY(panels.settings, TOTAL_LINES, BUTTON_LINE)
        spawnClick(panels.settings, 0, startY, [Tags.UI_SETTINGS, Tags.UI_START_INT, 'summit.interactable'], CLICK_WIDTH, CLICK_Y_OFFSET, { right: onStartGame, left: onStartGame })
    },
    { lazy: true },
)
