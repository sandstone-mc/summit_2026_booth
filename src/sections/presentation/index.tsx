import { render } from './jsx/render'
import styles from './styles.less' with { type: 'text' }

// Against wall to the north
const PRESENTATION_ORIGIN = [-83, 79, 42] as const
const PRESENTATION_BOUNDS = [18, 12] as const

function Presentation() {
  return (<>
    <div id="presentation">
      <h1>Sandstone</h1>
      <p>Welcome to my custom TSX framework!</p>
    </div>
    <style source={styles} />
  </>)
}

const scene = await render(<Presentation />, {
  origin: PRESENTATION_ORIGIN,
  bounds: PRESENTATION_BOUNDS,
})

export const { mount, tick, unmount } = scene