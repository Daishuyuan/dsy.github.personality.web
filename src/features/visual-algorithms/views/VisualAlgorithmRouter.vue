<template>
  <component :is="component" />
</template>

<script setup lang="ts">
import { computed } from "vue";
import BasketballView from "./BasketballView.vue";
import CellWarView from "./CellWarView.vue";
import CircleCenterView from "./CircleCenterView.vue";
import CraneView from "./CraneView.vue";
import CuteBoxView from "./CuteBoxView.vue";
import EscapePathfindingView from "./EscapePathfindingView.vue";
import IpAddressSplitView from "./IpAddressSplitView.vue";
import LakeCountingView from "./LakeCountingView.vue";
import PerfectWorldView from "./PerfectWorldView.vue";
import ThreeJsPlaygroundView from "./ThreeJsPlaygroundView.vue";

const props = defineProps<{
  slug: string;
}>();

const componentMap = {
  "cute-box": CuteBoxView,
  basketball: BasketballView,
  "cell-war": CellWarView,
  "perfect-world": PerfectWorldView,
  "three-js-playground": ThreeJsPlaygroundView,
  "circle-center": CircleCenterView,
  crane: CraneView,
  "lake-counting": LakeCountingView,
  "escape-pathfinding": EscapePathfindingView,
  "ip-address-split": IpAddressSplitView
};

const component = computed(() => componentMap[props.slug as keyof typeof componentMap]);
</script>
