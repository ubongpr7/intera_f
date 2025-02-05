import { useCreateAdAccountMutation } from "@/redux/features/adAccountApiSlice"; 
import { toast } from "react-toastify";

interface Props {
  access_token: string;
  ad_account_id: string;
}

const CreateAdAccountComponent: React.FC<Props> = ({ access_token, ad_account_id }) => {
  const [createAdAccount, { isLoading }] = useCreateAdAccountMutation();

  const handleCreate = async () => {
    try {
      const newAdAccount = {
        ad_account_id,
        access_token,
      };
      await createAdAccount(newAdAccount).unwrap();
      toast.success("Account Setup Successful!");
    } catch (error) {
      console.error("Failed to create ad account:", error);
      toast.error("Failed to create ad account.");
    }
  };

  return (
    <button onClick={handleCreate} disabled={isLoading}>
      {isLoading ? "Creating..." : "Create Ad Account"}
    </button>
  );
};

export default CreateAdAccountComponent;
