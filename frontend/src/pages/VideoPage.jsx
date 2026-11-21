
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Play,
  UserRound,
  MessageCircle,
  Heart,
  Bookmark,
  Share2,
  ArrowLeft,
  Disc3,
} from "lucide-react";

import { useAuth } from "../context/AuthContext.jsx";
import API from "../services/api.js";

// =====================================
// VIDEO PLAYER URL HANDLER
// =====================================

function getVideoPlayer(videoUrl) {
  if (!videoUrl) return null;

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
        const parts = url.pathname.split("/").filter(Boolean);

        if (["embed", "shorts", "live"].includes(parts[0])) {
          videoId = parts[1];
        }
      }

      if (videoId) {
        return {
          type: "iframe",
          src: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1`,
        };
      }
    }

    // Vimeo
    if (hostname.includes("vimeo.com")) {
      const parts = url.pathname.split("/").filter(Boolean);
      const videoId = parts.find((part) => /^\d+$/.test(part));

      if (videoId) {
        return {
          type: "iframe",
          src: `https://player.vimeo.com/video/${videoId}?autoplay=1`,
        };
      }
    }

    // Direct video files
    if (/\.(mp4|webm|ogg|mov|m4v)$/i.test(url.pathname)) {
      return {
        type: "video",
        src: videoUrl,
      };
    }

    // Other supported embed URLs
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
// HELPERS
// =====================================

function getCommentText(comment) {
  return (
    comment.text ||
    comment.content ||
    comment.comment ||
    ""
  );
}

function getCommentAuthor(comment) {
  if (typeof comment.user === "object" && comment.user) {
    return (
      comment.user.username ||
      comment.user.name ||
      "RYVO User"
    );
  }

  return (
    comment.username ||
    comment.author?.username ||
    comment.author ||
    "RYVO User"
  );
}

function getCommentAvatar(comment) {
  if (typeof comment.user === "object" && comment.user) {
    return comment.user.profileImage || "";
  }

  return (
    comment.profileImage ||
    comment.author?.profileImage ||
    ""
  );
}

function formatDate(date) {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// =====================================
// VIDEO PAGE
// =====================================

export default function VideoPage({ Sidebar, Header }) {
  const { id } = useParams();
  const { user, isLoggedIn } = useAuth();

  const [activePage, setActivePage] = useState("Home");
  const [mobileOpen, setMobileOpen] = useState(false);

  const [video, setVideo] = useState(null);
  const [suggestedVideos, setSuggestedVideos] = useState([]);
  const [comments, setComments] = useState([]);

  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const [commentText, setCommentText] = useState("");

  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [interactionLoading, setInteractionLoading] = useState(false);

  const [error, setError] = useState("");
  const [commentError, setCommentError] = useState("");

  // =====================================
  // LOAD VIDEO
  // =====================================

  useEffect(() => {
    let active = true;

    const loadVideo = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await API.get(`/videos/${id}`);
        const foundVideo = response.data.video || response.data;

        if (active) setVideo(foundVideo);
      } catch (requestError) {
        console.error("Could not load video:", requestError);

        if (active) {
          setError(
            requestError.response?.data?.message ||
              "We couldn't find this video."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadVideo();

    return () => {
      active = false;
    };
  }, [id]);

  // =====================================
  // LOAD COMMENTS
  // =====================================

  useEffect(() => {
    let active = true;

    const loadComments = async () => {
      try {
        setCommentsLoading(true);

        const response = await API.get(`/videos/${id}/comments`);

        if (!active) return;

        const loadedComments =
          response.data.comments || response.data || [];

        setComments(
          Array.isArray(loadedComments) ? loadedComments : []
        );
      } catch (requestError) {
        console.error("Could not load comments:", requestError);

        if (active) setComments([]);
      } finally {
        if (active) setCommentsLoading(false);
      }
    };

    loadComments();

    return () => {
      active = false;
    };
  }, [id]);

  // =====================================
  // LOAD LIKE COUNT
  // =====================================

  useEffect(() => {
    let active = true;

    const loadEngagement = async () => {
      try {
        const response = await API.get(
          `/videos/${id}/engagement`
        );

        if (!active) return;

        const count =
          response.data.likeCount ??
          response.data.likes ??
          response.data.count ??
          0;

        setLikeCount(typeof count === "number" ? count : 0);
      } catch (requestError) {
        console.error(
          "Could not load video engagement:",
          requestError
        );
      }
    };

    loadEngagement();

    return () => {
      active = false;
    };
  }, [id]);

  // =====================================
  // LOAD USER INTERACTION STATUS
  // =====================================

  useEffect(() => {
    let active = true;

    const loadInteraction = async () => {
      if (!isLoggedIn) {
        setLiked(false);
        setSaved(false);
        return;
      }

      try {
        const response = await API.get(
          `/videos/${id}/interaction`
        );

        if (!active) return;

        setLiked(Boolean(response.data.liked));
        setSaved(Boolean(response.data.saved));
      } catch (requestError) {
        console.error(
          "Could not load interaction status:",
          requestError
        );
      }
    };

    loadInteraction();

    return () => {
      active = false;
    };
  }, [id, isLoggedIn]);

  // =====================================
  // LOAD SUGGESTED VIDEOS
  // =====================================

  useEffect(() => {
    let active = true;

    const loadSuggestedVideos = async () => {
      try {
        const response = await API.get("/videos");

        if (!active) return;

        const allVideos = response.data.videos || [];

        setSuggestedVideos(
          allVideos
            .filter((item) => item._id !== id)
            .slice(0, 6)
        );
      } catch (requestError) {
        console.error(
          "Could not load suggested videos:",
          requestError
        );
      }
    };

    loadSuggestedVideos();

    return () => {
      active = false;
    };
  }, [id]);

  // =====================================
  // LIKE VIDEO
  // =====================================

  const handleLike = async () => {
    if (!isLoggedIn) {
      window.location.href = "/login";
      return;
    }

    if (interactionLoading) return;

    try {
      setInteractionLoading(true);

      const response = await API.post(`/videos/${id}/like`);

      const nextLiked =
        typeof response.data.liked === "boolean"
          ? response.data.liked
          : !liked;

      setLiked(nextLiked);

      if (typeof response.data.likeCount === "number") {
        setLikeCount(response.data.likeCount);
      } else if (typeof response.data.likes === "number") {
        setLikeCount(response.data.likes);
      } else {
        setLikeCount((current) =>
          Math.max(0, current + (nextLiked ? 1 : -1))
        );
      }
    } catch (requestError) {
      console.error("Could not like video:", requestError);

      alert(
        requestError.response?.data?.message ||
          "Could not update your like. Please try again."
      );
    } finally {
      setInteractionLoading(false);
    }
  };

  // =====================================
  // SAVE VIDEO
  // =====================================

  const handleSave = async () => {
    if (!isLoggedIn) {
      window.location.href = "/login";
      return;
    }

    if (interactionLoading) return;

    try {
      setInteractionLoading(true);

      const response = await API.post(`/videos/${id}/save`);

      setSaved(
        typeof response.data.saved === "boolean"
          ? response.data.saved
          : !saved
      );
    } catch (requestError) {
      console.error("Could not save video:", requestError);

      alert(
        requestError.response?.data?.message ||
          "Could not save this video. Please try again."
      );
    } finally {
      setInteractionLoading(false);
    }
  };

  // =====================================
  // SUBMIT COMMENT
  // =====================================

  const handleCommentSubmit = async (event) => {
    event.preventDefault();

    if (!isLoggedIn) {
      window.location.href = "/login";
      return;
    }

    const trimmedComment = commentText.trim();

    if (!trimmedComment) {
      setCommentError("Please write a comment first.");
      return;
    }

    try {
      setSubmittingComment(true);
      setCommentError("");

      const response = await API.post(
        `/videos/${id}/comments`,
        { text: trimmedComment }
      );

      const newComment =
        response.data.comment || response.data;

      if (newComment && typeof newComment === "object") {
        setComments((current) => [...current, newComment]);
      }

      setCommentText("");
    } catch (requestError) {
      console.error("Could not submit comment:", requestError);

      setCommentError(
        requestError.response?.data?.message ||
          "Your comment could not be posted. Please try again."
      );
    } finally {
      setSubmittingComment(false);
    }
  };

  // =====================================
  // SHARE VIDEO
  // =====================================

  const handleShare = async () => {
    const shareUrl = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: video?.title || "RYVO Video",
          url: shareUrl,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        alert("Video link copied!");
      }
    } catch (shareError) {
      if (shareError.name !== "AbortError") {
        console.error("Could not share video:", shareError);
      }
    }
  };

  // =====================================
  // SHARED WEBSITE LAYOUT
  // =====================================

  const renderPage = (content) => (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        mobileOpen={mobileOpen}
        closeMobile={() => setMobileOpen(false)}
      />

      <main className="main-area">
        <Header
          activePage="Video"
          openMobile={() => setMobileOpen(true)}
        />

        {content}
      </main>
    </div>
  );

  // =====================================
  // PAGE STATES
  // =====================================

  if (loading) {
    return renderPage(
      <div className="watch-state">
        <p>Loading video...</p>
      </div>
    );
  }

  if (error || !video) {
    return renderPage(
      <div className="watch-state">
        <Disc3 size={42} />
        <h2>Video unavailable</h2>
        <p>{error || "This video could not be found."}</p>

        <Link to="/" className="watch-back-button">
          <ArrowLeft size={16} />
          Back to RYVO
        </Link>
      </div>
    );
  }

  const player = getVideoPlayer(video.videoUrl);

  const artistUsername =
    video.artistUsername ||
    video.artist?.toLowerCase().replace(/[^a-z0-9]/g, "");

  const artistProfile = `/user/${artistUsername}`;

  const publishedDate =
    video.publishedAt || video.createdAt;

  // =====================================
  // PAGE
  // =====================================

  return renderPage(
    <main className="watch-container">
      <div className="watch-breadcrumb">
        <Link to="/">
          <ArrowLeft size={16} />
          Back to feed
        </Link>
      </div>

      <div className="watch-layout">
        <section className="watch-main-column">
          <div className="watch-player-container">
            {player ? (
              player.type === "iframe" ? (
                <iframe
                  key={player.src}
                  className="watch-player-frame"
                  src={player.src}
                  title={`${video.title} by ${video.artist}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              ) : (
                <video
                  className="watch-player-frame"
                  src={player.src}
                  controls
                  autoPlay
                  playsInline
                  preload="metadata"
                >
                  Your browser does not support video playback.
                </video>
              )
            ) : (
              <div className="watch-player-error">
                <Disc3 size={40} />
                <p>This video link is invalid or unsupported.</p>
              </div>
            )}
          </div>

          <div className="watch-video-info">
            <span className="watch-video-genre">
              {video.genre || "Music"}
            </span>

            <h1>{video.title}</h1>

            <div className="watch-video-meta">
              <Link
                to={artistProfile}
                className="watch-artist-link"
              >
                <span className="watch-artist-avatar">
                  {video.artistProfileImage ? (
                    <img
                      src={video.artistProfileImage}
                      alt={video.artist}
                    />
                  ) : (
                    <UserRound size={20} />
                  )}
                </span>

                <span>
                  <strong>{video.artist}</strong>
                  <small>{formatDate(publishedDate)}</small>
                </span>
              </Link>

              <div className="watch-actions">
                <button
                  className={
                    liked ? "watch-action active" : "watch-action"
                  }
                  onClick={handleLike}
                  disabled={interactionLoading}
                >
                  <Heart
                    size={18}
                    fill={liked ? "currentColor" : "none"}
                  />
                  <span>{likeCount}</span>
                </button>

                <button
                  className={
                    saved ? "watch-action active" : "watch-action"
                  }
                  onClick={handleSave}
                  disabled={interactionLoading}
                >
                  <Bookmark
                    size={18}
                    fill={saved ? "currentColor" : "none"}
                  />
                  <span>{saved ? "Saved" : "Save"}</span>
                </button>

                <button
                  className="watch-action"
                  onClick={handleShare}
                >
                  <Share2 size={18} />
                  <span>Share</span>
                </button>
              </div>
            </div>

            {video.description && (
              <div className="watch-description">
                <p>{video.description}</p>
              </div>
            )}
          </div>

          {/* COMMENTS */}

          <section className="watch-comments-section">
            <div className="watch-comments-heading">
              <h2>
                Comments
                <span>{comments.length}</span>
              </h2>
            </div>

            {isLoggedIn ? (
              <form
                className="watch-comment-form"
                onSubmit={handleCommentSubmit}
              >
                <div className="watch-comment-avatar">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt="Your profile"
                    />
                  ) : (
                    <UserRound size={19} />
                  )}
                </div>

                <div className="watch-comment-input-wrap">
                  <textarea
                    value={commentText}
                    onChange={(event) =>
                      setCommentText(event.target.value)
                    }
                    placeholder="Share your thoughts..."
                    rows={2}
                    maxLength={1000}
                  />

                  {commentError && (
                    <p className="watch-comment-error">
                      {commentError}
                    </p>
                  )}

                  <div className="watch-comment-submit-row">
                    <span>{commentText.length}/1000</span>

                    <button
                      type="submit"
                      disabled={
                        submittingComment || !commentText.trim()
                      }
                    >
                      {submittingComment
                        ? "Posting..."
                        : "Post comment"}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="watch-login-prompt">
                <p>
                  Join the conversation. Log in to leave a comment.
                </p>

                <Link to="/login">Log in</Link>
              </div>
            )}

            <div className="watch-comments-list">
              {commentsLoading ? (
                <p className="watch-muted-message">
                  Loading comments...
                </p>
              ) : comments.length === 0 ? (
                <div className="watch-no-comments">
                  <MessageCircle size={27} />
                  <h3>No comments yet</h3>
                  <p>Be the first to share your thoughts.</p>
                </div>
              ) : (
                comments.map((comment, index) => (
                  <article
                    className="watch-comment"
                    key={comment._id || comment.id || index}
                  >
                    <div className="watch-comment-avatar">
                      {getCommentAvatar(comment) ? (
                        <img
                          src={getCommentAvatar(comment)}
                          alt={getCommentAuthor(comment)}
                        />
                      ) : (
                        <UserRound size={19} />
                      )}
                    </div>

                    <div className="watch-comment-body">
                      <div className="watch-comment-heading">
                        <strong>
                          {getCommentAuthor(comment)}
                        </strong>

                        <span>
                          {formatDate(
                            comment.createdAt || comment.date
                          )}
                        </span>
                      </div>

                      <p>{getCommentText(comment)}</p>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </section>

        {/* SUGGESTED VIDEOS */}

        <aside className="watch-suggested-sidebar">
          <div className="watch-suggested-heading">
            <h2>Up next</h2>
          </div>

          {suggestedVideos.length === 0 ? (
            <p className="watch-muted-message">
              More videos coming soon.
            </p>
          ) : (
            suggestedVideos.map((suggested) => (
              <Link
                to={`/video/${suggested._id}`}
                className="suggested-video-card"
                key={suggested._id}
              >
                <div className="suggested-thumbnail">
                  {suggested.thumbnailUrl ? (
                    <img
                      src={suggested.thumbnailUrl}
                      alt={suggested.title}
                      loading="lazy"
                    />
                  ) : (
                    <Disc3 size={28} />
                  )}

                  <span className="suggested-play-icon">
                    <Play size={15} fill="currentColor" />
                  </span>
                </div>

                <div className="suggested-video-info">
                  <h3>{suggested.title}</h3>
                  <p>{suggested.artist}</p>
                  <span>{suggested.genre}</span>
                </div>
              </Link>
            ))
          )}
        </aside>
      </div>
    </main>
  );
}
