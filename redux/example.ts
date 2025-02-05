// import { useCreateAdAccountMutation } from '../services/adAccountApiSlice';

// const CreateAdAccountComponent = () => {
//     const [createAdAccount, { isLoading, isError, data }] = useCreateAdAccountMutation();

//     const handleCreate = async () => {
//         try {
//             const newAdAccount = {
//                 ad_account_id: "123456",
//                 pixel_id: "654321",
//                 facebook_page_id: "987654",
//                 app_id: "111111",
//                 app_secret: "secret_key",
//                 access_token: "access_token_here",
//                 is_bound: true,
//                 name: "My Ad Account",
//                 business_manager_id: "222222"
//             };
//             await createAdAccount(newAdAccount).unwrap();
//             alert('Ad Account Created!');
//         } catch (error) {
//             console.error("Failed to create ad account:", error);
//         }
//     };

//     return (
//         <button onClick={handleCreate} disabled={isLoading}>
//             {isLoading ? 'Creating...' : 'Create Ad Account'}
//         </button>
//     );
// };


// import { useGetAdAccountsQuery } from '../services/adAccountApiSlice';

// const AdAccountsList = () => {
//     const { data: adAccounts, isLoading, error } = useGetAdAccountsQuery();

//     if (isLoading) return <p>Loading...</p>;
//     if (error) return <p>Error loading ad accounts</p>;

//     return (
//         <ul>
//             {adAccounts?.map(account => (
//                 <li key={account.id}>{account.name}</li>
//             ))}
//         </ul>
//     );
// };
