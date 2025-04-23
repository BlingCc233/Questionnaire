<template>
  <div class="home-container">
    <!-- 背景装饰元素 -->
    <div class="decoration-circle circle-1"></div>
    <div class="decoration-circle circle-2"></div>
    <div class="decoration-circle circle-3"></div>

    <!-- 主内容区 -->
    <transition name="fade-slide" appear>
      <div class="home-content">
        <h1 class="title">教师能力评估系统</h1>
        <p class="subtitle">请选择要填写的调查问卷</p>
        <div class="describe">
          <t-typography-paragraph
              :ellipsis="{ row: 2, expandable: true, collapsible: true }"
              style="font-size: .7em"
          >
            本问卷由华东师范大学数学科学学院“卓越师范生培养目标达成评价方法探索与实践”项目组设计，面向毕业三到五年的卓越师范生代表开展调研，旨在基于《师范类专业认证标准》及“一践行三学会”（践行师德、学会教学、学会育人、学会发展）框架，量化评估卓越师范生培养目标在师德表现、教学能力、育人成效及专业发展四大维度的实际达成情况，并收集多方反馈数据，为优化师范生培养方案、改进教育实践提供科学依据，助力构建动态化、持续完善的师范教育体系。问卷最终解释权归项目组所有。            </t-typography-paragraph>
        </div>

        <div class="nav-cards">
          <transition-group name="staggered-fade" tag="div" appear>
            <div
                v-for="(item, index) in navItems"
                :key="item.name"
                class="nav-card"
                :style="{ 'transition-delay': `${index * 0.1}s` }"
                @click="navigateTo(item.path)"
            >
              <div class="card-icon">
                <i :class="getIconClass(index)"></i>
              </div>
              <h3 class="card-title">
                <!-- 普通部分 -->
                {{ item.titlePrefix }}
                <!-- 高亮部分（如果存在） -->
                <span v-if="item.highlight" class="highlight">
                  {{ item.highlight }}
                </span>
                <!-- 后面的部分 -->
                {{ item.titleSuffix }}
              </h3>
              <p class="card-desc">点击进入问卷</p>
              <div class="card-hover-effect"></div>
            </div>
          </transition-group>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { useRouter } from 'vue-router'

export default {
  name: 'HomeView',
  setup() {
    const router = useRouter()
    /*
      注意：这里拆分了标题文字，便于在模板中定制高亮。
      例如，对于“教师道德素养调查问卷”，我们将 titlePrefix 设为 “教师”，
      highlight 设为 “道德素养”，titleSuffix 设为 “调查问卷”。
    */
    const navItems = [
      {
        path: '/sub1',
        name: 'sub1',
        titlePrefix: '教师',
        highlight: '道德素养',
        titleSuffix: '调查问卷'
      },
      {
        path: '/sub2',
        name: 'sub2',
        titlePrefix: '教师',
        highlight: '教学能力',
        titleSuffix: '调查问卷'
      },
      {
        path: '/sub3',
        name: 'sub3',
        // 如果没有特殊高亮，可全部作为普通部分
        titlePrefix: '教师',
        highlight: '育人能力',
        titleSuffix: '调查问卷'
      },
      {
        path: '/sub4',
        name: 'sub4',
        titlePrefix: '教师',
        highlight: '发展能力',
        titleSuffix: '调查问卷'
      }
    ]

    const navigateTo = (path) => {
      router.push(path)
    }

    const getIconClass = (index) => {
      const icons = [
        'fas fa-heart',
        'fas fa-chalkboard-teacher',
        'fas fa-hands-helping',
        'fas fa-chart-line'
      ]
      return icons[index % icons.length]
    }

    return {
      navItems,
      navigateTo,
      getIconClass
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap');
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');

.home-container {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  overflow: hidden;
  font-family: 'Noto Sans SC', sans-serif;
  padding: 2rem;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  z-index: 0;
}

.circle-1 {
  width: 300px;
  height: 300px;
  top: -100px;
  left: -100px;
}

.circle-2 {
  width: 500px;
  height: 500px;
  bottom: -200px;
  right: -200px;
  background: linear-gradient(45deg, rgba(100, 149, 237, 0.1) 0%, rgba(144, 238, 144, 0.1) 100%);
}

.circle-3 {
  width: 200px;
  height: 200px;
  top: 50%;
  right: 10%;
  background: rgba(255, 182, 193, 0.15);
}

.home-content {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  width: 100%;
  text-align: center;
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 1rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.subtitle {
  font-size: 1.2rem;
  color: #7f8c8d;
  margin-bottom: 1rem;
}

.nav-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  padding: 1rem;
}

.nav-card {
  position: relative;
  background: white;
  border-radius: 12px;
  padding: 2rem 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin: 1.2rem;
  z-index: 1;
}

.nav-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
}

.nav-card:hover .card-hover-effect {
  opacity: 1;
  transform: scale(1);
}

.card-icon {
  font-size: 2.5rem;
  color: #3498db;
  margin-bottom: 1.5rem;
}

.card-title {
  font-size: 1.2rem;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.card-desc {
  font-size: 0.9rem;
  color: #7f8c8d;
}

.card-hover-effect {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(52, 152, 219, 0.1) 0%, rgba(155, 89, 182, 0.1) 100%);
  opacity: 0;
  transform: scale(0.9);
  transition: all 0.3s ease;
  z-index: -1;
}

.describe {
  width: 50%;
  display: inline-flex;
}

/* 高亮样式 */
.highlight {
  color: #f56e80;
  font-weight: bold;
  text-shadow: 0 0px 3px rgba(234, 150, 150, 0.55);
}

/* 进入动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.5s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.staggered-fade-move,
.staggered-fade-enter-active,
.staggered-fade-leave-active {
  transition: all 0.5s ease;
}

.staggered-fade-enter-from,
.staggered-fade-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

.staggered-fade-leave-active {
  position: absolute;
}

@media (max-width: 768px) {
  .nav-cards {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .title {
    font-size: 2rem;
  }

  .subtitle {
    font-size: 1rem;
  }

  .describe {
    width: 80%;
  }
}
</style>
