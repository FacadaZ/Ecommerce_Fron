// ===== ALERTAS =====
function showAlert(message, type = "success") {
  const alertContainer = document.getElementById("alert-container");
  const iconMap = {
    success: "bi-check-circle-fill",
    danger: "bi-exclamation-triangle-fill",
    warning: "bi-exclamation-triangle-fill",
    info: "bi-info-circle-fill",
  };
  const alertHtml = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      <i class="bi ${iconMap[type]} me-2"></i>
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
  alertContainer.innerHTML = alertHtml;
  setTimeout(() => {
    const alert = alertContainer.querySelector(".alert");
    if (alert) {
      const bsAlert = new bootstrap.Alert(alert);
      bsAlert.close();
    }
  }, 4000);
}

// ===== ADMIN FUNCTIONS =====
function cargarAdmins() {
  console.log("Llamando a cargarAdmins()");
  fetch("https://bk-ecommerce-0e4f.onrender.com/admin")
    .then(res => res.json())
    .then(admins => {
      console.log("Admins recibidos:", admins);
      const cont = document.getElementById("admins-table");
      console.log("Contenedor admins-table:", cont);
      if (!Array.isArray(admins)) {
        cont.innerHTML = "<div class='alert alert-warning'>No se pudieron cargar los administradores.</div>";
        return;
      }
      cont.innerHTML = `
        <div class="table-responsive">
          <table class="table table-bordered table-hover">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${admins.map(admin => `
                <tr>
                  <td>${admin.nombre}</td>
                  <td>${admin.correo}</td>
                  <td>${admin.rol || ''}</td>
                  <td>
                    <button class="btn btn-sm btn-primary me-1" onclick="editarAdmin(${admin.id_usuario})"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="eliminarAdmin(${admin.id_usuario})"><i class="bi bi-trash"></i></button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;
      console.log("HTML generado:", cont.innerHTML);
      const btnNuevo = document.getElementById("btnNuevoAdmin");
      if (btnNuevo) {
        btnNuevo.onclick = mostrarFormularioNuevoAdmin;
      }
    });
}

function mostrarFormularioNuevoAdmin() {
  const cont = document.querySelector("#users-content .card-body");
  cont.innerHTML = `
    <h5>Nuevo Usuario</h5>
    <form id="formNuevoAdmin">
      <div class="mb-3">
        <label>Nombre</label>
        <input type="text" class="form-control" name="nombre" required>
      </div>
      <div class="mb-3">
        <label>Correo</label>
        <input type="email" class="form-control" name="correo" required>
      </div>
      <div class="mb-3">
        <label>Contraseña</label>
        <input type="password" class="form-control" name="password" required>
      </div>
      <div class="mb-3">
        <label>Rol</label>
        <select class="form-control" name="rol" required>
          <option value="admin">Administrador</option>
          <option value="sub admin">Sub Admin</option>
          <option value="vendedor">Vendedor</option>
        </select>
      </div>
      <button type="submit" class="btn btn-success">Guardar</button>
      <button type="button" class="btn btn-secondary ms-2" id="cancelarNuevoAdmin">Cancelar</button>
    </form>
  `;
  document.getElementById("formNuevoAdmin").onsubmit = guardarNuevoAdmin;
  document.getElementById("cancelarNuevoAdmin").onclick = cargarAdmins;
}

function guardarNuevoAdmin(e) {
  e.preventDefault();
  const form = e.target;
  const data = {
    nombre: form.nombre.value,
    correo: form.correo.value,
    password: form.password.value,
    rol: form.rol.value
  };
  fetch("https://bk-ecommerce-0e4f.onrender.com/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
    .then(res => res.json())
    .then(resp => {
      showAlert(resp.message || "Usuario creado");
      cargarAdmins();
    });
}

function eliminarAdmin(id) {
  if (!confirm("¿Seguro que deseas eliminar este admin?")) return;
  fetch(`https://bk-ecommerce-0e4f.onrender.com/admin/${id}`, {
    method: "DELETE"
  })
    .then(res => res.json())
    .then(resp => {
      showAlert(resp.message || "Administrador eliminado", "warning");
      cargarAdmins();
    });
}

function editarAdmin(id) {
  fetch(`https://bk-ecommerce-0e4f.onrender.com/admin/${id}`)
    .then(res => res.json())
    .then(admin => {
      const cont = document.querySelector("#users-content .card-body");
      cont.innerHTML = `
        <h5>Editar Usuario</h5>
        <form id="formEditarAdmin">
          <div class="mb-3">
            <label>Nombre</label>
            <input type="text" class="form-control" name="nombre" value="${admin.nombre}" required>
          </div>
          <div class="mb-3">
            <label>Correo</label>
            <input type="email" class="form-control" name="correo" value="${admin.correo}" required>
          </div>
          <div class="mb-3">
            <label>Rol</label>
            <select class="form-control" name="rol" required>
              <option value="admin" ${admin.rol === "admin" ? "selected" : ""}>Administrador</option>
              <option value="sub admin" ${admin.rol === "sub admin" ? "selected" : ""}>Sub Admin</option>
              <option value="vendedor" ${admin.rol === "vendedor" ? "selected" : ""}>Vendedor</option>
            </select>
          </div>
          <div class="mb-3">
            <label>Nueva contraseña (dejar vacío para no cambiar)</label>
            <input type="password" class="form-control" name="password">
          </div>
          <button type="submit" class="btn btn-primary">Guardar Cambios</button>
          <button type="button" class="btn btn-secondary ms-2" id="cancelarEditarAdmin">Cancelar</button>
        </form>
      `;
      document.getElementById("formEditarAdmin").onsubmit = function (e) {
        e.preventDefault();
        const data = {
          nombre: e.target.nombre.value,
          correo: e.target.correo.value,
          rol: e.target.rol.value
        };
        if (e.target.password.value.trim() !== "") {
          data.password = e.target.password.value;
        }
        fetch(`https://bk-ecommerce-0e4f.onrender.com/admin/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        })
          .then(res => res.json())
          .then(resp => {
            showAlert(resp.message || "Usuario actualizado");
            cargarAdmins();
          });
      };
      document.getElementById("cancelarEditarAdmin").onclick = cargarAdmins;
    });
}

function showContent(page) {
  console.log("Cambiando a la página:", page);
  // Oculta todas las secciones
  document.querySelectorAll(".content-section").forEach((section) => {
    section.style.display = "none";
  });
  // Muestra la sección seleccionada
  const targetContent = document.getElementById(page + "-content");
  if (targetContent) {
    targetContent.style.display = "block";
  }

  const titles = {
    dashboard: {
      title: "Dashboard",
      subtitle: "Bienvenido a tu panel de control"
    },
    users: {
      title: "Usuarios",
      subtitle: "Gestión de administradores"
    },
    cupones: {
      title: "Cupones",
      subtitle: "Gestión de cupones"
    },
    products: {
      title: "Productos",
      subtitle: "Gestión de productos"
    },
    categoria: {
      title: "Categoría",
      subtitle: "Gestión de categorías"
    },
    pedidos: {
      title: "Pedidos",
      subtitle: "Gestión de pedidos"
    },
    puntos: {
      title: "Puntos",
      subtitle: "Gestión de puntos"
    },
    temporada: {
      title: "Temporada",
      subtitle: "Gestión de temporadas"
    },
    reports: {
      title: "Reportes",
      subtitle: "Reportes del sistema"
    },
    help: {
      title: "Ayuda",
      subtitle: "Centro de ayuda"
    }
  };

  const info = titles[page] || { title: page, subtitle: "" };

  console.log("Buscando page-title:", document.getElementById("page-title"));
  console.log("Buscando page-subtitle:", document.getElementById("page-subtitle"));
  console.log("Buscando current-page:", document.getElementById("current-page"));

  document.getElementById("page-title").textContent = info.title;
  document.getElementById("page-subtitle").textContent = info.subtitle;
  document.getElementById("current-page").textContent = info.title;

  // Cambia el borde azul (clase active) en el menú lateral
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.classList.remove('active');
    if (
      link.textContent.trim().toLowerCase().startsWith(info.title.toLowerCase())
    ) {
      link.classList.add('active');
    }
  });

  const rol = localStorage.getItem("rol");
  const btnNuevo = document.getElementById("btnNuevoAdmin");
  if (btnNuevo) {
    btnNuevo.style.display = ((page === "users" || page === "categoria" || page === "products") && rol === "admin") ? "" : "none";
    btnNuevo.onclick = null;
    if (page === "users" && rol === "admin") {
      btnNuevo.onclick = mostrarFormularioNuevoAdmin;
    } else if (page === "categoria" && rol === "admin") {
      btnNuevo.onclick = mostrarFormularioNuevaCategoria;
    } else if (page === "products" && rol === "admin") {
      btnNuevo.onclick = mostrarFormularioNuevoProducto;
    }
  }
  console.log("Valor de page:", page, "Comparando con 'users':", page === "users");

  if (page === "users") {
    console.log("Antes de llamar a cargarAdmins()");
    cargarAdmins();
  }
  if (page === "categoria") {
    cargarCategorias();
  }
  if (page === "products") {
    cargarProductos();
  }
  if (page === "pedidos") {
    cargarPedidos();
  }
  if (page === "puntos") {
    mostrarSeccionPuntos();
  }
  if (page === "temporada") {
    mostrarSeccionTemporada();
  }
  if (page === "cupones") {
    cargarCupones();
  }
  if (page === "reports") {
    cargarReportes();
  }
  if (page === "dashboard") {
    cargarDashboard();
  }
}

// ===== INICIALIZACIÓN =====
document.addEventListener("DOMContentLoaded", () => {
  const rol = localStorage.getItem("rol");
  // Oculta TODOS los enlaces de usuarios en ambos menús
  document.querySelectorAll('.sidebar-link').forEach(link => {
    if (link.textContent.trim().toLowerCase().includes("usuarios")) {
      link.style.display = (rol === "admin") ? "" : "none";
    }
  });
  // Oculta el botón "Nuevo" si no es admin
  const btnNuevo = document.getElementById("btnNuevoAdmin");
  if (btnNuevo && rol !== "admin") {
    btnNuevo.style.display = "none";
  }
  showContent("dashboard");
});

// ===== EXPORTS PARA HTML =====
window.showContent = showContent;
window.editarAdmin = editarAdmin;
window.eliminarAdmin = eliminarAdmin;