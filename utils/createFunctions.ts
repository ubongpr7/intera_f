import { useCreateAdAccountMutation } from "@/redux/features/adAccountApiSlice"; 
import { toast } from "react-toastify";

export const   CreateAdAccountComponent = (access_token:string,ad_account_id:string) => {
    const [createAdAccount, { isLoading, isError, data }] = useCreateAdAccountMutation();

    const handleCreate = async () => {
        try {
            const newAdAccount = {
                ad_account_id:ad_account_id,
                access_token: ad_account_id,
                
            };
            await createAdAccount(newAdAccount).unwrap();

            toast.success('Account Setup Successful!');
        } catch (error) {
            console.error("Failed to create ad account:", error);
        }
    };

};
