"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useResetPasswordMutation } from "@/redux/features/authApiSlice";
import Image from "next/image";

const Page = () => {
  const [formData, setFormData] = useState({
    email: "",
  });

  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [error, setError] = useState("");

  // Validate email
  const validateEmail = (email: string) => {
    if (!email) {
      return "Required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      return "Invalid email format";
    }
    return "";
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const emailError = validateEmail(formData.email);
    setError(emailError);

    if (emailError) {
      return;
    }

    try {
      // Call the resetPassword mutation
      await resetPassword({ email: formData.email }).unwrap();

      // Display success message or redirect
      alert("Password reset link sent to your email.");
    } catch (error) {
      console.error("Password reset failed:", error);
      console.log(formData.email)
      setError("Failed to send reset link. Please try again.");
    }
  };

  return (
    <div className="page-container">
      <link rel="stylesheet" href="/Styles/Login.css" />
      <Link href="/">
        {/* <img src="/assets/logo-header.png" alt="Logo" className="logo-header" />
         */}
          <Image
                    src="/assets/logo-header.png"
                    alt="Logo"
                    width={285} // Adjust as needed
                    height={47}
                    className="logo-header"
                  />
      </Link>

      <div className="container">
        <h1>Reset Password</h1>
        <form onSubmit={handleSubmit} className="form-container">
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            className="form-input"
            required
          />
          {error && <p className="error">{error}</p>}
          <button type="submit" className="option-button" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
        <p className="switchLink">
          <Link href="/accounts/login" className="linkText">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Page;