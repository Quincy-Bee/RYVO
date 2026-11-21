
import { useState, useEffect } from "react";

import {
  Home,
  Compass,
  Flame,
  Music2,
  PlusSquare,
  Bell,
  Search,
  Play,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  CheckCircle2,
  TrendingUp,
  Disc3,
  Menu,
  X,
  UserRound,
} from "lucide-react";

import {
  Routes,
  Route,
  Link,
  Navigate,
} from "react-router-dom";

import { useAuth } from "./context/AuthContext.jsx";
import API from "./services/api.js";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Profile from "./pages/Profile.jsx";
import PublicProfile from "./pages/PublicProfile.jsx";
import AdminVideos from "./pages/AdminVideos.jsx";

import "./App.css";
import "./ProfileDropdown.css";

// =====================================
// TRENDING ARTISTS
// =====================================

const trendingArtists = [
  {
    name: "Amara Rose",
    username: "@amararose",
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120",
  },
  {
    name: "Jaylen Carter",
    username: "@jaylencarter",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120",
  },
  {
    name: "Kairo",
    username: "@kairoofficial",
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120",
  },
];

// =====================================
// MUSIC CATEGORIES
// =====================================

const categories = [
  "For You",
  "Following",
  "Trending",
  "Hip-Hop",
  "R&B",
  "Afrobeats",
  "Pop",
  "Electronic",
];

// =====================================
// VIDEO URL HANDLER
// =====================================

function getVideoPlayer(videoUrl) {
  if (!videoUrl) {
    return null;
  }

  try {
    const url = new URL(videoUrl);
    const hostname = url.hostname.toLowerCase();

    // YouTube
    if (
      hostname.includes("youtube.com") ||
      hostname.includes("youtu.be")
    ) {
      let videoId = "";

      if (hostname.includes("youtu.be")) {
        videoId = url.pathname.split("/").filter(Boolean)[0];
      } else if (url.pathname === "/watch") {
        videoId = url.searchParams.get("v");
      } else {
        const pathParts = url.pathname.split("/").filter(Boolean);

        if (
          ["embed", "shorts", "live"].includes(pathParts[0])
        ) {
          videoId = pathParts[1];
        }
      }

      if (videoId) {
        return {
          type: "iframe",
          src: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`,
        };
      }
    }

    // Vimeo
    if (
      hostname.includes("vimeo.com")
    ) {
      const pathParts = url.pathname.split("/").filter(Boolean);

      const videoId =
        pathParts.find((part) => /^\d+$/.test(part));

      if (videoId) {
        return {
          type: "iframe",
          src: `https://player.vimeo.com/video/${videoId}?autoplay=1`,
        };
      }
    }

    // Direct video files
    if (
      /\.(mp4|webm|ogg|mov|m4v)$/i.test(url.pathname)
    ) {
      return {
        type: "video",
        src: videoUrl,
      };
    }

    // Other supported video embed URLs
    return {
      type: "iframe",
      src: videoUrl,
    };
  } catch (error) {
    console.error("Invalid video URL:", error);

    return null;
  }
}

// =====================================
// SIDEBAR
// =====================================

function Sidebar({
  activePage,
  setActivePage,
  mobileOpen,
  closeMobile,
}) {
  const navigation = [
    { label: "Home", icon: Home },
    { label: "Explore", icon: Compass },
    { label: "Trending", icon: Flame },
    { label: "Music", icon: Music2 },
    { label: "Mixtapes", icon: Disc3 },
  ];

  const { isLoggedIn, user } = useAuth();

  return (
    <>
      {mobileOpen && (
        <div
          className="mobile-overlay"
          onClick={closeMobile}
        />
      )}

      <aside
        className={`sidebar ${
          mobileOpen ? "sidebar-open" : ""
        }`}
      >
        <div className="sidebar-brand">
          <Link to="/" className="brand-name">
            RYVO
          </Link>

          <button
            className="mobile-close"
            onClick={closeMobile}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-label">MENU</p>

          {navigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`sidebar-link ${
                activePage === label ? "active" : ""
              }`}
              onClick={() => {
                setActivePage(label);
                closeMobile();
              }}
            >
              <Icon size={19} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="sidebar-section">
          <p className="sidebar-label">YOUR SPACE</p>

          {isLoggedIn ? (
            <>
              <Link
                to="/profile"
                className={`sidebar-link ${
                  activePage === "Profile" ? "active" : ""
                }`}
                onClick={() => {
                  setActivePage("Profile");
                  closeMobile();
                }}
              >
                <UserRound size={19} />
                <span>My Profile</span>
              </Link>

              <button
                className="sidebar-link"
                onClick={() => {
                  setActivePage("Saved");
                  closeMobile();
                }}
              >
                <Bookmark size={19} />
                <span>Saved Videos</span>
              </button>

              <button
                className="sidebar-link"
                onClick={() => {
                  setActivePage("Notifications");
                  closeMobile();
                }}
              >
                <Bell size={19} />
                <span>Notifications</span>
              </button>

              {user?.role === "admin" && (
                <Link
                  to="/admin/videos"
                  className={`sidebar-link ${
                    activePage === "Admin Videos" ? "active" : ""
                  }`}
                  onClick={() => {
                    setActivePage("Admin Videos");
                    closeMobile();
                  }}
                >
                  <Disc3 size={19} />
                  <span>Admin Videos</span>
                </Link>
              )}
            </>
          ) : (
            <Link
              to="/login"
              className="sidebar-link"
              onClick={closeMobile}
            >
              <UserRound size={19} />
              <span>Log in to your account</span>
            </Link>
          )}
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-promo">
            <div className="promo-icon">
              <PlusSquare size={20} />
            </div>

            <h3>Want to be featured?</h3>

            <p>
              Send your video to RYVO for review and promotional
              opportunities.
            </p>

            <a href="mailto:submissions@ryvo.com">
              Email RYVO
            </a>
          </div>

          <p className="sidebar-copyright">
            © 2026 RYVO MEDIA
          </p>
        </div>
      </aside>
    </>
  );
}

// =====================================
// HEADER
// =====================================

function Header({ openMobile, activePage }) {
  const { user, isLoggedIn, logout } = useAuth();

  const [profileMenuOpen, setProfileMenuOpen] =
    useState(false);

  const isAdmin = user?.role === "admin";

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="mobile-menu"
          onClick={openMobile}
          aria-label="Open navigation"
        >
          <Menu size={22} />
        </button>

        <Link to="/" className="mobile-brand">
          RYVO
        </Link>

        <span className="page-heading">
          {activePage}
        </span>
      </div>

      <div className="search-box">
        <Search size={18} />

        <input
          placeholder="Search artists, videos, music..."
        />

        <kbd>⌘ K</kbd>
      </div>

      <div className="topbar-actions">
        {isLoggedIn ? (
          <div className="profile-menu-wrap">
            <button
              type="button"
              className="profile-menu-trigger"
              onClick={() =>
                setProfileMenuOpen((open) => !open)
              }
              aria-expanded={profileMenuOpen}
              aria-label="Open account menu"
            >
              <span className="header-username">
                {user?.username}
              </span>

              <span className="header-avatar">
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt="Profile"
                  />
                ) : (
                  <UserRound size={18} />
                )}
              </span>
            </button>

            {profileMenuOpen && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-heading">
                  <strong>{user?.username}</strong>

                  {isAdmin && (
                    <span className="profile-admin-label">
                      Administrator
                    </span>
                  )}
                </div>

                <Link
                  to="/profile"
                  className="profile-menu-item"
                  onClick={() => setProfileMenuOpen(false)}
                >
                  <UserRound size={17} />
                  <span>Edit Profile</span>
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin/videos"
                    className="profile-menu-item"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    <Disc3 size={17} />
                    <span>Admin Videos</span>
                  </Link>
                )}

                <div className="profile-menu-divider" />

                <button
                  type="button"
                  className="profile-menu-item profile-logout"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    logout();
                  }}
                >
                  <X size={17} />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link
              to="/login"
              className="auth-header-button"
            >
              Log in
            </Link>

            <Link
              to="/register"
              className="auth-signup-button"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

// =====================================
// VIDEO CARD
// =====================================

function VideoCard({ post }) {
  const { isLoggedIn } = useAuth();

  const [saved, setSaved] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const artistUsername =
    post.artistUsername ||
    post.artist.toLowerCase().replace(/[^a-z0-9]/g, "");

  const artistProfile = `/user/${artistUsername}`;

  const publishedDate = post.publishedAt || post.createdAt;

  const formattedDate = publishedDate
    ? new Date(publishedDate).toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric",
          year: "numeric",
        }
      )
    : "Recently published";

  const videoPlayer = getVideoPlayer(post.videoUrl);

  const closePlayer = () => {
    setIsPlaying(false);
  };

  return (
    <article className="video-card">
      <div
        className="video-thumbnail"
        style={
          isPlaying
            ? {
                position: "relative",
                overflow: "hidden",
                background: "#000",
              }
            : undefined
        }
      >
        {isPlaying && videoPlayer ? (
          <>
            {videoPlayer.type === "iframe" ? (
              <iframe
                key={videoPlayer.src}
                src={videoPlayer.src}
                title={`${post.title} by ${post.artist}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{
                  display: "block",
                  width: "100%",
                  height: "100%",
                  minHeight: "250px",
                  border: "none",
                  background: "#000",
                }}
              />
            ) : (
              <video
                key={videoPlayer.src}
                src={videoPlayer.src}
                controls
                autoPlay
                playsInline
                onEnded={closePlayer}
                style={{
                  display: "block",
                  width: "100%",
                  height: "100%",
                  minHeight: "250px",
                  objectFit: "contain",
                  background: "#000",
                }}
              >
                Your browser does not support video playback.
              </video>
            )}

            <button
              className="thumbnail-more"
              onClick={closePlayer}
              aria-label="Close video player"
              style={{
                zIndex: 5,
                background: "rgba(0, 0, 0, 0.75)",
              }}
            >
              <X size={21} />
            </button>
          </>
        ) : (
          <>
            <img
              src={post.thumbnailUrl}
              alt={`${post.artist} video thumbnail`}
              loading="lazy"
            />

            <span className="video-category">
              {post.genre}
            </span>

            <button
              className="play-button"
              aria-label={`Play ${post.title}`}
              onClick={() => {
                if (!videoPlayer) {
                  alert("This video link is invalid or unsupported.");
                  return;
                }

                setIsPlaying(true);
              }}
            >
              <Play size={23} fill="currentColor" />
            </button>

            <button
              className="thumbnail-more"
              aria-label="More options"
            >
              <MoreHorizontal size={21} />
            </button>
          </>
        )}
      </div>

      <div className="video-details">
        <Link
          to={artistProfile}
          className="artist-avatar-link"
          aria-label={`View ${post.artist}'s profile`}
        >
          <span className="artist-avatar artist-avatar-fallback">
            <UserRound size={20} />
          </span>
        </Link>

        <div className="video-info">
          <h3>{post.title}</h3>

          <div className="artist-name">
            <Link
              to={artistProfile}
              className="artist-profile-link"
            >
              {post.artist}
            </Link>

            {post.verified && (
              <CheckCircle2
                size={13}
                className="verified-icon"
              />
            )}
          </div>

          <p className="video-meta">
            {formattedDate}
          </p>
        </div>

        <button
          className="details-more"
          aria-label="More options"
        >
          <MoreHorizontal size={20} />
        </button>
      </div>

      <div className="video-actions">
        <button>
          <MessageCircle size={18} />
          Comments
        </button>

        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: post.title,
                url: post.videoUrl,
              });
            } else if (navigator.clipboard) {
              navigator.clipboard.writeText(post.videoUrl);
              alert("Video link copied!");
            }
          }}
        >
          <Share2 size={18} />
          Share
        </button>

        <button
          className={`save-action ${
            saved ? "action-active" : ""
          }`}
          onClick={() => {
            if (!isLoggedIn) {
              window.location.href = "/login";
              return;
            }

            setSaved(!saved);
          }}
          aria-label={
            saved ? "Remove saved video" : "Save video"
          }
        >
          <Bookmark
            size={18}
            fill={saved ? "currentColor" : "none"}
          />
        </button>
      </div>
    </article>
  );
}

// =====================================
// RIGHT SIDEBAR
// =====================================

function RightSidebar() {
  return (
    <aside className="right-sidebar">
      <section className="right-section">
        <div className="section-heading">
          <h2>Trending now</h2>
          <TrendingUp size={18} />
        </div>

        {[
          "New music releases",
          "Hip-hop rising",
          "R&B spotlight",
        ].map((item, index) => (
          <div className="trending-item" key={item}>
            <span className="trending-number">
              0{index + 1}
            </span>

            <div>
              <h3>{item}</h3>

              <p>
                {["Music", "Hip-Hop", "R&B"][index]}
              </p>
            </div>

            <Flame
              size={16}
              className="trending-flame"
            />
          </div>
        ))}

        <button className="see-more">
          Explore trending <span>→</span>
        </button>
      </section>

      <section className="right-section artists-section">
        <div className="section-heading">
          <h2>Artists to watch</h2>
        </div>

        {trendingArtists.map((artist) => (
          <div
            className="artist-row"
            key={artist.username}
          >
            <Link
              to={`/user/${artist.username.replace("@", "")}`}
              className="artist-row-link"
            >
              <img
                src={artist.image}
                alt={artist.name}
              />

              <div className="artist-row-info">
                <h3>{artist.name}</h3>
                <p>{artist.username}</p>
              </div>
            </Link>

            <button className="follow-button">
              Follow
            </button>
          </div>
        ))}
      </section>

      <section className="right-section newsletter">
        <span className="newsletter-tag">
          THE RYVO EDIT
        </span>

        <h2>Stay in the loop.</h2>

        <p>
          Discover new artists, videos, and everything
          happening in music culture.
        </p>

        <button>Coming soon</button>
      </section>

      <div className="footer-links">
        <span>About</span>
        <span>Guidelines</span>
        <span>Privacy</span>
        <span>Terms</span>

        <p>© 2026 RYVO MEDIA</p>
      </div>
    </aside>
  );
}

// =====================================
// HOMEPAGE
// =====================================

function HomePage() {
  const [activePage, setActivePage] = useState("Home");

  const [activeCategory, setActiveCategory] =
    useState("For You");

  const [mobileOpen, setMobileOpen] = useState(false);

  const [videos, setVideos] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await API.get("/videos");

        setVideos(response.data.videos || []);
      } catch (error) {
        console.error("Could not load videos:", error);

        setError(
          "We couldn't load videos right now. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const filteredVideos =
    activeCategory === "For You" ||
    activeCategory === "Trending" ||
    activeCategory === "Following"
      ? videos
      : videos.filter(
          (video) =>
            video.genre?.toLowerCase() ===
            activeCategory.toLowerCase()
        );

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        mobileOpen={mobileOpen}
        closeMobile={() => setMobileOpen(false)}
      />

      <main className="main-area">
        <Header
          activePage={activePage}
          openMobile={() => setMobileOpen(true)}
        />

        <div className="content-layout">
          <div className="feed-column">
            <section className="welcome-section">
              <div>
                <p className="eyebrow">
                  YOUR CULTURE. YOUR CHANNEL.
                </p>

                <h1>
                  Discover what's <span>moving.</span>
                </h1>

                <p className="welcome-description">
                  New music, fresh faces, and the videos
                  everyone is talking about.
                </p>
              </div>

              <div className="welcome-mark">R.</div>
            </section>

            <div className="category-tabs">
              {categories.map((category) => (
                <button
                  key={category}
                  className={
                    activeCategory === category
                      ? "category-active"
                      : ""
                  }
                  onClick={() =>
                    setActiveCategory(category)
                  }
                >
                  {category}
                </button>
              ))}
            </div>

            <section className="feed-section">
              <div className="feed-heading">
                <div>
                  <h2>
                    {activeCategory === "For You"
                      ? "Your feed"
                      : activeCategory}
                  </h2>

                  <p>
                    Discover what's happening right now.
                  </p>
                </div>

                <button
                  className="feed-filter"
                  onClick={() => {
                    setVideos((currentVideos) =>
                      [...currentVideos].reverse()
                    );
                  }}
                >
                  Latest <span>⌄</span>
                </button>
              </div>

              {loading ? (
                <div className="feed-message">
                  <p>Loading the latest videos...</p>
                </div>
              ) : error ? (
                <div className="feed-message">
                  <p>{error}</p>

                  <button
                    onClick={() =>
                      window.location.reload()
                    }
                  >
                    Try again
                  </button>
                </div>
              ) : filteredVideos.length === 0 ? (
                <div className="feed-message">
                  <Disc3 size={32} />

                  <h3>
                    {videos.length === 0
                      ? "The feed is getting ready."
                      : "No videos in this category yet."}
                  </h3>

                  <p>
                    {videos.length === 0
                      ? "Check back soon for new music, artists, and videos."
                      : "Explore another category to discover more videos."}
                  </p>
                </div>
              ) : (
                filteredVideos.map((video) => (
                  <VideoCard
                    key={video._id}
                    post={video}
                  />
                ))
              )}
            </section>
          </div>

          <RightSidebar />
        </div>
      </main>
    </div>
  );
}

// =====================================
// ADMIN ROUTE PROTECTION
// =====================================

function AdminRoute({ children }) {
  const { user, isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}

// =====================================
// APP ROUTES
// =====================================

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      <Route path="/profile" element={<Profile />} />

      <Route
        path="/user/:username"
        element={<PublicProfile />}
      />

      <Route
        path="/admin/videos"
        element={
          <AdminRoute>
            <AdminVideos />
          </AdminRoute>
        }
      />

      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}

export default App;
