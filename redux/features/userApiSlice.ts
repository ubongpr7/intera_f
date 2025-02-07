import { apiSlice } from '../services/apiSlice';

interface User {
    id: number;
    username: string;
    email: string;
}

const ads_manager_api = 'ads_manager_api';

const userApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getUsers: builder.query<User[], void>({
            query: () => `/${ads_manager_api}/users/`,
        }),
        getUser: builder.query<User, number>({
            query: (id) => `/${ads_manager_api}/users/${id}/`,
        }),
    }),
});

export const {
    useGetUsersQuery,
    useGetUserQuery,
} = userApiSlice;
