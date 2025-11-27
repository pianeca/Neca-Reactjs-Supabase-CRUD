import { useState, useEffect } from "react";
import { supabase } from "./supabase-client";
import "./App.css";

export default function App() {
  
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: "", description: "" });
  const [newDescription, setNewDescription] = useState("");
  const [taskImage, setTaskImage] = useState(null);
  const [taskVideo, setTaskVideo] = useState(null);

  
  const [authUser, setAuthUser] = useState(null);
  const [authMode, setAuthMode] = useState("signin"); // 'signin' or 'signup'
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");

 
  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setAuthUser(session?.user ?? null);
    };
    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  
  const handleSignUp = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthMessage("");
    const { error } = await supabase.auth.signUp({
      email: authEmail,
      password: authPassword,
    });
    if (error) setAuthMessage("Sign up error: " + error.message);
    else setAuthMessage("Sign up success! Check your email to confirm.");
    setAuthLoading(false);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthMessage("");
    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: authPassword,
    });
    if (error) setAuthMessage("Sign in error: " + error.message);
    else setAuthMessage("Signed in successfully!");
    setAuthLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setAuthUser(null);
    setAuthMessage("Signed out");
  };

  const toggleAuthMode = () => {
    setAuthMode((m) => (m === "signin" ? "signup" : "signin"));
    setAuthMessage("");
  };

  
  const uploadFile = async (file, folder) => {
    try {
      const filePath = `${folder}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("notes-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("❌ Upload error:", uploadError.message);
        return null;
      }

      const { data } = supabase.storage.from("notes-images").getPublicUrl(filePath);
      return data?.publicUrl ?? null;
    } catch (err) {
      console.error("Unexpected upload error:", err);
      return null;
    }
  };

  // --- CRUD ---
  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("id", { ascending: false });

    if (error) console.error("Read error:", error.message);
    else setTasks(data);
  };

  const createTask = async (e) => {
    e.preventDefault();

    let imageUrl = null;
    let videoUrl = null;
    if (taskImage) imageUrl = await uploadFile(taskImage, "images");
    if (taskVideo) videoUrl = await uploadFile(taskVideo, "videos");

    const { error } = await supabase.from("tasks").insert([
      {
        title: newTask.title,
        description: newTask.description,
        image_url: imageUrl,
        video_url: videoUrl,
      },
    ]);

    if (error) console.error("❌ Insert error:", error.message);
    else {
      console.log("✅ Task added successfully!");
      setNewTask({ title: "", description: "" });
      setTaskImage(null);
      setTaskVideo(null);
      fetchTasks();
    }
  };

  const updateTask = async (id) => {
    const { error } = await supabase
      .from("tasks")
      .update({ description: newDescription })
      .eq("id", id);
    if (error) console.error("Update error:", error.message);
    else {
      console.log("✅ Task updated");
      setNewDescription("");
      fetchTasks();
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) console.error("Delete error:", error.message);
    else {
      console.log("✅ Task deleted");
      fetchTasks();
    }
  };

  useEffect(() => {
    if (authUser) fetchTasks(); // only load tasks after login

    const channel = supabase
      .channel("tasks-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => fetchTasks()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [authUser]);

  if (!authUser) {
   
    return (
      <div className="text-purple-300">
        <h2>{authMode === "signin" ? "Sign In" : "Sign Up"}</h2>
        <form
          onSubmit={authMode === "signin" ? handleSignIn : handleSignUp}
          className="auth-form"
        >
          <input
            type="email"
            placeholder="Email"
            value={authEmail}
            onChange={(e) => setAuthEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={authLoading}>
            {authLoading
              ? "Please wait..."
              : authMode === "signin"
              ? "Sign In"
              : "Sign Up"}
          </button>
          <p
            className="switch-link"
            onClick={toggleAuthMode}
            style={{ cursor: "pointer" }}
          >
            {authMode === "signin"
              ? "Switch to Sign Up"
              : "Switch to Sign In"}
          </p>
          {authMessage && <p className="message">{authMessage}</p>}
        </form>
      </div>
    );
  }

  
  return (
  <div
    className="App-Container"
    style={{
      maxWidth: "600px",
      margin: "0 auto",
      padding: "1rem",
      border: "3px solid green",
      borderRadius: "10px",
      textAlign: "center", // ✅ center all text inside container
    }}
  >
    <h2 className="text-3xl font-bold underline mb-4" style={{ color: "purple" }}>
      Pia's Task Manager
    </h2>
    <p className="mb-4">
      Signed in as: <b>{authUser.email}</b>
    </p>
    <button onClick={handleSignOut} className="mb-4">
      Sign Out
    </button>

    <form onSubmit={createTask} style={{ marginBottom: "2rem" }}>
      <input
        type="text"
        placeholder="Title Here"
        value={newTask.title}
        onChange={(e) =>
          setNewTask((prev) => ({ ...prev, title: e.target.value }))
        }
        required
        style={{ display: "block", width: "90%", margin: "10px auto", padding: "8px" }}
      />
      <textarea
        placeholder="Description Here"
        value={newTask.description}
        onChange={(e) =>
          setNewTask((prev) => ({ ...prev, description: e.target.value }))
        }
        required
        style={{ display: "block", width: "90%", margin: "10px auto", padding: "8px" }}
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setTaskImage(e.target.files[0])}
        style={{ display: "block", margin: "10px auto" }}
      />
      <input
        type="file"
        accept="video/*"
        onChange={(e) => setTaskVideo(e.target.files[0])}
        style={{ display: "block", margin: "10px auto" }}
      />
      <button type="submit" style={{ marginTop: "10px" }}>
        Add Task
      </button>
    </form>

    <ul style={{ listStyle: "none", padding: 0 }}>
      {tasks.map((task) => (
        <li key={task.id}>
          <div
            style={{
              border: "2px solid green",
              borderRadius: "10px",
              padding: "15px",
              marginBottom: "15px",
              textAlign: "left", // ✅ align task content to left for readability
            }}
          >
            <h3 style={{ marginBottom: "5px" }}>{task.title}</h3>
            <p style={{ marginBottom: "10px" }}>{task.description}</p>

            {task.image_url && (
              <img
                src={task.image_url}
                alt="Uploaded"
                width="100%"
                style={{ borderRadius: "10px", marginBottom: "10px" }}
              />
            )}

            {task.video_url && (
              <video
                src={task.video_url}
                controls
                width="100%"
                style={{ marginBottom: "10px", borderRadius: "10px" }}
              />
            )}

            <textarea
              placeholder="Edit description here"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              style={{ display: "block", width: "100%", marginBottom: "10px", padding: "8px" }}
            />

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button onClick={() => updateTask(task.id)}>Update</button>
              <button onClick={() => deleteTask(task.id)}>Delete</button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  </div>
);


}
