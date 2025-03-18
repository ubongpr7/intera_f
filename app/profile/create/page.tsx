// app/create-company/page.tsx
import CompanyForm from "components/management/companyCreationForm";

export default function CreateCompanyPage() {
  return (
    <div className="min-h-screen  bg-gray-50 flex items-center justify-center p-4">
      <CompanyForm />
    </div>
  );
}