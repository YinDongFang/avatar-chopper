const isDataURL = (str: string) => {
  const regex =
    /^\s*data:([a-z]+\/[a-z]+(;[a-z-]+=[a-z-]+)?)?(;base64)?,[a-z0-9!$&',()*+;=\-._~:@/?%\s]*\s*$/i
  return !!str.match(regex)
}

export const loadImageURL = (imageURL: string, crossOrigin?: string) => {
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    if (!isDataURL(imageURL) && crossOrigin) {
      image.crossOrigin = crossOrigin
    }
    image.src = imageURL
  })
}

export const loadImageFile = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        if (!e?.target?.result) {
          throw new Error('No image data')
        }
        const image = loadImageURL(e.target.result as string)
        resolve(image)
      } catch (e) {
        reject(e)
      }
    }
    reader.readAsDataURL(file)
  })

export const isTouchDevice =
  typeof window !== 'undefined' &&
  typeof navigator !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0)

// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
export const isPassiveSupported = () => {
  let passiveSupported = false
  try {
    const options = Object.defineProperty({}, 'passive', {
      get: function () {
        passiveSupported = true
      },
    })

    const handler = () => { }
    window.addEventListener('test', handler, options)
    window.removeEventListener('test', handler, options)
  } catch (err) {
    passiveSupported = false
  }
  return passiveSupported
}

export const isFileAPISupported = typeof File !== 'undefined'