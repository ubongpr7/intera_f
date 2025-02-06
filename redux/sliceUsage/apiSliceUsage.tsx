import { useGetAdAccountsQuery } from "../features/adAccountApiSlice";
import Image from "next/image";


const AdAccountsList = () => {
    const { data: adAccounts, isLoading, isError } = useGetAdAccountsQuery();

    if (isLoading) return <p>Loading...</p>;
    if (isError) return <p>Error fetching ad accounts</p>;

    return (
        <div>
            <h2>Ad Accounts</h2>
            {adAccounts?.length > 0 ? (
                adAccounts.map((account) => (
                    <button
                        key={account.id}
                        className="accountButton"
                        onClick={() => console.log(`Selected: ${account.account_name}`)}
                    >
                        <Image src="/assets/user-round.png" alt="User Icon" width={20} height={20} className="icon" />
                        {account.account_name}
                    </button>
                ))
            ) : (
                <p>No ad accounts available</p>
            )}
        </div>
    );
};

export default AdAccountsList;
