import { useGetAdAccountsQuery } from "../features/adAccountApiSlice";
import React, { useState, useEffect } from "react";
import { getCookie ,setCookie} from "cookies-next";

const AdAccountsList = ({ handleAccountClick,activeAccount }) => {
      const { data: adAccounts, refetch } = useGetAdAccountsQuery();

      useEffect(() => {
        const checkRefresh = () => {
            const shouldRefresh = getCookie("refresh") === "true";
            console.log('shouldRefresh: ', shouldRefresh)
            if (shouldRefresh) {
                refetch();  
                setCookie("refresh", "false");  
            }
        };

        const interval = setInterval(checkRefresh, 1000);

        return () => clearInterval(interval); 
    }, [refetch]);

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
                            handleAccountClick(index + 1,account);
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
