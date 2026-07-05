import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { KeyRound, Mail, Phone, User } from "lucide-react";
import { ensureUserProfile, signUp } from "../auth";
import logo from "../assets/Fast-Logo.gif";

function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/request";
  const loginPath = `/login?next=${encodeURIComponent(nextPath)}`;
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get("fullName") ?? "");
    const email = String(formData.get("email") ?? "");
    const phone = String(formData.get("phone") ?? "");
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    const { data, error } = await signUp(email, password, {
      full_name: fullName,
      phone,
    });

    if (error) {
      setIsSubmitting(false);
      setErrorMessage(error.message);
      return;
    }

    if (data.session) {
      try {
        await ensureUserProfile({
          full_name: fullName,
          phone,
        });
      } catch (profileError) {
        setIsSubmitting(false);
        setErrorMessage(
          profileError instanceof Error
            ? profileError.message
            : "Account created, but profile creation failed.",
        );
        return;
      }

      setIsSubmitting(false);
      navigate(nextPath, { replace: true });
      return;
    }

    setIsSubmitting(false);
    navigate(`${loginPath}&registered=1`, { replace: true });
  };

  return (
    <div className="authPage">
      <header className="authTopbar">
        <Link to="/" className="authBrand">
          <img src={logo} alt="Jibli logo" className="logoImg" />
          <span>Jibli</span>
        </Link>

        <div className="authNavActions">
          <Link to="/" className="authOutlineBtn">
            Back to Home
          </Link>
          <Link to={loginPath} className="authPrimaryBtn">
            Login
          </Link>
        </div>
      </header>

      <div className="authCard registerCard">
        <img src={logo} alt="Jibli logo" className="authCardLogo" />

        <h1>Register</h1>
        <p>Create your account</p>
        <div className="authNotice">Your account keeps your panier and order tracking in one place.</div>
        {errorMessage && <div className="authError">{errorMessage}</div>}

        <form className="loginForm" onSubmit={handleRegister}>
          <div className="loginInput">
            <User size={24} />
            <input
              name="fullName"
              type="text"
              placeholder="Full name"
              aria-label="Full name"
              required
            />
          </div>

          <div className="loginInput">
            <Mail size={24} />
            <input name="email" type="email" placeholder="Email" aria-label="Email" required />
          </div>

          <div className="loginInput">
            <Phone size={24} />
            <input
              name="phone"
              type="tel"
              placeholder="Phone number"
              aria-label="Phone number"
              required
            />
          </div>

          <div className="loginInput">
            <KeyRound size={24} />
            <input
              name="password"
              type="password"
              placeholder="Password"
              aria-label="Password"
              required
              minLength={6}
            />
          </div>

          <div className="loginInput">
            <KeyRound size={24} />
            <input
              name="confirmPassword"
              type="password"
              placeholder="Confirm password"
              aria-label="Confirm password"
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="authButton" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="forgotText">
          Already have an account? <Link to={loginPath}>Login here</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
