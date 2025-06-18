async function asignarPuntos({ id_cliente, motivo, puntos, id_admin, id_temporada }) {
    try {
        const resp = await fetch('https://bk-ecommerce-0e4f.onrender.com/puntos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_cliente, motivo, puntos, id_admin, id_temporada })
        });
        const data = await resp.json();
        if (resp.ok) {
            showAlert(data.message || 'Puntos asignados correctamente', 'success');
            return data;
        } else {
            showAlert(data.error || 'Error al asignar puntos', 'danger');
        }
    } catch (err) {
        showAlert('Error de conexión al asignar puntos', 'danger');
        console.error(err);
    }
}
async function listarPedidosCliente(id_cliente) {
    try {
        const resp = await fetch(`https://bk-ecommerce-0e4f.onrender.com/api/pedidos/cliente/${id_cliente}`);
        const data = await resp.json();
        if (resp.ok) {
            renderPedidosCliente(data);
        } else {
            renderPedidosCliente([]);
        }
    } catch (err) {
        renderPedidosCliente([]);
        console.error(err);
    }
}

function renderPedidosCliente(pedidos) {
    const contenedor = document.getElementById('productos-comprados');
    if (!contenedor) return;
    if (!Array.isArray(pedidos) || pedidos.length === 0) {
        contenedor.innerHTML = '<p class="text-muted">Este cliente no tiene pedidos aún.</p>';
        return;
    }
    contenedor.innerHTML = `
        <h6 class="mb-2">Pedidos del cliente</h6>
        <ul class="list-group mb-3">
            ${pedidos.map(p => `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    Pedido #${p.id_pedido} - ${p.fecha} 
                    <span class="badge bg-primary rounded-pill">${p.estado || ''}</span>
                </li>
            `).join('')}
        </ul>
    `;
}

async function listarClientes() {
    try {
        const resp = await fetch('https://bk-ecommerce-0e4f.onrender.com/clientes');
        const data = await resp.json();
        if (resp.ok) {
            renderClientesTabla(data);
        } else {
            alert(data.error || 'Error al obtener clientes');
        }
    } catch (err) {
        alert('Error de conexión al obtener clientes');
        console.error(err);
    }
}

function renderClientesTabla(clientes) {
    const contenedor = document.getElementById('clientes-table');
    if (!contenedor) return;
    if (!Array.isArray(clientes) || clientes.length === 0) {
        contenedor.innerHTML = '<p class="text-muted">No hay clientes registrados.</p>';
        return;
    }
    contenedor.innerHTML = `
        <table class="table table-bordered table-hover">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>WhatsApp</th>
                    <th>Ver puntos</th>
                </tr>
            </thead>
            <tbody>
                ${clientes.map(c => `
                    <tr>
                        <td>${c.id_cliente}</td>
                        <td>${c.codigo_cliente || '-'}</td>
                        <td>${c.nombre}</td>
                        <td>${c.numero_whatsapp || '-'}</td>
                        <td>
                            <button class="btn btn-primary btn-sm" onclick="verPuntosCliente(${c.id_cliente})">
                                Ver puntos / Asignar
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function listarPuntosPorCliente(id_cliente) {
    try {
        const resp = await fetch(`https://bk-ecommerce-0e4f.onrender.com/puntos/cliente/${id_cliente}`);
        const data = await resp.json();
        if (resp.ok) {
            renderPuntosTabla(data);
            return data;
        } else {
            alert(data.error || 'Error al obtener puntos');
        }
    } catch (err) {
        alert('Error de conexión al obtener puntos');
        console.error(err);
    }
}

function renderPuntosTabla(puntos) {
    const contenedor = document.getElementById('puntos-table');
    if (!contenedor) return;
    if (!Array.isArray(puntos) || puntos.length === 0) {
        contenedor.innerHTML = '<p class="text-muted">No hay puntos registrados para este cliente.</p>';
        return;
    }
    contenedor.innerHTML = `
        <table class="table table-bordered table-striped">
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Motivo</th>
                    <th>Puntos</th>
                    <th>Temporada</th>
                </tr>
            </thead>
            <tbody>
                ${puntos.map(p => `
                    <tr>
                        <td>${p.fecha}</td>
                        <td>${p.motivo}</td>
                        <td>${p.puntos}</td>
                        <td>${p.Temporada ? p.Temporada.nombre : '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function enviarAsignarPuntos(e) {
    e.preventDefault();
    const form = e.target;
    const id_cliente = document.getElementById('form-id-cliente').value;
    const motivo = form.motivo.value;
    const puntos = form.puntos.value;
    const id_admin = form.id_admin.value;
    const id_temporada = form.id_temporada.value;

    asignarPuntos({ id_cliente, motivo, puntos, id_admin, id_temporada }).then(() => {
        listarPuntosPorCliente(id_cliente);
    });
}

async function cargarAdminsComboBox() {
    try {
        const resp = await fetch('https://bk-ecommerce-0e4f.onrender.com/admin'); 
        const data = await resp.json();
        const select = document.getElementById('form-id-admin');
        if (!select) return;
        select.innerHTML = '<option value="">Selecciona un admin</option>';
        data.forEach(admin => {
            select.innerHTML += `<option value="${admin.id_usuario}">${admin.nombre}</option>`;
        });
    } catch (err) {
        console.error('Error al cargar admin', err);
    }
}

async function cargarTemporadas() {
    try {
        const resp = await fetch('https://bk-ecommerce-0e4f.onrender.com/temporada/all');
        const data = await resp.json();
        const select = document.getElementById('form-id-temporada');
        if (!select) return;
        select.innerHTML = '<option value="">Selecciona una temporada</option>';
        data.forEach(temp => {
            select.innerHTML += `<option value="${temp.id_temporada}">${temp.nombre} (${temp.fecha_inicio} a ${temp.fecha_fin})</option>`;
        });
    } catch (err) {
        console.error('Error al cargar temporadas', err);
    }
}

function mostrarSeccionPuntos() {
    listarClientes();
    cargarAdminsComboBox();
    cargarTemporadas()
    const detalle = document.getElementById('puntos-detalle');
    if (detalle) detalle.style.display = 'none';
}

window.verPuntosCliente = function(id_cliente) {
    listarPuntosPorCliente(id_cliente);
    listarPedidosCliente(id_cliente);
    const inputCliente = document.getElementById('form-id-cliente');
    if (inputCliente) inputCliente.value = id_cliente;
    const detalle = document.getElementById('puntos-detalle');
    if (detalle) detalle.style.display = 'block';
}

window.mostrarSeccionPuntos = mostrarSeccionPuntos;