import { createApp } from "vue";
import AvatarCropper from "./AvatarCropper.vue";
import { createAvatarCropper } from "@avatar-cropper/core";

createAvatarCropper();

createApp(AvatarCropper).mount("#app"); 