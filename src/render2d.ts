import { Circle } from './types'

export const setup2dContext = (height: number, width: number) => {
    const canvas = document.createElement('canvas')
    canvas.classList.add('canvas_2d')
    canvas.width = width
    canvas.height = height

    document.body.replaceChildren(canvas)

    return canvas.getContext('2d')
}

export const render2d = (
    circles: Circle[],
    context: CanvasRenderingContext2D
) => {
    console.log(circles)
    console.log(context)
}
