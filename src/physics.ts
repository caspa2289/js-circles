import {
    CIRCLE_BOUNCINESS,
    GRAVITY_CONST,
    GRID_DIMENSION,
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

const getSpatialGrid = (circles: Circle[], width: number, height: number) => {
    const cellHeight = height / GRID_DIMENSION
    const cellWidth = width / GRID_DIMENSION
    const grid: {
        x: number
        y: number
        x1: number
        y1: number
        items: Circle[]
        relevantCells: number[]
    }[] = []

    for (let i = 0; i < GRID_DIMENSION; i++) {
        for (let x = 0; x < GRID_DIMENSION; x++) {
            let relevantCells: number[] = []

            const cellIndex = i * GRID_DIMENSION + x

            if (cellIndex % GRID_DIMENSION === 0) {
                //cell is first in a row
                if (cellIndex === 0) {
                    //cell is first in first row
                    relevantCells = [1, GRID_DIMENSION, GRID_DIMENSION + 1]
                } else if (
                    //cell is first in last row
                    cellIndex + GRID_DIMENSION ===
                    GRID_DIMENSION * GRID_DIMENSION
                ) {
                    relevantCells = [
                        cellIndex - GRID_DIMENSION,
                        cellIndex - GRID_DIMENSION + 1,
                        cellIndex + 1,
                    ]
                } else {
                    relevantCells = [
                        cellIndex - GRID_DIMENSION,
                        cellIndex - GRID_DIMENSION + 1,
                        cellIndex + 1,
                        cellIndex + GRID_DIMENSION,
                        cellIndex + GRID_DIMENSION + 1,
                    ]
                }
            } else if ((cellIndex + 1) % GRID_DIMENSION === 0) {
                //cell is last in a row
                if (cellIndex === GRID_DIMENSION - 1) {
                    //cell is last in first row
                    relevantCells = [
                        GRID_DIMENSION - 2,
                        GRID_DIMENSION * 2 - 2,
                        GRID_DIMENSION * 2 - 1,
                    ]
                } else if (cellIndex === GRID_DIMENSION * GRID_DIMENSION - 1) {
                    //cell is last in last row
                    relevantCells = [
                        cellIndex - GRID_DIMENSION - 1,
                        cellIndex - GRID_DIMENSION,
                        cellIndex - 1,
                    ]
                } else {
                    relevantCells = [
                        cellIndex - GRID_DIMENSION - 1,
                        cellIndex - GRID_DIMENSION,
                        cellIndex - 1,
                        cellIndex + GRID_DIMENSION - 1,
                        cellIndex + GRID_DIMENSION,
                    ]
                }
            } else if (cellIndex - GRID_DIMENSION < 0) {
                //cell is in first row
                relevantCells = [
                    cellIndex - 1,
                    cellIndex + 1,
                    cellIndex + GRID_DIMENSION - 1,
                    cellIndex + GRID_DIMENSION,
                    cellIndex + GRID_DIMENSION + 1,
                ]
            } else if (
                cellIndex + GRID_DIMENSION >=
                GRID_DIMENSION * GRID_DIMENSION
            ) {
                //cell is in last row
                relevantCells = [
                    cellIndex - GRID_DIMENSION - 1,
                    cellIndex - GRID_DIMENSION,
                    cellIndex - GRID_DIMENSION + 1,
                    cellIndex - 1,
                    cellIndex + 1,
                ]
            } else {
                //cell is not on any of the edges
                relevantCells = [
                    cellIndex - GRID_DIMENSION - 1,
                    cellIndex - GRID_DIMENSION,
                    cellIndex - GRID_DIMENSION + 1,
                    cellIndex - 1,
                    cellIndex + 1,
                    cellIndex + GRID_DIMENSION - 1,
                    cellIndex + GRID_DIMENSION,
                    cellIndex + GRID_DIMENSION + 1,
                ]
            }

            grid.push({
                x: x * cellWidth,
                y: i * cellHeight,
                x1: x * cellWidth + cellWidth,
                y1: i * cellHeight + cellHeight,
                items: [],
                relevantCells,
            })
        }
    }

    for (let i = 0; i < circles.length; i++) {
        const { x, y } = circles[i].position
        let gridY = Math.floor(y / cellHeight)
        let gridX = Math.floor(x / cellWidth)

        // gridY = gridY >= GRID_DIMENSION ? GRID_DIMENSION - 1 : gridY
        // gridX = gridX >= GRID_DIMENSION ? GRID_DIMENSION - 1 : gridX

        const gridCellIndex = gridY * GRID_DIMENSION + gridX
        grid[gridCellIndex].items.push(circles[i])
    }

    return grid
}

const resolveCollision = (
    circle: Circle,
    otherCircle: Circle,
    dx: number,
    dy: number
) => {
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

const determineCollision = (circle: Circle, otherCircle: Circle) => {
    const rad = circle.radius + otherCircle.radius

    let dx = otherCircle.position.x - circle.position.x || TINY_OFFSET //FIXME: i don`t know how much this messes up the algorithm
    let dy = otherCircle.position.y - circle.position.y || TINY_OFFSET

    if (dx * dx + dy * dy <= rad * rad) {
        return { dx, dy }
    }
}

export const tick = (
    circles: Circle[],
    maxWidth: number,
    maxHeight: number
) => {
    const startTime = performance.now()

    for (let i = 0; i < PHYSICS_ITERATIONS_COUNT; i++) {
        circles.forEach((circle) => {
            circle.velocity.y += GRAVITY_CONST / PHYSICS_ITERATIONS_COUNT
            circle.position.x += circle.velocity.x / PHYSICS_ITERATIONS_COUNT
            circle.position.y += circle.velocity.y / PHYSICS_ITERATIONS_COUNT

            handleWallCollisions(circle, maxWidth, maxHeight)
        })

        const grid = getSpatialGrid(circles, maxWidth, maxHeight)

        grid.forEach((cell) => {
            cell.items.forEach((circle, circleIndex) => {
                for (let x = 0; x < cell.items.length; x++) {
                    if (x === circleIndex) continue

                    const otherCircle = cell.items[x]

                    const collisionData = determineCollision(
                        circle,
                        otherCircle
                    )

                    if (collisionData) {
                        resolveCollision(
                            circle,
                            otherCircle,
                            collisionData.dx,
                            collisionData.dy
                        )
                    }

                    //TODO: this could be skipped if circle is fully contained inside of cell
                    cell.relevantCells.forEach((relevantCellIndex) => {
                        const relevantCell = grid[relevantCellIndex]
                        relevantCell.items.forEach((otherCircle) => {
                            const collisionData = determineCollision(
                                circle,
                                otherCircle
                            )
                            if (collisionData) {
                                resolveCollision(
                                    circle,
                                    otherCircle,
                                    collisionData.dx,
                                    collisionData.dy
                                )
                            }
                        })
                    })
                }
            })
        })
    }

    return performance.now() - startTime
}
