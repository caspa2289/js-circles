import {
    CIRCLE_LENGTH,
    GRAVITY_CONST,
    MAX_CIRCLE_COUNT,
    PHYSICS_ITERATIONS_COUNT,
    VELOCITY_OFFSET,
} from '../constants'

const CIRCLES = new Array(MAX_CIRCLE_COUNT).fill(1)

const tick = (circles: number[]) => {
    for (let i = 0; i < circles.length; i++) {
        for (let i = 0; i < circles.length; i += CIRCLE_LENGTH) {
            circles[i + VELOCITY_OFFSET + 1] +=
                GRAVITY_CONST / PHYSICS_ITERATIONS_COUNT //apply gravity
        }
    }
}

export const run2d = () => {
    tick(CIRCLES)
}
