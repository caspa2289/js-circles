// import { runPerformanceTest } from './performanceTests'
import { run2d, runWebGPU } from './physics'

// runPerformanceTest()

const width = Math.floor(document.body.clientWidth)
const height = Math.floor(document.body.clientHeight)

const selector = document.getElementById('selector') as HTMLSelectElement
// selector.addEventListener('change', (event) => {
//     switch ((event.target as HTMLSelectElement).value) {
//         case '2d': {
//             run2d(width, height)
//         }
//         case 'webgpu': {
//             runWebGPU(width, height)
//         }
//     }
// }) //selected thins keeps rolling after canvas is destroyed

runWebGPU(width, height)
