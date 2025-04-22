/**
 * 问卷答案类型
 */
interface QuestionnaireAnswers {
    [key: string]: string | string[]; // 动态问题键值对，如 q1: "A", q2: "B" 等
}

/**
 * 问卷数据项类型
 */
interface QuestionnaireDataItem {
    type: string; // 问卷类型（index、sub1、sub2、sub3）
    timestamp: number; // 时间戳
    answers: QuestionnaireAnswers; // 问卷答案
}

/**
 * 数据管理类
 * 用于存储、获取和管理问卷数据
 */
class DataManager {
    private storageKey: string;
    private apiBaseUrl: string;

    constructor() {
        // 初始化数据存储键名
        this.storageKey = 'questionnaireData';

        // 从环境变量获取API基础URL
        const apiUrl = import.meta.env.VITE_API_URL;
        const port = import.meta.env.VITE_APP_API_PORT ? `:${import.meta.env.VITE_APP_API_PORT}` : '';
        this.apiBaseUrl = `${apiUrl}${port}`;
    }

    /**
     * 保存问卷数据到本地和远程
     * @param type - 问卷类型（index、sub1、sub2、sub3）
     * @param answers - 问卷答案数据
     * @returns Promise<boolean> - 是否保存成功
     */
    async saveData(type: string, answers: QuestionnaireAnswers): Promise<boolean> {
        // 本地保存
        const dataItem = {
            type: type,
            timestamp: Date.now(),
            answers: answers
        };

        const allData = this.getAllData();
        allData.push(dataItem);
        localStorage.setItem(this.storageKey, JSON.stringify(allData));

        try {
            // 远程保存
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
     * 从本地获取指定类型的问卷数据
     * @param type - 问卷类型
     * @returns 指定类型的问卷数据列表
     */
    getDataByTypeFromLocal(type: string): QuestionnaireDataItem[] {
        const allData = this.getAllData();
        return allData.filter(item => item.type === type);
    }

    /**
     * 从远程获取指定类型的问卷数据
     * @param type - 问卷类型
     * @returns Promise<QuestionnaireDataItem[]> - 指定类型的问卷数据列表
     */
    async getDataByTypeFromRemote(type: string): Promise<QuestionnaireDataItem[]> {
        try {
            const response = await fetch(`${this.apiBaseUrl}/getdatabytype?type=${encodeURIComponent(type)}`);

            if (!response.ok) {
                throw new Error(`获取数据失败: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('获取远程数据时出错:', error);
            return [];
        }
    }

    /**
     * 获取所有本地问卷数据
     * @returns 所有问卷数据列表
     */
    getAllDataFromLocal(): QuestionnaireDataItem[] {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : [];
    }

    /**
     * 获取所有远程问卷数据
     * @returns Promise<QuestionnaireDataItem[]> - 所有问卷数据列表
     */
    async getAllDataFromRemote(): Promise<QuestionnaireDataItem[]> {
        try {
            const response = await fetch(`${this.apiBaseUrl}/getdata`);

            if (!response.ok) {
                throw new Error(`获取数据失败: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('获取远程数据时出错:', error);
            return [];
        }
    }

    /**
     * 清除本地所有问卷数据
     * @returns boolean - 是否清除成功
     */
    clearAllDataFromLocal(): boolean {
        localStorage.removeItem(this.storageKey);
        return true;
    }

    /**
     * 清除远程问卷数据
     * @param type - 问卷类型
     * @param timestamp - 时间戳
     * @returns Promise<boolean> - 是否清除成功
     */
    async clearDataFromRemote(type: string, timestamp: number): Promise<boolean> {
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

    // 兼容旧版本的方法
    getDataByType(type: string): QuestionnaireDataItem[] {
        return this.getDataByTypeFromLocal(type);
    }

    getAllData(): QuestionnaireDataItem[] {
        return this.getAllDataFromLocal();
    }

    clearAllData(): boolean {
        return this.clearAllDataFromLocal();
    }
}

// 创建全局实例
const dataManager = new DataManager();

export default dataManager;
