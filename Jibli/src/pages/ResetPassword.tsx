import { useCommerceCopy } from "../i18n/commerceCopy";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { getAuthErrorMessage, updatePassword } from "../auth";
import logo from "../assets/Fast-Logo.gif";

function ResetPassword() {
  const navigate = useNavigate();
  const copy = useCommerceCopy();
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
      setErrorMessage(copy("Password must be at least 6 characters."));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(copy("Passwords do not match."));
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await updatePassword(password);
      if (error) throw error;
      setSuccessMessage(copy("Password updated. You can now login with your new password."));
      window.setTimeout(() => navigate("/login", { replace: true }), 1500);
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, copy("Could not update your password. Please try again.")));
    } finally {
      setIsSubmitting(false);
    }
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
        <h1>{copy("Reset password")}</h1>
        <p>{copy("Choose a new password for your account.")}</p>
        {errorMessage && <div className="authError">{errorMessage}</div>}
        {successMessage && <div className="authNotice success">{successMessage}</div>}

        <form className="loginForm" onSubmit={handleReset}>
          <div className="loginInput">
            <KeyRound size={24} />
            <input
              name="password"
              type="password"
              placeholder={copy("New password")}
              aria-label={copy("New password")}
              minLength={6}
              required
            />
          </div>

          <div className="loginInput">
            <KeyRound size={24} />
            <input
              name="confirmPassword"
              type="password"
              placeholder={copy("Confirm new password")}
              aria-label={copy("Confirm new password")}
              minLength={6}
              required
            />
          </div>

          <button type="submit" className="authButton" disabled={isSubmitting}>
            {isSubmitting ? copy("Updating...") : copy("Update password")}
          </button>
        </form>

        <p className="forgotText">
          {copy("Remembered it?")} <Link to="/login">{copy("Login here")}</Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;
