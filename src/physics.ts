import {
    CIRCLE_BOUNCINESS,
    GRAVITY_CONST,
    PHYSICS_ITERATIONS_COUNT,
} from './constants'
import { Circle } from './types'

const handleWallYCollision = (circle: Circle) => {
    circle.velocity.y *= -CIRCLE_BOUNCINESS
    circle.velocity.x *= CIRCLE_BOUNCINESS
}

const handleWallXCollision = (circle: Circle) => {
    circle.velocity.x *= -CIRCLE_BOUNCINESS
    circle.velocity.y *= CIRCLE_BOUNCINESS
}

const determineBoxCollisions = (
    circle: Circle,
    maxWidth: number,
    maxHeight: number,
    minWidth: number,
    minHeight: number
) => {
    const result: { x: boolean; y: boolean; x1: boolean; y1: boolean } = {
        x: false,
        y: false,
        x1: false,
        y1: false,
    }

    if (circle.position.y + circle.radius >= maxHeight) {
        result.y1 = true
    }

    if (circle.position.y - circle.radius <= minHeight) {
        result.y = true
    }

    if (circle.position.x + circle.radius >= maxWidth) {
        result.x1 = true
    }

    if (circle.position.x - circle.radius <= minWidth) {
        result.x = true
    }

    return result
}

const handleWallCollisions = (
    circle: Circle,
    maxWidth: number,
    maxHeight: number
) => {
    const { x, y, x1, y1 } = determineBoxCollisions(
        circle,
        maxWidth,
        maxHeight,
        0,
        0
    )

    if (y1) {
        circle.position.y = maxHeight - circle.radius
        handleWallYCollision(circle)
    }

    if (y) {
        circle.position.y = circle.radius
        handleWallYCollision(circle)
    }

    if (x1) {
        circle.position.x = maxWidth - circle.radius
        handleWallXCollision(circle)
    }

    if (x) {
        circle.position.x = circle.radius
        handleWallXCollision(circle)
    }
}

const grid: {
    x: number
    y: number
    x1: number
    y1: number
    items: Circle[]
    relevantCells: number[]
}[] = []

const getSpatialGrid = (
    circles: Circle[],
    width: number,
    height: number,
    gridDimension: number
) => {
    const cellHeight = height / gridDimension
    const cellWidth = width / gridDimension

    if (grid.length === 0) {
        for (let i = 0; i < gridDimension; i++) {
            for (let x = 0; x < gridDimension; x++) {
                let relevantCells: number[] = []

                const cellIndex = i * gridDimension + x

                if (cellIndex % gridDimension === 0) {
                    //cell is first in a row
                    if (cellIndex === 0) {
                        //cell is first in first row
                        relevantCells = [1, gridDimension, gridDimension + 1]
                    } else if (
                        //cell is first in last row
                        cellIndex + gridDimension ===
                        gridDimension * gridDimension
                    ) {
                        relevantCells = [
                            cellIndex - gridDimension,
                            cellIndex - gridDimension + 1,
                            cellIndex + 1,
                        ]
                    } else {
                        relevantCells = [
                            cellIndex - gridDimension,
                            cellIndex - gridDimension + 1,
                            cellIndex + 1,
                            cellIndex + gridDimension,
                            cellIndex + gridDimension + 1,
                        ]
                    }
                } else if ((cellIndex + 1) % gridDimension === 0) {
                    //cell is last in a row
                    if (cellIndex === gridDimension - 1) {
                        //cell is last in first row
                        relevantCells = [
                            gridDimension - 2,
                            gridDimension * 2 - 2,
                            gridDimension * 2 - 1,
                        ]
                    } else if (
                        cellIndex ===
                        gridDimension * gridDimension - 1
                    ) {
                        //cell is last in last row
                        relevantCells = [
                            cellIndex - gridDimension - 1,
                            cellIndex - gridDimension,
                            cellIndex - 1,
                        ]
                    } else {
                        relevantCells = [
                            cellIndex - gridDimension - 1,
                            cellIndex - gridDimension,
                            cellIndex - 1,
                            cellIndex + gridDimension - 1,
                            cellIndex + gridDimension,
                        ]
                    }
                } else if (cellIndex - gridDimension < 0) {
                    //cell is in first row
                    relevantCells = [
                        cellIndex - 1,
                        cellIndex + 1,
                        cellIndex + gridDimension - 1,
                        cellIndex + gridDimension,
                        cellIndex + gridDimension + 1,
                    ]
                } else if (
                    cellIndex + gridDimension >=
                    gridDimension * gridDimension
                ) {
                    //cell is in last row
                    relevantCells = [
                        cellIndex - gridDimension - 1,
                        cellIndex - gridDimension,
                        cellIndex - gridDimension + 1,
                        cellIndex - 1,
                        cellIndex + 1,
                    ]
                } else {
                    //cell is not on any of the edges
                    relevantCells = [
                        cellIndex - gridDimension - 1,
                        cellIndex - gridDimension,
                        cellIndex - gridDimension + 1,
                        cellIndex - 1,
                        cellIndex + 1,
                        cellIndex + gridDimension - 1,
                        cellIndex + gridDimension,
                        cellIndex + gridDimension + 1,
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
    } else {
        for (let i = 0; i < grid.length; i++) {
            grid[i].items = []
        }
    }

    for (let i = 0; i < circles.length; i++) {
        const { x, y } = circles[i].position
        let gridY = Math.floor(y / cellHeight)
        let gridX = Math.floor(x / cellWidth)

        const gridCellIndex = gridY * gridDimension + gridX
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

        if (dot < 0) {
            cX *= dot * 2
            cY *= dot * 2

            circle.velocity.x -= cX * CIRCLE_BOUNCINESS
            circle.velocity.y -= cY * CIRCLE_BOUNCINESS
        }
    }

    reflect(circle)
    reflect(otherCircle)
}

const determineCollision = (circle: Circle, otherCircle: Circle) => {
    const rad = circle.radius + otherCircle.radius

    let dx = otherCircle.position.x - circle.position.x
    let dy = otherCircle.position.y - circle.position.y

    if (dx * dx + dy * dy <= rad * rad) {
        return { dx, dy }
    }
}

export const tick = (
    circles: Circle[],
    maxWidth: number,
    maxHeight: number,
    gridDimension: number
) => {
    const startTime = performance.now()

    for (let i = 0; i < PHYSICS_ITERATIONS_COUNT; i++) {
        for (let x = 0; x < circles.length; x++) {
            const circle = circles[x]
            circle.velocity.y += GRAVITY_CONST / PHYSICS_ITERATIONS_COUNT
            circle.position.x += circle.velocity.x / PHYSICS_ITERATIONS_COUNT
            circle.position.y += circle.velocity.y / PHYSICS_ITERATIONS_COUNT
            handleWallCollisions(circle, maxWidth, maxHeight)
        }

        circles.sort((circle0, circle1) => {
            //FIXME: maybe try some fancy sorting algorithm
            return circle0.position.x - circle1.position.x
        })

        const collisionGroups: Circle[][] = []

        circles.forEach((circle, index) => {
            let iterate = true
            let nextIndex = index + 1
            const intervalStartX = circle.position.x - circle.radius
            const intervalEndX = circle.position.x + circle.radius
            const intervalStartY = circle.position.y - circle.radius
            const intervalEndY = circle.position.y + circle.radius

            const collisionGroup: Circle[] = [circle]

            while (iterate) {
                if (nextIndex >= circles.length) {
                    iterate = false
                    break
                }
                const otherCircle = circles[nextIndex]
                const intervalStartX1 =
                    otherCircle.position.x - otherCircle.radius
                const intervalEndX1 =
                    otherCircle.position.x + otherCircle.radius
                const intervalStartY1 =
                    otherCircle.position.y - otherCircle.radius
                const intervalEndY1 =
                    otherCircle.position.y + otherCircle.radius

                const intersectsX =
                    (intervalStartX1 <= intervalEndX &&
                        intervalStartX1 >= intervalStartX) ||
                    (intervalEndX1 <= intervalEndX &&
                        intervalEndX1 >= intervalStartX)

                if (intersectsX) {
                    const intersectsY =
                        (intervalStartY1 <= intervalEndY &&
                            intervalStartY1 >= intervalStartY) ||
                        (intervalEndY1 <= intervalEndY &&
                            intervalEndY1 >= intervalStartY)

                    if (intersectsY) {
                        collisionGroup.push(otherCircle)
                    }
                    nextIndex += 1
                } else {
                    iterate = false
                }
            }

            if (collisionGroup.length > 1) {
                collisionGroups.push(collisionGroup)
            }
        })

        collisionGroups.forEach((collisionGroup) => {
            for (let i = 1; i < collisionGroup.length; i++) {
                const collisionData = determineCollision(
                    collisionGroup[0],
                    collisionGroup[i]
                )

                if (collisionData) {
                    resolveCollision(
                        collisionGroup[0],
                        collisionGroup[i],
                        collisionData.dx,
                        collisionData.dy
                    )
                }
            }
        })

        // for (let x = 0; x < circles.length; x++) {
        //     const circle = circles[x]
        //     circle.velocity.y += GRAVITY_CONST / PHYSICS_ITERATIONS_COUNT
        //     circle.position.x += circle.velocity.x / PHYSICS_ITERATIONS_COUNT
        //     circle.position.y += circle.velocity.y / PHYSICS_ITERATIONS_COUNT
        //     handleWallCollisions(circle, maxWidth, maxHeight)
        // }
        // const grid = getSpatialGrid(circles, maxWidth, maxHeight, gridDimension)
        // for (let y = 0; y < grid.length; y++) {
        //     const cell = grid[y]
        //     for (let ci = 0; ci < cell.items.length; ci++) {
        //         const circle = cell.items[ci]
        //         for (let x = 0; x < cell.items.length; x++) {
        //             if (x === ci) continue
        //             const otherCircle = cell.items[x]
        //             const collisionData = determineCollision(
        //                 circle,
        //                 otherCircle
        //             )
        //             if (collisionData) {
        //                 resolveCollision(
        //                     circle,
        //                     otherCircle,
        //                     collisionData.dx,
        //                     collisionData.dy
        //                 )
        //             }
        //         }
        //         const {
        //             x: xCollision,
        //             y: yCollision,
        //             x1: x1Collision,
        //             y1: y1Collision,
        //         } = determineBoxCollisions(
        //             circle,
        //             cell.x,
        //             cell.y,
        //             cell.x1,
        //             cell.y1
        //         )
        //         //skip adjacent cells check if circle is fully contined within own cell
        //         //in best case gets a 20% speed up, worst case - nothing
        //         if (xCollision || yCollision || x1Collision || y1Collision) {
        //             for (let v = 0; v < cell.relevantCells.length; v++) {
        //                 const relevantCell = grid[cell.relevantCells[v]]
        //                 for (let z = 0; z < relevantCell.items.length; z++) {
        //                     const otherCircle = relevantCell.items[z]
        //                     const collisionData = determineCollision(
        //                         circle,
        //                         otherCircle
        //                     )
        //                     if (collisionData) {
        //                         resolveCollision(
        //                             circle,
        //                             otherCircle,
        //                             collisionData.dx,
        //                             collisionData.dy
        //                         )
        //                     }
        //                 }
        //             }
        //         }
        //     }
        // }
    }

    return performance.now() - startTime
}
