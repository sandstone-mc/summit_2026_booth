import { type JSONTextComponent } from 'sandstone/arguments'
import { panels } from '@rhythm/config/internal/derived'

// text_display entities don't support click_event — these are plain
// (non-clickable) labels, just colored to read as a link/handle.
function handle(label: string, color = 'aqua'): JSONTextComponent {
    return { text: label, color }
}

export const BLANK_INFO_TEXT: JSONTextComponent = { text: ' ' }

export const RHYTHM_INFO_TEXT: JSONTextComponent = [
    { text: '🎵 MUSIC CREDITS', color: 'gold', bold: true },
    { text: '\n\n' },
    { text: 'Symarol', color: 'aqua', bold: true },
    { text: '\nProvided the Porter Robinson\nNBS files used in this booth.\nBluesky: ', color: 'gray' },
    handle('@symarol.bsky.social'),
    { text: '\n\n' },
    { text: 'Music', color: 'light_purple', bold: true },
    { text: '\n Porter Robinson\nBluesky: ', color: 'white' },
    handle('porterrobinson.com'),
    { text: '\nJamie Paige\nWebsite: ', color: 'white' },
    handle('jamies.page'),
]

export const MAGIC_INFO_TEXT: JSONTextComponent = [
    { text: '❔ ABOUT THIS SHOWCASE', color: 'white', bold: true },
    { text: '\n\n' },
    {
        text:
            'This showcase is simpler, but\n' +
            'shows how object-oriented\n' +
            'patterns (classes, inheritance, factories)\n' +
            'can make Minecraft datapack\n' +
            'development simpler',
        color: 'white',
        bold: false
    },
]
