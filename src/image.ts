const canvas = document.createElement('canvas') as HTMLCanvasElement
const context = canvas.getContext('2d') as CanvasRenderingContext2D

const imageURL = 'static/shrock1.png'

export const getImageData = async () =>
    fetch(imageURL).then((data) => {
        return data.blob().then((blob) => {
            return createImageBitmap(blob).then((bitmap) => {
                context.drawImage(bitmap, 0, 0)

                const imageData = context.getImageData(
                    0,
                    0,
                    bitmap.width,
                    bitmap.height
                )

                return imageData.data
            })
        })
    })
