export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(value, min));
};

export const clamp2 = (value: Position, range: Position) => {
  return {
    x: clamp(value.x, -range.x, range.x),
    y: clamp(value.y, -range.y, range.y),
  };
};

export const scale = ({ width, height }: Size, scale: number) => {
  return { width: width * scale, height: height * scale };
};

export const cover = ({ width, height }: HTMLImageElement, size: number) => {
  // Calculate the cover size
  const aspectRatio = width / height;
  let renderWidth, renderHeight;

  if (aspectRatio > 1) {
    // Landscape
    renderWidth = size * aspectRatio;
    renderHeight = size;
  } else {
    // Portrait or square
    renderWidth = size;
    renderHeight = size / aspectRatio;
  }
  return { width: renderWidth, height: renderHeight };
};
