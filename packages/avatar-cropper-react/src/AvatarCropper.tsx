import React, { useRef, useEffect } from "react";
import Cropper, { AvatarCropperOptions } from "@avatar-cropper/core";

type AvatarCropperProps = {
  props?: AvatarCropperOptions;
} & React.CanvasHTMLAttributes<HTMLCanvasElement>;

const AvatarCropper: React.FC<AvatarCropperProps> = ({ props, ...restProps }: AvatarCropperProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const editorRef = useRef<Cropper | null>(null);

  useEffect(() => {
    if (canvasRef.current && !editorRef.current) {
      editorRef.current = new Cropper(canvasRef.current, { ...props });

      return () => {
        editorRef.current?.destroy();
        editorRef.current = null;
      };
    }
  }, []);

  return (
    <canvas ref={canvasRef} {...restProps} />
  );
};

export default AvatarCropper;
