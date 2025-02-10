import React, { useRef, useEffect } from "react";
import AvatarEditor from "../../avatar-editor/src/index";

const AvatarEditorTest: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const editor = new AvatarEditor(canvasRef.current, {
        image: "https://example.com/path/to/image.jpg", // 替换为实际图片URL
        size: 300,
        maxScale: 2,
        onLoadSuccess: (image) => {
          console.log("Image loaded successfully:", image);
        },
        onLoadFailure: () => {
          console.error("Failed to load image");
        },
        onOffsetChange: (offset) => {
          console.log("Offset changed:", offset);
        },
        onScaleChange: (scale) => {
          console.log("Scale changed:", scale);
        },
      });

      // 清理函数
      return () => {
        // 如果需要，可以在这里执行清理操作
      };
    }
  }, []);

  return <canvas ref={canvasRef} width={400} height={400} />;
};

export default AvatarEditorTest;
