<template>
  <div class="va-catalog">
    <section
      v-for="group in grouped"
      :key="group.category.id"
      class="va-category"
      :aria-labelledby="`category-${group.category.id}`"
    >
      <div>
        <h2 :id="`category-${group.category.id}`">{{ group.category.label }}</h2>
        <p>{{ group.category.description }}</p>
      </div>
      <div class="va-algorithm-list">
        <a
          v-for="algorithm in group.algorithms"
          :key="algorithm.slug"
          class="va-algorithm-link"
          :href="`/visual-algorithms/${algorithm.slug}/`"
        >
          <strong>{{ algorithm.title }}</strong>
          <span>{{ algorithm.summary }}</span>
        </a>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { getAlgorithmsByCategory } from "../data/catalog";

const grouped = getAlgorithmsByCategory();
</script>
