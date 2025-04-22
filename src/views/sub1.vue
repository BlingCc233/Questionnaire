<template>
  <div class="container mt-5">
    <h1 class="text-center mb-4">{{$route.meta.title}}</h1>

    <div class="row">
      <div class="col-md-8">
        <form @submit.prevent="submitForm">
          <div class="section mb-4">
            <div
                v-for="(question, index) in questions1"
                :key="question.id"
                class="question mb-3"
                :class="{ 'unanswered': !answers[question.id] && showValidation }"
                :id="`${question.id}-container`"
            >
              <p>{{ (index + 1) + '. ' + question.text }}</p>
              <div
                  v-for="option in question.options"
                  :key="option.value"
                  class="form-check"
              >
                <label class="form-check-label">
                  <input
                      class="form-check-input"
                      type="radio"
                      :name="question.id"
                      :value="option.value"
                      v-model="answers[question.id]"
                  >
                  {{ option.value + '. ' + option.text }}
                </label>
              </div>
            </div>

            <button type="submit" class="btn btn-primary">提交问卷</button>
          </div>
        </form>
      </div>

      <div class="col-md-4">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">词云分析</h5>
            <WordCloud :answers="answers" :questions="questions1" />
          </div>
        </div>
      </div>
    </div>
  </div>

  <CustomModal
      v-model:visible="modalVisible"
      :title="modalTitle"
      :message="modalMessage"
      @confirm="modalVisible = false"
  />
</template>

<script lang="ts">
import { defineComponent, reactive, ref } from 'vue';
import { questions1 } from '../types/questionnaire';
import type { Answers } from '../types/questionnaire';
import WordCloud from '../components/WordCloud.vue';
import CustomModal from '../components/CustomModal.vue';
import {MessagePlugin} from 'tdesign-vue-next';
import dataManager from '../utils/dataManager';
import { useRouter } from 'vue-router';

export default defineComponent({
  name: 'App',
  components: {
    WordCloud,
    CustomModal
  },
  setup() {
    const answers = reactive<Answers>({});
    const showValidation = ref(false);
    const modalVisible = ref(false);
    const modalTitle = ref('提示');
    const modalMessage = ref('这里是消息内容');
    const firstUnansweredQuestionId = ref('');
    const router = useRouter();

    const showModal = (title: string, message: string) => {
      modalTitle.value = title;
      modalMessage.value = message;
      modalVisible.value = true;
    };

    const scrollToUnansweredQuestion = () => {
      if (firstUnansweredQuestionId.value) {
        const element = document.getElementById(`${firstUnansweredQuestionId.value}-container`);
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }
    };

    const submitForm = () => {
      showValidation.value = true;
      firstUnansweredQuestionId.value = '';

      // 检查所有问题是否已回答
      const unansweredQuestions = questions1.filter(q => !answers[q.id]);

      if (unansweredQuestions.length > 0) {
        firstUnansweredQuestionId.value = unansweredQuestions[0].id;
        scrollToUnansweredQuestion();
        // showModal('提交失败', '请回答所有问题后再提交！未回答的问题已用红色高亮显示。');
        MessagePlugin.error('有问题尚未作答');

        return;
      }

      console.log('提交的数据:', answers);

      // 这里可以添加数据保存逻辑
      // dataManager.saveData('index', answers);
      dataManager.saveData('index', answers);

      // 显示成功消息
      MessagePlugin.success('提交成功');
      router.push('/')

      // showModal('提交成功', '问卷已成功提交！感谢您的参与。');

      // 重置表单
      // Object.keys(answers).forEach(key => {
      //   answers[key] = '';
      // });
      // showValidation.value = false;
    };

    return {
      questions1,
      answers,
      showValidation,
      modalVisible,
      modalTitle,
      modalMessage,
      submitForm,
      showModal
    };
  }
});
</script>

<style>
@import 'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css';

.unanswered {
  background-color: rgba(255, 0, 0, 0.1);
  border-left: 3px solid red;
  padding-left: 10px;
  transition: all 0.3s;
}
</style>
