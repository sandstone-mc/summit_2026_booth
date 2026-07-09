import { MCFunction, say } from 'sandstone'

// == snippet start ==
const subject = 'World'

MCFunction('hello', () => {
    say(`Hello ${subject}!`)
}, {
    runOnLoad: true,
})
// == snippet end ==

const placeholder = 'placeholder'
export default placeholder