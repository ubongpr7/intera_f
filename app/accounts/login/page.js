"use client";

import { useState } from "react";
import Link from "next/link";
import ReCAPTCHA from "react-google-recaptcha";
import "./Login.css";

const LoginPage = () => {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        rememberMe: false,
        recaptcha: null,
    });

    const [errors, setErrors] = useState({
        email: "",
        password: "",
    });

    const [showPassword, setShowPassword] = useState(false);

    // Field validation function
    const validateField = (name, value) => {
        let error = "";

        switch (name) {
            case "email":
                if (!value) {
                    error = "Required";
                } else if (!/\S+@\S+\.\S+/.test(value)) {
                    error = "Invalid email";
                }
                break;
            case "password":
                if (!value) {
                    error = "Required";
                } else if (value.length < 6) {
                    error = "Password must be at least 6 characters";
                }
                break;
            default:
                break;
        }

        setErrors((prevErrors) => ({
            ...prevErrors,
            [name]: error,
        }));
    };

    // Handle input change
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value,
        });
    };

    // Validate onBlur (when the user moves to another field)
    const handleBlur = (e) => {
        validateField(e.target.name, e.target.value);
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate all fields before submitting
        validateField("email", formData.email);
        validateField("password", formData.password);

        // Ensure no errors exist before submitting
        if (!errors.email && !errors.password && formData.recaptcha) {
            console.log("Form Data Submitted:", formData);
        }
        
    };

    return (
        <div className="page-container">
            {/* Logo */}
            <Link href="/"><img src="/assets/logo-header.png" alt="Logo" className="logo-header" /></Link>

            {/* Login Container */}
            <div className="container">
                <h1>Login</h1>

                <form onSubmit={handleSubmit} className="form-container">
                    {/* Email Input */}
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

                    {/* Password Input */}
                    <div className="password-container">
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className="form-input"
                            required
                        />
                        <span
                            onClick={() => setShowPassword(!showPassword)}
                            className="password-toggle"
                        >
                            <img
                                src={showPassword ? "/assets/eye-off.svg" : "/assets/eye.svg"}
                                alt="Toggle Password Visibility"
                                width="20"
                                height="20"
                            />
                        </span>
                    </div>
                    {errors.password && <p className="error">{errors.password}</p>}

                    {/* Remember Me Checkbox */}
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                        <input
                            type="checkbox"
                            name="rememberMe"
                            checked={formData.rememberMe}
                            onChange={handleChange}
                        />
                        <span className="remember-me-text">Remember me</span>
                    </div>

                    {/* Google reCAPTCHA */}
                    {/* <ReCAPTCHA
                        sitekey="YOUR_GOOGLE_RECAPTCHA_SITE_KEY"
                        onChange={(value) => setFormData({ ...formData, recaptcha: value })}
                    />
                    {!formData.recaptcha && <p className="error">Please verify reCAPTCHA</p>} */}

                    {/* Submit Button */}
                    <Link href="/main"><button type="submit" className="option-button">
                        Sign In
                    </button></Link>
                </form>

                {/* Links */}
                <p className="switchLink">
                    Don’t have an account?{" "}
                    <Link href="/accounts/signup" className="linkText">
                        Register
                    </Link>
                </p>
                <p className="switchLink">
                    <Link href="/accounts/password_reset" className="linkText">
                        Forgot your password?
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
