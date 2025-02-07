// import { useGetAdAccountsQuery } from "../features/adAccountApiSlice";
// import Image from "next/image";

// // interface account{
// //     id:number,
// //     name:string
// // }
// const AdAccountsList = () => {
//     const { data: adAccounts, isLoading, isError } = useGetAdAccountsQuery();

//     if (isLoading) return <p>Loading...</p>;
//     if (isError) return <p>Error fetching ad accounts</p>;

//     return (
//         <div>
//             <h4>Ad Accounts</h4>
//             {adAccounts?.length > 0 ? (
//                 adAccounts.map((account, index) => (  // Add index parameter
//                     <div key={account.id}>
//                         <button
//                             className="accountButton"
//                             onClick={() => console.log(`Selected: ${account.account_name}`)}
//                         >
//                             <Image src="/assets/user-round.png" alt="User Icon" width={20} height={20} className="icon" />
//                             {`Ad Account ${index + 1}`}  {/* ✅ Use index to number the accounts */}
//                         </button>
//                         <p>{account.account_name}</p>
//                     </div>
//                 ))
//             ) : (
//                 <p>No ad accounts available</p>
//             )}
//         </div>
//     );
// };

// export default AdAccountsList;
const AdAccountsList = ({ adAccounts }) => {
    if (!adAccounts) return <p>Loading...</p>;

    return (
        <div>
            <h4>Ad Accounts</h4>
            {adAccounts.length > 0 ? (
                adAccounts.map((account, index) => (
                    <div key={account.id}>
                        <button className="accountButton">
                            <img src="/assets/user-round.png" alt="User Icon" width={20} height={20} className="icon" />
                            {`Ad Account ${index + 1}`}
                        </button>
                        <p>{account.account_name}</p>
                    </div>
                ))
            ) : (
                <p>No ad accounts available</p>
            )}
        </div>
    );
};

export default AdAccountsList;
