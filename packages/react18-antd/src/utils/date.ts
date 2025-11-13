/**
 * 日期工具类 - 不依赖Date对象
 */
class DateUtils {
    /**
     * 判断是否为闰年
     */
    static isLeapYear(year) {
        if (typeof year !== 'number' || year < 0) {
            throw new Error('年份必须为非负数字');
        }
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    }
    
    /**
     * 获取月份天数
     */
    static getDaysInMonth(year, month) {
        if (typeof year !== 'number' || typeof month !== 'number') {
            throw new Error('年份和月份必须为数字');
        }
        
        if (month < 1 || month > 12) {
            throw new Error('月份必须在1-12之间');
        }
        
        if (year < 0) {
            throw new Error('年份不能为负数');
        }
        
        const daysMap = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        
        if (month === 2 && this.isLeapYear(year)) {
            return 29;
        }
        
        return daysMap[month - 1];
    }
    
    /**
     * 验证日期是否有效
     * @param {number} year - 年份
     * @param {number} month - 月份
     * @param {number} day - 日期
     * @returns {boolean} 是否有效
     */
    static isValidDate(year, month, day) {
        try {
            const daysInMonth = this.getDaysInMonth(year, month);
            return day >= 1 && day <= daysInMonth;
        } catch (error) {
            return false;
        }
    }
}