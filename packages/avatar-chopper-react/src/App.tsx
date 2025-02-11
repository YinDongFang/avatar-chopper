import AvatarChopper from "./AvatarChopper";

function App() {
  return <AvatarChopper
    width={1000}
    height={1000}
    props={{
      image: "https://picsum.photos/1920/1080", // 使用1920x1080尺寸的图片
      size: 300,
      maxScale: 2,
    }}
    style={{
      width: "100%", height: "100%",
    }}
  />
}

export default App;
