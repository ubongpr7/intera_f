import { AddressForm } from "@/components/management/companyCreationForm"

export default function AddressPage() {
  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl text-center font-bold mb-6">Company Main Address </h1>
      <AddressForm />
    </div>
  );
}