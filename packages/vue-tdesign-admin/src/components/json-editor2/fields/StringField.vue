<template>
  <div class="string-field">
    <label :for="fieldId">{{ label }}<span v-if="required" class="required">*</span></label>
    <input
      :id="fieldId"
      type="text"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :placeholder="schema.placeholder || ''"
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
  modelValue: [String, Number],
  label: String,
  required: Boolean
})

defineEmits(['update:modelValue'])

const fieldId = `field-${Math.random().toString(36).substr(2, 9)}`
</script>

<style scoped>
.string-field {
  margin-bottom: 16px;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.required {
  color: #ff4444;
  margin-left: 4px;
}

.field-description {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}
</style>