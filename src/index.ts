// import { runPerformanceTest } from './performanceTests'
import { colors } from './colors'
import { MAX_CIRCLE_COUNT } from './constants'
import { tick } from './physics'
import { render2d, setup2dContext } from './render2d'
import { renderWebGPU, setupWebGPUContext } from './renderWebGPU'
import { Circle } from './types'

// runPerformanceTest()
const width = 400
const height = 400

let prevTime = 0

let is2dEnabled = false
let isWebGPUEnabled = false

// let colorData: number[] = []
let CIRCLES: Circle[] = []

const radius = 3

// const xFactors = [
//     -radius * 55,
//     -radius * 30,
//     -radius * 20,
//     0,
//     radius * 55,
//     radius * 30,
//     radius * 20,
// ]

const xFactors = [
    radius * 32.1,
    radius * 30,
    radius * 27.9,
    radius * 25.8,
    // 0,
    // radius * 35,
    // radius * 30,
    // radius * 25,
]

const optimalGridSize = radius * 2.6755 //this is a magic number from practical tests

const gridDimension = Math.trunc(width / optimalGridSize)

const onFrameEnd = (frameCount: number) => {
    if (CIRCLES.length + xFactors.length * 3 >= MAX_CIRCLE_COUNT) {
        // if (frameCount === 2300) {
        //     console.log(CIRCLES)
        // }
        // console.log(frameCount)
        return
    }

    if (frameCount % 3 !== 0) return

    xFactors.forEach((factor) => {
        CIRCLES.push({
            index: CIRCLES.length,
            radius,
            velocity: { x: 2, y: -5 },
            // color: [255, 255, 0],
            color: colors[CIRCLES.length] as [number, number, number],
            position: {
                x: 30,
                y: factor,
            },
        })
        CIRCLES.push({
            index: CIRCLES.length,
            radius,
            velocity: { x: -2, y: -5 },
            // color: [255, 255, 0],
            color: colors[CIRCLES.length] as [number, number, number],
            position: {
                x: width - 30,
                y: factor,
            },
        })

        CIRCLES.push({
            index: CIRCLES.length,
            radius,
            velocity: { x: 3, y: 3 },
            // color: [255, 255, 0],
            color: colors[CIRCLES.length] as [number, number, number],
            position: {
                x: width / 2 - radius,
                y: factor,
            },
        })
    })
}

let frameCount = 0

const runWebGPU = async (
    w: number,
    h: number,
    circles: Circle[],
    callback: (frame: number) => void
) => {
    const setupData = await setupWebGPUContext(h, w)

    if (!setupData) {
        alert('failed to initialize webgpu')
        throw new Error('failed to initialize webgpu')
    }

    const { pipeline, buffer, bindGroup, device, context } = setupData

    const getNextFrame = (time: number) => {
        if (!isWebGPUEnabled) return

        frameCount++

        const physicsTime = tick(circles, width, height, gridDimension)

        const renderingTime = renderWebGPU(
            circles,
            device,
            context,
            pipeline,
            bindGroup,
            buffer,
            width,
            height
        )

        callback(frameCount)

        updateFPSCounter(physicsTime, renderingTime)

        requestAnimationFrame(getNextFrame)
    }

    requestAnimationFrame(getNextFrame)
}

const run2d = (
    w: number,
    h: number,
    circles: Circle[],
    callback: (frame: number) => void
) => {
    const { context } = setup2dContext(h, w)
    if (!context) {
        alert('Failed to initialize 2d context')
        throw new Error('Failed to initialize 2d context')
    }

    const getNextFrame = (time: number) => {
        if (!is2dEnabled) return

        frameCount++

        const physicsTime = tick(circles, width, height, gridDimension)
        render2d(circles, context) //rendering takes like 99% of the frame time :D

        callback(frameCount)

        updateFPSCounter(physicsTime, 0)

        requestAnimationFrame(getNextFrame)
    }

    requestAnimationFrame(getNextFrame)
}

const selector = document.getElementById('selector') as HTMLSelectElement
selector.addEventListener('change', (event) => {
    switch ((event.target as HTMLSelectElement).value) {
        case '2d': {
            is2dEnabled = true
            isWebGPUEnabled = false
            run2d(width, height, CIRCLES, onFrameEnd)
            break
        }
        case 'webgpu': {
            is2dEnabled = false
            isWebGPUEnabled = true
            runWebGPU(width, height, CIRCLES, onFrameEnd)
            break
        }
    }
})

const fpsCounter = document.getElementById('fpsCounter') as HTMLDivElement

const updateFPSCounter = (physicsTime: number, renderingTime: number) => {
    fpsCounter.textContent = `~ ${(1000 / (physicsTime + renderingTime)).toFixed(0)}FPS, Physics: ${physicsTime.toFixed(1)}ms, Rendering: ${renderingTime.toFixed(1)}ms`
}

isWebGPUEnabled = true
// getImageData().then((data) => {
//     colorData = [...data]

//     const result = finalData.map((circle) => {
//         const a = 63 / 400

//         const newX = Math.round(circle.position.x * a)
//         const newY = Math.round(circle.position.y * a)

//         const index = newY * 63 + newX

//         return [
//             colorData[index * 4] / 255,
//             colorData[index * 4 + 1] / 255,
//             colorData[index * 4 + 2] / 255,
//         ]
//     })
//     console.log(result)
runWebGPU(width, height, CIRCLES, onFrameEnd)
// })
