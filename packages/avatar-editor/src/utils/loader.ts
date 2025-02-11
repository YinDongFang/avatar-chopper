export const loadImageURL = (
  url: string,
  crossOrigin?: string
): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    if (crossOrigin) {
      image.crossOrigin = crossOrigin;
    }
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
};

export const loadImageFile = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = e.target.result as string;
      } else {
        reject(new Error("Failed to load image file"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
