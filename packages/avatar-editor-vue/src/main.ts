import { createApp } from "vue";
import AvatarEditor from "./AvatarEditor.vue";
import { createAvatarEditor } from "avatar-editor";

createAvatarEditor();

createApp(AvatarEditor).mount("#app"); 