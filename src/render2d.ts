import { Circle } from './types'

export const setup2dContext = (height: number, width: number) => {
    const canvas = document.createElement('canvas')
    canvas.classList.add('canvas_2d')
    const realHeight = height * window.devicePixelRatio
    const realWidth = width * window.devicePixelRatio
    canvas.width = realWidth
    canvas.height = realHeight

    document.getElementById('container')?.replaceChildren(canvas)

    return {
        context: canvas.getContext('2d'),
        width: realWidth,
        height: realHeight,
    }
}

export const render2d = (
    circles: Circle[],
    context: CanvasRenderingContext2D
) => {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height)
    context.beginPath()
    circles.forEach((circle) => {
        context.moveTo(circle.position.x, circle.position.y)
        context.fillStyle = `rgb(${circle.color})`
        context.arc(
            circle.position.x,
            circle.position.y,
            circle.radius,
            0,
            2 * Math.PI,
            false
        )
        context.fill()
    })
    context.closePath()
}
