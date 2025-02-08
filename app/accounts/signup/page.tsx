"use client";

import { useState, FormEvent, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Head from "next/head";
import Image from "next/image";
import Spinner from "@/components/common/Spinner";
import { useRegisterMutation } from "@/redux/features/authApiSlice";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../login/Login.css";

interface FormData {
  first_name: string;
  email: string;
  password: string;
  re_password: string;
  sessionId?: string;
}

interface Errors {
  first_name: string;
  email: string;
  password: string;
  re_password: string;
}

const RegisterPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id") || ""; // Extract session_id from URL if available

  const [register, { isLoading }] = useRegisterMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    email: "",
    password: "",
    re_password: "",
    sessionId, // Assign directly from URL parameter
  });

  const [errors, setErrors] = useState<Errors>({
    first_name: "",
    email: "",
    password: "",
    re_password: "",
  });

  const validateField = (name: keyof FormData, value: string) => {
    let error = "";

    switch (name) {
      case "first_name":
        error = value.trim() === "" ? "Name is required" : "";
        break;
      case "email":
        error = /\S+@\S+\.\S+/.test(value) ? "" : "Invalid email";
        break;
      case "password":
        error = value.length >= 6 ? "" : "Password must be at least 6 characters";
        break;
      case "re_password":
        error = value === formData.password ? "" : "Passwords do not match";
        break;
      default:
        break;
    }

    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: error,
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    validateField(name as keyof FormData, value);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    validateField(e.target.name as keyof FormData, e.target.value);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Validate all fields before submission
    const isFormValid = Object.keys(formData).every((key) => {
      const value = formData[key as keyof FormData];
      if (value === undefined) return false;

      validateField(key as keyof FormData, value);
      return !errors[key as keyof Errors];
    });

    if (!isFormValid) {
      alert("Please fix the errors before submitting.");
      return;
    }
    setIsSubmitting(true);

    // try {
    //   await register(formData).unwrap();
    //   router.push("/accounts/login");
    // } catch (error) {
    //   console.error("Registration failed:", error);
    //   alert("Registration failed. Please try again.");
    // }
  };
  useEffect(() => {
    if (!isSubmitting) return;

    const registerUser = async () => {
      try {
        await register(formData).unwrap();
        toast.success("Registration successful! Redirecting...");
        router.push("/accounts/login");
      } catch (error) {
        toast.error("Registration failed. Please try again.");
      } finally {
        setIsSubmitting(false); // Reset after completion
      }
    };

    registerUser();
  }, [isSubmitting, register, formData, router]);


  return (
    <div className="page-container">
      {/* Move <link> inside <Head> for proper SSR handling */}
      <Head>
        <link rel="stylesheet" href="/Styles/Login.css" />
      </Head>
      <ToastContainer position="top-right" autoClose={3000} />

      <Link href="/">
        <Image
          src="/assets/logo-header.png"
          alt="Logo"
          width={285} // Adjust as needed
          height={47}
          className="logo-header"
        />
      </Link>

      <div className="container">
        <h1>Register</h1>

        <form onSubmit={handleSubmit} className="form-container">
          {/* Name */}
          <input
            type="text"
            name="first_name"
            placeholder="Name"
            value={formData.first_name}
            onChange={handleChange}
            onBlur={handleBlur}
            className="form-input"
            required
          />
          {errors.first_name && <p className="error">{errors.first_name}</p>}

          {/* Email */}
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            className="form-input"
            required
          />
          {errors.email && <p className="error">{errors.email}</p>}

          {/* Password */}
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur}
            className="form-input"
            required
          />
          {errors.password && <p className="error">{errors.password}</p>}

          {/* Confirm Password */}
          <input
            type="password"
            name="re_password"
            placeholder="Confirm Password"
            value={formData.re_password}
            onChange={handleChange}
            onBlur={handleBlur}
            className="form-input"
            required
          />
          {errors.re_password && <p className="error">{errors.re_password}</p>}

          {/* Submit Button */}
          <button
            type="submit"
            className="option-button"
            disabled={isLoading}
          >
            {isLoading ? <Spinner sm /> : "Create account"}
          </button>
        </form>

        <p className="switchLink">
          Already have an account?{" "}
          <Link href="/accounts/login" className="linkText">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
