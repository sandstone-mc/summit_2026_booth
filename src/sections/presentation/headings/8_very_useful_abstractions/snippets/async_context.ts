import { MCFunction, say, sleep } from 'sandstone'

// == snippet start ==
MCFunction('explode_countdown', () => {
    say('I will explode in...')
    for (let i = 10; i > 0; i--) {
        say('10')
        sleep('1s')
    }
    say('BOOOOOOM')
}, {
    asyncContext: true,
})
// == snippet end ==

const placeholder = 'placeholder'

export default placeholder