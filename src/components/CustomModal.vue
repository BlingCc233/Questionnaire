<template>
  <div v-if="visible" class="custom-modal">
    <div class="custom-modal-content">
      <h5>{{ title }}</h5>
      <p>{{ message }}</p>
      <div class="custom-modal-footer">
        <button class="custom-modal-btn" @click="onConfirm">确定</button>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'CustomModal',
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    title: {
      type: String,
      default: '提示'
    },
    message: {
      type: String,
      default: '这里是消息内容'
    }
  },
  emits: ['confirm'],
  setup(props, { emit }) {
    const onConfirm = () => {
      console.log('确认操作:', props.title, props.message); // 使用 props 示例
      emit('confirm');
    };

    return {
      onConfirm
    };
  }
});
</script>
