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
              <h3 class="card-title">{{ item.meta.title }}</h3>
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

    const navItems = [
      {
        path: '/sub1',
        name: 'sub1',
        meta: {
          title: '教师道德素养调查问卷'
        }
      },
      {
        path: '/sub2',
        name: 'sub2',
        meta: {
          title: '教师教学能力调查问卷'
        }
      },
      {
        path: '/sub3',
        name: 'sub3',
        meta: {
          title: '教师育人能力调查问卷'
        }
      },
      {
        path: '/sub4',
        name: 'sub4',
        meta: {
          title: '教师发展能力调查问卷'
        }
      }
    ]

    const navigateTo = (path) => {
      router.push(path)
    }

    const getIconClass = (index) => {
      const icons = ['fas fa-heart', 'fas fa-chalkboard-teacher', 'fas fa-hands-helping', 'fas fa-chart-line']
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
/* 这里保持和之前完全相同的CSS样式 */
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
  margin-bottom: 3rem;
}

.nav-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
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
}
</style>
