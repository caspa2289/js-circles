import { GRAVITY_CONST, PHYSICS_ITERATIONS_COUNT } from './constants'
import { render2d } from './render2d'
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

export const run2d = () => {
    tick(CIRCLES)
    render2d(CIRCLES)
}
