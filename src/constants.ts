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
export const MAX_CIRCLE_COUNT = 4800
export const GRAVITY_CONST = 0.5
export const PHYSICS_ITERATIONS_COUNT = 5
export const CIRCLE_BOUNCINESS = 0.6
export const BUFFER_BYTE_SIZE = Float32Array.BYTES_PER_ELEMENT * 8 // 2 for position 3 for color and 1 + 2 paddings
