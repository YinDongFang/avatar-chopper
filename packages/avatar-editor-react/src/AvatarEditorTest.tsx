import React, { useRef, useEffect, useState } from "react";
import AvatarEditor from "../../avatar-editor/src/index";

const AvatarEditorTest: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const editorRef = useRef<AvatarEditor | null>(null);

  const [offset, setOffset] = useState<any>();
  const [scale, setScale] = useState<number>();

  useEffect(() => {
    editorRef.current?.setOptions({ offset, scale });
  }, [offset, scale]);

  useEffect(() => {
    if (canvasRef.current && !editorRef.current) {
      editorRef.current = new AvatarEditor(canvasRef.current, {
        image: "https://picsum.photos/1920/1080", // 使用1920x1080尺寸的图片
        size: 300,
        maxScale: 2,
        scale: 1.5,
        offset: { x: 100, y: 100 },
        onLoadSuccess: (image) => {
          console.log("Image loaded successfully:", image);
        },
        onLoadFailure: () => {
          console.error("Failed to load image");
        },
        onOffsetChange: (offset) => {
          console.log("Offset changed:", offset);
          setOffset(offset);
        },
        onScaleChange: (scale) => {
          console.log("Scale changed:", scale);
          setScale(scale);
        },
      });
    }

    // 清理函数
    return () => {
      editorRef.current?.destroy(); // 清理 editor 实例
      editorRef.current = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={1000}
      height={1000}
      style={{ width: "100%", height: "100%" }}
    />
  );
};

export default AvatarEditorTest;
