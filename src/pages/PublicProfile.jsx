
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { UserRound, ArrowLeft } from "lucide-react";
import API from "../services/api.js";
import "./PublicProfile.css";

function PublicProfile() {
  const { username } = useParams();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await API.get(
          `/auth/users/${encodeURIComponent(username)}`
        );

        setProfile(response.data.user);
      } catch (err) {
        setError(
          err.response?.status === 404
            ? "This user could not be found."
            : "Unable to load this profile. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="public-profile-message">
        Loading profile...
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="public-profile-message">
        <h2>{error || "Profile not found."}</h2>
        <Link to="/" className="public-profile-back">
          <ArrowLeft size={17} />
          Back to RYVO
        </Link>
      </div>
    );
  }

  return (
    <main className="public-profile-page">
      <div className="public-profile-top">
        <Link to="/" className="public-profile-back">
          <ArrowLeft size={18} />
          Back to RYVO
        </Link>

        <Link to="/" className="public-profile-logo">
          RYVO
        </Link>
      </div>

      <section className="public-profile-header">
        <div className="public-profile-avatar">
          {profile.profileImage ? (
            <img
              src={profile.profileImage}
              alt={profile.name}
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <UserRound size={55} />
          )}
        </div>

        <div className="public-profile-info">
          <h1>{profile.name}</h1>

          <p className="public-profile-username">
            @{profile.username}
          </p>

          {profile.bio ? (
            <p className="public-profile-bio">
              {profile.bio}
            </p>
          ) : (
            <p className="public-profile-bio muted">
              No bio added yet.
            </p>
          )}
        </div>
      </section>

      <section className="public-profile-videos">
        <div className="public-profile-section-heading">
          <h2>Videos</h2>
        </div>

        <div className="public-profile-empty">
          <div className="public-profile-empty-icon">
            <UserRound size={25} />
          </div>

          <h3>No videos to show yet</h3>

          <p>
            Published videos associated with this creator
            will appear here.
          </p>
        </div>
      </section>
    </main>
  );
}

export default PublicProfile;
