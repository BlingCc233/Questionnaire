<template>
  <div class="container mt-5">
    <h1 class="text-center mb-4">{{$route.meta.title}}</h1>

    <div class="row">
      <div class="col-md-8">
        <form @submit.prevent="submitForm">
          <div class="section mb-4">
            <div
                v-for="(question, index) in questions4"
                :key="question.id"
                class="question mb-3"
                :class="{ 'unanswered': !isQuestionAnswered(question) && showValidation }"
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
                      :type="question.multiple ? 'checkbox' : 'radio'"
                      :name="question.id"
                      :value="option.value"
                      v-model="answers[question.id]"
                      @change="handleAnswerChange(question, $event)"
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
            <WordCloud :answers="answers" :questions="questions4" />
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
import {type Question, questions4} from '../types/questionnaire';
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
    const answers = reactive<Record<string, string | string[]>>({});
    const showValidation = ref(false);
    const modalVisible = ref(false);
    const modalTitle = ref('提示');
    const modalMessage = ref('这里是消息内容');
    const firstUnansweredQuestionId = ref('');
    const router = useRouter();

    const isQuestionAnswered = (question: Question) => {
      const answer = answers[question.id];
      if (question.multiple) {
        return Array.isArray(answer) && answer.length > 0;
      }
      return answer !== undefined && answer !== '';
    };

    const handleAnswerChange = (question: Question, event: Event) => {
      if (!question.multiple) return;

      const target = event.target as HTMLInputElement;
      const value = target.value;
      const currentAnswers = Array.isArray(answers[question.id])
          ? [...(answers[question.id] as string[])]
          : [];

      if (target.checked) {
        if (!currentAnswers.includes(value)) {
          currentAnswers.push(value);
        }
      } else {
        const index = currentAnswers.indexOf(value);
        if (index > -1) {
          currentAnswers.splice(index, 1);
        }
      }

      answers[question.id] = currentAnswers;
    };

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
      const unansweredQuestions = questions4.filter(q => !isQuestionAnswered(q));

      if (unansweredQuestions.length > 0) {
        firstUnansweredQuestionId.value = unansweredQuestions[0].id;
        scrollToUnansweredQuestion();
        MessagePlugin.error('有问题尚未作答');
        return;
      }

      console.log('提交的数据:', answers);
      dataManager.saveData('sub3', answers);
      MessagePlugin.success('提交成功');
      router.push('/')
    };

    return {
      questions4,
      answers,
      showValidation,
      modalVisible,
      modalTitle,
      modalMessage,
      isQuestionAnswered,
      handleAnswerChange,
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
