function cargarReportes() {
    console.log("Cargando reportes...");
    const cont = document.getElementById("reports-content");

    cont.innerHTML = `
    <div class="row">
      <div class="col-12 mb-4">
        <div class="card shadow">
          <div class="card-header py-3">
            <h6 class="m-0 font-weight-bold text-primary">Filtros de Reportes</h6>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-4">
                <label class="form-label">Fecha Inicio</label>
                <input type="date" class="form-control" id="fechaInicio">
              </div>
              <div class="col-md-4">
                <label class="form-label">Fecha Fin</label>
                <input type="date" class="form-control" id="fechaFin">
              </div>
              <div class="col-md-4 d-flex align-items-end">
                <button class="btn btn-primary w-100" onclick="aplicarFiltrosReporte()">
                  <i class="bi bi-funnel me-2"></i>Aplicar Filtros
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 mb-4">
        <div class="card shadow">
          <div class="card-header py-3 d-flex justify-content-between align-items-center">
            <h6 class="m-0 font-weight-bold text-primary">
              <i class="bi bi-graph-up me-2"></i>Reporte de Ventas
            </h6>
            <span class="badge bg-success">Detallado</span>
          </div>
          <div class="card-body text-center">
            <p class="text-muted mb-4">Genera reportes detallados de ventas por período, incluyendo productos más vendidos y métricas de rendimiento.</p>
            <div class="d-flex gap-2 justify-content-center">
              <button class="btn btn-success btn-lg" onclick="generarReporteVentas()">
                <i class="bi bi-file-earmark-pdf me-2"></i>Generar Reporte PDF
              </button>
              <button class="btn btn-outline-secondary btn-lg" onclick="generarReporteTexto()">
                <i class="bi bi-file-earmark-text me-2"></i>Generar TXT
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

    configurarFechasPorDefecto();
}

function configurarFechasPorDefecto() {
    const fechaInicio = document.getElementById("fechaInicio");
    const fechaFin = document.getElementById("fechaFin");

    if (fechaInicio && fechaFin) {
        const hoy = new Date();
        const mesAnterior = new Date(
            hoy.getFullYear(),
            hoy.getMonth() - 1,
            hoy.getDate()
        );

        fechaInicio.value = mesAnterior.toISOString().split("T")[0];
        fechaFin.value = hoy.toISOString().split("T")[0];
    }
}

function aplicarFiltrosReporte() {
    const fechaInicio = document.getElementById("fechaInicio")?.value || "";
    const fechaFin = document.getElementById("fechaFin")?.value || "";

    if (!fechaInicio || !fechaFin) {
        if (typeof showAlert === "function") {
            showAlert(
                "Por favor selecciona ambas fechas para aplicar los filtros",
                "warning"
            );
        } else {
            alert("Por favor selecciona ambas fechas");
        }
        return;
    }

    if (fechaInicio > fechaFin) {
        if (typeof showAlert === "function") {
            showAlert(
                "La fecha de inicio no puede ser mayor que la fecha fin",
                "error"
            );
        } else {
            alert("Fechas inválidas");
        }
        return;
    }

    console.log("Aplicando filtros de ventas:", { fechaInicio, fechaFin });

    if (typeof showAlert === "function") {
        showAlert(`Filtros aplicados: ${fechaInicio} hasta ${fechaFin}`, "success");
    }
}

async function obtenerDatosVentas(fechaInicio = "", fechaFin = "") {
    try {
        // Solo obtener pedidos ya que los datos del cliente están incluidos en cada pedido
        const response = await fetch(
            "https://bk-ecommerce-0e4f.onrender.com/pedidos"
        );

        if (!response.ok) {
            throw new Error(`Error HTTP en pedidos: ${response.status}`);
        }

        const pedidos = await response.json();

        if (!Array.isArray(pedidos)) {
            throw new Error("Datos inválidos recibidos de la API de pedidos");
        }

        console.log("Estructura de pedidos recibidos:", pedidos[0]); // Para depurar

        // Filtrar por fechas si se especifican
        let pedidosFiltrados = pedidos;
        if (fechaInicio && fechaFin) {
            pedidosFiltrados = pedidos.filter((pedido) => {
                if (!pedido.fecha) return false;

                let fechaPedido = pedido.fecha;
                if (fechaPedido.includes("T")) {
                    fechaPedido = fechaPedido.split("T")[0];
                }

                return fechaPedido >= fechaInicio && fechaPedido <= fechaFin;
            });
        }

        // Filtrar solo ventas aprobadas/completadas
        const ventas = pedidosFiltrados
            .filter((pedido) =>
                ["aprobado", "completado", "entregado"].includes(pedido.estado)
            )
            .map((pedido) => {
                console.log("Procesando pedido:", pedido.id_pedido);
                console.log("Cliente encontrado:", pedido.Cliente);

                return {
                    ...pedido,
                    // Los datos del cliente están en el objeto Cliente anidado
                    nombre_cliente: pedido.Cliente?.nombre || "Cliente no encontrado",
                    telefono_cliente:
                        pedido.Cliente?.numero_whatsapp || "Teléfono no disponible",
                    codigo_cliente:
                        pedido.Cliente?.codigo_cliente || "Código no disponible",

                    // Para método de pago y dirección, como vienen del checkout, podrían estar directamente en el pedido
                    // Pero según el checkout que viste, estos se envían pero no se ven en la estructura
                    // Los campos del checkout son: pago y entrega
                    metodo_pago:
                        pedido.metodo_pago || pedido.pago || "Método no especificado",
                    direccion_envio:
                        pedido.direccion_envio ||
                        pedido.entrega ||
                        pedido.lugar_entrega ||
                        "Dirección no especificada",
                };
            });

        return {
            ventas,
            totalVentas: ventas.length,
            montoTotal: ventas.reduce(
                (sum, venta) => sum + parseFloat(venta.total || 0),
                0
            ),
            fechaInicio,
            fechaFin,
        };
    } catch (error) {
        console.error("Error al obtener datos de ventas:", error);
        throw error;
    }
}

// Función para generar PDF bonito
function generarReportePDF(datos) {
    const { ventas, totalVentas, montoTotal, fechaInicio, fechaFin } = datos;

    // Verificar que jsPDF esté disponible
    if (!window.jspdf) {
        throw new Error("jsPDF no está cargado. Agrega la librería jsPDF al HTML.");
    }

    // Crear nuevo documento PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Configurar colores y fuentes
    const colorPrimario = [41, 128, 185]; // Azul
    const colorSecundario = [52, 73, 94]; // Gris oscuro
    const colorExito = [39, 174, 96]; // Verde
    const colorTexto = [44, 62, 80]; // Gris texto

    let yPosition = 20;

    // === ENCABEZADO ===
    doc.setFontSize(22);
    doc.setTextColor(...colorPrimario);
    doc.text("REPORTE DE VENTAS", 105, yPosition, { align: "center" });

    yPosition += 12;
    doc.setFontSize(12);
    doc.setTextColor(...colorSecundario);
    doc.text(
        `Período: ${fechaInicio || "Inicio"} - ${fechaFin || "Fin"}`,
        105,
        yPosition,
        { align: "center" }
    );

    yPosition += 6;
    doc.setFontSize(10);
    doc.text(
        `Fecha de generación: ${new Date().toLocaleString("es-ES")}`,
        105,
        yPosition,
        { align: "center" }
    );

    // Línea separadora
    yPosition += 10;
    doc.setDrawColor(...colorPrimario);
    doc.setLineWidth(1);
    doc.line(20, yPosition, 190, yPosition);

    // === RESUMEN EJECUTIVO ===
    yPosition += 15;
    doc.setFontSize(16);
    doc.setTextColor(...colorPrimario);
    doc.text("RESUMEN EJECUTIVO", 20, yPosition);

    yPosition += 12;

    // Cajas de estadísticas
    const estadisticas = [
        { label: "Total de ventas", valor: totalVentas, color: colorPrimario },
        {
            label: "Monto total",
            valor: `R$ ${montoTotal.toFixed(2)}`,
            color: colorExito,
        },
        {
            label: "Promedio por venta",
            valor: `R$ ${totalVentas > 0 ? (montoTotal / totalVentas).toFixed(2) : "0.00"
                }`,
            color: colorSecundario,
        },
    ];

    estadisticas.forEach((stat, index) => {
        const xPos = 20 + index * 60;

        // Rectángulo de fondo
        doc.setFillColor(...stat.color);
        doc.rect(xPos, yPosition, 50, 22, "F");

        // Texto blanco encima
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text(stat.label, xPos + 25, yPosition + 8, { align: "center" });
        doc.setFontSize(11);
        doc.text(stat.valor.toString(), xPos + 25, yPosition + 16, {
            align: "center",
        });
    });

    yPosition += 35;

    // === TOP 5 PRODUCTOS MÁS VENDIDOS ===
    doc.setFontSize(14);
    doc.setTextColor(...colorPrimario);
    doc.text("TOP 5 PRODUCTOS MÁS VENDIDOS", 20, yPosition);

    yPosition += 12;

    // Calcular productos más vendidos
    const productosVendidos = {};
    ventas.forEach((venta) => {
        if (venta.PedidoProductos && venta.PedidoProductos.length > 0) {
            venta.PedidoProductos.forEach((item) => {
                const nombreProducto = item.Producto?.nombre || "Producto sin nombre";
                const cantidad = parseInt(item.cantidad) || 0;
                const precio = parseFloat(item.precio_unitario) || 0;

                if (!productosVendidos[nombreProducto]) {
                    productosVendidos[nombreProducto] = {
                        cantidad: 0,
                        ingresos: 0,
                        ventas: 0,
                    };
                }

                productosVendidos[nombreProducto].cantidad += cantidad;
                productosVendidos[nombreProducto].ingresos += cantidad * precio;
                productosVendidos[nombreProducto].ventas += 1;
            });
        }
    });

    const productosOrdenados = Object.entries(productosVendidos)
        .sort((a, b) => b[1].cantidad - a[1].cantidad)
        .slice(0, 5);

    if (productosOrdenados.length > 0) {
        doc.setFontSize(10);
        doc.setTextColor(...colorTexto);

        productosOrdenados.forEach(([producto, datos], index) => {
            const yPos = yPosition + index * 16;

            // Número de ranking
            doc.setFillColor(...colorPrimario);
            doc.circle(25, yPos + 5, 6, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.text((index + 1).toString(), 25, yPos + 7, { align: "center" });

            // Información del producto
            doc.setTextColor(...colorTexto);
            doc.setFontSize(11);
            doc.text(producto, 35, yPos + 3);
            doc.setFontSize(9);
            doc.text(
                `${datos.cantidad} unidades - R$ ${datos.ingresos.toFixed(2)}`,
                35,
                yPos + 9
            );

            // Barra de progreso
            const maxCantidad = productosOrdenados[0][1].cantidad;
            const porcentaje = (datos.cantidad / maxCantidad) * 100;
            const barraWidth = (porcentaje / 100) * 60;

            // Fondo de la barra
            doc.setFillColor(230, 230, 230);
            doc.rect(120, yPos + 2, 60, 8, "F");
            // Barra de progreso
            doc.setFillColor(...colorExito);
            doc.rect(120, yPos + 2, barraWidth, 8, "F");

            // Porcentaje
            doc.setFontSize(8);
            doc.setTextColor(...colorSecundario);
            doc.text(`${porcentaje.toFixed(0)}%`, 185, yPos + 7, { align: "right" });
        });

        yPosition += productosOrdenados.length * 16 + 15;
    } else {
        doc.setFontSize(10);
        doc.setTextColor(...colorSecundario);
        doc.text("No hay datos de productos disponibles.", 20, yPosition);
        yPosition += 15;
    }

    // === TOP 5 CLIENTES ===
    doc.setFontSize(14);
    doc.setTextColor(...colorPrimario);
    doc.text("TOP 5 CLIENTES QUE MÁS COMPRARON", 20, yPosition);

    yPosition += 12;

    // Calcular clientes top
    const clientesCompras = {};
    ventas.forEach((venta) => {
        const nombreCliente = venta.nombre_cliente || "Cliente desconocido";
        const codigoCliente = venta.codigo_cliente || "Sin código";
        const telefonoCliente = venta.telefono_cliente || "Sin teléfono";
        const total = parseFloat(venta.total) || 0;

        const clienteKey = `${nombreCliente} (${codigoCliente})`;

        if (!clientesCompras[clienteKey]) {
            clientesCompras[clienteKey] = {
                nombre: nombreCliente,
                codigo: codigoCliente,
                telefono: telefonoCliente,
                totalGastado: 0,
                numeroCompras: 0,
                productosComprados: 0,
            };
        }

        clientesCompras[clienteKey].totalGastado += total;
        clientesCompras[clienteKey].numeroCompras += 1;

        if (venta.PedidoProductos && venta.PedidoProductos.length > 0) {
            venta.PedidoProductos.forEach((item) => {
                clientesCompras[clienteKey].productosComprados +=
                    parseInt(item.cantidad) || 0;
            });
        }
    });

    const clientesOrdenados = Object.entries(clientesCompras)
        .sort((a, b) => b[1].totalGastado - a[1].totalGastado)
        .slice(0, 5);

    if (clientesOrdenados.length > 0) {
        doc.setFontSize(10);
        doc.setTextColor(...colorTexto);

        clientesOrdenados.forEach(([clienteKey, datos], index) => {
            const yPos = yPosition + index * 16;

            // Verificar si necesitamos nueva página
            if (yPos > 250) {
                doc.addPage();
                yPosition = 20;
                const newYPos = yPosition + index * 16;

                // Número de ranking
                doc.setFillColor(...colorExito);
                doc.circle(25, newYPos + 5, 6, "F");
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(10);
                doc.text((index + 1).toString(), 25, newYPos + 7, { align: "center" });

                // Información del cliente
                doc.setTextColor(...colorTexto);
                doc.setFontSize(11);
                doc.text(datos.nombre, 35, newYPos + 3);
                doc.setFontSize(9);
                doc.text(
                    `${datos.codigo} - ${datos.numeroCompras} compras`,
                    35,
                    newYPos + 9
                );

                // Monto gastado
                doc.setFontSize(11);
                doc.setTextColor(...colorExito);
                doc.text(`R$ ${datos.totalGastado.toFixed(2)}`, 150, newYPos + 6);

                return;
            }

            // Número de ranking
            doc.setFillColor(...colorExito);
            doc.circle(25, yPos + 5, 6, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.text((index + 1).toString(), 25, yPos + 7, { align: "center" });

            // Información del cliente
            doc.setTextColor(...colorTexto);
            doc.setFontSize(11);
            doc.text(datos.nombre, 35, yPos + 3);
            doc.setFontSize(9);
            doc.text(
                `${datos.codigo} - ${datos.numeroCompras} compras`,
                35,
                yPos + 9
            );

            // Monto gastado
            doc.setFontSize(11);
            doc.setTextColor(...colorExito);
            doc.text(`R$ ${datos.totalGastado.toFixed(2)}`, 150, yPos + 6);
        });

        yPosition += clientesOrdenados.length * 16 + 15;
    } else {
        doc.setFontSize(10);
        doc.setTextColor(...colorSecundario);
        doc.text("No hay datos de clientes disponibles.", 20, yPosition);
        yPosition += 15;
    }

    // === ESTADÍSTICAS ADICIONALES ===
    if (yPosition > 220) {
        doc.addPage();
        yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(...colorPrimario);
    doc.text("ESTADÍSTICAS ADICIONALES", 20, yPosition);

    yPosition += 15;
    doc.setFontSize(10);
    doc.setTextColor(...colorTexto);

    // Estadísticas en columnas
    const estadisticasAdicionales = [
        `Productos únicos vendidos: ${Object.keys(productosVendidos).length}`,
        `Clientes únicos: ${Object.keys(clientesCompras).length}`,
        `Total unidades vendidas: ${Object.values(productosVendidos).reduce(
            (sum, prod) => sum + prod.cantidad,
            0
        )}`,
        `Promedio unidades por venta: ${Object.keys(productosVendidos).length > 0
            ? (
                Object.values(productosVendidos).reduce(
                    (sum, prod) => sum + prod.cantidad,
                    0
                ) / totalVentas
            ).toFixed(1)
            : "0"
        }`,
    ];

    estadisticasAdicionales.forEach((stat, index) => {
        doc.text(`• ${stat}`, 20, yPosition + index * 8);
    });

    yPosition += estadisticasAdicionales.length * 8 + 10;

    // Ventas por estado
    const ventasPorEstado = ventas.reduce((acc, venta) => {
        acc[venta.estado] = (acc[venta.estado] || 0) + 1;
        return acc;
    }, {});

    doc.setFontSize(12);
    doc.setTextColor(...colorPrimario);
    doc.text("Ventas por estado:", 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setTextColor(...colorTexto);
    Object.entries(ventasPorEstado).forEach(([estado, cantidad], index) => {
        doc.text(`• ${estado}: ${cantidad} ventas`, 25, yPosition + index * 6);
    });

    // Pie de página
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
            `Página ${i} de ${totalPages} - Generado el ${new Date().toLocaleDateString(
                "es-ES"
            )}`,
            105,
            285,
            { align: "center" }
        );
    }

    return doc;
}

// Función principal para generar reporte PDF
async function generarReporteVentas() {
    const fechaInicio = document.getElementById("fechaInicio")?.value || "";
    const fechaFin = document.getElementById("fechaFin")?.value || "";

    if (typeof showAlert === "function") {
        showAlert("Generando reporte PDF...", "info");
    }

    try {
        const datosVentas = await obtenerDatosVentas(fechaInicio, fechaFin);

        // Generar el reporte en PDF
        const doc = generarReportePDF(datosVentas);
        doc.save(`reporte_ventas_${fechaInicio}_${fechaFin}.pdf`);

        if (typeof showAlert === "function") {
            showAlert(
                `Reporte PDF generado exitosamente: ${datosVentas.totalVentas} ventas encontradas`,
                "success"
            );
        }
    } catch (error) {
        console.error("Error al generar reporte:", error);
        if (typeof showAlert === "function") {
            showAlert("Error al generar el reporte. " + error.message, "error");
        } else {
            alert("Error al generar el reporte: " + error.message);
        }
    }
}

// Función para generar reporte en TXT (mantener la opción anterior)
async function generarReporteTexto() {
    const fechaInicio = document.getElementById("fechaInicio")?.value || "";
    const fechaFin = document.getElementById("fechaFin")?.value || "";

    if (typeof showAlert === "function") {
        showAlert("Generando reporte TXT...", "info");
    }

    try {
        const datosVentas = await obtenerDatosVentas(fechaInicio, fechaFin);

        const reporte = generarTextoReporte(datosVentas);
        descargarReporte(reporte, `reporte_ventas_${fechaInicio}_${fechaFin}.txt`);

        if (typeof showAlert === "function") {
            showAlert(
                `Reporte TXT generado exitosamente: ${datosVentas.totalVentas} ventas encontradas`,
                "success"
            );
        }
    } catch (error) {
        console.error("Error al generar reporte:", error);
        if (typeof showAlert === "function") {
            showAlert(
                "Error al generar el reporte. Verifica la conexión con la API.",
                "error"
            );
        } else {
            alert("Error al generar el reporte");
        }
    }
}

function formatearFecha(fechaString) {
    if (!fechaString) return "Fecha no disponible";

    try {
        let fechaSolo = fechaString;
        if (fechaString.includes("T")) {
            fechaSolo = fechaString.split("T")[0];
        }

        const partes = fechaSolo.split("-");
        const year = parseInt(partes[0]);
        const month = parseInt(partes[1]) - 1;
        const day = parseInt(partes[2]);

        const fecha = new Date(year, month, day);

        if (isNaN(fecha.getTime())) {
            return "Fecha inválida";
        }

        return fecha.toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    } catch (error) {
        console.warn("Error al formatear fecha:", fechaString, error);
        return "Fecha inválida";
    }
}

function generarTextoReporte(datos) {
    const { ventas, totalVentas, montoTotal, fechaInicio, fechaFin } = datos;

    let reporte = `
REPORTE DE VENTAS
=================
Período: ${fechaInicio || "Inicio"} - ${fechaFin || "Fin"}
Fecha de generación: ${new Date().toLocaleString("es-ES")}

RESUMEN EJECUTIVO
-----------------
Total de ventas: ${totalVentas}
Monto total: R$ ${montoTotal.toFixed(2)}
Promedio por venta: R$ ${totalVentas > 0 ? (montoTotal / totalVentas).toFixed(2) : "0.00"
        }

DETALLE DE VENTAS
-----------------
`;

    ventas.forEach((venta, index) => {
        reporte += `
${index + 1}. Pedido #${venta.id_pedido || "N/A"}
   Fecha: ${formatearFecha(venta.fecha)}
   Cliente: ${venta.nombre_cliente}
   Código Cliente: ${venta.codigo_cliente}
   Teléfono: ${venta.telefono_cliente}
   Estado: ${venta.estado || "N/A"}
   Total: R$ ${parseFloat(venta.total || 0).toFixed(2)}
`;

        if (venta.PedidoProductos && venta.PedidoProductos.length > 0) {
            reporte += `   Productos:\n`;
            venta.PedidoProductos.forEach((item, idx) => {
                const nombreProducto = item.Producto?.nombre || "Producto sin nombre";
                reporte += `     ${idx + 1}. ${nombreProducto} - Talla: ${item.talla
                    } - Cantidad: ${item.cantidad} - R$ ${item.precio_unitario}\n`;
            });
        }
    });

    reporte += `

ANÁLISIS DE PRODUCTOS MÁS VENDIDOS
==================================
`;

    const productosVendidos = {};
    ventas.forEach((venta) => {
        if (venta.PedidoProductos && venta.PedidoProductos.length > 0) {
            venta.PedidoProductos.forEach((item) => {
                const nombreProducto = item.Producto?.nombre || "Producto sin nombre";
                const cantidad = parseInt(item.cantidad) || 0;
                const precio = parseFloat(item.precio_unitario) || 0;

                if (!productosVendidos[nombreProducto]) {
                    productosVendidos[nombreProducto] = {
                        cantidad: 0,
                        ingresos: 0,
                        ventas: 0,
                    };
                }

                productosVendidos[nombreProducto].cantidad += cantidad;
                productosVendidos[nombreProducto].ingresos += cantidad * precio;
                productosVendidos[nombreProducto].ventas += 1;
            });
        }
    });

    const productosOrdenados = Object.entries(productosVendidos)
        .sort((a, b) => b[1].cantidad - a[1].cantidad)
        .slice(0, 10);

    if (productosOrdenados.length > 0) {
        reporte += `
TOP 10 PRODUCTOS MÁS VENDIDOS:
`;
        productosOrdenados.forEach(([producto, datos], index) => {
            reporte += `
${index + 1}. ${producto}
   - Cantidad vendida: ${datos.cantidad} unidades
   - Ingresos generados: R$ ${datos.ingresos.toFixed(2)}
   - Número de ventas: ${datos.ventas}
   - Promedio por venta: ${(datos.cantidad / datos.ventas).toFixed(
                1
            )} unidades`;
        });
    } else {
        reporte += `
No hay datos de productos disponibles.`;
    }

    reporte += `


ANÁLISIS DE CLIENTES TOP
========================
`;

    const clientesCompras = {};
    ventas.forEach((venta) => {
        const nombreCliente = venta.nombre_cliente || "Cliente desconocido";
        const codigoCliente = venta.codigo_cliente || "Sin código";
        const telefonoCliente = venta.telefono_cliente || "Sin teléfono";
        const total = parseFloat(venta.total) || 0;

        const clienteKey = `${nombreCliente} (${codigoCliente})`;

        if (!clientesCompras[clienteKey]) {
            clientesCompras[clienteKey] = {
                nombre: nombreCliente,
                codigo: codigoCliente,
                telefono: telefonoCliente,
                totalGastado: 0,
                numeroCompras: 0,
                productosComprados: 0,
            };
        }

        clientesCompras[clienteKey].totalGastado += total;
        clientesCompras[clienteKey].numeroCompras += 1;

        if (venta.PedidoProductos && venta.PedidoProductos.length > 0) {
            venta.PedidoProductos.forEach((item) => {
                clientesCompras[clienteKey].productosComprados +=
                    parseInt(item.cantidad) || 0;
            });
        }
    });

    const clientesOrdenados = Object.entries(clientesCompras)
        .sort((a, b) => b[1].totalGastado - a[1].totalGastado)
        .slice(0, 10);

    if (clientesOrdenados.length > 0) {
        reporte += `
TOP 10 CLIENTES QUE MÁS COMPRARON:
`;
        clientesOrdenados.forEach(([clienteKey, datos], index) => {
            reporte += `
${index + 1}. ${datos.nombre}
   - Código: ${datos.codigo}
   - Teléfono: ${datos.telefono}
   - Total gastado: R$ ${datos.totalGastado.toFixed(2)}
   - Número de compras: ${datos.numeroCompras}
   - Productos comprados: ${datos.productosComprados} unidades
   - Promedio por compra: R$ ${(
                    datos.totalGastado / datos.numeroCompras
                ).toFixed(2)}`;
        });
    } else {
        reporte += `
No hay datos de clientes disponibles.`;
    }

    reporte += `


ESTADÍSTICAS ADICIONALES
========================
- Ventas por estado:`;

    const ventasPorEstado = ventas.reduce((acc, venta) => {
        acc[venta.estado] = (acc[venta.estado] || 0) + 1;
        return acc;
    }, {});

    Object.entries(ventasPorEstado).forEach(([estado, cantidad]) => {
        reporte += `\n  ${estado}: ${cantidad} ventas`;
    });

    reporte += `\n\n- Ventas por método de pago:`;
    const ventasPorMetodo = ventas.reduce((acc, venta) => {
        const metodo = venta.metodo_pago || "No especificado";
        acc[metodo] = (acc[metodo] || 0) + 1;
        return acc;
    }, {});

    Object.entries(ventasPorMetodo).forEach(([metodo, cantidad]) => {
        reporte += `\n  ${metodo}: ${cantidad} ventas`;
    });

    reporte += `\n\n- Resumen general:`;
    reporte += `\n  Total de productos únicos vendidos: ${Object.keys(productosVendidos).length
        }`;
    reporte += `\n  Total de clientes únicos: ${Object.keys(clientesCompras).length
        }`;

    if (Object.keys(productosVendidos).length > 0) {
        const totalUnidadesVendidas = Object.values(productosVendidos).reduce(
            (sum, prod) => sum + prod.cantidad,
            0
        );
        reporte += `\n  Total de unidades vendidas: ${totalUnidadesVendidas}`;
        reporte += `\n  Promedio de unidades por venta: ${(
            totalUnidadesVendidas / totalVentas
        ).toFixed(1)}`;
    }

    return reporte;
}

function descargarReporte(contenido, nombreArchivo) {
    const blob = new Blob([contenido], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = nombreArchivo;
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
}

// Exportar funciones al objeto window
window.cargarReportes = cargarReportes;
window.aplicarFiltrosReporte = aplicarFiltrosReporte;
window.generarReporteVentas = generarReporteVentas;
window.generarReporteTexto = generarReporteTexto;
