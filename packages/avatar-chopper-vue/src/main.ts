import { createApp } from "vue";
import AvatarEditor from "./AvatarEditor.vue";
import { createAvatarEditor } from "avatar-chopper";

createAvatarEditor();

createApp(AvatarEditor).mount("#app"); 