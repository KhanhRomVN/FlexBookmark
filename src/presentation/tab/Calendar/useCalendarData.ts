import { useState, useEffect, useCallback } from "react";
import { fetchGoogleEvents, fetchGoogleCalendars } from "../../../utils/GGCalender";
import ChromeAuthManager, { AuthState } from "../../../utils/chromeAuth";
import type { CalendarEvent, GoogleCalendar } from "../../types/calendar";

export const useCalendarData = () => {
    const authManager = ChromeAuthManager.getInstance();
    const [authState, setAuthState] = useState<AuthState>({
        isAuthenticated: false,
        user: null,
        loading: true,
        error: null,
    });
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
    const [selectedItem, setSelectedItem] = useState<CalendarEvent | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = authManager.subscribe((newState) => {
            setAuthState(newState);
        });
        authManager.initialize();
        return unsubscribe;
    }, [authManager]);

    const fetchData = useCallback(async () => {
        if (!authState.isAuthenticated || !authState.user?.accessToken) return;
        setLoading(true);
        setError(null);
        try {
            const [calendarList, eventList] = await Promise.all([
                fetchGoogleCalendars(authState.user.accessToken),
                fetchGoogleEvents(authState.user.accessToken),
            ]);

            setCalendars(calendarList);
            setEvents(eventList);
        } catch (err) {
            console.error("API Error:", err);
            setError(err instanceof Error ? `Lỗi kết nối với Google APIs: ${err.message}` : "Lỗi kết nối với Google APIs");
        } finally {
            setLoading(false);
        }
    }, [authState.isAuthenticated, authState.user?.accessToken]);

    useEffect(() => {
        if (authState.isAuthenticated) {
            fetchData();
        }
    }, [authState.isAuthenticated, fetchData]);

    const handleLogin = useCallback(async () => {
        try {
            await authManager.login();
        } catch (err) {
            console.error("Login error:", err);
            setError("Đăng nhập thất bại. Vui lòng thử lại.");
        }
    }, [authManager]);

    const handleLogout = useCallback(async () => {
        try {
            await authManager.logout();
            setEvents([]);
            setCalendars([]);
            setSelectedItem(null);
            setError(null);
        } catch (err) {
            console.error("Logout error:", err);
        }
    }, [authManager]);

    const handleDateChange = useCallback((date: Date) => {
        setSelectedDate(date);
    }, []);

    const handleSelectItem = useCallback((item: CalendarEvent) => {
        setSelectedItem(item);
    }, []);

    const handleCloseModal = useCallback(() => {
        setSelectedItem(null);
    }, []);

    const handleRefresh = useCallback(() => {
        fetchData();
    }, [fetchData]);

    const handleToggleCalendar = useCallback((calendarId: string) => {
        setCalendars(prev =>
            prev.map(cal =>
                cal.id === calendarId
                    ? { ...cal, selected: cal.selected !== false ? false : true }
                    : cal
            )
        );
    }, []);

    const isSameDate = useCallback((d1: Date, d2: Date) => {
        return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
    }, []);

    // Filter events based on selected calendars and date
    const filteredEvents = events.filter((event) => {
        // Check if event's calendar is selected
        const eventCalendar = calendars.find(cal => cal.id === event.calendarId);
        if (eventCalendar && eventCalendar.selected === false) {
            return false;
        }

        // Check if event is on selected date
        try {
            const eventDate = event.start instanceof Date ? event.start : new Date(event.start);
            return isSameDate(eventDate, selectedDate);
        } catch {
            return false;
        }
    });

    return {
        authState,
        selectedDate,
        events,
        calendars,
        selectedItem,
        loading,
        error,
        filteredEvents,
        handleLogin,
        handleLogout,
        handleDateChange,
        handleSelectItem,
        handleCloseModal,
        handleRefresh,
        handleToggleCalendar,
    };
};