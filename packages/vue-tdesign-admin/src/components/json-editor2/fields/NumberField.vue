<template>
  <div class="number-field">
    <label :for="fieldId">{{ label }}<span v-if="required" class="required">*</span></label>
    <input
      :id="fieldId"
      type="number"
      :value="modelValue"
      @input="$emit('update:modelValue', parseFloat($event.target.value) || 0)"
      :min="schema.minimum"
      :max="schema.maximum"
      :step="schema.type === 'integer' ? 1 : 0.01"
      class="form-control"
    />
    <div v-if="schema.description" class="field-description">
      {{ schema.description }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  schema: Object,
  modelValue: Number,
  label: String,
  required: Boolean
})

defineEmits(['update:modelValue'])

const fieldId = `field-${Math.random().toString(36).substr(2, 9)}`
</script>