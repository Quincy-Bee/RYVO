
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
} from "lucide-react";

import API from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import "./AdminVideos.css";

const emptyForm = {
  title: "",
  artist: "",
  artistUsername: "",
  genre: "",
  description: "",
  videoUrl: "",
  thumbnailUrl: "",
};

function AdminVideos() {
  const { user, token } = useAuth();

  const [videos, setVideos] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const loadVideos = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/videos/admin", {
        headers,
      });

      setVideos(response.data.videos || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load videos."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && user?.role === "admin") {
      loadVideos();
    } else {
      setLoading(false);
    }
  }, [token, user?.role]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setMessage("");
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (editingId) {
        await API.patch(
          `/videos/${editingId}`,
          form,
          { headers }
        );

        setMessage("Video updated successfully.");
      } else {
        await API.post("/videos", form, {
          headers,
        });

        setMessage("Video added successfully as a draft.");
      }

      resetForm();
      await loadVideos();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not save the video."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (video) => {
    setEditingId(video._id);

    setForm({
      title: video.title || "",
      artist: video.artist || "",
      artistUsername: video.artistUsername || "",
      genre: video.genre || "",
      description: video.description || "",
      videoUrl: video.videoUrl || "",
      thumbnailUrl: video.thumbnailUrl || "",
    });

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handlePublish = async (video) => {
    try {
      setError("");
      setMessage("");

      await API.patch(
        `/videos/${video._id}/publish`,
        {},
        { headers }
      );

      setMessage("Video published successfully.");
      await loadVideos();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not publish video."
      );
    }
  };

  const handleUnpublish = async (video) => {
    try {
      setError("");
      setMessage("");

      await API.patch(
        `/videos/${video._id}/unpublish`,
        {},
        { headers }
      );

      setMessage("Video unpublished successfully.");
      await loadVideos();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not unpublish video."
      );
    }
  };

  const handleDelete = async (video) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${video.title}"?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      await API.delete(`/videos/${video._id}`, {
        headers,
      });

      setMessage("Video deleted successfully.");
      await loadVideos();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not delete video."
      );
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="admin-access-denied">
        <h1>Access denied</h1>
        <p>You do not have permission to access this page.</p>
        <Link to="/">Return to RYVO</Link>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <Link to="/" className="admin-back">
          <ArrowLeft size={18} />
          Back to RYVO
        </Link>

        <div>
          <span className="admin-eyebrow">RYVO MEDIA</span>
          <h1>Video Management</h1>
          <p>Manage, review, and publish platform videos.</p>
        </div>
      </header>

      <main className="admin-content">
        <section className="admin-form-section">
          <div className="admin-section-heading">
            <div>
              <span className="admin-eyebrow">
                CONTENT MANAGEMENT
              </span>
              <h2>
                {editingId ? "Edit video" : "Add a video"}
              </h2>
            </div>

            {editingId && (
              <button
                className="admin-cancel-button"
                onClick={resetForm}
                type="button"
              >
                <X size={16} />
                Cancel editing
              </button>
            )}
          </div>

          {error && (
            <div className="admin-alert admin-error">
              {error}
            </div>
          )}

          {message && (
            <div className="admin-alert admin-success">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="admin-form-grid">
              <label>
                Video title *
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Enter video title"
                  required
                />
              </label>

              <label>
                Artist name *
                <input
                  name="artist"
                  value={form.artist}
                  onChange={handleChange}
                  placeholder="Enter artist name"
                  required
                />
              </label>

              <label>
                Artist username
                <input
                  name="artistUsername"
                  value={form.artistUsername}
                  onChange={handleChange}
                  placeholder="e.g. rocky_lotto"
                />
              </label>

              <label>
                Genre *
                <input
                  name="genre"
                  value={form.genre}
                  onChange={handleChange}
                  placeholder="e.g. Hip-Hop, R&B, Afrobeats"
                  required
                />
              </label>

              <label className="admin-full-width">
                Video URL *
                <input
                  type="url"
                  name="videoUrl"
                  value={form.videoUrl}
                  onChange={handleChange}
                  placeholder="YouTube or Vimeo video URL"
                  required
                />
              </label>

              <label className="admin-full-width">
                Thumbnail image URL *
                <input
                  type="url"
                  name="thumbnailUrl"
                  value={form.thumbnailUrl}
                  onChange={handleChange}
                  placeholder="Paste thumbnail image URL"
                  required
                />
              </label>

              <label className="admin-full-width">
                Description
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Add a video description..."
                  rows={4}
                />
              </label>
            </div>

            <button
              className="admin-submit-button"
              type="submit"
              disabled={saving}
            >
              {editingId ? (
                <Save size={17} />
              ) : (
                <Plus size={18} />
              )}

              {saving
                ? "Saving..."
                : editingId
                ? "Save changes"
                : "Add video as draft"}
            </button>
          </form>
        </section>

        <section className="admin-list-section">
          <div className="admin-section-heading">
            <div>
              <span className="admin-eyebrow">
                YOUR LIBRARY
              </span>
              <h2>All videos ({videos.length})</h2>
            </div>

            <button
              className="admin-refresh-button"
              onClick={loadVideos}
              type="button"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="admin-empty">Loading videos...</p>
          ) : videos.length === 0 ? (
            <div className="admin-empty">
              <h3>No videos yet</h3>
              <p>
                Add your first video using the form above.
              </p>
            </div>
          ) : (
            <div className="admin-video-list">
              {videos.map((video) => (
                <article
                  className="admin-video-row"
                  key={video._id}
                >
                  <img
                    className="admin-video-thumbnail"
                    src={video.thumbnailUrl}
                    alt={video.title}
                  />

                  <div className="admin-video-info">
                    <h3>{video.title}</h3>
                    <p>
                      {video.artist} · {video.genre}
                    </p>

                    <span
                      className={`admin-status status-${video.status}`}
                    >
                      {video.status}
                    </span>
                  </div>

                  <div className="admin-video-actions">
                    <button
                      onClick={() => handleEdit(video)}
                      title="Edit video"
                    >
                      <Pencil size={17} />
                    </button>

                    {video.status === "published" ? (
                      <button
                        onClick={() => handleUnpublish(video)}
                        title="Unpublish video"
                      >
                        <EyeOff size={17} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePublish(video)}
                        title="Publish video"
                      >
                        <Eye size={17} />
                      </button>
                    )}

                    <button
                      className="admin-delete-button"
                      onClick={() => handleDelete(video)}
                      title="Delete video"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminVideos;
