const canvas = document.createElement('canvas') as HTMLCanvasElement
const context = canvas.getContext('2d') as CanvasRenderingContext2D

const imageURL = 'static/shrock1.jpg'

const resizeSize = 63

export const getImageData = async () =>
    fetch(imageURL).then((data) => {
        return data.blob().then((blob) => {
            return createImageBitmap(blob, {
                resizeHeight: resizeSize,
                resizeWidth: resizeSize,
                resizeQuality: 'pixelated',
            }).then((bitmap) => {
                context.drawImage(bitmap, 0, 0)

                const imageData = context.getImageData(
                    0,
                    0,
                    resizeSize,
                    resizeSize
                )

                return imageData.data
            })
        })
    })
