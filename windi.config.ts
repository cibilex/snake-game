import { defineConfig } from "windicss/helpers";

export default defineConfig({
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        paint: ["'Press Start 2P', cursive"],
        score:["'Rubik Wet Paint', cursive"]
      },
    },
  },
});
