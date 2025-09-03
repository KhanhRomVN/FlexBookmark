/**
 * 📅 DATE UTILITIES
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 📋 TỔNG QUAN CHỨC NĂNG:
 * ├── 📆 Xử lý các thao tác liên quan đến ngày tháng
 * ├── 📊 Tính toán ngày trong tháng, tuần
 * ├── 🔄 Chuyển đổi định dạng ngày
 * ├── 📈 Tính toán streaks và khoảng thời gian
 * └── 🎯 Hỗ trợ localization và timezone
 */

/**
 * 📅 Lấy thông tin chi tiết về một ngày
 */
export interface DateInfo {
    date: Date;
    day: number;
    month: number;
    year: number;
    dayOfWeek: number;
    weekOfYear: number;
    isToday: boolean;
    isWeekend: boolean;
    formatted: string;
    iso: string;
}

/**
 * 🎯 Lấy thông tin chi tiết về một ngày
 */
export const getDateInfo = (date: Date): DateInfo => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const dayOfWeek = date.getDay();
    const today = new Date();

    return {
        date,
        day,
        month,
        year,
        dayOfWeek,
        weekOfYear: getWeekOfYear(date),
        isToday: isSameDay(date, today),
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        formatted: formatDate(date),
        iso: date.toISOString()
    };
};

/**
 * 📆 Kiểm tra hai ngày có cùng ngày không (bỏ qua giờ)
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear();
};

/**
 * 📅 Kiểm tra hai ngày có cùng tháng không
 */
export const isSameMonth = (date1: Date, date2: Date): boolean => {
    return date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear();
};

/**
 * 📊 Lấy tuần trong năm
 */
export const getWeekOfYear = (date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

/**
 * 🔢 Lấy số ngày trong tháng
 */
export const getDaysInMonth = (month: number, year: number): number => {
    return new Date(year, month, 0).getDate();
};

/**
 * 📅 Lấy tất cả ngày trong tháng
 */
export const getDaysInMonthArray = (month: number, year: number): DateInfo[] => {
    const daysInMonth = getDaysInMonth(month, year);
    const days: DateInfo[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        days.push(getDateInfo(date));
    }

    return days;
};

/**
 * 🔄 Thêm ngày vào một ngày
 */
export const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

/**
 * 🔄 Thêm tháng vào một ngày
 */
export const addMonths = (date: Date, months: number): Date => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
};

/**
 * 📈 Tính số ngày giữa hai ngày
 */
export const getDaysBetween = (date1: Date, date2: Date): number => {
    const timeDiff = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

/**
 * 🎯 Định dạng ngày thành chuỗi
 */
export const formatDate = (date: Date, format: string = 'dd/MM/yyyy'): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return format
        .replace('dd', day)
        .replace('MM', month)
        .replace('yyyy', year.toString())
        .replace('yy', year.toString().slice(-2));
};

/**
 * 📅 Lấy ngày đầu tháng
 */
export const getFirstDayOfMonth = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
};

/**
 * 📅 Lấy ngày cuối tháng
 */
export const getLastDayOfMonth = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

/**
 * 📊 Lấy tên ngày trong tuần
 */
export const getDayName = (date: Date, locale: string = 'en-US'): string => {
    return date.toLocaleDateString(locale, { weekday: 'short' });
};

/**
 * 📊 Lấy tên tháng
 */
export const getMonthName = (date: Date, locale: string = 'en-US'): string => {
    return date.toLocaleDateString(locale, { month: 'long' });
};

/**
 * 🎯 Kiểm tra ngày có hợp lệ không
 */
export const isValidDate = (date: any): boolean => {
    return date instanceof Date && !isNaN(date.getTime());
};

/**
 * 📈 Tính streak liên tiếp
 */
export const calculateStreak = (dates: Date[]): number => {
    if (dates.length === 0) return 0;

    // Sắp xếp ngày giảm dần
    const sortedDates = [...dates].sort((a, b) => b.getTime() - a.getTime());

    let streak = 1;
    let currentDate = new Date(sortedDates[0]);

    for (let i = 1; i < sortedDates.length; i++) {
        const previousDate = addDays(currentDate, -1);

        if (isSameDay(sortedDates[i], previousDate)) {
            streak++;
            currentDate = sortedDates[i];
        } else {
            break;
        }
    }

    return streak;
};

export default {
    getDateInfo,
    isSameDay,
    isSameMonth,
    getWeekOfYear,
    getDaysInMonth,
    getDaysInMonthArray,
    addDays,
    addMonths,
    getDaysBetween,
    formatDate,
    getFirstDayOfMonth,
    getLastDayOfMonth,
    getDayName,
    getMonthName,
    isValidDate,
    calculateStreak
};