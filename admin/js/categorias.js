function cargarCategorias() {
    fetch("https://bk-ecommerce-0e4f.onrender.com/categoria")
        .then((res) => res.json())
        .then((categorias) => {
            const cont = document.getElementById("categorias-table");
            if (!Array.isArray(categorias)) {
                cont.innerHTML =
                    "<div class='alert alert-warning'>No se pudieron cargar las categorías.</div>";
                return;
            }
            cont.innerHTML = `
        <div class="table-responsive">
          <table class="table table-bordered table-hover">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${categorias
                    .map(
                        (cat) => `
                <tr>
                  <td>${cat.nombre}</td>
                  <td>
                    <button class="btn btn-sm btn-primary me-1" onclick="editarCategoria(${cat.id_categoria
                            })"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="eliminarCategoria(${cat.id_categoria
                            })"><i class="bi bi-trash"></i></button>
                  </td>
                </tr>
              `
                    )
                    .join("")}
            </tbody>
          </table>
        </div>
      `;
        });
}

function cargarCategorias() {
    fetch("https://bk-ecommerce-0e4f.onrender.com/categoria")
        .then((res) => res.json())
        .then((categorias) => {
            const cont = document.getElementById("categorias-table");
            if (!Array.isArray(categorias)) {
                cont.innerHTML =
                    "<div class='alert alert-warning'>No se pudieron cargar las categorías.</div>";
                return;
            }
            cont.innerHTML = `
        <div class="table-responsive">
          <table class="table table-bordered table-hover">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${categorias
                    .map(
                        (cat) => `
                <tr>
                  <td>${cat.nombre}</td>
                  <td>
                    <button class="btn btn-sm btn-primary me-1" onclick="editarCategoria(${cat.id_categoria})"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="eliminarCategoria(${cat.id_categoria})"><i class="bi bi-trash"></i></button>
                  </td>
                </tr>
              `
                    )
                    .join("")}
            </tbody>
          </table>
        </div>
      `;
        });
}

function mostrarFormularioNuevaCategoria() {
    const cont = document.getElementById("categorias-table");
    cont.innerHTML = `
    <h5>Nueva Categoría</h5>
    <form id="formNuevaCategoria">
      <div class="mb-3">
        <label>Nombre</label>
        <input type="text" class="form-control" name="nombre" required>
      </div>
      <button type="submit" class="btn btn-success">Guardar</button>
      <button type="button" class="btn btn-secondary ms-2" id="cancelarNuevaCategoria">Cancelar</button>
    </form>
  `;
    document.getElementById("formNuevaCategoria").onsubmit =
        guardarNuevaCategoria;
    document.getElementById("cancelarNuevaCategoria").onclick = cargarCategorias;
}

function guardarNuevaCategoria(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
        nombre: form.nombre.value,
    };
    fetch("https://bk-ecommerce-0e4f.onrender.com/categoria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    })
        .then((res) => res.json())
        .then((resp) => {
            showAlert(resp.message || "Categoría creada");
            cargarCategorias();
        });
}

function eliminarCategoria(id) {
    if (!confirm("¿Seguro que deseas eliminar esta categoría?")) return;
    fetch(`https://bk-ecommerce-0e4f.onrender.com/categoria/${id}`, {
        method: "DELETE",
    })
        .then((res) => res.json())
        .then((resp) => {
            showAlert(resp.message || "Categoría eliminada", "warning");
            cargarCategorias();
        });
}

function editarCategoria(id) {
    fetch(`https://bk-ecommerce-0e4f.onrender.com/categoria/${id}`)
        .then((res) => res.json())
        .then((cat) => {
            const cont = document.getElementById("categorias-table");
            cont.innerHTML = `
        <h5>Editar Categoría</h5>
        <form id="formEditarCategoria">
          <div class="mb-3">
            <label>Nombre</label>
            <input type="text" class="form-control" name="nombre" value="${cat.nombre
                }" required>
          </div>
        <button type="submit" class="btn btn-primary">Guardar Cambios</button>
          <button type="button" class="btn btn-secondary ms-2" id="cancelarEditarCategoria">Cancelar</button>
        </form>
      `;
            document.getElementById("formEditarCategoria").onsubmit = function (e) {
                e.preventDefault();
                const data = {
                    nombre: e.target.nombre.value,
                };
                fetch(`https://bk-ecommerce-0e4f.onrender.com/categoria/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                })
                    .then((res) => res.json())
                    .then((resp) => {
                        showAlert(resp.message || "Categoría actualizada");
                        cargarCategorias();
                    });
            };
            document.getElementById("cancelarEditarCategoria").onclick =
                cargarCategorias;
        });
}

// Para navegación
window.cargarCategorias = cargarCategorias;
window.editarCategoria = editarCategoria;
window.eliminarCategoria = eliminarCategoria;
