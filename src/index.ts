// import { runPerformanceTest } from './performanceTests'
import { MAX_CIRCLE_COUNT } from './constants'
import { tick } from './physics'
import { render2d, setup2dContext } from './render2d'
import { renderWebGPU, setupWebGPUContext } from './renderWebGPU'
import { Circle } from './types'

// runPerformanceTest()

const width = Math.floor(document.body.clientWidth)
const height = Math.floor(document.body.clientHeight)

let prevTime = 0

let is2dEnabled = false
let isWebGPUEnabled = false

let CIRCLES: Circle[] = []

// const initValues = () => {
//     CIRCLES = []
//     // for (let i = 0; i < MAX_CIRCLE_COUNT; i++) {
//     //     CIRCLES[i] = {
//     //         radius: 10,
//     //         velocity: { x: 20, y: 0 },
//     //         color: [255, 0, 0],
//     //         position: { x: 50, y: 30 + 30 * i },
//     //     }
//     // }
// }

const onFrameEnd = (frameCount: number) => {
    if (CIRCLES.length >= MAX_CIRCLE_COUNT) return

    if (frameCount % 5 !== 0) return

    CIRCLES.push({
        radius: 5,
        velocity: { x: 15, y: 0 },
        color: [255, 0, 0],
        position: { x: 20, y: 20 },
    })

    CIRCLES.push({
        radius: 5,
        velocity: { x: 15, y: 0 },
        color: [255, 0, 0],
        position: { x: 20, y: 60 },
    })

    CIRCLES.push({
        radius: 5,
        velocity: { x: -15, y: 0 },
        color: [255, 0, 0],
        position: { x: width * window.devicePixelRatio - 20, y: 20 },
    })

    CIRCLES.push({
        radius: 5,
        velocity: { x: -15, y: 0 },
        color: [255, 0, 0],
        position: { x: width * window.devicePixelRatio - 20, y: 60 },
    })
}

const addCircles = () => {
    CIRCLES.push({
        radius: 10,
        velocity: { x: 30, y: 0 },
        color: [255, 0, 0],
        position: { x: 20, y: 20 },
    })

    if (CIRCLES.length < MAX_CIRCLE_COUNT) {
        setTimeout(addCircles, 250) //FIXME: the timeouts are too inconsistent, gotta count frames
    }
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

    const { pipeline, buffer, bindGroup, device, context, height, width } =
        setupData

    const getNextFrame = (time: number) => {
        if (!isWebGPUEnabled) return

        frameCount++

        const physicsTime = tick(circles, width, height)

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
    const { context, height, width } = setup2dContext(h, w)
    if (!context) {
        alert('Failed to initialize 2d context')
        throw new Error('Failed to initialize 2d context')
    }

    const getNextFrame = (time: number) => {
        if (!is2dEnabled) return

        frameCount++

        tick(circles, width, height)
        render2d(circles, context) //rendering takes like 99% of the frame time :D

        callback(frameCount)

        updateFPSCounter(0, 0)

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

const resetButton = document.getElementById('resetButton') as HTMLButtonElement
resetButton.addEventListener('click', () => {
    CIRCLES = []
})

const fpsCounter = document.getElementById('fpsCounter') as HTMLDivElement

const updateFPSCounter = (physicsTime: number, renderingTime: number) => {
    fpsCounter.textContent = `~ ${(1000 / (physicsTime + renderingTime)).toFixed(0)}FPS, Physics: ${physicsTime.toFixed(1)}ms, Rendering: ${renderingTime.toFixed(1)}ms`
}

isWebGPUEnabled = true
runWebGPU(width, height, CIRCLES, onFrameEnd)
// addCircles()
