
// ====== ALERTAS ======
function showAlert(message, type = "success") {
    const alertContainer = document.getElementById("alert-container");
    alertContainer.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

// ====== VALIDACIÓN SIMPLE ======
function validateForm(formId) {
    const form = document.getElementById(formId);
    let valid = true;
    form.querySelectorAll("input[required]").forEach(input => {
        if (!input.value.trim()) {
            input.classList.add("is-invalid");
            valid = false;
        } else {
            input.classList.remove("is-invalid");
        }
    });
    return valid;
}

// ====== LOGIN ======
function handleLogin(event) {
    event.preventDefault();

    if (!validateForm("loginForm")) {
        showAlert("Por favor, corrige los errores en el formulario.", "danger");
        return;
    }

    const correo = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.classList.add("loading");
    submitBtn.disabled = true;

    fetch("https://bk-ecommerce-0e4f.onrender.com/admin/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ correo, password })
    })
    .then(async (response) => {
        const data = await response.json();
        submitBtn.classList.remove("loading");
        submitBtn.disabled = false;

        if (response.ok) {
            // Guardar flag de login
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("rol", data.usuario.rol);
            showAlert(data.message || "¡Inicio de sesión exitoso! Redirigiendo...", "success");
            setTimeout(() => {
                window.location.href = "admin.html";
            }, 1500);
        } else {
            showAlert(data.message || "Credenciales incorrectas.", "danger");
        }
    })
    .catch((err) => {
        submitBtn.classList.remove("loading");
        submitBtn.disabled = false;
        showAlert("Error de conexión con el servidor.", "danger");
        console.error("Error en login:", err);
    });
}

// ====== CAMBIO DE FORMULARIO (solo login) ======
function showForm(formType) {
    document.querySelectorAll(".auth-form").forEach(form => form.style.display = "none");
    const targetForm = document.getElementById(`${formType}-form`);
    if (targetForm) targetForm.style.display = "block";
    document.getElementById("alert-container").innerHTML = "";
}

// ====== TOGGLE PASSWORD ======
document.addEventListener("DOMContentLoaded", function() {
    // Conectar evento de submit solo para login
    const loginForm = document.getElementById("loginForm");
    if (loginForm) loginForm.addEventListener("submit", handleLogin);

    // Toggle password
    const toggleLoginPassword = document.getElementById("toggleLoginPassword");
    if (toggleLoginPassword) {
        toggleLoginPassword.addEventListener("click", function() {
            const input = document.getElementById("loginPassword");
            input.type = input.type === "password" ? "text" : "password";
            this.querySelector("i").classList.toggle("bi-eye");
            this.querySelector("i").classList.toggle("bi-eye-slash");
        });
    }

    // Mostrar solo login al inicio
    showForm("login");
});