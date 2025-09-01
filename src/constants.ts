export const COLOR_LENGTH = 3
export const COLOR_OFFSET = 0
export const RADIUS_LENGTH = 1
export const RADIUS_OFFSET = COLOR_LENGTH
export const VELOCITY_LENGTH = 2
export const VELOCITY_OFFSET = RADIUS_OFFSET + RADIUS_LENGTH
export const POSITION_LENGTH = 2
export const POSITION_OFFSET = VELOCITY_OFFSET + VELOCITY_LENGTH
export const MAX_CIRCLE_COUNT = 5
export const GRAVITY_CONST = 0.5 / 500
export const PHYSICS_ITERATIONS_COUNT = 5
export const CIRCLE_BOUNCINESS = 0.6
export const CIRCLE_COMPONENT_COUNT = 8 //3 color 2 position 2 velocity 1 radius
export const BUFFER_BYTE_SIZE =
    Float32Array.BYTES_PER_ELEMENT * CIRCLE_COMPONENT_COUNT
