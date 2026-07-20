import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAdminEmail } from "../admin";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";

const tunisianGovernorates = [
  "Ariana",
  "Beja",
  "Ben Arous",
  "Bizerte",
  "Gabes",
  "Gafsa",
  "Jendouba",
  "Kairouan",
  "Kasserine",
  "Kebili",
  "Kef",
  "Mahdia",
  "Manouba",
  "Medenine",
  "Monastir",
  "Nabeul",
  "Sfax",
  "Sidi Bouzid",
  "Siliana",
  "Sousse",
  "Tataouine",
  "Tozeur",
  "Tunis",
  "Zaghouan",
];

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message ?? fallback);
  }

  return fallback;
};

function Account() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [email, setEmail] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        setIsLoading(false);
        return;
      }

      const accountEmail = userData.user.email ?? "";
      setEmail(accountEmail);
      setOriginalEmail(accountEmail);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, phone, city, postal_code, avatar_url, role")
        .eq("id", userData.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Could not load profile", profileError);
        setIsLoading(false);
        return;
      }

      if (profile) {
        setFullName(profile.full_name ?? "");
        setPhone(profile.phone ?? "");
        setCity(profile.city ?? "");
        setPostalCode(profile.postal_code ?? "");
        setAvatarUrl(profile.avatar_url ?? "");
      }

      setIsLoading(false);
    };

    loadProfile();
  }, []);

  const displayName = fullName.trim() || "Jibli customer";
  const canAccessAdmin = isAdminEmail(originalEmail);
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const needsRequiredDetails = !fullName.trim() || !phone.trim() || !city;

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");
    setIsSaving(true);

    try {
      const nextEmail = email.trim();

      if (nextEmail && nextEmail !== originalEmail) {
        const { error } = await supabase.auth.updateUser({ email: nextEmail });

        if (error) {
          throw error;
        }

        setOriginalEmail(nextEmail);
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw userError ?? new Error("You must be logged in.");
      }

      const profilePayload = {
        email: userData.user.email ?? nextEmail,
        full_name: fullName.trim(),
        phone: phone.trim(),
        city,
        postal_code: postalCode.trim() || null,
        avatar_url: avatarUrl || null,
      };

      const { data: existingProfile, error: existingProfileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userData.user.id)
        .maybeSingle();

      if (existingProfileError) {
        throw existingProfileError;
      }

      if (existingProfile) {
        const { error: updateProfileError } = await supabase
          .from("profiles")
          .update(profilePayload)
          .eq("id", userData.user.id);

        if (updateProfileError) {
          throw updateProfileError;
        }
      } else {
        const { error: insertProfileError } = await supabase.from("profiles").insert({
          id: userData.user.id,
          role: isAdminEmail(userData.user.email) ? "admin" : "user",
          ...profilePayload,
        });

        if (insertProfileError) {
          throw insertProfileError;
        }
      }

      setMessage(
        nextEmail !== originalEmail
          ? "Profile updated. Check your email if Supabase asks you to confirm the new address."
          : "Profile updated successfully.",
      );
    } catch (error) {
      console.error("Could not update profile", error);
      setErrorMessage(getErrorMessage(error, "Could not save your profile."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  return (
    <div>
      <Navbar>
        <Link to="/request">New order</Link>
        <Link to="/tracking">Track orders</Link>
        {canAccessAdmin && <Link to="/admin">Admin</Link>}
        <button className="outlineBtn accountLogoutBtn" type="button" onClick={handleLogout}>
          Logout
        </button>
      </Navbar>

      <main className="accountPage profileExperience">
        <section className="profileIntro">
          <span className="eyebrow">My account</span>
          <h1>Profile management</h1>
          <p>Keep your delivery details ready so every panier and order request is faster to confirm.</p>
        </section>

        <section className="profilePhones">
          <form className="profilePhone editProfilePhone" onSubmit={handleSaveProfile}>
            <div className="accountPanelHeader">
              <div>
                <span>Edit profile</span>
                <h2>{displayName}</h2>
              </div>
              <Link to="/request">Back to orders</Link>
            </div>

            <div className="editAvatarWrap">
              <label className="profilePhotoPicker">
                <input type="file" accept="image/*" onChange={handleAvatarChange} />
                <span className="profileAvatar large">
                  {avatarUrl ? <img src={avatarUrl} alt="Profile preview" /> : <span>{initials || "J"}</span>}
                </span>
                <strong>Change photo</strong>
              </label>
            </div>

            {isLoading ? (
              <div className="profileLoading">Loading your profile...</div>
            ) : (
              <>
                {message && <div className="noticeBox success">{message}</div>}
                {errorMessage && <div className="noticeBox warning">{errorMessage}</div>}
                {needsRequiredDetails && (
                  <div className="profileRequiredNote">
                    <strong>Complete the necessary details</strong>
                    <span>Full name, phone number, and city are required before you request orders.</span>
                  </div>
                )}

                <div className="accountFormGrid">
                  <div>
                    <label>Full name *</label>
                    <input
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Your full name"
                      required
                    />
                  </div>

                  <div>
                    <label>Email address</label>
                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="Your email"
                      type="email"
                    />
                  </div>

                  <div>
                    <label>Phone number *</label>
                    <input
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="+216 XX XXX XXX"
                      required
                    />
                  </div>

                  <div>
                    <label>City *</label>
                    <select value={city} onChange={(event) => setCity(event.target.value)} required>
                      <option value="">Select city</option>
                      {tunisianGovernorates.map((governorate) => (
                        <option key={governorate}>{governorate}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label>Postal code</label>
                    <input
                      value={postalCode}
                      onChange={(event) => setPostalCode(event.target.value)}
                      inputMode="numeric"
                      placeholder="Example: 1000"
                    />
                  </div>
                </div>

                <button className="saveProfileBtn" type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save profile"}
                </button>
              </>
            )}
          </form>
        </section>
      </main>
    </div>
  );
}

export default Account;
