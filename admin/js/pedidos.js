
async function cargarPedidos() {
    const res = await fetch("https://bk-ecommerce-0e4f.onrender.com/pedidos");
    const pedidos = await res.json();
    const pedidosTable = document.getElementById("pedidos-table");
    if (!pedidos.length) {
        pedidosTable.innerHTML = "<p>No hay pedidos registrados.</p>";
        return;
    }
    pedidosTable.innerHTML = `
        <div class="table-responsive">
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Cliente</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                        <th>Total</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${pedidos.map(p => `
                        <tr>
                            <td>${p.id_pedido}</td>
                            <td>${p.Cliente ? p.Cliente.nombre : p.id_cliente}</td>
                            <td>${p.fecha}</td>
                            <td>
                                <button class="btn btn-sm
                                    ${p.estado === "aprobado" ? "btn-success" : ""}
                                    ${p.estado === "pendiente" ? "btn-warning" : ""}
                                    ${p.estado === "cancelado" ? "btn-danger" : ""}"
                                    disabled>
                                    ${p.estado.charAt(0).toUpperCase() + p.estado.slice(1)}
                                </button>
                            </td>
                            <td>R$${p.total}</td>
                            <td>
                                <button class="btn btn-primary btn-sm text-white me-2" onclick="verDetallePedido(${p.id_pedido})">
                                    Detalle
                                </button>
                                <button class="btn btn-danger btn-sm" title="Eliminar" onclick="eliminarPedido(${p.id_pedido})">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
}

async function verDetallePedido(id_pedido) {
    const res = await fetch(`https://bk-ecommerce-0e4f.onrender.com/pedidos/${id_pedido}`);
    const pedido = await res.json();
    const productos = pedido.PedidoProductos || [];
    let html = "";

    // Selector de estado
    html += `
        <div class="mb-3">
            <label for="estadoPedido" class="form-label">Estado del pedido:</label>
            <select id="estadoPedido" class="form-select">
                <option value="pendiente" ${pedido.estado === "pendiente" ? "selected" : ""}>Pendiente</option>
                <option value="aprobado" ${pedido.estado === "aprobado" ? "selected" : ""}>Aprobado</option>
                <option value="cancelado" ${pedido.estado === "cancelado" ? "selected" : ""}>Cancelado</option>
            </select>
            <button id="guardarEstadoBtn" class="btn btn-primary btn-sm mt-2">Guardar estado</button>
        </div>
    `;

    if (!productos.length) {
        html += "<p>No hay productos en este pedido.</p>";
    } else {
        html += `
            <table class="table">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Talla</th>
                        <th>Cantidad</th>
                        <th>Precio Unitario</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${productos.map(prod => `
                        <tr>
                            <td>${prod.Producto ? prod.Producto.nombre : prod.id_producto}</td>
                            <td>${prod.talla}</td>
                            <td>${prod.cantidad}</td>
                            <td>R$${prod.precio_unitario}</td>
                            <td>R$${(prod.precio_unitario * prod.cantidad).toFixed(2)}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `;
    }
    document.getElementById("pedidoDetalleBody").innerHTML = html;

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById("pedidoDetalleModal"));
    modal.show();

    // ...existing code...
    // Listener para guardar el estado
    document.getElementById("guardarEstadoBtn").onclick = async function () {
        const nuevoEstado = document.getElementById("estadoPedido").value;
        try {
            const resp = await fetch(`https://bk-ecommerce-0e4f.onrender.com/pedidos/${id_pedido}/estado`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ estado: nuevoEstado })
            });
            const data = await resp.json();
            if (resp.ok) {
                showAlert(data.message || "Estado actualizado correctamente", "success");
                modal.hide();
                cargarPedidos(); // refresca la tabla
            } else {
                showAlert(data.message || "Error al actualizar el estado", "danger");
            }
        } catch (err) {
            showAlert("Error de conexión al actualizar el estado", "danger");
        }
    };
}


window.eliminarPedido = async function(id_pedido) {
    if (!confirm("¿Seguro que deseas eliminar este pedido?")) return;
    try {
        const resp = await fetch(`https://bk-ecommerce-0e4f.onrender.com/pedidos/${id_pedido}`, {
            method: "DELETE"
        });
        const data = await resp.json();
        if (resp.ok) {
            showAlert(data.message || "Pedido eliminado correctamente", "success");
            cargarPedidos();
        } else {
            showAlert(data.error || "Error al eliminar el pedido", "danger");
        }
    } catch (err) {
        showAlert("Error de conexión al eliminar el pedido", "danger");
    }
};
