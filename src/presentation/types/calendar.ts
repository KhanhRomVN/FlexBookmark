// // src/presentation/types/calendar.ts

// export interface CalendarEvent {
//     id: string;                         // ID duy nhất của sự kiện
//     status: string;                     // Trạng thái: confirmed | tentative | cancelled
//     created: string;                    // ISO datetime tạo sự kiện
//     updated: string;                    // ISO datetime cập nhật sự kiện
//     summary: string;                    // Tiêu đề sự kiện
//     description?: string;               // Mô tả chi tiết (optional)

//     creator: {                          // Người tạo sự kiện
//         id?: string;
//         email: string;
//         displayName?: string;
//         self: boolean;
//     };

//     start: {                            // Thời gian bắt đầu
//         date?: string;                    // Nếu sự kiện cả ngày
//         dateTime?: string;                // Nếu có giờ cụ thể
//         timeZone?: string;
//     };

//     end: {                              // Thời gian kết thúc
//         date?: string;
//         dateTime?: string;
//         timeZone?: string;
//     };

//     endTimeUnspecified?: boolean;       // true nếu không có giờ kết thúc

//     recurrence?: string[];              // Quy tắc lặp lại (RRULE)

//     reminders?: {                       // Nhắc nhở
//         useDefault: boolean;
//         overrides?: Array<{
//             method: string;                 // popup | email
//             minutes: number;
//         }>;
//     };

//     extendedProperties?: {              // Metadata tùy chỉnh
//         shared?: {
//             tags?: string[];                // Mảng tag
//             collection?: string;            // Nhóm/nhãn sưu tập
//             location?: {                    // Địa điểm chi tiết
//                 locationName?: string;
//                 locationAddress?: string;
//                 locationCoordinates?: {
//                     lat: number;
//                     lng: number;
//                 };
//             };
//         };
//     };
// }

export interface CalendarEvent {
    id: string;
    summary: string;                    // Event title
    description?: string;               // Optional description

    // Planned times - using separate date and time fields like tasks
    startDate: Date | null;            // Planned start date
    startTime: Date | null;            // Planned start time
    dueDate: Date | null;              // Planned end date (renamed from endDate for consistency)
    dueTime: Date | null;              // Planned end time (renamed from endTime for consistency)

    // Actual times - when event actually started/ended
    actualStartDate: Date | null;      // When event actually started
    actualStartTime: Date | null;      // Actual start time 
    actualEndDate: Date | null;        // When event actually ended
    actualEndTime: Date | null;        // Actual end time

    // Timezone information
    timeZone?: string;                 // Auto-detected timezone (e.g., "Asia/Ho_Chi_Minh")

    // Legacy fields for backward compatibility with Google Calendar
    start?: Date;                      // Computed from startDate + startTime
    end?: Date;                        // Computed from dueDate + dueTime

    // Location information
    location?: string;                  // Simple location string
    locationName?: string;              // Detailed location name
    locationAddress?: string;           // Address
    locationCoordinates?: string;       // GPS coordinates

    // Event properties
    priority?: 'low' | 'medium' | 'high';
    tags?: string[];
    subtasks?: Array<{
        id: string;
        title: string;
        description?: string;
        completed: boolean;
        linkedTaskId?: string;
        requiredCompleted?: boolean;
    }>;
    attachments?: Array<{
        id: string;
        title: string;
        url: string;
        type: 'image' | 'video' | 'audio' | 'file' | 'other';
    }>;
    completed?: boolean;

    // Recurrence and reminders
    recurrence?: {
        type: string;
        interval: number;
        endDate?: Date | null;
        endAfterOccurrences?: number | null;
    };
    reminders?: number[];               // Array of minutes before event

    // Google Calendar specific (optional)
    status?: string;
    created?: string;
    updated?: string;
    creator?: {
        id?: string;
        email: string;
        displayName?: string;
        self: boolean;
    };
    calendarId?: string;
    attendees?: string[];
}

export interface GoogleCalendar {
    id: string;
    summary: string;
    description?: string;
    backgroundColor?: string;
    selected?: boolean;
}

// Helper function to combine date and time into a single Date object
export function combineDateTime(date: Date | null, time: Date | null): Date | null {
    if (!date) return null;
    const combined = new Date(date);
    if (time) {
        combined.setHours(time.getHours(), time.getMinutes(), time.getSeconds(), time.getMilliseconds());
    }
    return combined;
}

// Helper function to get current timezone
export function getCurrentTimeZone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// Helper function to format timezone for display
export function formatTimeZone(timeZone?: string): string {
    if (!timeZone) return '';

    try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en', {
            timeZone,
            timeZoneName: 'short'
        });

        const parts = formatter.formatToParts(now);
        const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value || '';

        return `${timeZone} (${timeZoneName})`;
    } catch (error) {
        return timeZone;
    }
}