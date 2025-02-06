
useEffect(() => {
    if (accessToken && userID) {
        
        fetchAdAccounts(accessToken).then((accounts) => {
          if (accounts) {
            
            console.log("Ad Accounts:", accounts);
          } else {
            console.log("Failed to fetch ad accounts.");
          }
});


    }
  }, [accessToken, userID]);