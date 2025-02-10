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
  onLoadFailure: () => {},
  onLoadSuccess: () => {},
};

class AvatarEditor {
  private canvas: HTMLCanvasElement;
  private options: Required<AvatarEditorOptions> & AvatarEditorProps =
    defaultOptions;
  private image: HTMLImageElement | undefined;
  private _offset: Position = { x: 0, y: 0 };
  private _scale: number = 1;

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
      this.options.onLoadSuccess?.(image);
    } catch (error) {
      if (cancelled) return;
      this.options.onLoadFailure?.();
    }
  }

  private getContext() {
    const context = this.canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not get canvas context");
    }
    return context;
  }

  private getCenter() {
    const { position } = this.options;
    const { width, height } = this.canvas;
    return { x: width / 2 + position.x, y: height / 2 + position.y };
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

    const maxOffsetX = (renderWidth - size) / 2;
    const maxOffsetY = (renderHeight - size) / 2;

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

  // Draws a shape on a 2D context.
  private drawShape() {
    const { x, y } = this.getCenter();
    const context = this.getContext();
    const { shape, size } = this.options;
    if (shape === "rect") {
      context.rect(x - size / 2, y - size / 2, size, size);
    } else {
      const radius = size / 2;
      context.arc(x, y, radius, 0, Math.PI * 2);
    }
  }

  // Draws a "Rule of Three" grid on the canvas.
  private drawGrid() {
    const { x, y } = this.getCenter();
    const { gridWidth, gridColor, size } = this.options;

    if (gridColor || gridWidth) {
      const width = gridWidth || 1;
      const thirds = size / 3;

      const context = this.getContext();
      context.save();

      context.fillStyle = gridColor || "#fff";
      context.beginPath();
      // vertical bars
      context.fillRect(x - thirds * 0.5, y - thirds * 1.5, width, size);
      context.fillRect(x + thirds * 0.5, y - thirds * 1.5, width, size);
      // horizontal bars
      context.fillRect(x - thirds * 1.5, y - thirds * 0.5, size, width);
      context.fillRect(x - thirds * 1.5, y + thirds * 0.5, size, width);
      context.fill();

      context.globalCompositeOperation = "destination-in";

      context.beginPath();
      this.drawShape();
      context.fill();

      context.restore();
    }
  }

  private drawBorder() {
    const { borderColor, borderWidth } = this.options;

    if (borderColor || borderWidth) {
      const context = this.getContext();
      context.save();

      context.strokeStyle = borderColor || "#fff";
      context.lineWidth = borderWidth || 1;
      context.beginPath();
      this.drawShape();
      context.stroke();

      context.restore();
    }
  }

  private drawImage() {
    if (!this.image?.width || !this.image?.height) return;

    const { x: cx, y: cy } = this.getCenter();
    const { x: deltaX, y: deltaY } = this.getLimitOffset();
    const { width, height } = this.getSize();

    const context = this.getContext();
    context.save();
    context.globalCompositeOperation = "destination-over";
    const x = (cx + deltaX - 0.5) * width;
    const y = (cy + deltaY - 0.5) * height;
    context.drawImage(this.image, x, y, width, height);
    context.restore();
  }

  private paint() {
    const { maskColor, pixelRatio } = this.options;

    const context = this.getContext();
    context.save();
    context.scale(pixelRatio, pixelRatio);
    context.translate(0, 0);

    // draw grid
    this.drawGrid();

    // draw black mask
    context.save();
    context.fillStyle = maskColor;
    context.beginPath();
    this.drawShape();
    context.rect(0, 0, this.canvas.width, this.canvas.height);
    context.fill("evenodd");
    context.restore();

    // draw border
    this.drawBorder();

    //draw image
    this.drawImage();

    context.restore();
  }

  private setupEventListeners() {
    const onPointerDown = (e: PointerEvent) => {
      const prevX = e.clientX;
      const prevY = e.clientY;

      const onPointerMove = (e: PointerEvent) => {
        if (!this.image?.width || !this.image?.height) return;
        e.preventDefault();
        const { clientX, clientY } = e;

        const offset = this.getLimitOffset();
        const scale = this.getLimitScale();

        // calculate offset
        const deltaX = (clientX - prevX) / scale;
        const deltaY = (clientY - prevY) / scale;
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
      const onPointerUp = () => {
        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", onPointerUp);
      };
      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
    };
    this.canvas.addEventListener("pointerdown", onPointerDown);
  }
}

export default AvatarEditor;
