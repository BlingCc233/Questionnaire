<template>
  <div ref="wordCloudContainer" class="word-cloud-container"></div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, watch } from 'vue';
import type { Question } from '../types/questionnaire';

declare const d3: any;

interface WordData {
  text: string;
  size: number;
  frequency: number;
}

export default defineComponent({
  name: 'WordCloud',
  props: {
    answers: {
      type: Object as () => Record<string, string>,
      required: true
    },
    questions: {
      type: Array as () => Question[],
      required: true
    }
  },
  setup(props) {
    const wordCloudContainer = ref<HTMLElement | null>(null);

    const colors = [
      "#2F4858", "#33658A", "#86BBD8", "#758E4F",
      "#F6AE2D", "#86BBD8", "#33658A", "#2F4858",
      "#758E4F", "#F6AE2D"
    ];

    const initWordCloud = () => {
      if (!wordCloudContainer.value) return;

      const width = wordCloudContainer.value.offsetWidth;
      const height = 400;

      d3.select(wordCloudContainer.value).selectAll("*").remove();

      d3.select(wordCloudContainer.value)
          .append("svg")
          .attr("width", width)
          .attr("height", height)
          .attr("viewBox", `0 0 ${width} ${height}`)
          .attr("preserveAspectRatio", "xMidYMid meet");
    };

    const updateWordCloud = () => {
      if (!wordCloudContainer.value) return;

      const wordFrequency: Record<string, number> = {};

      Object.entries(props.answers).forEach(([questionId, answerValue]) => {
        const question = props.questions.find(q => q.id === questionId);
        if (question) {
          const selectedOption = question.options.find(opt => opt.value === answerValue);
          if (selectedOption) {
            selectedOption.keywords.forEach(word => {
              wordFrequency[word] = (wordFrequency[word] || 0) + 1;
            });
          }
        }
      });

      const wordCloudData: WordData[] = Object.entries(wordFrequency).map(([text, frequency]) => {
        return {
          text,
          size: 10 + frequency * 8,
          frequency
        };
      });

      drawWordCloud(wordCloudData);
    };

    const drawWordCloud = (words: WordData[]) => {
      if (!wordCloudContainer.value) return;

      const width = wordCloudContainer.value.offsetWidth;
      const height = 400;

      d3.select(wordCloudContainer.value).selectAll("*").remove();

      const svg = d3.select(wordCloudContainer.value)
          .append("svg")
          .attr("width", width)
          .attr("height", height)
          .attr("viewBox", `0 0 ${width} ${height}`)
          .attr("preserveAspectRatio", "xMidYMid meet");

      if (words.length === 0) {
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height / 2)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .style("font-size", "20px")
            .style("fill", "#666")
            .text("回答问题后生成词云");
        return;
      }

      const layout = d3.layout.cloud()
          .size([width - 40, height - 40])
          .words(words.map(d => ({ text: d.text, size: d.size, frequency: d.frequency })))
          .padding(8)
          .rotate(() => 0)
          .spiral("archimedean")
          .font("Microsoft YaHei")
          .fontSize((d: WordData) => d.size)
          .on("end", (words: any[]) => {
            const cloud = svg.append("g")
                .attr("transform", `translate(${width/2},${height/2})`)
                .attr("class", "word-cloud");

            cloud.selectAll("text")
                .data(words)
                .enter()
                .append("text")
                .style("font-size", (d: any) => `${d.size}px`)
                .style("font-family", "Microsoft YaHei")
                .style("fill", (_: any, i: number) => colors[i % colors.length])
                .style("font-weight", (d: any) => d.frequency > 1 ? "bold" : "normal")
                .style("cursor", "default")
                .style("opacity", 0)
                .attr("text-anchor", "middle")
                .attr("transform", (d: any) => `translate(${d.x},${d.y})`)
                .text((d: any) => d.text)
                .transition()
                .duration(600)
                .style("opacity", (d: any) => d.frequency > 1 ? 1 : 0.7);
          });

      layout.start();
    };

    onMounted(() => {
      initWordCloud();
      updateWordCloud();
    });

    watch(() => props.answers, () => {
      updateWordCloud();
    }, { deep: true });

    return {
      wordCloudContainer
    };
  }
});
</script>

<style scoped>
.word-cloud-container {
  width: 100%;
  height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
