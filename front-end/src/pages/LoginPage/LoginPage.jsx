import "./LoginPage.css";

const LoginPage = () => {
  const handleLogin = () => {
    window.location.href = "http://localhost:5000/api/auth/google";
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Tutoring App</h1>
        <p>Platformă de consultații universitare</p>
        <button className="login-btn" onClick={handleLogin}>
          Autentificare cu Google
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
