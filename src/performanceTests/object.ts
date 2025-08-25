import {
    GRAVITY_CONST,
    MAX_CIRCLE_COUNT,
    PHYSICS_ITERATIONS_COUNT,
} from '../constants'
import { Circle } from '../types'

const CIRCLES: Circle[] = []

for (let i = 0; i < MAX_CIRCLE_COUNT; i++) {
    CIRCLES.push({
        index: i,
        radius: 1,
        velocity: { x: 0, y: 0 },
        color: [255, 255, 255],
        position: { x: 0, y: 0 },
    })
}

const tick = (circles: Circle[]) => {
    circles.forEach((circle) => {
        circle.velocity.y += GRAVITY_CONST / PHYSICS_ITERATIONS_COUNT //apply gravity
    })
}

export const run2d = () => {
    tick(CIRCLES)
}
