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

const CIRCLES: Circle[] = []

const initValues = () => {
    for (let i = 0; i < MAX_CIRCLE_COUNT; i++) {
        CIRCLES[i] = {
            radius: 10,
            velocity: { x: 20, y: 0 },
            color: [255, 0, 0],
            position: { x: 50, y: 30 + 30 * i },
        }
    }
}

const runWebGPU = async (w: number, h: number, circles: Circle[]) => {
    const setupData = await setupWebGPUContext(h, w)

    if (!setupData) {
        alert('failed to initialize webgpu')
        throw new Error('failed to initialize webgpu')
    }

    const { pipeline, buffer, bindGroup, device, context, height, width } =
        setupData

    const getNextFrame = (time: number) => {
        if (!isWebGPUEnabled) return

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

        updateFPSCounter(physicsTime, renderingTime)

        requestAnimationFrame(getNextFrame)
    }

    requestAnimationFrame(getNextFrame)
}

const run2d = (w: number, h: number, circles: Circle[]) => {
    const { context, height, width } = setup2dContext(h, w)
    if (!context) {
        alert('Failed to initialize 2d context')
        throw new Error('Failed to initialize 2d context')
    }

    const getNextFrame = (time: number) => {
        if (!is2dEnabled) return

        tick(circles, width, height)
        render2d(circles, context) //rendering takes like 99% of the frame time :D

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
            run2d(width, height, CIRCLES)
            break
        }
        case 'webgpu': {
            is2dEnabled = false
            isWebGPUEnabled = true
            runWebGPU(width, height, CIRCLES)
            break
        }
    }
})

const resetButton = document.getElementById('resetButton') as HTMLButtonElement
resetButton.addEventListener('click', initValues)

const fpsCounter = document.getElementById('fpsCounter') as HTMLDivElement

const updateFPSCounter = (physicsTime: number, renderingTime: number) => {
    fpsCounter.textContent = `~ ${(1000 / (physicsTime + renderingTime)).toFixed(0)}FPS, Physics: ${physicsTime.toFixed(1)}ms, Rendering: ${renderingTime.toFixed(1)}ms`
}

isWebGPUEnabled = true
initValues()
runWebGPU(width, height, CIRCLES)
