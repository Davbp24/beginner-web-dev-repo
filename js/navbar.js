// Toggle password visibility
document.getElementById("toggle-password").addEventListener("click", () => {
  const pwd = document.getElementById("password");
  const icon = document.querySelector("#toggle-password i");
  if (pwd.type === "password") {
    pwd.type = "text";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
  } else {
    pwd.type = "password";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  }
});

// Handle login form submission
document.getElementById("login-form").addEventListener("submit", (e) => {
  e.preventDefault();

  document.getElementById("login-title").textContent = "Welcome Back! 👋";
  document.getElementById("login-desc").textContent = "Redirecting to your workspace...";
  document.getElementById("login-form").style.display = "none";

  setTimeout(() => {
    alert("You’re logged in!");
  }, 1500);
});
