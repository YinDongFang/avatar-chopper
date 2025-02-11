import { clamp, clamp2, cover, Position, scale } from "./utils/math";
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

const defaultOptions: Required<AvatarEditorOptions> = {
  shape: "circle",
  size: 200,
  maxScale: 3,
  image: "",
  crossOrigin: "",
  position: { x: 0, y: 0 },
  pixelRatio: window.devicePixelRatio || 1,
  maskColor: "#000000aa",
  gridColor: "#fff",
  gridWidth: 1,
  borderColor: "#fff",
  borderWidth: 1,
  onLoadFailure: () => {},
  onLoadSuccess: () => {},
};

class AvatarEditor {
  private canvas: HTMLCanvasElement;
  private options: Required<AvatarEditorOptions> & AvatarEditorProps =
    defaultOptions;
  private image:
    | {
        src: HTMLImageElement;
        width: number;
        height: number;
      }
    | undefined;

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
    this.setOptions(options);

    this.setupEventListeners();
    this.setupResizeObserver();
  }

  public setOptions(options: AvatarEditorOptions & AvatarEditorProps) {
    const image = this.options.image;
    this.options = { ...this.options, ...options };

    if (this.options.image !== image && this.options.image) {
      this.loadImage();
    }

    // update _scale
    const scale = this.options.scale || this._scale;
    this._scale = clamp(scale, 1, this.options.maxScale);

    // update _image initial size
    if (this.image) {
      this.image = {
        ...this.image,
        ...cover(this.image.src, this.options.size),
      };
    }

    this.paint();
  }

  private async loadImage() {
    const { image, crossOrigin } = this.options;
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
      this.paint();
    } catch (error) {
      if (cancelled) return;
      this.options.onLoadFailure?.();
    }
  }

  private getLimitOffset(
    newOffset: Position = this.options.offset || this._offset
  ) {
    // limit offset based on actual render size
    const { width, height } = scale(this.image!, this._scale);
    const { size } = this.options;

    const maxOffsetX = (width - size) / 2 / width;
    const maxOffsetY = (height - size) / 2 / height;

    return clamp2(newOffset, { x: maxOffsetX, y: maxOffsetY });
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
    const { width, height } = this.canvas;
    const x = width / 2 + position.x;
    const y = height / 2 + position.y;
    context.clearRect(0, 0, width, height);
    context.scale(pixelRatio, pixelRatio);
    context.translate(0, 0);

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
      const { x: deltaX, y: deltaY } = this.getLimitOffset();
      const { width, height } = scale(this.image, this._scale);
      context.save();
      context.globalCompositeOperation = "destination-over";
      const px = (deltaX - 0.5) * width + x;
      const py = (deltaY - 0.5) * height + y;
      context.drawImage(this.image.src, px, py, width, height);
      context.restore();
    }
  }

  private handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (!this.image) return;

    const delta = -e.deltaY;
    const scaleChange = delta > 0 ? 0.1 : -0.1;
    const newScale = clamp(this._scale + scaleChange, 1, this.options.maxScale);

    // update scale
    if (this.options.scale !== undefined) {
      this.options.onScaleChange?.(newScale);
    } else {
      this._scale = newScale;
      this.paint();
    }
  };

  private handlePointerDown = (e: PointerEvent) => {
    e.preventDefault();
    let [prevX, prevY] = [e.clientX, e.clientY];

    const handlePointerMove = ({ clientX, clientY }: PointerEvent) => {
      e.preventDefault();
      if (!this.image) return;

      const { width, height } = scale(this.image, this._scale);
      const offset = this.getLimitOffset();

      // calculate offset
      const deltaX = (clientX - prevX) / width;
      const deltaY = (clientY - prevY) / height;
      [prevX, prevY] = [clientX, clientY];
      const newOffset = this.getLimitOffset({
        x: offset.x + deltaX,
        y: offset.y + deltaY,
      });

      // update offset
      if (this.options.offset) {
        this.options.onOffsetChange?.(newOffset);
      } else {
        this._offset = newOffset;
        this.paint();
      }
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
    this.resizeObserver = new ResizeObserver(() => this.paint());
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
