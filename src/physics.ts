import { GRAVITY_CONST, PHYSICS_ITERATIONS_COUNT } from './constants'
import { render2d, setup2dContext } from './render2d'
import { Circle } from './types'

const CIRCLES: Circle[] = [
    {
        radius: 1,
        velocity: { x: 0, y: 0 },
        color: [255, 255, 255],
        position: { x: 0, y: 0 },
    },
]

const tick = (circles: Circle[]) => {
    circles.forEach((circle) => {
        circle.velocity.y += GRAVITY_CONST / PHYSICS_ITERATIONS_COUNT
    })
}

export const run2d = (width: number, height: number) => {
    const context = setup2dContext(height, width)
    if (!context) {
        throw new Error('Failed to initialize 2d context')
    }

    const getNextFrame = (time: number) => {
        tick(CIRCLES)
        render2d(CIRCLES, context)
        requestAnimationFrame(getNextFrame)
    }

    requestAnimationFrame(getNextFrame)
}
