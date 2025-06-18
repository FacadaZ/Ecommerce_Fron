function obtenerCategorias() {
  return fetch("https://bk-ecommerce-0e4f.onrender.com/categoria").then((res) => res.json());
}

// Función segura para parsear stock_tallas
function parseStockTallas(stock) {
  if (!stock) return {};
  if (typeof stock === "string") {
    try {
      return JSON.parse(stock);
    } catch {
      return {};
    }
  }
  return stock;
}

function cargarProductos() {
  fetch("https://bk-ecommerce-0e4f.onrender.com/producto")
    .then((res) => res.json())
    .then((productos) => {
      const cont = document.getElementById("productos-table");
      if (!Array.isArray(productos)) {
        cont.innerHTML =
          "<div class='alert alert-warning'>No se pudieron cargar los productos.</div>";
        return;
      }
      cont.innerHTML = `
        <div class="table-responsive">
          <table class="table table-bordered table-hover">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Precio</th>
                <th>Imagen</th>
                <th>Destacado</th>
                <th>Stock por tallas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${productos
          .map(
            (prod) => `
                <tr>
                  <td>${prod.nombre}</td>
                  <td>${prod.descripcion || ""}</td>
                  <td>${prod.precio}</td>
                  <td>
${prod.imagen
                ? `<img src="${prod.imagen}" alt="img" style="width:40px;height:40px;">`
                : ""}
                </td>
                  <td>${prod.destacado ? "Sí" : "No"}</td>
                  <td>
                    ${prod.stock_tallas
                ? Object.entries(parseStockTallas(prod.stock_tallas))
                  .map(([talla, cant]) => `${talla}: ${cant}`).join("<br>")
                : ""}
                  </td>
                  <td>
                    <button class="btn btn-sm btn-primary me-1" onclick="editarProducto(${prod.id_producto
              })"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="eliminarProducto(${prod.id_producto
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

function mostrarFormularioNuevoProducto() {
  const cont = document.getElementById("productos-table");
  obtenerCategorias().then((categorias) => {
    const tallas = ["P", "M", "G", "GG"];
    cont.innerHTML = `
        <h5>Nuevo Producto</h5>
        <form id="formNuevoProducto">
          <div class="mb-3">
            <label>Nombre</label>
            <input type="text" class="form-control" name="nombre" required>
          </div>
          <div class="mb-3">
            <label>Descripción</label>
            <textarea class="form-control" name="descripcion"></textarea>
          </div>
          <div class="mb-3">
            <label>Precio</label>
            <input type="number" step="0.01" class="form-control" name="precio" required>
          </div>
          <div class="mb-3">
            <label>Imagen</label>
            <input type="file" class="form-control" name="imagen" accept="image/*">
          </div>
          <div class="mb-3">
            <label>Destacado</label>
            <select class="form-control" name="destacado">
              <option value="false">No</option>
              <option value="true">Sí</option>
            </select>
          </div>
          <div class="mb-3">
            <label>Stock por tallas</label>
            <div id="tallas-checkboxes" class="row">
              ${tallas.map(talla => `
                <div class="col-6 col-md-3 mb-2">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" value="${talla}" id="talla_${talla}" name="tallas">
                    <label class="form-check-label" for="talla_${talla}">${talla}</label>
                  </div>
                  <input type="number" class="form-control mt-1" id="cantidad_${talla}" name="cantidad_${talla}" placeholder="Cantidad" min="0" style="display:none;">
                </div>
              `).join("")}
            </div>
          </div>
          <div class="mb-3">
            <label>Categoría</label>
            <select class="form-control" name="id_categoria" required>
              <option value="">Seleccione una categoría</option>
              ${categorias
        .map(
          (cat) =>
            `<option value="${cat.id_categoria}">${cat.nombre}</option>`
        )
        .join("")}
            </select>
          </div>
          <button type="submit" class="btn btn-success">Guardar</button>
          <button type="button" class="btn btn-secondary ms-2" id="cancelarNuevoProducto">Cancelar</button>
        </form>
      `;

    // Mostrar/ocultar input cantidad según checkbox
    tallas.forEach(talla => {
      const checkbox = document.getElementById(`talla_${talla}`);
      const inputCantidad = document.getElementById(`cantidad_${talla}`);
      checkbox.addEventListener('change', function () {
        inputCantidad.style.display = this.checked ? "" : "none";
        if (!this.checked) inputCantidad.value = "";
      });
    });

    document.getElementById("formNuevoProducto").onsubmit = guardarNuevoProducto;
    document.getElementById("cancelarNuevoProducto").onclick = cargarProductos;
  });
}

function guardarNuevoProducto(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData();
  formData.append("nombre", form.nombre.value);
  formData.append("descripcion", form.descripcion.value);
  formData.append("precio", form.precio.value);
  formData.append("destacado", form.destacado.value === "true");
  formData.append("id_categoria", form.id_categoria.value);

  // Armar stock_tallas como JSON
  const tallas = ["P", "M", "G", "GG"];
  const stockTallas = {};
  tallas.forEach(talla => {
    const checkbox = form.querySelector(`#talla_${talla}`);
    const cantidadInput = form.querySelector(`#cantidad_${talla}`);
    if (checkbox.checked && cantidadInput.value) {
      stockTallas[talla] = Number(cantidadInput.value);
    }
  });
  formData.append("stock_tallas", JSON.stringify(stockTallas));

  if (form.imagen && form.imagen.files.length > 0) {
    formData.append("imagen", form.imagen.files[0]);
  }
  fetch("https://bk-ecommerce-0e4f.onrender.com/producto", {
    method: "POST",
    body: formData,
  })
    .then((res) => res.json())
    .then((resp) => {
      showAlert(resp.message || "Producto creado");
      cargarProductos();
    });
}

function eliminarProducto(id) {
  if (!confirm("¿Seguro que deseas eliminar este producto?")) return;
  fetch(`https://bk-ecommerce-0e4f.onrender.com/producto/${id}`, {
    method: "DELETE",
  })
    .then((res) => res.json())
    .then((resp) => {
      showAlert(resp.message || "Producto eliminado", "warning");
      cargarProductos();
    });
}

function editarProducto(id) {
  Promise.all([
    fetch(`https://bk-ecommerce-0e4f.onrender.com/producto/${id}`).then((res) => res.json()),
    obtenerCategorias(),
  ]).then(([prod, categorias]) => {
    const cont = document.getElementById("productos-table");
    const tallas = ["P", "M", "G", "GG"];
    const stockTallas = parseStockTallas(prod.stock_tallas);
    cont.innerHTML = `
        <h5>Editar Producto</h5>
        <form id="formEditarProducto">
          <div class="mb-3">
            <label>Nombre</label>
            <input type="text" class="form-control" name="nombre" value="${prod.nombre
      }" required>
          </div>
          <div class="mb-3">
            <label>Descripción</label>
            <textarea class="form-control" name="descripcion">${prod.descripcion || ""
      }</textarea>
          </div>
          <div class="mb-3">
            <label>Precio</label>
            <input type="number" step="0.01" class="form-control" name="precio" value="${prod.precio
      }" required>
          </div>
        <div class="mb-3">
          <label>Imagen</label>
          <input type="file" class="form-control" name="imagen" accept="image/*">
        </div>
          <div class="mb-3">
            <label>Destacado</label>
            <select class="form-control" name="destacado">
              <option value="false" ${!prod.destacado ? "selected" : ""
      }>No</option>
              <option value="true" ${prod.destacado ? "selected" : ""
      }>Sí</option>
            </select>
          </div>
          <div class="mb-3">
            <label>Stock por tallas</label>
            <div id="tallas-checkboxes" class="row">
              ${tallas.map(talla => `
                <div class="col-6 col-md-3 mb-2">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" value="${talla}" id="talla_${talla}" name="tallas" ${stockTallas[talla] ? "checked" : ""}>
                    <label class="form-check-label" for="talla_${talla}">${talla}</label>
                  </div>
                  <input type="number" class="form-control mt-1" id="cantidad_${talla}" name="cantidad_${talla}" placeholder="Cantidad" min="0" value="${stockTallas[talla] || ""}" style="${stockTallas[talla] ? "" : "display:none;"}">
                </div>
              `).join("")}
            </div>
          </div>
          <div class="mb-3">
            <label>Categoría</label>
            <select class="form-control" name="id_categoria" required>
              <option value="">Seleccione una categoría</option>
              ${categorias
        .map(
          (cat) =>
            `<option value="${cat.id_categoria}" ${prod.id_categoria == cat.id_categoria ? "selected" : ""
            }>${cat.nombre}</option>`
        )
        .join("")}
            </select>
          </div>
          <button type="submit" class="btn btn-primary">Guardar Cambios</button>
          <button type="button" class="btn btn-secondary ms-2" id="cancelarEditarProducto">Cancelar</button>
        </form>
      `;

    // Mostrar/ocultar input cantidad según checkbox
    tallas.forEach(talla => {
      const checkbox = document.getElementById(`talla_${talla}`);
      const inputCantidad = document.getElementById(`cantidad_${talla}`);
      checkbox.addEventListener('change', function () {
        inputCantidad.style.display = this.checked ? "" : "none";
        if (!this.checked) inputCantidad.value = "";
      });
    });

    document.getElementById("formEditarProducto").onsubmit = function (e) {
      e.preventDefault();
      const form = e.target;
      const formData = new FormData();
      formData.append("nombre", form.nombre.value);
      formData.append("descripcion", form.descripcion.value);
      formData.append("precio", form.precio.value);
      formData.append("destacado", form.destacado.value === "true");
      formData.append("id_categoria", form.id_categoria.value);

      // Armar stock_tallas como JSON
      const stockTallas = {};
      tallas.forEach(talla => {
        const checkbox = form.querySelector(`#talla_${talla}`);
        const cantidadInput = form.querySelector(`#cantidad_${talla}`);
        if (checkbox.checked && cantidadInput.value) {
          stockTallas[talla] = Number(cantidadInput.value);
        }
      });
      formData.append("stock_tallas", JSON.stringify(stockTallas));

      if (form.imagen && form.imagen.files.length > 0) {
        formData.append("imagen", form.imagen.files[0]);
      }

      fetch(`https://bk-ecommerce-0e4f.onrender.com/producto/${id}`, {
        method: "PUT",
        body: formData,
      })
        .then((res) => res.json())
        .then((resp) => {
          showAlert(resp.message || "Producto actualizado");
          cargarProductos();
        });
    };
    document.getElementById("cancelarEditarProducto").onclick = cargarProductos;
  });
}

window.cargarProductos = cargarProductos;
window.editarProducto = editarProducto;
window.eliminarProducto = eliminarProducto;
window.mostrarFormularioNuevoProducto = mostrarFormularioNuevoProducto;