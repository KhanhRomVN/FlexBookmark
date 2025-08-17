import { useState, useEffect, useCallback } from "react";
import CalendarPanel from "../../components/TaskAndEvent/CalendarPanel";
import TimeLinePanel from "../../components/TaskAndEvent/TimeLinePanel";
import { fetchGoogleEvents } from "../../../utils/GGCalender";
import { fetchGoogleTasks, fetchGoogleTaskGroups } from "../../../utils/GGTask";
import ChromeAuthManager, { AuthState } from "../../../utils/chromeAuth";

export interface CalendarEvent {
    id: string;
    title: string;
    start: Date | string;
    end: Date | string;
    description?: string;
    location?: string;
    attendees?: string[];
}

export interface Task {
    endTime: Date | string;
    folder: any;
    id: string;
    title: string;
    due?: Date | string;
    completed: boolean;
    notes?: string;
}

export const useTaskAndEventData = () => {
    const authManager = ChromeAuthManager.getInstance();
    const [authState, setAuthState] = useState<AuthState>({
        isAuthenticated: false,
        user: null,
        loading: true,
        error: null,
    });
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedItem, setSelectedItem] = useState<CalendarEvent | Task | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [taskLists, setTaskLists] = useState<any[]>([]);

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
            const lists = await fetchGoogleTaskGroups(authState.user.accessToken);
            setTaskLists(lists);
            const defaultList = lists.length > 0 ? lists[0].id : "@default";
            const [evts, tks] = await Promise.all([
                fetchGoogleEvents(authState.user.accessToken),
                fetchGoogleTasks(authState.user.accessToken, defaultList),
            ]);
            setEvents(evts);
            setTasks(tks);
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
            setTasks([]);
            setTaskLists([]);
            setSelectedItem(null);
            setError(null);
        } catch (err) {
            console.error("Logout error:", err);
        }
    }, [authManager]);

    const handleDateChange = useCallback((date: Date) => {
        setSelectedDate(date);
    }, []);

    const handleSelectItem = useCallback((item: CalendarEvent | Task) => {
        setSelectedItem(item);
    }, []);

    const handleCloseModal = useCallback(() => {
        setSelectedItem(null);
    }, []);

    const handleRefresh = useCallback(() => {
        fetchData();
    }, [fetchData]);

    const isSameDate = useCallback((d1: Date, d2: Date) => {
        return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
    }, []);

    const filteredEvents = events.filter((e) => {
        try {
            const dt = e.start instanceof Date ? e.start : new Date(e.start);
            return isSameDate(dt, selectedDate);
        } catch {
            return false;
        }
    });

    const filteredTasks = tasks.filter((t) => {
        if (!t.due) return false;
        try {
            const dt = t.due instanceof Date ? t.due : new Date(t.due);
            return isSameDate(dt, selectedDate);
        } catch {
            return false;
        }
    });

    return {
        authState,
        selectedDate,
        events,
        tasks,
        selectedItem,
        loading,
        error,
        taskLists,
        filteredEvents,
        filteredTasks,
        handleLogin,
        handleLogout,
        handleDateChange,
        handleSelectItem,
        handleCloseModal,
        handleRefresh,
    };
};