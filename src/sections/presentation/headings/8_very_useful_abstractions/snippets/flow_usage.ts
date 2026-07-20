import { _, Objective, say } from 'sandstone'

// == snippet start ==
const funny_objective = Objective.create('funny')
const funny = funny_objective('@s')
_.switch(funny, [
    ['case', 0, () => say('funny is 0 :(')],
    ['case', 1, () => say('funny is 1!')],
    ['case', 2, () => say('funny is 2!')],
    ['default', () => {
        _.if(funny['<'](0), () => {
            say('funny is under 0 :(')
        }).else(() => {
            say('funny is over 2!')
        })
    }],
])
// == snippet end ==

const placeholder = 'placeholder'

export default placeholder