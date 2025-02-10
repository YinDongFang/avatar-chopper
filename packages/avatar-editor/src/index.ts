import { loadImageURL, loadImageFile } from "./utils";

type Shape = "rect" | "circle";

interface Position {
  x: number;
  y: number;
}

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
  onLoadFailure: () => { },
  onLoadSuccess: () => { },
};

class AvatarEditor {
  private canvas: HTMLCanvasElement;
  private options: Required<AvatarEditorOptions> & AvatarEditorProps =
    defaultOptions;
  private image: HTMLImageElement | undefined;

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

  private setupResizeObserver() {
    this.resizeObserver = new ResizeObserver(() => {
      this.paint();
    });
    this.resizeObserver.observe(this.canvas);
  }

  public destroy() {
    // 清理 ResizeObserver
    this.resizeObserver?.disconnect();

    // 清理事件监听器
    this.canvas.removeEventListener("wheel", this.handleWheel);
    this.canvas.removeEventListener("pointerdown", this.handlePointerDown);

    // 清理图片加载取消函数
    (this as any).cancelImageLoad?.();
  }

  public setOptions(options: AvatarEditorOptions & AvatarEditorProps) {
    const image = this.options.image;
    this.options = { ...this.options, ...options };

    if (this.options.image !== image && this.options.image) {
      this.loadImage();
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
      this.image = image;
      this.options.onLoadSuccess?.(image);
      this.paint();
    } catch (error) {
      if (cancelled) return;
      this.options.onLoadFailure?.();
    }
  }

  private getLimitScale(scale: number = this.options.scale || this._scale) {
    return Math.min(this.options.maxScale, Math.max(scale, 1));
  }

  private getLimitOffset(
    newOffset: Position = this.options.offset || this._offset
  ) {
    // limit offset based on actual render size
    const { width: renderWidth, height: renderHeight } = this.getSize();
    const { size } = this.options;

    const maxOffsetX = (renderWidth - size) / 2 / renderWidth;
    const maxOffsetY = (renderHeight - size) / 2 / renderHeight;

    const x = Math.max(-maxOffsetX, Math.min(maxOffsetX, newOffset.x));
    const y = Math.max(-maxOffsetY, Math.min(maxOffsetY, newOffset.y));
    return { x, y };
  }

  private getSize(): { width: number; height: number } {
    if (!this.image) {
      return { width: 0, height: 0 };
    }

    const { width, height } = this.image;
    const { size } = this.options;
    const scale = this.getLimitScale();

    // Calculate the cover size
    const aspectRatio = width / height;
    let renderWidth, renderHeight;

    if (aspectRatio > 1) {
      // Landscape
      renderWidth = size * aspectRatio * scale;
      renderHeight = size * scale;
    } else {
      // Portrait or square
      renderWidth = size * scale;
      renderHeight = (size / aspectRatio) * scale;
    }

    return { width: renderWidth, height: renderHeight };
  }

  private paint() {
    const { maskColor, pixelRatio, position, shape, size, gridWidth, gridColor, borderColor, borderWidth } = this.options;
    const { width, height } = this.canvas;
    const x = width / 2 + position.x;
    const y = height / 2 + position.y;

    const context = this.canvas.getContext("2d");
    if (!context) throw new Error("Could not get canvas context");
    context.clearRect(0, 0, width, height);
    context.scale(pixelRatio, pixelRatio);
    context.translate(0, 0);

    // draws a rect or cicle shape
    const drawShape = () => shape === "rect"
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
    if (this.image?.width && this.image?.height) {
      const { x: deltaX, y: deltaY } = this.getLimitOffset();
      const { width, height } = this.getSize();
      context.save();
      context.globalCompositeOperation = "destination-over";
      const px = (deltaX - 0.5) * width + x;
      const py = (deltaY - 0.5) * height + y;
      context.drawImage(this.image, px, py, width, height);
      context.restore();
    }
  }

  private handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (!this.image?.width || !this.image?.height) return;

    const delta = -e.deltaY;
    const scaleChange = delta > 0 ? 0.1 : -0.1;
    const newScale = this.getLimitScale(this.getLimitScale() + scaleChange);

    // 更新缩放比例
    if (this.options.scale !== undefined) {
      this.options.onScaleChange?.(newScale);
    } else {
      this._scale = newScale;
      this.paint();
    }
  };

  private handlePointerDown = (e: PointerEvent) => {
    e.preventDefault();
    let prevX = e.clientX;
    let prevY = e.clientY;

    const handlePointerMove = (e: PointerEvent) => {
      e.preventDefault();
      if (!this.image?.width || !this.image?.height) return;
      const { clientX, clientY } = e;

      const { width, height } = this.getSize();
      const offset = this.getLimitOffset();

      // calculate offset
      const deltaX = (clientX - prevX) / width;
      const deltaY = (clientY - prevY) / height;
      prevX = clientX;
      prevY = clientY;
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

    document.addEventListener("pointermove", handlePointerMove, { passive: false });
    document.addEventListener("pointerup", handlePointerUp, { passive: false });
  };

  private setupEventListeners() {
    this.canvas.addEventListener("pointerdown", this.handlePointerDown, { passive: false });
    this.canvas.addEventListener("wheel", this.handleWheel, { passive: false });
  }
}

export default AvatarEditor;
