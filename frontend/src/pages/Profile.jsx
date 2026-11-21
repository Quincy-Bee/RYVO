
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, Camera, Save, UserRound } from "lucide-react";

import API from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const Profile = () => {
  const { user, token, isLoggedIn, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [profileImage, setProfileImage] = useState(
    user?.profileImage || ""
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [imageError, setImageError] = useState(false);

  // Retrieve the latest profile information
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await API.get("/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const profile = response.data.user;

        setName(profile.name || "");
        setBio(profile.bio || "");
        setProfileImage(profile.profileImage || "");

        updateUser(profile);
      } catch (err) {
        setError(
          err.response?.data?.message ||
          "Could not load your profile."
        );
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchProfile();
    }
  }, [token]);

  const handleSave = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response = await API.patch(
        "/auth/me",
        {
          name,
          bio,
          profileImage,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      updateUser(response.data.user);

      setName(response.data.user.name);
      setBio(response.data.user.bio || "");
      setProfileImage(response.data.user.profileImage || "");

      setSuccess("Your profile has been updated!");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Could not update your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="profile-loading">
        Loading your profile...
      </div>
    );
  }

  return (
    <div className="profile-page">
      <header className="profile-topbar">
        <Link to="/" className="profile-brand">
          RYVO
        </Link>

        <Link to="/" className="profile-back">
          <ArrowLeft size={16} />
          Back to RYVO
        </Link>
      </header>

      <main className="profile-container">
        <div className="profile-heading">
          <p className="profile-eyebrow">YOUR ACCOUNT</p>
          <h1>My Profile</h1>
          <p>
            Manage your identity and how you appear on RYVO.
          </p>
        </div>

        <form className="profile-card" onSubmit={handleSave}>
          <div className="profile-photo-section">
            <div className="profile-photo">
              {profileImage && !imageError ? (
                <img
                  src={profileImage}
                  alt="Your profile"
                  onError={() => setImageError(true)}
                />
              ) : (
                <UserRound size={42} />
              )}
            </div>

            <div className="profile-photo-info">
              <h2>Profile picture</h2>
              <p>
                Add a photo using an image URL.
              </p>
            </div>
          </div>

          <div className="profile-field">
            <label htmlFor="profileImage">
              Profile image URL
            </label>

            <div className="profile-image-input">
              <Camera size={18} />

              <input
                id="profileImage"
                type="url"
                placeholder="https://example.com/your-photo.jpg"
                value={profileImage}
                onChange={(e) => {
                  setProfileImage(e.target.value);
                  setImageError(false);
                }}
              />
            </div>

            {imageError && profileImage && (
              <p className="profile-field-hint profile-error">
                This image could not be displayed. Check the URL.
              </p>
            )}
          </div>

          <div className="profile-divider" />

          <div className="profile-field">
            <label htmlFor="profileName">
              Display name
            </label>

            <input
              id="profileName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={60}
              required
            />
          </div>

          <div className="profile-field">
            <label>Username</label>

            <div className="profile-readonly">
              @{user?.username}
            </div>

            <p className="profile-field-hint">
              Your username cannot be changed here.
            </p>
          </div>

          <div className="profile-field">
            <label htmlFor="profileBio">
              Bio
            </label>

            <textarea
              id="profileBio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the RYVO community a little about yourself..."
              maxLength={300}
              rows={4}
            />

            <p className="profile-character-count">
              {bio.length}/300 characters
            </p>
          </div>

          {error && (
            <p className="profile-message profile-error">
              {error}
            </p>
          )}

          {success && (
            <p className="profile-message profile-success">
              {success}
            </p>
          )}

          <button
            type="submit"
            className="profile-save-button"
            disabled={saving}
          >
            <Save size={17} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </main>
    </div>
  );
};

export default Profile;
