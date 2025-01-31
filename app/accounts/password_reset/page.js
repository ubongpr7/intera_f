"use client";

import { useState } from "react";
import Link from "next/link";

const Page = () => {
    const [formData, setFormData] = useState({
        email: "",
    });

    const [error, setError] = useState("");

    // Validate email
    const validateEmail = (email) => {
        if (!email) {
            return "Required";
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            return "Invalid email format";
        }
        return "";
    };

    // Handle input change
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        const emailError = validateEmail(formData.email);
        setError(emailError);

        if (!emailError) {
            console.log("Reset Password Request Submitted:", formData);
        }
    };

    return (
        <div className="page-container">
            <link rel="stylesheet" href="/Styles/Login.css" />
            <Link href="/"><img src="/assets/logo-header.png" alt="Logo" className="logo-header" /></Link>

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
                    <button type="submit" className="option-button">
                        Send Reset Link
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
