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
const AdAccountsList = ({ adAccounts,handleAccountClick,activeAccount,handleSetActiveAd }) => {
    if (!adAccounts) return <p>Loading...</p>;

    return (
        <div>
            <h4>Ad Accounts</h4>
            {adAccounts.length > 0 ? (
                adAccounts.map((account, index) => (
                    <div key={account.id}>
                        <button
                        className={`accountButton ${activeAccount === index + 1 ? 'accountActive' : ''}`}
                        onClick={() => {
                            handleAccountClick(index + 1);
                            handleSetActiveAd(account);
                        }}
                        aria-label={`Switch to Ad Account ${index + 1}`}
                        >
                            <img src="/assets/user-round.png" alt="User Icon" width={20} height={20} className="icon" />
                            {`Ad Account ${index + 1}`}
                        </button>
                        {activeAccount === index + 1 && <p style={{ textAlign: "center", marginTop: "10px", }}>{account.account_name}</p>}
                    </div>
                ))
            ) : (
                <p>No ad accounts available</p>
            )}
        </div>
    );
};

export default AdAccountsList;
