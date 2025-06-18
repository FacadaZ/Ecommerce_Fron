function mostrarFormularioNuevoCupon() {
    const cont = document.getElementById("cupones-content");
    cont.innerHTML = `
        <div class="card">
            <div class="card-body">
                <h5>Nuevo Cupón</h5>
                <form id="formNuevoCupon">
                    <div class="mb-3">
                        <label>Código del cupón</label>
                        <input type="text" class="form-control" name="codigo" required>
                    </div>
                    <div class="mb-3">
                        <label>Puntos necesarios</label>
                        <input type="number" class="form-control" name="puntos" min="1" required>
                    </div>
                    <div class="mb-3">
                        <label>Descuento (%)</label>
                        <input type="number" class="form-control" name="descuento" min="1" max="100" required>
                    </div>
                    <button type="submit" class="btn btn-success">Crear Cupón</button>
                    <button type="button" class="btn btn-secondary ms-2" id="cancelarNuevoCupon">Cancelar</button>
                </form>
            </div>
        </div>
    `;
    document.getElementById("formNuevoCupon").onsubmit = guardarNuevoCupon;
    document.getElementById("cancelarNuevoCupon").onclick = cargarCupones;
}
function guardarNuevoCupon(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
        codigo: form.codigo.value.trim(),
        puntos: Number(form.puntos.value),
        descuento: Number(form.descuento.value)
    };
    fetch("https://bk-ecommerce-0e4f.onrender.com/cupones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(resp => {
        showAlert(resp.message || "Cupón creado", "success");
        cargarCupones();
    });
}
function cargarCupones() {
    fetch("https://bk-ecommerce-0e4f.onrender.com/cupones")
        .then(res => res.json())
        .then(cupones => {
            const cont = document.getElementById("cupones-content");
            let rows = cupones.length
                ? cupones.map(c => `
                    <tr>
                        <td>${c.id_cupon}</td>
                        <td>${c.codigo || '-'}</td>
                        <td>${c.puntos}</td>
                        <td>${c.descuento}</td>
                        <td>
                            <button class="btn btn-sm btn-warning" onclick="mostrarEditarCupon(${c.id_cupon})">Editar</button>
                            <button class="btn btn-sm btn-danger ms-2" onclick="eliminarCupon(${c.id_cupon})">Eliminar</button>
                        </td>
                    </tr>
                `).join("")
                : `<tr><td colspan="5" class="text-center">No hay cupones registrados</td></tr>`;
            cont.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5>Cupones</h5>
                    <button class="btn btn-primary" id="btnNuevoCupon">Nuevo Cupón</button>
                </div>
                <div class="table-responsive">
                    <table class="table table-bordered table-hover">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Código</th>
                                <th>Puntos necesarios</th>
                                <th>Descuento (%)</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>
                </div>
            `;
            document.getElementById("btnNuevoCupon").onclick = mostrarFormularioNuevoCupon;
        });
}

function mostrarEditarCupon(id) {
    fetch(`https://bk-ecommerce-0e4f.onrender.com/cupones`)
        .then(res => res.json())
        .then(cupones => {
            const cupon = cupones.find(c => c.id_cupon === id);
            if (!cupon) return showAlert("Cupón no encontrado", "danger");
            const cont = document.getElementById("cupones-content");
            cont.innerHTML = `
                <div class="card">
                    <div class="card-body">
                        <h5>Editar Cupón</h5>
                        <form id="formEditarCupon">
                            <div class="mb-3">
                                <label>Código del cupón</label>
                                <input type="text" class="form-control" name="codigo" value="${cupon.codigo}" required>
                            </div>
                            <div class="mb-3">
                                <label>Puntos necesarios</label>
                                <input type="number" class="form-control" name="puntos" min="1" value="${cupon.puntos}" required>
                            </div>
                            <div class="mb-3">
                                <label>Descuento (%)</label>
                                <input type="number" class="form-control" name="descuento" min="1" max="100" value="${cupon.descuento}" required>
                            </div>
                            <button type="submit" class="btn btn-success">Guardar Cambios</button>
                            <button type="button" class="btn btn-secondary ms-2" id="cancelarEditarCupon">Cancelar</button>
                        </form>
                    </div>
                </div>
            `;
            document.getElementById("formEditarCupon").onsubmit = function (e) {
                e.preventDefault();
                const data = {
                    codigo: e.target.codigo.value.trim(),
                    puntos: Number(e.target.puntos.value),
                    descuento: Number(e.target.descuento.value)
                };
                fetch(`https://bk-ecommerce-0e4f.onrender.com/cupones/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data)
                })
                .then(res => res.json())
                .then(resp => {
                    showAlert(resp.message || "Cupón actualizado", "success");
                    cargarCupones();
                });
            };
            document.getElementById("cancelarEditarCupon").onclick = cargarCupones;
        });
}

// Eliminar cupón
function eliminarCupon(id) {
    if (!confirm("¿Seguro que deseas eliminar este cupón?")) return;
    fetch(`https://bk-ecommerce-0e4f.onrender.com/cupones/${id}`, {
        method: "DELETE"
    })
    .then(res => res.json())
    .then(resp => {
        showAlert(resp.message || "Cupón eliminado", "warning");
        cargarCupones();
    });
}

window.cargarCupones = cargarCupones;
window.mostrarFormularioNuevoCupon = mostrarFormularioNuevoCupon;