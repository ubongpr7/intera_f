"use client";

import { useState } from "react";
import Link from "next/link";
import ReCAPTCHA from "react-google-recaptcha";
// import "../login/Login.css";
const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    recaptcha: null,
  });

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "name":
        error = value.trim() === "" ? "Name is required" : "";
        break;
      case "email":
        error = /\S+@\S+\.\S+/.test(value) ? "" : "Invalid email";
        break;
      case "password":
        error = value.length >= 6 ? "" : "Password must be at least 6 characters";
        break;
      case "confirmPassword":
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleBlur = (e) => {
    validateField(e.target.name, e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form Data Submitted:", formData);
  };

  return (
    <div className="page-container">
      {/* Logo */}
      <link rel="stylesheet" href="/Styles/Login.css" />

      <Link href="/"><img src="/assets/logo-header.png" alt="Logo" className="logo-header" /></Link>


      {/* Register Container */}
      <div className="container">
        <h1>Register</h1>

        <form onSubmit={handleSubmit} className="form-container">
          {/* Name Input */}
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            className="form-input"
            required
          />
          {errors.name && <p className="error">{errors.name}</p>}

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
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              className="form-input"
              required
            />
          </div>
          {errors.password && <p className="error">{errors.password}</p>}

          {/* Confirm Password Input */}
          <div className="password-container">
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              className="form-input"
              required
            />
          </div>
          {errors.confirmPassword && <p className="error">{errors.confirmPassword}</p>}

          {/* Google reCAPTCHA */}
          <ReCAPTCHA
            sitekey="YOUR_GOOGLE_RECAPTCHA_SITE_KEY"
            onChange={(value) => setFormData({ ...formData, recaptcha: value })}
          />

          {/* Submit Button */}
          <button type="submit" className="option-button">
            Create account
          </button>
        </form>

        {/* Links */}
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
