import { create } from "zustand";
import { toast } from "react-hot-toast";
import apiClient, { registerAuthHandlers } from "../lib/apiClient";
import { translate } from "../lib/locale";

export const useUserStore = create((set) => ({
        user: null,
        loading: false,
        checkingAuth: true,

        signup: async ({ name, email, password, confirmPassword }) => {
                set({ loading: true });

                if (password !== confirmPassword) {
                        set({ loading: false });
                        return toast.error(translate("common.messages.passwordMismatch"));
                }

                try {
                        const data = await apiClient.post("/auth/signup", { name, email, password });
                        set({ user: data, loading: false });
                } catch (error) {
                        set({ loading: false });
                        toast.error(error.response?.data?.message || translate("toast.genericError"));
                }
        },
        login: async (email, password) => {
                set({ loading: true });

                try {
                        const data = await apiClient.post("/auth/login", { email, password });

                        set({ user: data, loading: false });
                } catch (error) {
                        set({ loading: false });
                        toast.error(error.response?.data?.message || translate("toast.genericError"));
                }
        },

        logout: async () => {
                try {
                        await apiClient.post("/auth/logout");
                        set({ user: null });
                } catch (error) {
                        toast.error(error.response?.data?.message || translate("toast.logoutError"));
                }
        },

        checkAuth: async () => {
                set({ checkingAuth: true });
                try {
                        const data = await apiClient.get("/auth/profile");
                        set({ user: data, checkingAuth: false });
                } catch (error) {
                        console.log(error.message);
                        set({ checkingAuth: false, user: null });
                }
        },

        refreshToken: async () => {
                set({ checkingAuth: true });
                try {
                        const data = await apiClient.post("/auth/refresh-token", undefined, {
                                skipAuthRetry: true,
                        });
                        set({ checkingAuth: false });
                        return data;
                } catch (error) {
                        set({ user: null, checkingAuth: false });
                        throw error;
                }
        },
}));

registerAuthHandlers({
        onRefresh: () => useUserStore.getState().refreshToken(),
        onLogout: () => useUserStore.setState({ user: null, checkingAuth: false }),
});
