import { createApp } from "vue";
import AvatarChopper from "./AvatarChopper.vue";
import { createAvatarChopper } from "avatar-chopper";

createAvatarChopper();

createApp(AvatarChopper).mount("#app"); 