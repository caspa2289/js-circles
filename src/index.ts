import { colors } from './colors'
import { MAX_CIRCLE_COUNT } from './constants'
import { tick } from './physics'
import { renderWebGPU, setupWebGPUContext } from './renderWebGPU'
import { Circle } from './types'
import { physics_tick } from './physics-wasm/pkg'

const width = 400
const height = 400

let CIRCLES: Circle[] = []

const radius = 3

const xFactors = [radius * 32.1, radius * 30, radius * 27.9, radius * 25.8]

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
            // color: colors[CIRCLES.length] as [number, number, number],
            color: [25, 25, 25],
            position: {
                x: 30,
                y: factor,
            },
        })
        CIRCLES.push({
            index: CIRCLES.length,
            radius,
            velocity: { x: -2, y: -5 },
            // color: colors[CIRCLES.length] as [number, number, number],
            color: [25, 25, 25],
            position: {
                x: width - 30,
                y: factor,
            },
        })

        CIRCLES.push({
            index: CIRCLES.length,
            radius,
            velocity: { x: 3, y: 3 },
            // color: colors[CIRCLES.length] as [number, number, number],
            color: [25, 25, 25],
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
        const newCircles = physics_tick(CIRCLES, width, height, gridDimension)
        CIRCLES = newCircles
        const physicsTime = performance.now() - a

        const renderingTime = renderWebGPU(
            CIRCLES,
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
