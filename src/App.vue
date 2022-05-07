<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";

interface TrailCell {
  px: number;
  py: number;
}

interface Snake {
  px: number;
  py: number;
  ax: number;
  ay: number;
  trail: TrailCell[];
  tail: number;
  vx: number;
  vy: number;
  volume: boolean;
  recType: "rect" | "circle";
}

const canvas = ref<HTMLCanvasElement | null>(null);
const ct = ref<CanvasRenderingContext2D | null>(null);

const snake = reactive<Snake>({
  px: 0,
  py: 0,
  trail: [],
  tail: 1,
  ax: 0,
  ay: 0,
  vx: 0,
  vy: 0,
  volume: true,
  recType: "rect",
});
let timer: number;
const colL = 20,
  rowL = 20;
const showDialog = ref(true);
const lastPlayTime = ref<number>(Date.now());
const gameInterval = computed<number>(() => {
  let div: number;
  if (snake.tail < 5) {
    div = 10;
  } else if (snake.tail < 10) {
    div = 15;
  } else if (snake.tail < 18) {
    div = 20;
  } else {
    div = 25;
  }
  return 1000 / div;
});

const snakeImgs = {
  logo: new Image(),
};
snakeImgs.logo.src = "logo.png";

const snakeAudios = {
  turn: new Audio("bip.mov"),
  eat: new Audio("eat.wav"),
  win: new Audio("success.mp3"),
  dead: new Audio("die.wav"),
};
snakeAudios.turn.volume = 0.2;
snakeAudios.dead.volume = 0.6;

const openVoices = () => {
  snake.volume = true;
  snakeAudios.turn.volume = 0.2;
  snakeAudios.dead.volume = 0.6;
  snakeAudios.eat.volume = 1;
  snakeAudios.win.volume = 1;
};

const closeVoices = () => {
  snake.volume = false;
  for (const [key, value] of Object.entries(snakeAudios)) {
    //@ts-ignore
    snakeAudios[key].volume = 0;
  }
};

function generateRandomInteger(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max + 1 - min));
}
function getRandomColor() {
  var letters = "0123456789ABCDEF";
  var color = "#";
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

const init = () => {
  update();
  draw();
  if (timer) {
    clearInterval(timer);
  }
  timer = setInterval(init, gameInterval.value);
};

const startGame = () => {
  snakeAudios.dead.pause();
  snakeAudios.dead.currentTime = 0;
  snake.px = snake.py = 0;
  snake.trail = [];
  snake.tail = 1;
  showDialog.value = false;
  snake.vx = 1;
  snake.vy = 0;
  snakeColors.value = [getRandomColor(), getRandomColor(), getRandomColor()];
  makeNewApple();

  snake.trail.push({
    px: 0,
    py: 0,
  });
  init();
};

const reset = () => {
  snakeAudios.dead.play();
  showDialog.value = true;
  clearInterval(timer);
};

const snakeColors = ref<[string, string, string]>([
  getRandomColor(),
  getRandomColor(),
  getRandomColor(),
]);

const makeNewApple = () => {
  snake.ax = generateRandomInteger(0, colL - 1);
  snake.ay = generateRandomInteger(0, rowL - 1);
};

const keyClicked = (e: KeyboardEvent) => {
  snakeAudios.turn.currentTime = 0;
  const date = Date.now();
  if (date - lastPlayTime.value < gameInterval.value) {
    return;
  }
  const validKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
  if (e.key === "ArrowUp" && snake.vy !== 1) {
    snake.vx = 0;
    snake.vy = -1;
  } else if (e.key == "ArrowDown" && snake.vy !== -1) {
    snake.vx = 0;
    snake.vy = 1;
  } else if (e.key == "ArrowLeft" && snake.vx !== 1) {
    snake.vx = -1;
    snake.vy = 0;
  } else if (e.key == "ArrowRight" && snake.vx !== -1) {
    snake.vx = 1;
    snake.vy = 0;
  }
  if (validKeys.includes(e.key)) {
    snakeAudios.turn.play();
  }
  lastPlayTime.value = date;
};

const update = () => {
  snake.px += snake.vx;
  snake.py += snake.vy;

  const bumped = snake.trail.findIndex(
    (cell) => cell.px === snake.px && cell.py === snake.py
  );
  if (bumped > -1) {
    return reset();
  }

  if (snake.px < 0) {
    snake.px = colL - 1;
  } else if (snake.px > colL - 1) {
    snake.px = 0;
  } else if (snake.py < 0) {
    snake.py = rowL - 1;
  } else if (snake.py > rowL - 1) {
    snake.py = 0;
  }
  if (snake.px === snake.ax && snake.py === snake.ay) {
    snake.tail++;
    snakeAudios.eat.play();
    makeNewApple();
  }

  snake.trail.push({
    px: snake.px,
    py: snake.py,
  });
  while (snake.trail.length > snake.tail) {
    snake.trail.shift();
  }
};
const draw = () => {
  if (canvas.value && ct.value) {
    const ctx = ct.value;
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);

    ctx.save();
    ctx.beginPath();
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = "#90A4AE";

    for (let i = 0; i <= colL; i++) {
      ctx.moveTo((canvas.value.width / colL) * i, 0);
      ctx.lineTo((canvas.value.width / colL) * i, canvas.value.height);
    }
    for (let i = 0; i <= rowL; i++) {
      ctx.moveTo(0, (canvas.value.height / rowL) * i);
      ctx.lineTo(canvas.value.width, (canvas.value.height / rowL) * i);
    }
    ctx.stroke();
    ctx.restore();

    ctx.font = "80px 'Rubik Wet Paint', cursive";
    ctx.fillText(
      ((snake.tail - 1) * 3).toString(),
      (canvas.value.width / colL) * (colL - 3),
      (canvas.value.height / rowL) * 3
    );

    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.drawImage(
      snakeImgs.logo,
      canvas.value.width - 100,
      canvas.value.height - 92,
      100,
      100
    );

    const direction = snake.vx == 1 || snake.vx == -1 ? "x" : "y";
    ctx.fillStyle = snakeColors.value[2];
    if (snake.recType == "rect") {
      ctx.fillRect(
        (snake.ax * canvas.value.width) / colL + 4,
        (snake.ay * canvas.value.height) / rowL + 4,
        canvas.value.width / colL - 8,
        canvas.value.height / rowL - 8
      );
    } else {
      ctx.beginPath();
      ctx.arc(
        (snake.ax * canvas.value.width) / colL +
          canvas.value.width / (colL * 2),
        (snake.ay * canvas.value.height) / rowL +
          canvas.value.height / (rowL * 2),
        direction === "x"
          ? canvas.value.width / (colL * 4)
          : canvas.value.height / (colL * 4),
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    snake.trail.forEach((t, i) => {
      if (canvas.value) {
        ctx.fillStyle =
          i == snake.trail.length - 1
            ? snakeColors.value[0]
            : snakeColors.value[1];
        if (snake.recType == "rect") {
          ctx.fillRect(
            (t.px * canvas.value.width) / colL + 4,
            (t.py * canvas.value.height) / rowL + 4,
            canvas.value.width / colL - 8,
            canvas.value.height / rowL - 8
          );
        } else {
          ctx.beginPath();
          ctx.arc(
            (t.px * canvas.value.width) / colL +
              canvas.value.width / (colL * 2),
            (t.py * canvas.value.height) / rowL +
              canvas.value.height / (rowL * 2),
            direction === "x"
              ? canvas.value.width / (colL * 4)
              : canvas.value.height / (colL * 4),
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
        window.addEventListener("keydown", keyClicked);
      }
    });
  }
};

const changeRecType = (type: Snake["recType"]) => {
  snake.recType = type;
};

onMounted(() => {
  if (canvas.value) {
    ct.value = canvas.value.getContext("2d");
  }
});
</script>

<template>
  <h1 class="text-center font-bold text-3xl tracking-widest font-paint mt-5">
    Snake Game
  </h1>
  <div
    class="
      container
      mx-auto
      flex flex-col
      items-center
      gap-5
      pt-10
      justify-center
    "
  >
    <canvas ref="canvas" class="bg-gray-200" height="600" width="900"></canvas>
    <div
      v-if="showDialog"
      class="
        w-[900px]
        h-[600px]
        bg-green-100
        absolute
        flex flex-col
        gap-y-6
        px:16
        md:px-80
        justify-center
        lg:px-82
      "
    >
      <img src="/snake.gif" alt="snake.png" />
      <div
        class="
          rounded-full
          self-center
          w-32
          h-32
          flex
          justify-center
          items-center
          bg-white
          text-6xl
          font-bold font-score
        "
        v-if="snake.tail > 1"
      >
        {{ (snake.tail - 1) * 3 }}
      </div>
      <div class="flex justify-around">
        <div
          @click="changeRecType('rect')"
          :class="
            snake.recType == 'rect'
              ? 'bg-green-300'
              : 'bg-white hover:bg-green-200 active:bg-green-300'
          "
          class="h-10 w-10 flex justify-center items-center cursor-pointer"
        >
          <span :class="snake.recType == 'rect' ? 'visible' : 'invisible'">
            ✔️
          </span>
        </div>
        <div
          @click="changeRecType('circle')"
          :class="
            snake.recType == 'circle'
              ? 'bg-green-300'
              : 'bg-white hover:bg-green-200 active:bg-green-300'
          "
          class="
            h-10
            w-10
            flex
            justify-center
            items-center
            rounded-full
            cursor-pointer
          "
        >
          <span :class="snake.recType == 'circle' ? 'visible' : 'invisible'">
            ✔️
          </span>
        </div>
      </div>
      <button
        type="button"
        class="
          px-5
          py-3
          font-medium
          bg-green-200
          rounded-md
          active:bg-green-600
          hover:bg-green-300
        "
        @click="startGame"
      >
        Start
      </button>

      <a
        href="https://github.com/cibilex/snake-game"
        class="self-center flex items-center gap-4"
        target="_blank"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="
            w-8
            h-8
            fill-gray-700
            hover:fill-gray-800
            duration-200
            active:fill-black
          "
          viewBox="0 0 496 512"
        >
          <!--! Font Awesome Pro 6.1.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. -->
          <path
            d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"
          />
        </svg>
        Cibilex
      </a>

      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-18 h-22 absolute left-5 top-0 cursor-pointer fill-green-400"
        viewBox="0 0 640 512"
        @click="closeVoices"
        v-if="snake.volume"
      >
        <!--! Font Awesome Pro 6.1.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. -->
        <path
          d="M412.6 182c-10.28-8.334-25.41-6.867-33.75 3.402c-8.406 10.24-6.906 25.35 3.375 33.74C393.5 228.4 400 241.8 400 255.1c0 14.17-6.5 27.59-17.81 36.83c-10.28 8.396-11.78 23.5-3.375 33.74c4.719 5.806 11.62 8.802 18.56 8.802c5.344 0 10.75-1.779 15.19-5.399C435.1 311.5 448 284.6 448 255.1S435.1 200.4 412.6 182zM473.1 108.2c-10.22-8.334-25.34-6.898-33.78 3.34c-8.406 10.24-6.906 25.35 3.344 33.74C476.6 172.1 496 213.3 496 255.1s-19.44 82.1-53.31 110.7c-10.25 8.396-11.75 23.5-3.344 33.74c4.75 5.775 11.62 8.771 18.56 8.771c5.375 0 10.75-1.779 15.22-5.431C518.2 366.9 544 313 544 255.1S518.2 145 473.1 108.2zM534.4 33.4c-10.22-8.334-25.34-6.867-33.78 3.34c-8.406 10.24-6.906 25.35 3.344 33.74C559.9 116.3 592 183.9 592 255.1s-32.09 139.7-88.06 185.5c-10.25 8.396-11.75 23.5-3.344 33.74C505.3 481 512.2 484 519.2 484c5.375 0 10.75-1.779 15.22-5.431C601.5 423.6 640 342.5 640 255.1S601.5 88.34 534.4 33.4zM301.2 34.98c-11.5-5.181-25.01-3.076-34.43 5.29L131.8 160.1H48c-26.51 0-48 21.48-48 47.96v95.92c0 26.48 21.49 47.96 48 47.96h83.84l134.9 119.8C272.7 477 280.3 479.8 288 479.8c4.438 0 8.959-.9314 13.16-2.835C312.7 471.8 320 460.4 320 447.9V64.12C320 51.55 312.7 40.13 301.2 34.98z"
        />
      </svg>

      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-16 h-16 absolute left-2 top-3 cursor-pointer fill-green-400"
        viewBox="0 0 320 512"
        v-else
        @click="openVoices"
      >
        <!--! Font Awesome Pro 6.1.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. -->
        <path
          d="M320 64v383.1c0 12.59-7.337 24.01-18.84 29.16C296.1 479.1 292.4 480 288 480c-7.688 0-15.28-2.781-21.27-8.094l-134.9-119.9H48c-26.51 0-48-21.49-48-47.1V208c0-26.51 21.49-47.1 48-47.1h83.84l134.9-119.9c9.422-8.375 22.93-10.45 34.43-5.259C312.7 39.1 320 51.41 320 64z"
        />
      </svg>
    </div>
  </div>
</template>

<style>
canvas {
  box-shadow: 0px 0px 0px 5px white, 0px 0px 100px 20px rgba(100, 181, 246, 0.4),
    0px 0px 100px 10px rgba(236, 64, 122, 0.4),
    0px 0px 100px 10px rgba(144, 164, 174, 0.4);
}
</style>
