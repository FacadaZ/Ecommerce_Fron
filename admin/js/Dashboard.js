function obtenerEstadisticas() {
    const fetchSafe = (url) => {
        return fetch(url)
            .then(res => {
                if (!res.ok) {
                    console.warn(`API ${url} retornó ${res.status}`);
                    return [];
                }
                return res.json();
            })
            .catch(error => {
                console.warn(`Error al conectar con ${url}:`, error);
                return [];
            });
    };

    return Promise.all([
        fetchSafe("https://bk-ecommerce-0e4f.onrender.com/admin"),
        fetchSafe("https://bk-ecommerce-0e4f.onrender.com/producto"),
        fetchSafe("https://bk-ecommerce-0e4f.onrender.com/pedidos"),
        fetchSafe("https://bk-ecommerce-0e4f.onrender.com/cupones")
    ]);
}

function cargarDashboard() {
    console.log("Cargando dashboard...");
    const cont = document.getElementById("dashboard-content");

    cont.innerHTML = `
    <div class="text-center">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>
  `;

    obtenerEstadisticas()
        .then(([admins, productos, pedidos, cupones]) => {
            const adminsSafe = Array.isArray(admins) ? admins : [];
            const productosSafe = Array.isArray(productos) ? productos : [];
            const pedidosSafe = Array.isArray(pedidos) ? pedidos : [];
            const cuponesSafe = Array.isArray(cupones) ? cupones : [];

            const totalUsuarios = adminsSafe.length;
            const totalProductos = productosSafe.length;
            const totalPedidos = pedidosSafe.length;
            const totalCupones = cuponesSafe.length;

            // Calcular ventas del mes actual
            const fechaActual = new Date();
            const ventasDelMesActual = calcularVentasPorMes(pedidosSafe, fechaActual.getFullYear(), fechaActual.getMonth());

            cont.innerHTML = `
        <!-- ESTADÍSTICAS PRINCIPALES -->
        <div class="row mb-4">
          <div class="col-xl-3 col-md-6 mb-4">
            <div class="card border-left-primary shadow h-100 py-2">
              <div class="card-body">
                <div class="row no-gutters align-items-center">
                  <div class="col mr-2">
                    <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                      Total Usuarios
                    </div>
                    <div class="h5 mb-0 font-weight-bold text-gray-800">${totalUsuarios}</div>
                  </div>
                  <div class="col-auto">
                    <i class="bi bi-people fa-2x text-gray-300"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-xl-3 col-md-6 mb-4">
            <div class="card border-left-success shadow h-100 py-2">
              <div class="card-body">
                <div class="row no-gutters align-items-center">
                  <div class="col mr-2">
                    <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                      Ventas del Mes
                    </div>
                    <div class="h5 mb-0 font-weight-bold text-gray-800">R$ ${ventasDelMesActual.toFixed(2)}</div>
                    <small class="text-muted">${obtenerNombreMes(fechaActual.getMonth())} ${fechaActual.getFullYear()}</small>
                  </div>
                  <div class="col-auto">
                    <i class="bi bi-currency-dollar fa-2x text-gray-300"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-xl-3 col-md-6 mb-4">
            <div class="card border-left-info shadow h-100 py-2">
              <div class="card-body">
                <div class="row no-gutters align-items-center">
                  <div class="col mr-2">
                    <div class="text-xs font-weight-bold text-info text-uppercase mb-1">
                      Total Productos
                    </div>
                    <div class="h5 mb-0 font-weight-bold text-gray-800">${totalProductos}</div>
                  </div>
                  <div class="col-auto">
                    <i class="bi bi-box fa-2x text-gray-300"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-xl-3 col-md-6 mb-4">
            <div class="card border-left-warning shadow h-100 py-2">
              <div class="card-body">
                <div class="row no-gutters align-items-center">
                  <div class="col mr-2">
                    <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">
                      Total Pedidos
                    </div>
                    <div class="h5 mb-0 font-weight-bold text-gray-800">${totalPedidos}</div>
                  </div>
                  <div class="col-auto">
                    <i class="bi bi-cart fa-2x text-gray-300"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-lg-6 mb-4">
            <div class="card shadow mb-4">
              <div class="card-header py-3">
                <h6 class="m-0 font-weight-bold text-primary">Actividad Reciente</h6>
              </div>
              <div class="card-body">
                <div class="list-group list-group-flush" id="actividad-reciente">
                  ${generarActividadReciente(pedidosSafe)}
                </div>
              </div>
            </div>
          </div>

          <div class="col-lg-6 mb-4">
            <div class="card shadow mb-4">
              <div class="card-header py-3">
                <h6 class="m-0 font-weight-bold text-primary">Productos Destacados</h6>
              </div>
              <div class="card-body">
                <div id="productos-destacados">
                  ${generarProductosDestacados(productosSafe)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-12">
            <div class="card shadow mb-4">
              <div class="card-header py-3">
                <h6 class="m-0 font-weight-bold text-primary">Resumen del Sistema</h6>
              </div>
              <div class="card-body">
                <div class="row text-center">
                  <div class="col-md-3">
                    <div class="mb-3">
                      <i class="bi bi-ticket-perforated fa-3x text-info mb-2"></i>
                      <h5>${totalCupones}</h5>
                      <small class="text-muted">Cupones Activos</small>
                    </div>
                  </div>
                  <div class="col-md-3">
                    <div class="mb-3">
                      <i class="bi bi-star fa-3x text-warning mb-2"></i>
                      <h5>${productosSafe.filter(p => p.destacado).length}</h5>
                      <small class="text-muted">Productos Destacados</small>
                    </div>
                  </div>
                  <div class="col-md-3">
                    <div class="mb-3">
                      <i class="bi bi-check-circle fa-3x text-success mb-2"></i>
                      <h5>${pedidosSafe.filter(p => p.estado === 'completado' || p.estado === 'aprobado').length}</h5>
                      <small class="text-muted">Pedidos Completados</small>
                    </div>
                  </div>
                  <div class="col-md-3">
                    <div class="mb-3">
                      <i class="bi bi-clock fa-3x text-warning mb-2"></i>
                      <h5>${pedidosSafe.filter(p => p.estado === 'pendiente').length}</h5>
                      <small class="text-muted">Pedidos Pendientes</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
        })
        .catch(error => {
            console.error("Error al cargar dashboard:", error);
            cont.innerHTML = `
        <div class="alert alert-warning">
          <i class="bi bi-exclamation-triangle me-2"></i>
          Dashboard cargado con datos limitados. Algunas APIs no están disponibles.
          <br><small>Error: ${error.message}</small>
        </div>
        <div class="row">
          <div class="col-12 text-center py-5">
            <i class="bi bi-graph-up fa-3x text-muted mb-3"></i>
            <h4>Dashboard en Modo Demo</h4>
            <p class="text-muted">Mostrando datos de ejemplo mientras se conectan las APIs</p>
          </div>
        </div>
      `;
        });
}

// Función para obtener nombre del mes
function obtenerNombreMes(numeroMes) {
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[numeroMes];
}

// Función para calcular ventas por mes específico
function calcularVentasPorMes(pedidos, año, mes) {
    const pedidosDelMes = pedidos.filter(pedido => {
        // Corregir el parsing de fechas
        let fechaString = pedido.fecha;
        if (fechaString && fechaString.includes('-') && !fechaString.includes('T')) {
            fechaString = fechaString + 'T12:00:00';
        }
        
        const fechaPedido = new Date(fechaString);
        const esDelMes = fechaPedido.getMonth() === mes && fechaPedido.getFullYear() === año;
        const estaAprobado = pedido.estado === 'aprobado' || pedido.estado === 'completado' || pedido.estado === 'entregado';
        
        return esDelMes && estaAprobado;
    });

    return pedidosDelMes.reduce((sum, pedido) => sum + parseFloat(pedido.total || 0), 0);
}

// Función mejorada para actividad reciente
function generarActividadReciente(pedidos) {
    if (!Array.isArray(pedidos) || pedidos.length === 0) {
        return '<p class="text-muted">No hay actividad reciente</p>';
    }

    const pedidosRecientes = pedidos
        .sort((a, b) => {
            const fechaA = new Date(a.fecha || a.fecha_pedido || a.created_at || a.date || Date.now());
            const fechaB = new Date(b.fecha || b.fecha_pedido || b.created_at || b.date || Date.now());
            return fechaB - fechaA;
        })
        .slice(0, 5);

    return pedidosRecientes.map(pedido => {
        const fechaCampo = pedido.fecha || pedido.fecha_pedido || pedido.created_at || pedido.date || null;
        
        let fecha = 'Fecha no disponible';
        if (fechaCampo) {
            let fechaString = fechaCampo;
            if (fechaCampo.includes('-') && !fechaCampo.includes('T')) {
                fechaString = fechaCampo + 'T12:00:00';
            }
            
            const fechaObj = new Date(fechaString);
            fecha = fechaObj.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }

        const cliente = pedido.Cliente?.nombre ||
            pedido.cliente?.nombre ||
            pedido.nombre_cliente ||
            pedido.user_name ||
            pedido.usuario ||
            'Cliente no especificado';

        const estado = pedido.estado || pedido.status || pedido.state || 'pendiente';
        const idPedido = pedido.id_pedido || pedido.id || pedido.pedido_id || 'N/A';
        const total = pedido.total ? `R$ ${pedido.total}` : '';

        const iconoEstado = {
            'completado': 'bi-check-circle text-success',
            'aprobado': 'bi-check-circle text-success',
            'entregado': 'bi-check-circle text-success',
            'pendiente': 'bi-clock text-warning',
            'procesando': 'bi-clock text-warning',
            'cancelado': 'bi-x-circle text-danger',
            'rechazado': 'bi-x-circle text-danger'
        };

        const colorEstado = {
            'completado': 'success',
            'aprobado': 'success',
            'entregado': 'success',
            'pendiente': 'warning',
            'procesando': 'warning',
            'cancelado': 'danger',
            'rechazado': 'danger'
        };

        return `
      <div class="list-group-item d-flex justify-content-between align-items-center">
        <div>
          <i class="${iconoEstado[estado.toLowerCase()] || 'bi-circle text-secondary'} me-2"></i>
          <strong>Pedido #${idPedido}</strong>
          <small class="text-muted d-block">Cliente: ${cliente} ${total ? '- ' + total : ''}</small>
        </div>
        <div class="text-end">
          <small class="text-muted">${fecha}</small>
          <div class="badge bg-${colorEstado[estado.toLowerCase()] || 'secondary'}">${estado}</div>
        </div>
      </div>
    `;
    }).join('');
}

// Función para generar productos destacados
function generarProductosDestacados(productos) {
    if (!Array.isArray(productos) || productos.length === 0) {
        return '<p class="text-muted">No hay productos destacados</p>';
    }

    const productosDestacados = productos.filter(p => p.destacado).slice(0, 5);

    if (productosDestacados.length === 0) {
        return '<p class="text-muted">No hay productos destacados</p>';
    }

    return productosDestacados.map(producto => `
    <div class="d-flex align-items-center mb-3">
      <div class="me-3">
        ${producto.imagen
            ? `<img src="${producto.imagen}" alt="${producto.nombre}" style="width: 50px; height: 50px; object-fit: cover;" class="rounded">`
            : `<div class="bg-light rounded d-flex align-items-center justify-content-center" style="width: 50px; height: 50px;"><i class="bi bi-image text-muted"></i></div>`
        }
      </div>
      <div class="flex-grow-1">
        <h6 class="mb-1">${producto.nombre}</h6>
        <small class="text-muted">R$ ${producto.precio}</small>
      </div>
      <span class="badge bg-warning">Destacado</span>
    </div>
  `).join('');
}

// Función para actualizar dashboard en tiempo real
function actualizarDashboard() {
    const dashboard = document.getElementById("dashboard-content");
    if (dashboard && dashboard.style.display !== "none") {
        cargarDashboard();
    }
}

// Exportar funciones al scope global
window.cargarDashboard = cargarDashboard;
window.actualizarDashboard = actualizarDashboard;