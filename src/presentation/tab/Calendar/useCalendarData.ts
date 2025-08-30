import { useState, useEffect, useCallback } from "react";
import { fetchGoogleEvents, fetchGoogleCalendars, createGoogleEvent, updateGoogleEvent } from "../../../utils/GGCalender";
import ChromeAuthManager, { AuthState } from "../../../utils/chromeAuth";
import type { CalendarEvent, GoogleCalendar } from "../../types/calendar";
import { startOfWeek, endOfWeek } from "date-fns";

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
    const [needsReauth, setNeedsReauth] = useState<boolean>(false);

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

    // NEW: Check calendar write permissions on auth
    useEffect(() => {
        if (authState.isAuthenticated && authState.user) {
            const checkPermissions = async () => {
                const hasWritePermission = await authManager.hasCalendarWritePermission();
                setNeedsReauth(!hasWritePermission);

                if (!hasWritePermission) {
                    setError("Cần cấp quyền để tạo/chỉnh sửa sự kiện. Vui lòng đăng nhập lại.");
                }
            };

            checkPermissions();
        }
    }, [authState.isAuthenticated, authState.user, authManager]);

    // NEW: Handle re-authentication for calendar write permissions
    const handleForceReauth = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            await authManager.forceReauth();
            setNeedsReauth(false);
            // Refresh data after re-auth
            setTimeout(() => {
                fetchData();
            }, 500);
        } catch (error) {
            console.error("Re-authentication error:", error);
            setError("Không thể cấp quyền. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    }, [authManager, fetchData]);

    const handleSaveEvent = useCallback(async (event: CalendarEvent) => {
        if (!authState.isAuthenticated || !authState.user?.accessToken) {
            setError("Không thể lưu: Chưa đăng nhập");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let savedEvent: CalendarEvent;

            // Check if this is a new event (temp ID or no existing event with this ID)
            const isNewEvent = event.id.startsWith('temp-') || !events.find(e => e.id === event.id);

            if (isNewEvent) {
                // Create new event
                savedEvent = await createGoogleEvent(authState.user.accessToken, event);

                // Add to local state
                setEvents(prev => [...prev, savedEvent]);
            } else {
                // Update existing event
                savedEvent = await updateGoogleEvent(authState.user.accessToken, event);

                // Update local state
                setEvents(prev => prev.map(e => e.id === event.id ? savedEvent : e));
            }


            // Refresh data to ensure sync
            setTimeout(() => {
                fetchData();
            }, 500);

        } catch (err) {
            console.error("Save event error:", err);

            if (err instanceof Error) {
                if (err.message === 'UNAUTHORIZED') {
                    setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
                    handleLogout();
                } else if (err.message.includes('403') || err.message.includes('insufficient authentication scopes') || err.message.includes('insufficientPermissions')) {
                    // Handle permission error specifically
                    setError("Không có quyền tạo/chỉnh sửa sự kiện. Cần cấp quyền bổ sung.");
                    setNeedsReauth(true);
                } else {
                    setError(`Lỗi lưu sự kiện: ${err.message}`);
                }
            } else {
                setError("Lỗi không xác định khi lưu sự kiện");
            }
        } finally {
            setLoading(false);
        }
    }, [authState.isAuthenticated, authState.user?.accessToken, events]);

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
            setNeedsReauth(false);
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

    // Filter events based on selected calendars and week
    const filteredEvents = events.filter((event) => {
        // Check if event's calendar is selected
        const eventCalendar = calendars.find(cal => cal.id === event.calendarId);
        if (eventCalendar && eventCalendar.selected === false) {
            return false;
        }

        // Check if event is within the current week being displayed
        try {
            const eventDate = event.start instanceof Date ? event.start : new Date(event.start);

            // Get week boundaries for the selected date
            const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
            const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 }); // Sunday

            // Check if event falls within this week
            return eventDate >= weekStart && eventDate <= weekEnd;
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
        needsReauth, // NEW: Export this flag
        handleLogin,
        handleLogout,
        handleDateChange,
        handleSelectItem,
        handleCloseModal,
        handleRefresh,
        handleToggleCalendar,
        handleSaveEvent,
        handleForceReauth, // NEW: Export this function
    };
};