import { run2d as run2df32 } from './f32'

import { run2d as run2dobj } from './object'

import { run2d as run2darr } from './array'
import { MAX_CIRCLE_COUNT } from '../constants'

export const runPerformanceTest = () => {
    {
        const start = performance.now()

        run2dobj()

        const end = performance.now()

        console.log(`Array of objects ${end - start}`)
    }

    {
        const start = performance.now()

        run2darr()

        const end = performance.now()

        console.log(`Array ${end - start}`)
    }

    {
        const start = performance.now()

        run2df32()

        const end = performance.now()

        console.log(`Float32Array ${end - start}`)
    }

    console.log(`Read/write ${MAX_CIRCLE_COUNT} circles`)
}

//contrary to my belief array of objects is a lot faster than array and is on par with float32array. V8 is a weird beast
