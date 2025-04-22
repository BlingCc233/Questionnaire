/**
 * 数据管理类
 * 用于存储、获取和管理问卷数据
 */
class DataManagerBAN {
    constructor() {
        // 初始化数据存储键名
        this.storageKey = 'questionnaireData';
    }

    /**
     * 保存问卷数据
     * @param {string} type - 问卷类型（index、sub1、sub2、sub3）
     * @param {Object} answers - 问卷答案数据
     */
    saveData(type, answers) {
        // 获取已有数据
        const allData = this.getAllData();

        // 添加新数据
        allData.push({
            type: type,
            timestamp: Date.now(),
            answers: answers
        });

        // 保存到localStorage
        localStorage.setItem(this.storageKey, JSON.stringify(allData));

        return true;
    }

    /**
     * 获取指定类型的问卷数据
     * @param {string} type - 问卷类型
     * @returns {Array} - 指定类型的问卷数据列表
     */
    getDataByType(type) {
        const allData = this.getAllData();
        console.log(allData.filter(item => item.type === type));
        return allData.filter(item => item.type === type);
    }

    /**
     * 获取所有问卷数据
     * @returns {Array} - 所有问卷数据列表
     */
    getAllData() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : [];
    }

    /**
     * 清除所有问卷数据
     */
    clearAllData() {
        localStorage.removeItem(this.storageKey);
        return true;
    }
}

// 创建全局实例

class DataManager {
    constructor(apiBaseUrl) {
        this.apiBaseUrl = apiBaseUrl;
        this.storageKey = 'questionnaireData';
    }

    /**
     * 保存问卷数据到远程
     * @param {string} type - 问卷类型
     * @param {Object} answers - 问卷答案数据
     * @returns {Promise<boolean>} - 是否保存成功
     */
    async saveData(type, answers) {
        const dataItem = {
            type: type,
            timestamp: Date.now(),
            answers: answers
        };

        try {
            const response = await fetch(`${this.apiBaseUrl}/savedata`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataItem)
            });

            if (!response.ok) {
                console.error('远程保存失败:', response.statusText);
                return false;
            }

            return true;
        } catch (error) {
            console.error('保存数据时出错:', error);
            return false;
        }
    }

    /**
     * 从远程获取指定类型的问卷数据
     * @param {string} type - 问卷类型
     * @returns {Promise<Array>} - 指定类型的问卷数据列表
     */
    async getDataByType(type) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/getdatabytype?type=${encodeURIComponent(type)}`);

            if (!response.ok) {
                throw new Error(`获取数据失败: ${response.statusText}`);
            }
            console.log(await response.json());

            return await response.json();
        } catch (error) {
            console.error('获取远程数据时出错:', error);
            return [];
        }
    }

    /**
     * 获取所有远程问卷数据
     * @returns {Promise<Array>} - 所有问卷数据列表
     */
    async getAllData() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/getdata`);

            if (!response.ok) {
                throw new Error(`获取数据失败: ${response.statusText}`);
            }
            //console.log(await response.json());


            return await response.json();
        } catch (error) {
            console.error('获取远程数据时出错:', error);
            return [];
        }
    }

    /**
     * 清除远程问卷数据
     * @param {string} type - 问卷类型
     * @param {number} timestamp - 时间戳
     * @returns {Promise<boolean>} - 是否清除成功
     */
    async clearData(type, timestamp) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/cleardata`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ type, timestamp })
            });

            if (!response.ok) {
                throw new Error(`清除数据失败: ${response.statusText}`);
            }

            return true;
        } catch (error) {
            console.error('清除远程数据时出错:', error);
            return false;
        }
    }
}

// 使用示例：
const dataManager = new DataManager('https://qessdk.blingcc.eu.org');
// const dataManagerBAN = new DataManagerBAN();
// export default dataManager;
