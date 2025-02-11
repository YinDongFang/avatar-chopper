import { clamp, cover, Position, scale } from "./utils/math";
import { loadImageURL, loadImageFile } from "./utils/loader";

type Shape = "rect" | "circle";

interface AvatarEditorOptions {
  shape?: Shape;
  image?: string | File;
  crossOrigin?: "" | "anonymous" | "use-credentials";
  size?: number;
  maxScale?: number;
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

type MergeOptions = AvatarEditorOptions & typeof defaultOptions;

const defaultOptions = {
  shape: "circle" as Shape,
  size: 200,
  maxScale: 3,
  position: { x: 0, y: 0 },
  pixelRatio: window.devicePixelRatio || 1,
  maskColor: "#000000aa",
};

class AvatarEditor {
  private canvas: HTMLCanvasElement;
  private options: MergeOptions & AvatarEditorProps = defaultOptions;
  private image:
    | {
        src: HTMLImageElement;
        width: number;
        height: number;
      }
    | undefined;

  private width: number = 0;
  private height: number = 0;

  private _offset: Position = { x: 0, y: 0 };
  private _scale: number = 1;
  private resizeObserver: ResizeObserver | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    options: AvatarEditorOptions & AvatarEditorProps
  ) {
    if (!canvas) {
      throw new Error("Canvas element is required");
    }

    this.canvas = canvas;

    this.setupEventListeners();
    this.setupResizeObserver();

    this.setOptions(options);
  }

  public setOptions(options: AvatarEditorOptions & AvatarEditorProps) {
    const image = this.options.image;
    this.options = { ...this.options, ...options };

    if (this.options.image !== image) {
      this.loadImage();
    }

    // update _scale
    const s = this.options.scale || this._scale;
    this._scale = clamp(s, 1, this.options.maxScale);

    // update image initial size
    if (this.image) {
      this.image = {
        ...this.image,
        ...cover(this.image.src, this.options.size),
      };
    }

    if (this.options.offset) {
      this._offset = this.options.offset;
    }
    this.triggerOffsetChange(this.options.offset || this._offset);

    this.paint();
  }

  private async loadImage() {
    const { image, crossOrigin } = this.options;
    if (!image) return;
    (this as any).cancelImageLoad?.();
    let cancelled = false;
    (this as any).cancelImageLoad = () => (cancelled = true);

    const load =
      typeof image === "string"
        ? () => loadImageURL(image, crossOrigin)
        : () => loadImageFile(image);

    try {
      const image = await load();
      if (cancelled) return;
      this.image = {
        src: image,
        ...cover(image, this.options.size),
      };
      this.options.onLoadSuccess?.(image);

      this.triggerOffsetChange(this.options.offset || this._offset);
      this.paint();
    } catch (error) {
      if (cancelled) return;
      this.options.onLoadFailure?.();
    }
  }

  private paint() {
    const {
      maskColor,
      pixelRatio,
      position,
      shape,
      size,
      gridWidth,
      gridColor,
      borderColor,
      borderWidth,
    } = this.options;
    const context = this.canvas.getContext("2d");
    if (!context) throw new Error("Could not get canvas context");

    const { width, height } = this;
    const { width: cw, height: ch } = this.canvas;
    const x = width / 2 + position.x;
    const y = height / 2 + position.y;

    context.save();
    context.scale((cw / width) * pixelRatio, (ch / height) * pixelRatio);
    context.clearRect(0, 0, width, height);

    // draws a rect or cicle shape
    const drawShape = () =>
      shape === "rect"
        ? context.rect(x - size / 2, y - size / 2, size, size)
        : context.arc(x, y, size / 2, 0, Math.PI * 2);

    // draw grid lines
    if (gridColor || gridWidth) {
      const lineWidth = gridWidth || 1;
      const thirds = size / 3;

      context.save();

      context.fillStyle = gridColor || "#fff";
      context.beginPath();
      // vertical bars
      context.fillRect(x - thirds * 0.5, y - thirds * 1.5, lineWidth, size);
      context.fillRect(x + thirds * 0.5, y - thirds * 1.5, lineWidth, size);
      // horizontal bars
      context.fillRect(x - thirds * 1.5, y - thirds * 0.5, size, lineWidth);
      context.fillRect(x - thirds * 1.5, y + thirds * 0.5, size, lineWidth);
      context.fill();
      // chop the shape
      context.globalCompositeOperation = "destination-in";
      context.beginPath();
      drawShape();
      context.fill();

      context.restore();
    }

    // draw black mask
    context.save();
    context.fillStyle = maskColor;
    context.beginPath();
    drawShape();
    context.rect(0, 0, width, height);
    context.fill("evenodd");
    context.restore();

    // draw border
    if (borderColor || borderWidth) {
      context.save();

      context.strokeStyle = borderColor || "#fff";
      context.lineWidth = borderWidth || 1;
      context.beginPath();
      drawShape();
      context.stroke();

      context.restore();
    }

    //draw image
    if (this.image) {
      const { x: deltaX, y: deltaY } = this._offset;
      const { width, height } = scale(this.image, this._scale);
      context.save();
      context.globalCompositeOperation = "destination-over";
      const px = (deltaX - 0.5) * width + x;
      const py = (deltaY - 0.5) * height + y;
      context.drawImage(this.image.src, px, py, width, height);
      context.restore();
    }
    context.restore();
  }

  private triggerOffsetChange(offset: Position) {
    if (!this.image) return;

    const { width, height } = scale(this.image, this._scale);
    const size = this.options.size;

    const maxOffsetX = (width - size) / 2 / width;
    const maxOffsetY = (height - size) / 2 / height;

    offset = {
      x: clamp(offset.x, -maxOffsetX, maxOffsetX),
      y: clamp(offset.y, -maxOffsetY, maxOffsetY),
    };

    if (this._offset.x !== offset.x || this._offset.y !== offset.y) {
      this.options.onOffsetChange?.(offset);

      if (!this.options.offset) {
        this._offset = offset;
        return true;
      }
    }
    return false;
  }

  private triggerScaleChange(scale: number) {
    scale = clamp(scale, 1, this.options.maxScale);
    if (scale !== this._scale) {
      // update scale
      this.options.onScaleChange?.(scale);

      if (this.options.scale === undefined) {
        this._scale = scale;
        this.triggerOffsetChange(this.options.offset || this._offset);
        return true;
      }
    }
    return false;
  }

  private handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (!this.image) return;

    const delta = -e.deltaY;
    const scaleChange = delta > 0 ? 0.1 : -0.1;
    const repaint = this.triggerScaleChange(this._scale + scaleChange);
    repaint && this.paint();
  };

  private handlePointerDown = (e: PointerEvent) => {
    e.preventDefault();
    let [prevX, prevY] = [e.clientX, e.clientY];

    const handlePointerMove = ({ clientX, clientY }: PointerEvent) => {
      e.preventDefault();
      if (!this.image) return;

      const { width, height } = scale(this.image, this._scale);
      const offset = this._offset;

      // calculate offset
      const deltaX = (clientX - prevX) / width;
      const deltaY = (clientY - prevY) / height;
      [prevX, prevY] = [clientX, clientY];

      const repaint = this.triggerOffsetChange({
        x: offset.x + deltaX,
        y: offset.y + deltaY,
      });
      repaint && this.paint();
    };

    const handlePointerUp = () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };

    document.addEventListener("pointermove", handlePointerMove, {
      passive: false,
    });
    document.addEventListener("pointerup", handlePointerUp, { passive: false });
  };

  private setupEventListeners() {
    this.canvas.addEventListener("pointerdown", this.handlePointerDown, {
      passive: false,
    });
    this.canvas.addEventListener("wheel", this.handleWheel, { passive: false });
  }

  private setupResizeObserver() {
    const resize = () => {
      const styleWidth = parseFloat(getComputedStyle(this.canvas).width);
      const styleHeight = parseFloat(getComputedStyle(this.canvas).height);
      // 设置 canvas 的实际像素尺寸
      this.width = styleWidth;
      this.height = styleHeight;
    };
    resize();

    this.resizeObserver = new ResizeObserver(() => {
      resize();
      this.paint();
    });
    this.resizeObserver.observe(this.canvas);
  }

  public destroy() {
    // disconnect ResizeObserver
    this.resizeObserver?.disconnect();

    // remove event listeners
    this.canvas.removeEventListener("wheel", this.handleWheel);
    this.canvas.removeEventListener("pointerdown", this.handlePointerDown);

    // cancel image load
    (this as any).cancelImageLoad?.();
  }
}

export default AvatarEditor;
