import {
    CIRCLE_BOUNCINESS,
    GRAVITY_CONST,
    PHYSICS_ITERATIONS_COUNT,
} from './constants'
import { Circle } from './types'

const TINY_OFFSET = 0.0000001

const handleWallYCollision = (circle: Circle) => {
    circle.velocity.y *= -CIRCLE_BOUNCINESS
    circle.velocity.x *= CIRCLE_BOUNCINESS
}

const handleWallXCollision = (circle: Circle) => {
    circle.velocity.x *= -CIRCLE_BOUNCINESS
    circle.velocity.y *= CIRCLE_BOUNCINESS
}

const handleWallCollisions = (
    circle: Circle,
    maxWidth: number,
    maxHeight: number
) => {
    if (circle.position.y + circle.radius >= maxHeight) {
        circle.position.y = maxHeight - (circle.radius + TINY_OFFSET)
        handleWallYCollision(circle)
    }

    if (circle.position.y - circle.radius <= 0) {
        circle.position.y = TINY_OFFSET + circle.radius
        handleWallYCollision(circle)
    }

    if (circle.position.x + circle.radius >= maxWidth) {
        circle.position.x = maxWidth - (circle.radius + TINY_OFFSET)
        handleWallXCollision(circle)
    }

    if (circle.position.x - circle.radius <= 0) {
        circle.position.x = TINY_OFFSET + circle.radius
        handleWallXCollision(circle)
    }
}

export const tick = (
    circles: Circle[],
    maxWidth: number,
    maxHeight: number
) => {
    circles.forEach((circle) => {
        circle.velocity.y += GRAVITY_CONST / PHYSICS_ITERATIONS_COUNT
        circle.position.x += circle.velocity.x / PHYSICS_ITERATIONS_COUNT
        circle.position.y += circle.velocity.y / PHYSICS_ITERATIONS_COUNT
    })

    circles.forEach((circle, index) => {
        handleWallCollisions(circle, maxWidth, maxHeight)

        for (let x = index + 1; x < circles.length; x++) {
            const otherCircle = circles[x]

            const rad = circle.radius + otherCircle.radius

            let dx = otherCircle.position.x - circle.position.x
            let dy = otherCircle.position.y - circle.position.y

            if (dx * dx + dy * dy <= rad * rad) {
                const distance = Math.sqrt(dx * dx + dy * dy)

                const [collisionX, collisionY] = [
                    (circle.position.x * otherCircle.radius +
                        otherCircle.position.x * circle.radius) /
                        (circle.radius + otherCircle.radius),

                    (circle.position.y * otherCircle.radius +
                        otherCircle.position.y * circle.radius) /
                        (circle.radius + otherCircle.radius),
                ]

                const step = circle.radius + otherCircle.radius - distance

                if (step > 0) {
                    dx /= distance
                    dy /= distance

                    circle.position.x -= (dx * step) / 2
                    circle.position.y -= (dy * step) / 2
                    otherCircle.position.x += (dx * step) / 2
                    otherCircle.position.y += (dy * step) / 2
                }

                const reflect = (circle: Circle) => {
                    let cX = circle.position.x - collisionX
                    let cY = circle.position.y - collisionY

                    const cMagnitude = Math.sqrt(cX * cX + cY * cY)

                    cX /= cMagnitude
                    cY /= cMagnitude

                    const dot = circle.velocity.x * cX + circle.velocity.y * cY

                    cX *= dot * 2
                    cY *= dot * 2

                    circle.velocity.x -= cX * CIRCLE_BOUNCINESS
                    circle.velocity.y -= cY * CIRCLE_BOUNCINESS
                }

                reflect(circle)
                reflect(otherCircle)
            }
        }
    })
}
