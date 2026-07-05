import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { updatePassword } from "../auth";
import logo from "../assets/Fast-Logo.gif";

function ResetPassword() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const { error } = await updatePassword(password);
    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSuccessMessage("Password updated. You can now login with your new password.");
    window.setTimeout(() => navigate("/login", { replace: true }), 1500);
  };

  return (
    <div className="authPage">
      <header className="authTopbar">
        <Link to="/" className="authBrand">
          <img src={logo} alt="Jibli logo" className="logoImg" />
          <span>Jibli</span>
        </Link>
      </header>

      <div className="authCard">
        <img src={logo} alt="Jibli logo" className="authCardLogo" />
        <h1>Reset password</h1>
        <p>Choose a new password for your account.</p>
        {errorMessage && <div className="authError">{errorMessage}</div>}
        {successMessage && <div className="authNotice success">{successMessage}</div>}

        <form className="loginForm" onSubmit={handleReset}>
          <div className="loginInput">
            <KeyRound size={24} />
            <input
              name="password"
              type="password"
              placeholder="New password"
              aria-label="New password"
              minLength={6}
              required
            />
          </div>

          <div className="loginInput">
            <KeyRound size={24} />
            <input
              name="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              aria-label="Confirm new password"
              minLength={6}
              required
            />
          </div>

          <button type="submit" className="authButton" disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update password"}
          </button>
        </form>

        <p className="forgotText">
          Remembered it? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;
