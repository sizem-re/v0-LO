export default function NotFound() {
  return (
    <div style={{ textAlign: "center", padding: "4rem" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>404 – Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <a href="/" style={{ color: "#0070f3", textDecoration: "underline", marginTop: "2rem", display: "inline-block" }}>
        Go Home
      </a>
    </div>
  );
} 