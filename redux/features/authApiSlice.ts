import { headers } from "next/headers";
import { apiSlice } from "../services/apiSlice";
import { login } from "./authSlice";
import { verify } from "crypto";
interface User{
    first_name:string;
    last_name:string;
    email:string;

}
interface SocialAuthArgs{
    provider:string
}
const authApiSlice=apiSlice.injectEndpoints({
    endpoints:builder=>({
        retrieveUser:builder.query({
            query:()=>'/auth-api/refresh',
        }),
        socialAuthRetrieve:builder.mutation({
            query:({provider,state,code})=>{
                url:`/o/${provider}/?state=${encodeURIComponent(state)}&code=${encodeURIComponent(code)}`,
                method:'POST',
                headers:{
                    Accept:'application/json',
                    'Content-Type':'application/x-www-form-urlencode'
                }
            }
        }),
        register:builder.mutation(
            {
                query:(first_name,last_name,email,password,re_password)=>({
                    url:'/auth-api/user/',
                    method:'POST',
                    body:{first_name,last_name,email,password,re_password}
                }),
        }),
        login:builder.mutation(
            {
                query:(email,password)=>({
                    url:'/auth-api/login',
                    method:'POST',
                    body:{email,password}
                }),
        }),
        logout:builder.mutation({
            query:()=>({
                url:'/account/token/logout/',
                method:'POST'
            })
        }),
        verify:builder.mutation({
            query:()=>({
                url:'/account/token/verify/',
                method:'POST',
            })
        }),
        activation:builder.mutation({
            query:(uid,token)=>({
                url:'/auth-api/users/activation',
                method:'POST',
                body:{uid,token}
            })
        }),
        resetPassword:builder.mutation({
            query:(email)=>({
                url:'/auth-api/users/reset_password/',
                method:'POST',
                body:{email}
            })
        }),
        resetPasswordConfirm:builder.mutation({
            query:(uid,token,new_assword,re_new_password)=>({
                url:'/auth-api/users/reset_password_confirm/',
                method:'POST',
                body:{uid,token,new_assword,re_new_password}
            })
        }),
    })
})

export const {
    useRetrieveUserQuery,
    useRegisterMutation,
    useVerifyMutation,
    useLoginMutation,
    useLogoutMutation,
    useActivationMutation,
    useResetPasswordMutation,
    useResetPasswordConfirmMutation,
    useSocialAuthRetrieveMutation,
    }=authApiSlice;

