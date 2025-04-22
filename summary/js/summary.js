// 问卷标题映射
const questionnaireTitles = {
    'index': '道德品质问卷',
    'sub1': '教学技能问卷',
    'sub2': '育人能力问卷',
    'sub3': '发展能力问卷'
};

// 日期筛选变量
let startDate = null;
let endDate = null;
let filteredData = [];

// 格式化日期
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// 创建数据表格
function createDataTable(data) {
    const table = document.createElement('table');
    table.className = 'table table-striped table-hover';

    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>问卷类型</th>
            <th>提交时间</th>
            <th>操作</th>
        </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    data.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${questionnaireTitles[item.type]}</td>
            <td>${formatDate(item.timestamp)}</td>
            <td>
                <button class="btn btn-sm btn-info" data-index="${index}">查看详情</button>
                <button class="btn btn-sm btn-danger" data-index="${index}">删除数据</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    // Attach event listeners after table is created
    table.querySelectorAll('.btn-info').forEach(button => {
        button.addEventListener('click', async () => {
            const index = parseInt(button.getAttribute('data-index'), 10);
            await showAnswers(index);
        });
    });

    table.querySelectorAll('.btn-danger').forEach(button => {
        button.addEventListener('click', async () => {
            // 弹出确认删除的对话框
            if (!confirm("确定删除吗？")) {
                return; // 如果用户取消，则不执行删除操作
            }
            // 获取要删除的记录的索引
            const index = parseInt(button.getAttribute('data-index'), 10);
            // 执行删除操作
            await clearDT(index);
            // 删除完成后刷新页面
            window.location.reload();
        });
    });


    return table;
}

async function clearDT(index){
    const data = await getCurrentData();
    const item = data[index];
    await dataManager.clearData(item.type, item.timestamp);
}

// 显示答案详情
async function showAnswers(index) {
    const data = await getCurrentData();
    const item = data[index];

    const processedAnswers = {};
    for (const [key, value] of Object.entries(item.answers)) {
        const questionKey = key.replace(/[A-Z]$/, '');
        if (!processedAnswers[questionKey]) processedAnswers[questionKey] = [];
        if (Array.isArray(value)) {
            processedAnswers[questionKey] = processedAnswers[questionKey].concat(value);
        } else {
            processedAnswers[questionKey].push(value);
        }
    }

    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'answersModal';
    modal.setAttribute('tabindex', '-1');
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">${questionnaireTitles[item.type]} - 答案详情</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <strong>提交时间：</strong> ${formatDate(item.timestamp)}
                    </div>
                    <div class="answers-list">
                        ${Object.entries(item.answers).map(([question, answer]) => `
                            <div class="mb-3">
                                <strong>问题 ${question.replace(/[A-Za-z]+/, '')}：</strong>
                                <div class="answer-content">
                                    选项: ${answer}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();

    modal.addEventListener('hidden.bs.modal', function() {
        document.body.removeChild(modal);
    });
}
// 导出数据
async function exportData() {
    const data = await getCurrentData();
    if (data.length === 0) {
        alert('暂无数据可导出！');
        return;
    }

    const exportData = data.map(item => ({
        问卷类型: questionnaireTitles[item.type],
        提交时间: formatDate(item.timestamp),
        ...item.answers
    }));

    const csv = convertToCSV(exportData);
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);

    let filename = '问卷数据';
    if (startDate) {
        const formattedStartDate = new Date(startDate).toISOString().split('T')[0];
        filename += `_从${formattedStartDate}`;
    }
    if (endDate) {
        const formattedEndDate = new Date(endDate).toISOString().split('T')[0];
        filename += `_至${formattedEndDate}`;
    }
    filename += `_${formatDate(Date.now())}.csv`;

    link.download = filename;
    link.click();
}
// 清除数据
async function clearData() {
    if (confirm('确定要清除所有问卷数据吗？此操作不可恢复。')) {
        dataManager.clearAllData(); // Assuming clearAllData is sync; if async, await it
        await updateDisplay();
        alert('所有数据已清除！');
    }
}

// 更新显示
async function updateDisplay() {
    console.log('Updating display...');
    const data = await getCurrentData();
    console.log('Data:', data);
    const dataTable = document.getElementById('dataTable');
    dataTable.innerHTML = '';

    if (data.length === 0) {
        dataTable.innerHTML = '<p class="text-center">暂无数据</p>';
        return;
    }

    dataTable.appendChild(createDataTable(data));
    updateAllCharts();
}

// 将数据转换为CSV格式
function convertToCSV(data) {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const rows = data.map(item =>
        headers.map(header => {
            const value = item[header];
            // 处理值，如果是字符串且包含逗号，则加引号
            return typeof value === 'string' && value.includes(',') ?
                `"${value}"` : (value === undefined ? '' : value);
        }).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
}

// 页面加载时显示数据
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM content loaded, initializing...');
    updateDisplay();
});

// 下面是新增的统计图表相关函数

// 统计图表的全局变量
let typeChart, timeChart, questionChart;
const chartColors = [
    'rgba(54, 162, 235, 0.7)',
    'rgba(255, 99, 132, 0.7)',
    'rgba(255, 206, 86, 0.7)',
    'rgba(75, 192, 192, 0.7)',
    'rgba(153, 102, 255, 0.7)',
    'rgba(255, 159, 64, 0.7)',
    'rgba(199, 199, 199, 0.7)',
    'rgba(83, 102, 255, 0.7)',
    'rgba(40, 159, 64, 0.7)',
    'rgba(210, 199, 199, 0.7)'
];

// 问题标题映射
const questionTitles = {
  'index': {
        'q1': '1. 在您的教学过程中，您如何将世界观与国家观融入到课程内容和教学方法中？',
        'q2': '2. 如果您发现有校外力量试图在您的班级中公开质疑国家政策或传播与社会主义核心价值观不符的思想，您会怎么做？',
        'q3': '3. 假设您所在的学校要组织一次关于国家历史和文化的主题教育活动，您打算如何参与？',
        'q4': '4. 您发现学生在课后使用社交媒体对他人进行网络欺凌，您会怎么做？',
        'q5': '5. 作为一名教师，您在批改学生的期末试卷时，发现一名平时表现优异的学生在试卷中有明显的抄袭行为。您知道这名学生非常渴望得到好成绩，以获得即将到来的奖学金。根据学校的规章制度，抄袭行为会导致该学生本门课程成绩作废，并可能影响其奖学金资格。在这种情况下，您会采取以下哪种行动？',
        'q6': '6. 面对复杂的社会思潮和网络环境，当学校政策或决策与您的个人教学理念不符时，您会如何应对？',
        'q7': '7. 您如何在日常教学中体现对学生的仁爱之心？',
        'q8': '8. 作为教师，您在教学过程中如何培养自己对不同学习风格学生的敏感性和适应性？',
        'q9': '9. 您在社交媒体上发表个人意见时，如何平衡个人表达和教师身份之间的关系？',
        'q10': '10. 当您的个人生活压力增大，影响到您的教学情绪和表现时，您会如何处理？'
    },
    'sub1': {
        'q1': '1. 您在设计教学计划时，对于培养学生成为全面发展的人这一目标，以下哪种情况最符合您的想法？',
        'q2': '2. 在一次新的课程单元开始时，您会怎么做？',
        'q3': '3. 在设计教学目标时，您通常会：',
        'q4': '4. 您在组织教学内容时：',
        'q5': '5. 在教学中，您有用到人工智能工具吗？如果用到了您是如何利用人工智能工具来优化教学过程？',
        'q6': '6. 在开始一节新课时，您会怎么做？',
        'q7': '7. 在小组讨论知识点时，您发现一个小组讨论气氛很热烈，但偏离了主题，您会怎么做？',
        'q8': '8. 在一节课上，您原计划让学生在课堂上完成作业，但临近下课还有很多学生没完成，您会怎么做？',
        'q9': '9. 在开学初，您向学生宣布了课堂发言规则：先举手，得到允许后再发言。但在课堂上，有一位成绩优秀的学生经常未经允许就发言，您会怎么做？',
        'q10': '10. 课堂上两位学生因为一个问题发生了争吵，您会怎么处理？',
        'q11': '11. 在批改实验报告时，您最注重学生的什么能力？',
        'q12': '12. 在批改学生作业时，您通常会怎么做？',
        'q13': '13. 在结束一堂课后，关于自己的教学，您通常会：',
        'q14': '14. 如果发现大部分学生对某个知识点理解不够好，您会采取什么措施？'
    },
    'sub2': {
        'q1': '1. 在您的教学实践中，以下哪种做法既最能体现您对社会主义核心价值观的传播和学生对社会责任感、集体荣誉感的培养，又能较好地整合和应用教育学原理、教育心理学和法律法规的相关知识呢？',
        'q2': '2. 在您的教学实践中，综合考虑以下几个方面：一是如何运用教育相关理论知识，二是怎样确保自己在所教学科领域的专业知识精通并有效指导学生深入学习，三是能否融合不同学科知识促进学生全面学习。请根据您的实际教学情况，选择最符合的选项：',
        'q3': '3. 在您的教学实践中，综合考虑学生考试焦虑辅导、沟通技巧运用、价值观引导以及教育观念方法更新等方面，您认为自己在以下哪种情况表现最为突出？',
        'q4': '4. 在您的教学实践中，从学生考试焦虑辅导、与学生及家长等沟通、引导学生价值观以及教育观念方法更新这四个维度出发，您认为自己目前最需要改进的是哪一方面？',
        'q5': '5. 在您的教学实践中，您如何处理学生个体差异并支持学生成长？请选择最符合您做法的选项：',
        'q6': '6. 在教育过程中，您如何处理学生的提问和遇到的困难？请选择最符合您实际情况的选项：',
        'q7': '7. 在处理学生问题时，您如何与家长协同合作，共同促进学生的改变和进步？',
        'q8': '8. 在您的教学实践中，综合考虑根据学生个性、兴趣和需求调整教学策略的情况，营造有助于学生学习和成长环境的程度，以及运用激励手段并对学生表现和进步进行评价的方式等方面，请选择最符合您教学情况的选项：',
        'q9': '9. 在您的教学中，您的主要关注点是什么？请选择最符合您教学实际的选项：',
        'q10': '10. 培养"德智体美劳"全面发展的学生，您认为最重要的是以下哪个方面？'
    },
    'sub3': {
        'q1': '1. 在数学教学专业成长中，您符合以下哪种描述？',
        'q2': '2. 在准备一节公开课时，您会有以下哪些具体工作？',
        'q3': '3. 在您的教学实践中，如何体现对国际教育理念的理解？',
        'q4': '4. 在数学教学活动中，您如何应用国际化专业能力？',
        'q5': '5. 在教学实践中，您会对以下哪些核心环节进行反思与研究？',
        'q6': '6. 在一次数学课上，学生们对新学的几何知识理解起来比较困难，课堂气氛沉闷，作业完成情况也不理想。您认为是哪里出现了问题？',
        'q7': '7. 在日常教学中，您经常参与的教师合作活动及表现是？',
        'q8': '8. 您在学校教师合作中感受到哪些支持与成效？'
    }
    // 可以添加其他问卷的问题标题
};

// 选项标题映射
const optionTitles = {
    'A': 'A选项',
    'B': 'B选项',
    'C': 'C选项',
    'D': 'D选项'
}

// 获取当前筛选后的数据
async function getCurrentData() {
    try {
        if (!startDate && !endDate) {
            return await dataManager.getAllData();
        }
        return filteredData;
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    }
}

// 应用日期筛选
async function applyDateFilter() {
    const startDateInput = document.getElementById('startDate').value;
    const endDateInput = document.getElementById('endDate').value;

    startDate = startDateInput ? new Date(startDateInput) : null;
    endDate = endDateInput ? new Date(endDateInput) : null;

    if (endDate) {
        endDate.setHours(23, 59, 59, 999);
    }

    const allData = await dataManager.getAllData();
    filteredData = allData.filter(item => {
        const itemDate = new Date(item.timestamp);
        if (startDate && itemDate < startDate) return false;
        if (endDate && itemDate > endDate) return false;
        return true;
    });

    await updateDisplay();
    const resultMessage = `已筛选出 ${filteredData.length} 条数据 (共 ${allData.length} 条)`;
    alert(resultMessage);
}

// 重置日期筛选
function resetDateFilter() {
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';

    // 清除筛选条件
    startDate = null;
    endDate = null;
    filteredData = [];

    // 更新显示
    updateDisplay();
}

// 更新所有图表
async function updateAllCharts() {
    const data = await getCurrentData();
    if (data.length === 0) {
        console.log('No data available for charts');
        return;
    }
    initTypeChart(data);
    initTimeChart(data);
    if (document.getElementById('questionSelect').value) {
        await updateQuestionChart();
    }
}
// 初始化所有图表
async function initCharts() {
    const data = await getCurrentData();
    if (data.length === 0) {
        console.log('No data available for charts');
        return;
    }
    initTypeChart(data);
    initTimeChart(data);
    initQuestionSelect();
}
// 初始化问卷类型分布图
function initTypeChart(data) {
    // 统计各类型问卷数量
    const typeCounts = {};
    data.forEach(item => {
        if (!typeCounts[item.type]) {
            typeCounts[item.type] = 0;
        }
        typeCounts[item.type]++;
    });

    const chartData = {
        labels: Object.keys(typeCounts).map(type => questionnaireTitles[type]),
        datasets: [{
            label: '问卷数量',
            data: Object.values(typeCounts),
            backgroundColor: chartColors.slice(0, Object.keys(typeCounts).length),
            borderWidth: 1
        }]
    };

    const ctx = document.getElementById('typeChart').getContext('2d');
    if (typeChart) {
        typeChart.destroy();
    }

    typeChart = new Chart(ctx, {
        type: 'doughnut',
        data: chartData,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: '问卷类型分布'
                }
            }
        }
    });
}

// 初始化提交时间趋势图
function initTimeChart(data) {
    // 按日期分组统计提交数量
    const dates = {};
    data.forEach(item => {
        const date = new Date(item.timestamp);
        const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

        if (!dates[dateStr]) {
            dates[dateStr] = 0;
        }
        dates[dateStr]++;
    });

    // 按日期排序
    const sortedDates = Object.keys(dates).sort((a, b) => {
        return new Date(a) - new Date(b);
    });

    const chartData = {
        labels: sortedDates,
        datasets: [{
            label: '提交数量',
            data: sortedDates.map(date => dates[date]),
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.1,
            fill: true
        }]
    };

    const ctx = document.getElementById('timeChart').getContext('2d');
    if (timeChart) {
        timeChart.destroy();
    }

    timeChart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: '问卷提交时间趋势'
                }
            }
        }
    });
}

// 初始化问题选择下拉菜单
function initQuestionSelect() {
    const questionnaireType = document.getElementById('questionnaireType');
    questionnaireType.value = 'index'; // 默认选择第一个问卷类型
    updateQuestionStats();
}

// 更新问题统计
function updateQuestionStats() {
    const questionnaireType = document.getElementById('questionnaireType').value;
    const questionSelect = document.getElementById('questionSelect');

    // 清空选项
    questionSelect.innerHTML = '';

    // 添加该问卷类型的所有问题
    if (questionTitles[questionnaireType]) {
        Object.entries(questionTitles[questionnaireType]).forEach(([key, title]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = title;
            questionSelect.appendChild(option);
        });

        // 默认选择第一个问题
        if (questionSelect.options.length > 0) {
            questionSelect.selectedIndex = 0;
            updateQuestionChart();
        }
    } else {
        // 如果没有该问卷类型的问题映射数据
        const option = document.createElement('option');
        option.value = '';
        option.textContent = '暂无该类型问卷的问题数据';
        questionSelect.appendChild(option);
    }
}

// 更新问题图表
async function updateQuestionChart() {
    let answerCounts = {};
    let answerCountsNum = 4;
    const questionnaireType = document.getElementById('questionnaireType').value;
    const questionKey = document.getElementById('questionSelect').value;
    if (!questionKey) return;

    const allData = await getCurrentData();
    const data = allData.filter(item => item.type === questionnaireType);

    if (data.length === 0) {
        const ctx = document.getElementById('questionChart').getContext('2d');
        if (questionChart) questionChart.destroy();
        return;
    }else {
        answerCounts = { 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E':0, 'F':0 };
    }
    data.forEach(item => {
        if (item.answers && item.answers[questionKey]) {
            const answer = item.answers[questionKey];
            if (answerCounts[answer] !== undefined) answerCounts[answer]++;
        }
    });

    const chartData = {
        labels: Object.keys(answerCounts).map(key => `选项${key}`),
        datasets: [{
            label: '回答数量',
            data: Object.values(answerCounts),
            backgroundColor: chartColors.slice(0, Object.keys(answerCounts).length),
            borderWidth: 1
        }]
    };

    const ctx = document.getElementById('questionChart').getContext('2d');
    if (questionChart) questionChart.destroy();

    questionChart = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
            plugins: { title: { display: true, text: questionTitles[questionnaireType][questionKey] } }
        }
    });
}
// 获取各问卷关键词数据
async function getQuestionnaireKeywords() {
    const allData = await dataManager.getAllData();
    const keywordMappings = {
        'index': getKeywordMappingForQuestionnaire('script.js'),
        'sub1': getKeywordMappingForQuestionnaire('script2.js'),
        'sub2': getKeywordMappingForQuestionnaire('script3.js'),
        'sub3': getKeywordMappingForQuestionnaire('script4.js')
    };

    const keywordCounts = { 'index': {}, 'sub1': {}, 'sub2': {}, 'sub3': {}, 'total': {} };
    allData.forEach(entry => {
        const type = entry.type;
        const answers = entry.answers;
        if (keywordMappings[type]) {
            Object.entries(answers).forEach(([question, answer]) => {
                if (Array.isArray(answer)) {
                    answer.forEach(option => {
                        const mapping = keywordMappings[type][question];
                        if (mapping && mapping[option]) {
                            mapping[option].forEach(keyword => {
                                keywordCounts[type][keyword] = (keywordCounts[type][keyword] || 0) + 1;
                                keywordCounts['total'][keyword] = (keywordCounts['total'][keyword] || 0) + 1;
                            });
                        }
                    });
                } else {
                    const mapping = keywordMappings[type][question];
                    if (mapping && mapping[answer]) {
                        mapping[answer].forEach(keyword => {
                            keywordCounts[type][keyword] = (keywordCounts[type][keyword] || 0) + 1;
                            keywordCounts['total'][keyword] = (keywordCounts['total'][keyword] || 0) + 1;
                        });
                    }
                }
            });
        }
    });
    return keywordCounts;
}
// 获取特定问卷的关键词映射
function getKeywordMappingForQuestionnaire(scriptFile) {
    // 这里应该有更好的实现方式，但我们先用硬编码的方式模拟
    // 实际应用中，可以通过动态加载script文件或其他方式获取
    if (scriptFile === 'script.js') {
        return {
            q1: {
                A: ['道德教育'],
                B: ['有限整合'],
                C: ['学科孤立'],
                D: ['回避价值观']
            },
            q2: {
                A: ['积极灵活'],
                B: ['个别引导'],
                C: ['消极应对'],
                D: ['间接引导']
            },
            q3: {
                A: ['积极灵活'],
                B: ['教学延伸'],
                C: ['制度依赖'],
                D: ['消极应对']
            },
            q4: {
                A: ['消极应对'],
                B: ['道德教育'],
                C: ['制度依赖'],
                D: ['协同干预']
            },
            q5: {
                A: ['纵容失信'],
                B: ['制度依赖'],
                C: ['严格执行'],
                D: ['警示教学']
            },
            q6: {
                A: ['批判思维'],
                B: ['积极灵活'],
                C: ['制度依赖'],
                D: ['团队合作']
            },
            q7: {
                A: ['情感支持'],
                B: ['成绩导向'],
                C: ['情感疏离'],
                D: ['情感忽视']
            },
            q8: {
                A: ['因材施教'],
                B: ['反馈优化'],
                C: ['积极灵活'],
                D: ['风格固化']
            },
            q9: {
                A: ['谨慎小心'],
                B: ['私域自由'],
                C: ['自由表达'],
                D: ['道德教育']
            },
            q10: {
                A: ['情绪管理'],
                B: ['团队合作'],
                C: ['情感忽视'],
                D: ['反馈优化']
            }
        };
    } else if (scriptFile === 'script2.js') {
        return {
            q1: {
                A: ['学术成绩'],
                B: ['社交能力'],
                C: ['均衡发展'],
                D: ['个性发展']
            },
            q2: {
                A: ['紧跟教材'],
                B: ['知识讲解'],
                C: ['学生反馈'],
                D: ['自主探究']
            },
            q3: {
                A: ['精准制定'],
                B: ['目标笼统'],
                C: ['个人理解'],
                D: ['不会制定']
            },
            q4: {
                A: ['合理整合'],
                B: ['逻辑一般'],
                C: ['组织松散'],
                D: ['不会组织']
            },
            q5: {
                A: ['经常使用'],
                B: ['偶尔使用'],
                C: ['尝试使用'],
                D: ['没有使用']
            },
            q6: {
                A: ['直接讲解'],
                B: ['借助器材'],
                C: ['视频引入'],
                D: ['动手感受']
            },
            q7: {
                A: ['直接纠正'],
                B: ['引导讨论'],
                C: ['不做干预'],
                D: ['提醒全班']
            },
            q8: {
                A: ['必须完成'],
                B: ['延长时间'],
                C: ['总结重点'],
                D: ['分享思路']
            },
            q9: {
                A: ['不做处理'],
                B: ['轻微批评'],
                C: ['立刻制止'],
                D: ['单独谈话']
            },
            q10: {
                A: ['严厉批评'],
                B: ['引导讨论'],
                C: ['课后处理'],
                D: ['忽略不管']
            },
            q11: {
                A: ['只看结果'],
                B: ['着重过程'],
                C: ['侧重收获'],
                D: ['综合考虑']
            },
            q12: {
                A: ['只打分数'],
                B: ['给予评语'],
                C: ['提出建议'],
                D: ['课堂讲解']
            },
            q13: {
                A: ['很少反思'],
                B: ['简单回想'],
                C: ['认真分析'],
                D: ['同事交流']
            },
            q14: {
                A: ['增加练习'],
                B: ['练习难题'],
                C: ['调整方法'],
                D: ['借鉴同事']
            }
        };
    } else if (scriptFile === 'script3.js') {
        return {
            q1: {
                A: ['国际视野'],
                B: ['文汇教通'],
                C: ['班级管理'],
                D: ['教育实践']
            },
            q2: {
                A: ['课程创新'],
                B: ['跨科融合'],
                C: ['教学多元'],
                D: ['心教融合']
            },
            q3: {
                A: ['综合教育'],
                B: ['承旧启新'],
                C: ['理念纷歧'],
                D: ['家校合作'],
                E: ['全面沟通'],
                F: ['探索创新']
            },
            q4: {
                A: ['心理辅导'],
                B: ['教育沟通'],
                C: ['教育方法'],
                D: ['教育理念']
            },
            q5: {
                A: ['个性化交流'],
                B: ['差异化教学'],
                C: ['尊重学生'],
                D: ['顾全扶微'],
                E: ['强调统一'],
                F: ['心怀包容']
            },
            q6: {
                A: ['恒有耐心'],
                B: ['常耐偶躁'],
                C: ['间具耐心'],
                D: ['鲜少耐心'],
                E: ['全无耐心']
            },
            q7: {
                A: ['家校共育'],
                B: ['被动沟通'],
                C: ['单向反馈'],
                D: ['缺少沟通']
            },
            q8: {
                A: ['个性化教学'],
                B: ['差异化教学'],
                C: ['传统教学'],
                D: ['固执一发'],
                E: ['探索教学']
            },
            q9: {
                A: ['引导式教学'],
                B: ['教学转变'],
                C: ['传统教学'],
                D: ['个体忽视'],
                E: ['探索实践']
            },
            q10: {
                A: ['育德守规'],
                B: ['创新实践'],
                C: ['爱国教育'],
                D: ['身正为范']
            }
        };
    } else if (scriptFile === 'script4.js') {
        return {
            q1: {
                A: ['喜爱学习'],
                B: ['学习动机'],
                C: ['主动学习']
            },
            q2: {
                A: ['独立学习'],
                B: ['创造学习'],
                C: ['效率学习']
            },
            q3: {
                A: ['情感', '国际视野'],
                B: ['情感', '国际视野'],
                C: ['知识', '国际视野'],
                D: ['知识', '国际视野']
            },
            q4: {
                A: ['能力', '国际视野'],
                B: ['能力', '国际视野'],
                C: ['能力', '国际视野'],
                D: ['能力', '国际视野']
            },
            q5: {
                A: ['反思研究', '教学目标'],
                B: ['反思研究', '教学策略'],
                C: ['反思研究', '师生互动'],
                D: ['反思研究', '教学数据']
            },
            q6: {
                A: ['反思研究', '教学纪律'],
                B: ['反思研究', '教学方法'],
                C: ['反思研究', '教学进度'],
                D: ['反思研究', '练习量']
            },
            q7: {
                A: ['行为', '教师合作'],
                B: ['行为', '教师合作'],
                C: ['能力', '教师合作'],
                D: ['能力', '教师合作']
            },
            q8: {
                A: ['条件', '教师合作'],
                B: ['条件', '教师合作'],
                C: ['条件', '教师合作'],
                D: ['条件', '教师合作']
            }
        };
    }

    return {};
}

// 创建词云
function createWordCloud(containerId, keywordData) {
    // 清除现有内容
    d3.select(`#${containerId}`).selectAll("*").remove();

    // 转换数据格式
    const wordFrequency = keywordData;

    // 获取最大和最小频率
    const frequencies = Object.values(wordFrequency);
    if (frequencies.length === 0) {
        // 如果没有数据，则显示提示
        d3.select(`#${containerId}`)
            .append("div")
            .attr("class", "text-center text-muted")
            .style("padding-top", "100px")
            .text("暂无数据");
        return;
    }

    const maxFreq = Math.max(...frequencies);
    const minFreq = Math.min(...frequencies);

    // 转换为词云数据格式
    const wordCloudData = Object.entries(wordFrequency).map(([text, frequency]) => {
        // 计算字体大小：频率越高，字体越大
        // 最小频率对应14px，最大频率对应40px
        const size = frequency === maxFreq ? 40 :
                    frequency === minFreq ? 14 :
                    14 + ((frequency - minFreq) / (maxFreq - minFreq)) * 26;

        return {
            text: text,
            size: size,
            frequency: frequency
        };
    });

    const container = document.getElementById(containerId);
    const width = container.offsetWidth;
    const height = container.offsetHeight || 250;

    // 创建SVG容器
    const svg = d3.select(`#${containerId}`)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    // 定义渐变色
    const colors = [
        "#2F4858", "#33658A", "#86BBD8", "#758E4F",
        "#F6AE2D", "#86BBD8", "#33658A", "#2F4858",
        "#758E4F", "#F6AE2D"
    ];

    // 创建词云布局
    const layout = d3.layout.cloud()
        .size([width - 40, height - 40])
        .words(wordCloudData)
        .padding(8)
        .rotate(() => 0)
        .spiral("archimedean")
        .fontSize(d => d.size)
        .on("end", words => {
            // 绘制词云
            const cloud = svg.append("g")
                .attr("transform", `translate(${width/2},${height/2})`)
                .attr("class", "word-cloud");

            cloud.selectAll("text")
                .data(words)
                .enter()
                .append("text")
                .style("font-size", d => `${d.size}px`)
                .style("font-family", "Microsoft YaHei")
                .style("fill", (d, i) => colors[i % colors.length])
                .style("font-weight", d => d.frequency > 1 ? "bold" : "normal")
                .style("cursor", "default")
                .style("opacity", 0)
                .attr("text-anchor", "middle")
                .attr("transform", d => `translate(${d.x},${d.y})`)
                .text(d => d.text)
                .transition()
                .duration(600)
                .style("opacity", d => d.frequency > 1 ? 1 : 0.7);
        });

    layout.start();
}

// 更新所有词云
async function updateAllWordClouds() {
    const keywordCounts = await getQuestionnaireKeywords();
    createWordCloud('indexWordCloud', keywordCounts['index']);
    createWordCloud('sub1WordCloud', keywordCounts['sub1']);
    createWordCloud('sub2WordCloud', keywordCounts['sub2']);
    createWordCloud('sub3WordCloud', keywordCounts['sub3']);
    createWordCloud('totalWordCloud', keywordCounts['total']);
}

// 在文档加载完成后初始化词云
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM content loaded, initializing...');
    await updateDisplay();
    await updateAllWordClouds();

    window.applyDatefilter = async function() {
        await applyDateFilter();
        await updateAllWordClouds();
    };

    window.resetDateFilter = async function() {
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';
        startDate = null;
        endDate = null;
        filteredData = [];
        await updateDisplay();
        await updateAllWordClouds();
    };
});
// 保存原始的日期筛选函数
const originalApplyDateFilter = window.applyDatefilter;
const originalResetDateFilter = window.resetDateFilter;
