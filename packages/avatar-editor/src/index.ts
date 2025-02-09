import { loadImageURL, loadImageFile, isPassiveSupported, isTouchDevice } from './utils'

type Shape = 'rect' | 'circle'

interface Position {
  x: number
  y: number
}

interface AvatarEditorOptions {
  shape?: Shape;
  image?: string | File;
  crossOrigin?: '' | 'anonymous' | 'use-credentials';
  size?: number;
  position?: Position;
  pixelRatio?: number;
  maskColor?: string;
  gridColor?: string;
  gridWidth?: number;
  borderColor?: string;
  borderWidth?: number;
  onLoadFailure?: () => void;
  onLoadSuccess?: (image: HTMLImageElement) => void;
}

interface AvatarEditorProps {
  scale?: number;
  onScaleChange?: (scale: number) => void;
  offset?: Position;
  onOffsetChange?: (offset: Position) => void;
}

const defaultOptions: Required<AvatarEditorOptions> = {
  shape: 'circle',
  size: 200,
  image: '',
  crossOrigin: '',
  position: { x: 0, y: 0 },
  pixelRatio: window.devicePixelRatio || 1,
  maskColor: '#000000aa',
  gridColor: '#fff',
  gridWidth: 1,
  borderColor: '#fff',
  borderWidth: 1,
  onLoadFailure: () => { },
  onLoadSuccess: () => { },
}

class AvatarEditor {
  private canvas: HTMLCanvasElement;
  private options: Required<AvatarEditorOptions> & AvatarEditorProps = defaultOptions;
  private image: HTMLImageElement | undefined;
  private _offset: Position = { x: 0, y: 0 };
  private _scale: number | null = 1;
  private _drag: boolean = false;

  constructor(canvas: HTMLCanvasElement, options: AvatarEditorOptions & AvatarEditorProps) {
    if (!canvas) {
      throw new Error('Canvas element is required');
    }

    this.canvas = canvas;
    this.setOptions(options);

    this.setupEventListeners()
  }

  public setOptions(options: AvatarEditorOptions & AvatarEditorProps) {
    const image = this.options.image;
    this.options = { ...this.options, ...options };

    if (this.options.image !== image && this.options.image) {
      this.loadImage()
    }

    this.paint();
  }

  private async loadImage() {
    const { image, crossOrigin } = this.options;
    (this as any).cancelImageLoad?.();
    let cancelled = false;
    (this as any).cancelImageLoad = () => cancelled = true;

    const load = typeof image === 'string'
      ? () => loadImageURL(image, crossOrigin)
      : () => loadImageFile(image)

    try {
      const image = await load();
      if (cancelled) return;
      this.options.onLoadSuccess?.(image);
    } catch (error) {
      if (cancelled) return;
      this.options.onLoadFailure?.();
    }
  }

  private getContext() {
    const context = this.canvas.getContext('2d')
    if (!context) {
      throw new Error('Could not get canvas context')
    }
    return context
  }

  // Draws a shape on a 2D context.
  private drawShape(center: Position, size: number) {
    const context = this.getContext();
    const { shape } = this.options;
    if (shape === 'rect') {
      context.rect(center.x - size / 2, center.y - size / 2, size, size)
    } else {
      const radius = size / 2
      context.arc(center.x, center.y, radius, 0, Math.PI * 2)
    }
  }

  // Draws a "Rule of Three" grid on the canvas.
  private drawGrid(center: Position, size: number) {
    const { x, y } = center;
    const { gridWidth, gridColor } = this.options;

    if (gridColor || gridWidth) {
      const width = gridWidth || 1;
      const thirds = size / 3

      const context = this.getContext();
      context.save()

      context.fillStyle = gridColor || '#fff';
      context.beginPath()
      // vertical bars
      context.fillRect(x - thirds * 0.5, y - thirds * 1.5, width, size);
      context.fillRect(x + thirds * 0.5, y - thirds * 1.5, width, size);
      // horizontal bars
      context.fillRect(x - thirds * 1.5, y - thirds * 0.5, size, width);
      context.fillRect(x - thirds * 1.5, y + thirds * 0.5, size, width);
      context.fill()

      context.globalCompositeOperation = "destination-in";

      context.beginPath()
      this.drawShape(center, size);
      context.fill()

      context.restore()
    }
  }

  private drawBorder(center: Position, size: number) {
    const { borderColor, borderWidth } = this.options;

    if (borderColor || borderWidth) {
      const context = this.getContext();
      context.save()

      context.strokeStyle = borderColor || '#fff'
      context.lineWidth = borderWidth || 1
      context.beginPath()
      this.drawShape(center, size);
      context.stroke()

      context.restore()
    }
  }

  private drawImage() {
    if (!this.image?.width || !this.image?.height) return

    const { x, y, width, height } = this.calculatePosition();

    const context = this.getContext();
    context.save()
    context.globalCompositeOperation = 'destination-over'
    context.drawImage(this.image, x, y, width, height)
    context.restore()
  }

  private paint() {
    const { maskColor, size, pixelRatio, position } = this.options;
    const { width, height } = this.canvas;
    const center = { x: width / 2 + position.x, y: height / 2 + position.y };

    const context = this.getContext();
    context.save()
    context.scale(pixelRatio, pixelRatio)
    context.translate(0, 0)

    // draw grid
    this.drawGrid(center, size);

    // draw black mask
    context.save()
    context.fillStyle = maskColor;
    context.beginPath();
    this.drawShape(center, size);
    context.rect(0, 0, this.canvas.width, this.canvas.height);
    context.fill('evenodd')
    context.restore()

    // draw border
    this.drawBorder(center, size);

    //draw image
    this.drawImage()

    context.restore()
  }

  private setupEventListeners() {
    const options = isPassiveSupported() ? { passive: false } : false

    this.canvas.addEventListener('mousedown', this.handleMouseDown)
    document.addEventListener('mousemove', this.handleMouseMove, options)
    document.addEventListener('mouseup', this.handleMouseUp, options)

    if (isTouchDevice) {
      this.canvas.addEventListener('touchstart', this.handleTouchStart)
      document.addEventListener('touchmove', this.handleMouseMove, options)
      document.addEventListener('touchend', this.handleMouseUp, options)
    }
  }

  private handleMouseDown = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    this._drag = true;
  }

  private handleTouchStart = (e: TouchEvent) => {
    this._drag = true;
  }

  private handleMouseUp = () => {
    this._drag = false
  }

  private handleMouseMove = (e: MouseEvent | TouchEvent) => {
    if (!this._drag) return
    e.preventDefault()

    const mousePositionX = 'targetTouches' in e ? e.targetTouches[0].pageX : e.clientX
    const mousePositionY = 'targetTouches' in e ? e.targetTouches[0].pageY : e.clientY

    if (this.state.mx !== undefined && this.state.my !== undefined) {
      const mx = this.state.mx - mousePositionX
      const my = this.state.my - mousePositionY

      const width = this.state.image.width! * this.options.scale
      const height = this.state.image.height! * this.options.scale

      let { x: lastX, y: lastY } = this.getCroppingRect()

      lastX *= width
      lastY *= height

      const x = lastX + mx
      const y = lastY + my

      const relativeWidth = (1 / this.options.scale) * this.getXScale()
      const relativeHeight = (1 / this.options.scale) * this.getYScale()

      const position = {
        x: x / width + relativeWidth / 2,
        y: y / height + relativeHeight / 2,
      }

      this.options.onPositionChange(position)
      this.state.image = { ...this.state.image, ...position }
      this.paint()
    }

    this.state.mx = mousePositionX
    this.state.my = mousePositionY
    this.options.onMouseMove(e)
  }

  public destroy() {
    document.removeEventListener('mousemove', this.handleMouseMove)
    document.removeEventListener('mouseup', this.handleMouseUp)

    if (isTouchDevice) {
      document.removeEventListener('touchmove', this.handleMouseMove)
      document.removeEventListener('touchend', this.handleMouseUp)
    }

    this.canvas.removeEventListener('mousedown', this.handleMouseDown)
    if (isTouchDevice) {
      this.canvas.removeEventListener('touchstart', this.handleTouchStart)
    }
  }

  private calculatePosition() {
    const croppingRect = this.getCroppingRect()

    const width = image.width * this.options.scale
    const height = image.height * this.options.scale

    const x = -croppingRect.x * width
    const y = -croppingRect.y * height

    return { x, y, height, width }
  }

  private getCroppingRect() {
    const position = this.options.position || {
      x: this.state.image.x,
      y: this.state.image.y,
    }
    const width = (1 / this.options.scale) * this.getXScale()
    const height = (1 / this.options.scale) * this.getYScale()

    const croppingRect = {
      x: position.x - width / 2,
      y: position.y - height / 2,
      width,
      height,
    }

    let xMin = 0
    let xMax = 1 - croppingRect.width
    let yMin = 0
    let yMax = 1 - croppingRect.height

    return {
      ...croppingRect,
      x: Math.max(xMin, Math.min(croppingRect.x, xMax)),
      y: Math.max(yMin, Math.min(croppingRect.y, yMax)),
    }
  }
}

export default AvatarEditor