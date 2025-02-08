import { createApp } from "vue";
import { createAvatarEditor } from "avatar-editor";

createAvatarEditor();

const App = {
  template: `<div>Vue Avatar Editor Demo</div>`,
};

createApp(App).mount("#app");
