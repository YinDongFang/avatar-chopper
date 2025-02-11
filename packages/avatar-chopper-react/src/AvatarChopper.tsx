import React, { useRef, useEffect } from "react";
import Chopper, { AvatarChopperOptions } from "../../avatar-chopper/src/index";

type AvatarChopperProps = {
  props?: AvatarChopperOptions;
} & React.CanvasHTMLAttributes<HTMLCanvasElement>;

const AvatarChopper: React.FC<AvatarChopperProps> = ({ props, ...restProps }: AvatarChopperProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const editorRef = useRef<Chopper | null>(null);

  useEffect(() => {
    if (canvasRef.current && !editorRef.current) {
      editorRef.current = new Chopper(canvasRef.current, { ...props });

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

export default AvatarChopper;
