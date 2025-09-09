import { useState, useEffect, useCallback } from "react";
import { fetchGoogleEvents, fetchGoogleCalendars, createGoogleEvent, updateGoogleEvent } from "../services/googleCalendarService";
import { startOfWeek, endOfWeek } from "date-fns";
import { useAuth } from "../../../../contexts/AuthContext";
import type { CalendarEvent, GoogleCalendar } from "../types";

export const useCalendar = () => {
    const { authState, login, logout } = useAuth();
    const token = authState.user?.accessToken || null;
    const isAuthenticated = authState.isAuthenticated;

    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
    const [selectedItem, setSelectedItem] = useState<CalendarEvent | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [authError, setAuthError] = useState<boolean>(false);

    const handleAuthError = useCallback(async (err: any) => {
        const errorMessage = err?.message || '';
        const isAuthError =
            err?.status === 401 ||
            errorMessage.includes('401') ||
            errorMessage.includes('UNAUTHORIZED') ||
            errorMessage.includes('OAuth2 not granted') ||
            errorMessage.includes('oauth') ||
            errorMessage.includes('authentication') ||
            errorMessage.includes('permission denied');

        if (isAuthError) {
            console.log('Authentication error detected');
            setAuthError(true);
            setError("Authentication required. Please grant calendar permissions.");
            return true;
        }
        return false;
    }, []); // Remove logout dependency

    const fetchData = useCallback(async () => {
        if (!isAuthenticated || !token) {
            setError("Vui lòng đăng nhập với Google để sử dụng tính năng này");
            setAuthError(true);
            return;
        }

        setLoading(true);
        setError(null);
        setAuthError(false);

        try {
            const [calendarList, eventList] = await Promise.all([
                fetchGoogleCalendars(token),
                fetchGoogleEvents(token),
            ]);
            setCalendars(calendarList);
            setEvents(eventList);
        } catch (err) {
            console.error("API Error:", err);

            // Handle authentication errors
            const isAuthErr = await handleAuthError(err);
            if (!isAuthErr) {
                // Handle other errors
                if (err?.message?.includes('403')) {
                    setError("Không có quyền truy cập Google Calendar. Vui lòng kiểm tra quyền truy cập của ứng dụng.");
                } else if (err?.message?.includes('404')) {
                    setError("Không tìm thấy dữ liệu Google Calendar.");
                } else if (err?.message?.includes('quota')) {
                    setError("Đã vượt quá giới hạn API. Vui lòng thử lại sau.");
                } else {
                    setError(err instanceof Error ?
                        `Lỗi kết nối với Google APIs: ${err.message}` :
                        "Lỗi không xác định khi kết nối với Google APIs"
                    );
                }
            }
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, token, handleAuthError]);

    useEffect(() => {
        if (isAuthenticated && token) {
            fetchData();
        } else if (!isAuthenticated) {
            // Clear data when not authenticated
            setEvents([]);
            setCalendars([]);
            setError(null);
            setAuthError(true);
        }
    }, [isAuthenticated, fetchData, token]);

    const handleSaveEvent = useCallback(async (event: CalendarEvent) => {
        if (!isAuthenticated || !token) {
            setError("Không thể lưu: Chưa đăng nhập");
            setAuthError(true);
            return;
        }

        setLoading(true);
        setError(null);
        setAuthError(false);

        try {
            let savedEvent: CalendarEvent;
            const isNewEvent = event.id.startsWith('temp-') || !events.find(e => e.id === event.id);

            if (isNewEvent) {
                savedEvent = await createGoogleEvent(token, event);
                setEvents(prev => [...prev, savedEvent]);
            } else {
                savedEvent = await updateGoogleEvent(token, event);
                setEvents(prev => prev.map(e => e.id === event.id ? savedEvent : e));
            }

            // Refresh data after successful save
            setTimeout(() => {
                fetchData();
            }, 500);
        } catch (err) {
            console.error("Save event error:", err);

            // Handle authentication errors
            const isAuthErr = await handleAuthError(err);
            if (!isAuthErr) {
                // Handle other save errors
                if (err?.message?.includes('403')) {
                    setError("Không có quyền chỉnh sửa lịch này. Vui lòng kiểm tra quyền truy cập.");
                } else if (err?.message?.includes('400')) {
                    setError("Dữ liệu sự kiện không hợp lệ. Vui lòng kiểm tra lại thông tin.");
                } else {
                    setError(err instanceof Error ?
                        `Lỗi lưu sự kiện: ${err.message}` :
                        "Lỗi không xác định khi lưu sự kiện"
                    );
                }
            }
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, token, events, fetchData, handleAuthError]);

    const handleDateChange = useCallback((date: Date) => {
        setSelectedDate(date);
    }, []);

    const handleSelectItem = useCallback((item: CalendarEvent) => {
        setSelectedItem(item);
    }, []);

    const handleCloseModal = useCallback(() => {
        setSelectedItem(null);
    }, []);

    const handleRefresh = useCallback(async () => {
        if (!isAuthenticated) {
            setError("Vui lòng đăng nhập để làm mới dữ liệu");
            setAuthError(true);
            return;
        }
        await fetchData();
    }, [fetchData, isAuthenticated]);

    const handleRetryAuth = useCallback(async () => {
        setLoading(true);
        setError(null);
        setAuthError(false);

        try {
            const success = await login();
            if (success) {
                // Wait a bit for auth state to update, then fetch data
                setTimeout(() => {
                    fetchData();
                }, 1000);
            } else {
                setError("Đăng nhập không thành công. Vui lòng thử lại.");
                setAuthError(true);
            }
        } catch (err) {
            console.error("Retry auth error:", err);
            setError("Lỗi trong quá trình đăng nhập. Vui lòng thử lại.");
            setAuthError(true);
        } finally {
            setLoading(false);
        }
    }, [login, fetchData]);

    const handleToggleCalendar = useCallback((calendarId: string) => {
        setCalendars(prev =>
            prev.map(cal =>
                cal.id === calendarId
                    ? { ...cal, selected: cal.selected !== false ? false : true }
                    : cal
            )
        );
    }, []);

    const filteredEvents = events.filter((event) => {
        const eventCalendar = calendars.find(cal => cal.id === event.calendarId);
        if (eventCalendar && eventCalendar.selected === false) {
            return false;
        }

        try {
            const eventDate = event.start instanceof Date ? event.start : new Date(event.start);
            const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
            return eventDate >= weekStart && eventDate <= weekEnd;
        } catch {
            return false;
        }
    });

    return {
        selectedDate,
        events,
        calendars,
        selectedItem,
        loading,
        error,
        authError,
        filteredEvents,
        handleDateChange,
        handleSelectItem,
        handleCloseModal,
        handleRefresh,
        handleToggleCalendar,
        handleSaveEvent,
        handleRetryAuth,
    };
};