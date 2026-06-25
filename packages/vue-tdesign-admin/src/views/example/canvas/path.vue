<script setup lang="ts">
import { onMounted, ref, shallowRef, reactive, watch, computed } from 'vue'
import { Path2D } from './lib/Path2D'
import { PathStroke } from './lib/PathStroke'
import { arcToCubic, arcToOval, ellipseToCubics, normalizeAngles } from './lib/Arc'
function degToRad(deg: number) { return deg * Math.PI / 180 }

const canvas = shallowRef<HTMLCanvasElement>()

interface TestCase {
  key: string
  label: string
  params: Record<string, ParamDef>
  draw: (ctx: CanvasRenderingContext2D, p: Record<string, any>) => void
}

</script>

<template>
  <div class="flex">
     <div class="flex-1">
      <canvas ref="nativeCanvas"></canvas>
     </div>
     <div class="flex-1">
       <canvas ref="pathCanvas"></canvas>
     </div>
  </div>
  
</template>
