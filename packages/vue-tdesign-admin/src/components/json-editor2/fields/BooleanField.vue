<template>
  <div class="boolean-field">
    <label class="checkbox-label">
      <input
        type="checkbox"
        :checked="modelValue"
        @change="$emit('update:modelValue', $event.target.checked)"
      />
      <span>{{ label }}<span v-if="required" class="required">*</span></span>
    </label>
    <div v-if="schema.description" class="field-description">
      {{ schema.description }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  schema: Object,
  modelValue: Boolean,
  label: String,
  required: Boolean
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
</style>