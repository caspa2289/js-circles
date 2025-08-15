import {
    CIRCLE_LENGTH,
    GRAVITY_CONST,
    MAX_CIRCLE_COUNT,
    PHYSICS_ITERATIONS_COUNT,
    VELOCITY_OFFSET,
} from '../constants'

const CIRCLES = new Float32Array(CIRCLE_LENGTH * MAX_CIRCLE_COUNT)

const tick = (circles: Float32Array) => {
    for (let i = 0; i < circles.length; i++) {
        circles[i + VELOCITY_OFFSET + 1] +=
            GRAVITY_CONST / PHYSICS_ITERATIONS_COUNT
    }
}

export const run2d = () => {
    tick(CIRCLES)
}
