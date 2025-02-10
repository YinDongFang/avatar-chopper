import React, { useRef, useEffect } from "react";
import AvatarEditor from "../../avatar-editor/src/index";

const AvatarEditorTest: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const editorRef = useRef<AvatarEditor | null>(null);

  useEffect(() => {
    if (canvasRef.current && !editorRef.current) {
      editorRef.current = new AvatarEditor(canvasRef.current, {
        image: "https://picsum.photos/1920/1080", // 使用1920x1080尺寸的图片
        size: 300,
        maxScale: 2,
        scale: 2,
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
    }

    // 清理函数
    return () => {
      editorRef.current = null; // 清理 editor 实例
    };
  }, []);

  return <canvas ref={canvasRef} width={400} height={400} />;
};

export default AvatarEditorTest;
