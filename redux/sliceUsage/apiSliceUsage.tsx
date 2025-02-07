import { useGetAdAccountsQuery } from "../features/adAccountApiSlice";
import Image from "next/image";

// interface account{
//     id:number,
//     name:string
// }
const AdAccountsList = () => {
    const { data: adAccounts, isLoading, isError } = useGetAdAccountsQuery();

    if (isLoading) return <p>Loading...</p>;
    if (isError) return <p>Error fetching ad accounts</p>;

    return (
        <div>
            <h4>Ad Accounts</h4>
            {adAccounts?.length > 0 ? (
                adAccounts.map((account) => (
                    <button
                        key={account.id}
                        className="accountButton"
                        onClick={() => console.log(`Selected: ${account.account_name}`)}
                    >
                        <Image src="/assets/user-round.png" alt="User Icon" width={20} height={20} className="icon" />
                        {account.name}
                        </button>
                       <p> {account.account_name}</p>
                ))
            ) : (
                <p>No ad accounts available</p>
            )}
        </div>
    );
};

export default AdAccountsList;
