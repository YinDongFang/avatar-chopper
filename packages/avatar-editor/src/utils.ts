const isDataURL = (str: string) => {
  const regex =
    /^\s*data:([a-z]+\/[a-z]+(;[a-z-]+=[a-z-]+)?)?(;base64)?,[a-z0-9!$&',()*+;=\-._~:@/?%\s]*\s*$/i
  return !!str.match(regex)
}

export const loadImageURL = (url: string, crossOrigin?: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const image = new Image()
    if (crossOrigin) {
      image.crossOrigin = crossOrigin
    }
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = url
  })
}

export const loadImageFile = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        const image = new Image()
        image.onload = () => resolve(image)
        image.onerror = reject
        image.src = e.target.result as string
      } else {
        reject(new Error('Failed to load image file'))
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export const isTouchDevice = typeof window !== 'undefined' && 
  ('ontouchstart' in window || 
   navigator.maxTouchPoints > 0)

// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
export const isPassiveSupported = () => {
  let passiveSupported = false

  try {
    const options = {
      get passive() {
        passiveSupported = true
        return false
      },
    } as AddEventListenerOptions

    window.addEventListener('test' as keyof WindowEventMap, () => {}, options)
    window.removeEventListener('test' as keyof WindowEventMap, () => {}, options)
  } catch (err) {
    passiveSupported = false
  }

  return passiveSupported
}

export const isFileAPISupported = typeof File !== 'undefined'