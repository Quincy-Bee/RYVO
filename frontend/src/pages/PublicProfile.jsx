
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  UserRound,
  ArrowLeft,
  UserPlus,
  UserCheck,
} from "lucide-react";

import API from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

import "./PublicProfile.css";

function PublicProfile() {
  const { username } = useParams();
  const { user, isLoggedIn } = useAuth();

  const [profile, setProfile] = useState(null);
  const [videos, setVideos] = useState([]);

  const [loading, setLoading] = useState(true);
  const [videosLoading, setVideosLoading] = useState(true);
  const [error, setError] = useState("");

  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const isOwnProfile =
    user?.username?.toLowerCase() === username?.toLowerCase();

  useEffect(() => {
    let active = true;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await API.get(
          `/auth/users/${encodeURIComponent(username)}`
        );

        if (!active) return;

        const profileData = response.data.user;

        setProfile(profileData);
        setFollowersCount(profileData.followersCount || 0);
        setFollowingCount(profileData.followingCount || 0);

        // Retrieve this creator's published videos.
        setVideosLoading(true);

        try {
          const videosResponse = await API.get(
            `/videos/artist/${encodeURIComponent(profileData.username)}`
          );

          if (active) {
            setVideos(videosResponse.data.videos || []);
          }
        } catch (videoError) {
          console.error("Creator videos error:", videoError);

          if (active) {
            setVideos([]);
          }
        } finally {
          if (active) {
            setVideosLoading(false);
          }
        }

        // Retrieve follow status for logged-in users.
        if (isLoggedIn && !isOwnProfile) {
          try {
            const followResponse = await API.get(
              `/auth/users/${encodeURIComponent(profileData.username)}/follow-status`
            );

            if (active) {
              setFollowing(followResponse.data.following);
              setFollowersCount(
                followResponse.data.followersCount || 0
              );
              setFollowingCount(
                followResponse.data.followingCount || 0
              );
            }
          } catch (followError) {
            console.error("Follow status error:", followError);
          }
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.status === 404
              ? "This user could not be found."
              : "Unable to load this profile. Please try again."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      active = false;
    };
  }, [username, isLoggedIn, isOwnProfile]);

  const handleFollow = async () => {
    if (!isLoggedIn || followLoading || !profile) return;

    try {
      setFollowLoading(true);

      const response = await API.post(
        `/auth/users/${encodeURIComponent(profile.username)}/follow`
      );

      setFollowing(response.data.following);

      setFollowersCount(
        response.data.followersCount || 0
      );
    } catch (error) {
      console.error("Follow action error:", error);

      alert(
        error.response?.data?.message ||
          "Unable to update follow status. Please try again."
      );
    } finally {
      setFollowLoading(false);
    }
  };

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

          <div className="public-profile-stats">
            <div>
              <strong>{followersCount}</strong>
              <span>Followers</span>
            </div>

            <div>
              <strong>{followingCount}</strong>
              <span>Following</span>
            </div>
          </div>

          {isLoggedIn && !isOwnProfile && (
            <button
              type="button"
              className={`public-profile-follow-btn ${
                following ? "following" : ""
              }`}
              onClick={handleFollow}
              disabled={followLoading}
            >
              {following ? (
                <UserCheck size={17} />
              ) : (
                <UserPlus size={17} />
              )}

              {followLoading
                ? "Please wait..."
                : following
                ? "Following"
                : "Follow"}
            </button>
          )}
        </div>
      </section>

      <section className="public-profile-videos">
        <div className="public-profile-section-heading">
          <h2>Videos</h2>
          <span>{videos.length}</span>
        </div>

        {videosLoading ? (
          <div className="public-profile-empty">
            Loading videos...
          </div>
        ) : videos.length > 0 ? (
          <div className="public-profile-video-grid">
            {videos.map((video) => (
              <Link
                to={`/video/${video._id}`}
                className="public-profile-video-card"
                key={video._id}
              >
                <div className="public-profile-video-thumbnail">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    loading="lazy"
                  />
                </div>

                <div className="public-profile-video-info">
                  <h3>{video.title}</h3>

                  <p>{video.artist}</p>

                  {video.genre && (
                    <span>{video.genre}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
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
        )}
      </section>
    </main>
  );
}

export default PublicProfile;
