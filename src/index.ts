import { colors } from './colors'
import {
    CIRCLE_COMPONENT_COUNT,
    COLOR_OFFSET,
    MAX_CIRCLE_COUNT,
    POSITION_OFFSET,
    RADIUS_OFFSET,
    VELOCITY_OFFSET,
} from './constants'
import { renderWebGPU, setupWebGPUContext } from './renderWebGPU'
import { physics_tick } from './physics-wasm/pkg'

const width = 400
const height = 400

let CIRCLES: Float32Array = new Float32Array(
    MAX_CIRCLE_COUNT * CIRCLE_COMPONENT_COUNT
)

let circleCount = 0

const radius = 3

const xFactors = [radius * 32.1, radius * 30, radius * 27.9, radius * 25.8]

const optimalGridSize = radius * 2.6755 //this is a magic number from practical tests

const gridDimension = Math.trunc(width / optimalGridSize)

const onFrameEnd = (frameCount: number) => {
    if (circleCount === MAX_CIRCLE_COUNT) {
        // console.log(frameCount)
        return
    }

    if (frameCount % 3 !== 0) return

    xFactors.forEach((factor) => {
        const index = circleCount * CIRCLE_COMPONENT_COUNT

        circleCount += 1

        CIRCLES[index + COLOR_OFFSET] = 1
        CIRCLES[index + COLOR_OFFSET + 1] = 0
        CIRCLES[index + COLOR_OFFSET + 2] = 0
        CIRCLES[index + RADIUS_OFFSET] = (radius / width) * 2
        CIRCLES[index + VELOCITY_OFFSET] = 2 / 500
        CIRCLES[index + VELOCITY_OFFSET + 1] = -5 / 500
        //webgpu screenspace is -1 to 1
        CIRCLES[index + POSITION_OFFSET] = (30 / width) * 2 - 1
        CIRCLES[index + POSITION_OFFSET + 1] = (factor / height) * -2 + 1
    })
}

let frameCount = 0

const runWebGPU = async (
    w: number,
    h: number,
    callback: (frame: number) => void
) => {
    const setupData = await setupWebGPUContext(h, w)

    if (!setupData) {
        alert('failed to initialize webgpu')
        throw new Error('failed to initialize webgpu')
    }

    const { pipeline, buffer, bindGroup, device, context } = setupData

    const getNextFrame = (time: number) => {
        frameCount++

        const a = performance.now()
        CIRCLES = physics_tick(
            CIRCLES,
            RADIUS_OFFSET,
            COLOR_OFFSET,
            VELOCITY_OFFSET,
            POSITION_OFFSET
        )

        const physicsTime = performance.now() - a

        const renderingTime = renderWebGPU(
            CIRCLES,
            device,
            context,
            pipeline,
            bindGroup,
            buffer
        )

        callback(frameCount)

        updateFPSCounter(physicsTime, renderingTime)

        requestAnimationFrame(getNextFrame)
    }

    requestAnimationFrame(getNextFrame)
}

const fpsCounter = document.getElementById('fpsCounter') as HTMLDivElement

const updateFPSCounter = (physicsTime: number, renderingTime: number) => {
    fpsCounter.textContent = `~ ${(1000 / (physicsTime + renderingTime)).toFixed(0)}FPS, Physics: ${physicsTime.toFixed(1)}ms, Rendering: ${renderingTime.toFixed(1)}ms`
}

// getImageData().then((data) => {
//     const colorData = [...data]

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
runWebGPU(width, height, onFrameEnd)
// })
