import {createRouter, createWebHistory} from 'vue-router';


const routes = [
    {
        path: '/',
        component: () => import('../views/home.vue'),
        meta: {
            title: '教师调查问卷'
        },
    },
    {
        path: '/404',
        component: import('../views/404.vue'),
        name: 'NotFound',
        meta: {
            title: '404',
        },
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/404',
        meta: {
            title: '404',
        },
    },
    {
        path: '/sub1',
        name: 'sub1',
        component: () => import('../views/sub1.vue'),
        meta: {
            title: '教师道德素养调查问卷'
        },
    },
    {
        path: '/sub2',
        name: 'sub2',
        component: () => import('../views/sub2.vue'),
        meta: {
            title: '教师教学能力调查问卷'
        },
    },
    {
        path: '/sub3',
        name: 'sub3',
        component: () => import('../views/sub3.vue'),
        meta: {
            title: '教师育人能力调查问卷'
        },
    },
    {
        path: '/sub4',
        name: 'sub4',
        component: () => import('../views/sub4.vue'),
        meta: {
            title: '教师发展能力调查问卷'
        },
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach((to, from, next) => {
    document.title = to.meta.title;
    next();
});

export default router;
