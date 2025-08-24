export const RADIUS_LENGTH = 1
export const RADIUS_OFFSET = 0
export const COLOR_LENGTH = 3
export const COLOR_OFFSET = RADIUS_LENGTH
export const VELOCITY_LENGTH = 2
export const VELOCITY_OFFSET = COLOR_OFFSET + COLOR_LENGTH
export const POSITION_LENGTH = 2
export const POSITION_OFFSET = VELOCITY_OFFSET + VELOCITY_LENGTH
export const CIRCLE_LENGTH =
    RADIUS_LENGTH + COLOR_LENGTH + VELOCITY_LENGTH + POSITION_LENGTH
export const MAX_CIRCLE_COUNT = 2500
export const GRAVITY_CONST = 0.25
export const PHYSICS_ITERATIONS_COUNT = 1 //FIXME: doesn`t work as expected
export const CIRCLE_BOUNCINESS = 0.45
export const BUFFER_BYTE_SIZE = Float32Array.BYTES_PER_ELEMENT * 2 // 2 for position for now
