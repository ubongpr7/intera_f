"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter,useSearchParams  } from "next/navigation";
import "./Login.css";
import { useLoginMutation } from "@/redux/features/authApiSlice";
import Image from "next/image";
import { useAppDispatch } from '@/redux/hooks';
import { setAuth } from '@/redux/features/authSlice';
import { toast } from 'react-toastify';
import { setCookie } from 'cookies-next'; 

export interface AuthResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    email: string;
  };
}
const LoginPage = () => {
  const router = useRouter();
	const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  // const [login, { data, isSuccess }] = useLoginMutation();
  const [login, {data, isLoading }] = useLoginMutation();
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  // Field validation function
  const validateField = (name: string, value: string) => {
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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Validate onBlur (when the user moves to another field)
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    validateField(e.target.name, e.target.value);

  };

  // Handle form submission
  // const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();

  //   // Validate all fields before submitting
  //   validateField("email", formData.email);
  //   validateField("password", formData.password);

  //   // Ensure no errors exist before submitting
  //   if (errors.email || errors.password) {
  //     alert("Please fix the errors before submitting.");
  //     return;
  //   }

  //   try {
  //     await login({ email: formData.email, password: formData.password }).unwrap();

  //     router.push("/main");
  //   } catch (error) {
  //     // console.error("Login failed:", error);
  //     // alert(`${error.data.detail}`);
  //   }
  // };
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
    
      validateField("email", formData.email);
      validateField("password", formData.password);
    
      if (errors.email || errors.password) {
        alert("Please fix the errors before submitting.");
        return;
      }

    
      try {
        // const response = await login({ email: formData.email, password: formData.password }).unwrap();
        
        // login({ email: formData.email, password: formData.password }).unwrap()
        // .then(() => {
        //   dispatch(setAuth());
        //   toast.success('Logged in');
        //   router.push('/dashboard');
        // })
        // .catch(() => {
        //   toast.error('Failed to log in');
        // });

        login({ email: formData.email, password: formData.password })
        .unwrap()
        .then((response:AuthResponse) => {
          if (response?.access) {
            // Store access token
            setCookie('accessToken', response.access, { maxAge: 60 * 60, path: '/' }); // 1 hour expiration
          }

          if (response?.refresh) {
            // Store refresh token
            setCookie('refreshToken', response.refresh, { maxAge: 60 * 60 * 24 * 7, path: '/' }); // 7 days expiration
          }

          dispatch(setAuth());
          toast.success('Logged in');
          if (next) {
            router.push(next);
          } else {
            router.push('/dashboard');
          }
        })
        .catch(() => {
          toast.error('Failed to log in');
        });
    
        
      } catch (error) {
        // alert("Login failed: " + error?.data?.detail);
      }
    };
  
  return (
    <div className="page-container">
      {/* Logo */}
      <Link href="/">
        {/* <img src="/assets/logo-header.png" alt="Logo" className="logo-header" /> */}
        <Image
            src="/assets/logo-header.png"
            alt="Logo"
            width={150} // Adjust as needed
            height={150}
            className="logo-header"
          />
      </Link>

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
              {/* <img
                src={showPassword ? "/assets/eye-off.svg" : "/assets/eye.svg"}
                alt="Toggle Password Visibility"
                width="20"
                height="20"
              /> */}
              <Image
            src="/assets/logo-header.png"
            alt="Logo"
            width={20} // Adjust as needed
            height={20}
            className="logo-header"
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

          {/* Submit Button */}
          <button type="submit" className="option-button" disabled={isLoading}>
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
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
