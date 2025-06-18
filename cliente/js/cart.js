console.log('cart.js cargado');

function renderCart() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartItemsDiv = document.getElementById('cartItems');
    const emptyCartDiv = document.getElementById('emptyCart');
    const subtotalSpan = document.getElementById('subtotal');
    const totalSpan = document.getElementById('total');

    if (!cartItemsDiv || !subtotalSpan || !totalSpan) return;

    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '';
        if (emptyCartDiv) emptyCartDiv.style.display = 'block';
        subtotalSpan.textContent = 'R$0.00';
        totalSpan.textContent = 'R$0.00';
        return;
    }

    if (emptyCartDiv) emptyCartDiv.style.display = 'none';

    let subtotal = 0;
    cartItemsDiv.innerHTML = cart.map(item => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 0;
        subtotal += price * quantity;
        return `
            <div class="cart-item d-flex align-items-center mb-3">
                <img src="${item.image || 'https://via.placeholder.com/60'}" alt="${item.name}" class="me-3" style="width:60px;height:60px;object-fit:cover;">
                <div class="flex-grow-1">
                    <div><strong>${item.name}</strong> ${item.size ? `<span class="badge bg-secondary">${item.size}</span>` : ''}</div>
                    <div class="text-muted">Cantidad: ${quantity}</div>
                    <div class="text-muted">Precio: R$${price.toFixed(2)}</div>
                </div>
                <div class="ms-3">
                    <strong>R$${(price * quantity).toFixed(2)}</strong>
                </div>
            </div>
        `;
    }).join('');

    subtotalSpan.textContent = `R$${subtotal.toFixed(2)}`;
    totalSpan.textContent = `R$${subtotal.toFixed(2)}`;
}

document.addEventListener("DOMContentLoaded", () => {
    renderCart();
});


function generarCodigoCliente(nombre, telefono) {
    const nombrePart = nombre.trim().toLowerCase().replace(/\s+/g, '').substring(0, 3);
    const telPart = telefono.trim().replace(/\D/g, '').slice(-4);
    const codigo = (nombrePart && telPart) ? `${nombrePart}-${telPart}` : '';
    console.log('Generando código cliente:', { nombre, telefono, codigo });
    return codigo;
}

// Actualiza el campo de código de cliente en tiempo real
function actualizarCodigoCliente() {
    const nombre = document.getElementById('customerName').value;
    const telefono = document.getElementById('customerPhone').value;
    const codigo = generarCodigoCliente(nombre, telefono);
    document.getElementById('customerCode').value = codigo;
    console.log('Código de cliente actualizado:', codigo);
}

async function getIdTemporadaActual() {
    try {
        const resp = await fetch('https://bk-ecommerce-0e4f.onrender.com/temporada/all');
        const temporadas = await resp.json();
        // Busca la temporada activa (ajusta el campo según tu modelo)
        let actual = temporadas.find(t => t.estado && t.estado.toLowerCase() === 'activa');
        // Si no hay activa, toma la más reciente
        if (!actual && temporadas.length > 0) actual = temporadas[0];
        return actual ? actual.id_temporada : null;
    } catch (err) {
        console.error("No se pudo obtener la temporada actual", err);
        return null;
    }
}

async function applyPromoCode() {
    const code = document.getElementById("promoCode").value.trim();
    if (!code) {
        showAlert("Por favor ingresa un código de cupón.", "warning");
        return;
    }

    let codigo_cliente = document.getElementById("customerCode").value.trim();
    if (!codigo_cliente) {
        showAlert("Primero ingresa tus datos para generar tu código de cliente.", "warning");
        return;
    }
    codigo_cliente = codigo_cliente.replace(/-/g, "");

    // Obtener el id de la temporada actual dinámicamente
    const id_temporada_actual = await getIdTemporadaActual();
    if (!id_temporada_actual) {
        showAlert("No se pudo determinar la temporada actual.", "danger");
        return;
    }

    try {
        // Buscar el cupón por código
        const respCupon = await fetch(`https://bk-ecommerce-0e4f.onrender.com/cupones?codigo=${encodeURIComponent(code)}`);
        if (!respCupon.ok) {
            showAlert("Cupón no válido o no encontrado.", "danger");
            return;
        }
        const cupones = await respCupon.json();
        const cupon = Array.isArray(cupones) ? cupones[0] : cupones;
        if (!cupon) {
            showAlert("Cupón no válido o no encontrado.", "danger");
            return;
        }
        console.log("Cupón recibido:", cupon);

        // Buscar los puntos del usuario SOLO de la temporada actual
        const respPuntos = await fetch(
            `https://bk-ecommerce-0e4f.onrender.com/puntos/codigo/${encodeURIComponent(codigo_cliente)}?id_temporada=${encodeURIComponent(id_temporada_actual)}`
        );
        if (!respPuntos.ok) {
            showAlert("No se pudo verificar tus puntos. Verifica tu código cliente.", "danger");
            return;
        }
        const puntosArray = await respPuntos.json();
        const puntosUsuario = puntosArray.reduce((sum, p) => sum + (p.puntos || 0), 0);

        // DEPURACIÓN: Mostrar puntos y requisitos
        console.log("Puntos del usuario:", puntosUsuario);
        console.log("Puntos requeridos por el cupón:", cupon.puntos);

        // Validar puntos necesarios
        if (puntosUsuario < cupon.puntos) {
            showAlert(`Este cupón requiere ${cupon.puntos} puntos y solo tienes ${puntosUsuario}.`, "warning");
            return;
        }

        // Calcular subtotal
        let subtotal = 0;
        if (typeof cart !== "undefined" && Array.isArray(cart)) {
            subtotal = cart.reduce((sum, item) => {
                const price = Number(item.price) || 0;
                const quantity = Number(item.quantity) || 0;
                return sum + price * quantity;
            }, 0);
        } else {
            subtotal = Number(document.getElementById("total").textContent.replace(/[^\d.]/g, "")) || 0;
        }

        // Aplica el descuento solo si es mayor a 0
        const descuento = Number(cupon.descuento) || 0;
        if (descuento <= 0) {
            showAlert("Este cupón no tiene descuento.", "warning");
            return;
        }
        const totalConDescuento = subtotal - (subtotal * (descuento / 100));

        // Actualiza el total en pantalla solo si hay descuento
        document.getElementById("total").textContent = `R$${totalConDescuento.toFixed(2)}`;

        // Guarda el total con descuento en una variable global
        window.totalConDescuento = totalConDescuento;

        // Guarda el cupón y la temporada en variables globales para usarlas al crear el pedido
        window.cuponAplicado = cupon;
        window.idTemporadaActual = id_temporada_actual;

        showAlert(`¡Cupón aplicado! Descuento: ${descuento}%. Total a pagar: R$${totalConDescuento.toFixed(2)}`, "success");

    } catch (err) {
        showAlert("Error al validar el cupón o los puntos.", "danger");
        console.error(err);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM listo");

    const nombreInput = document.getElementById("customerName");
    const telefonoInput = document.getElementById("customerPhone");
    console.log("nombreInput:", nombreInput);
    console.log("telefonoInput:", telefonoInput);

    if (nombreInput && telefonoInput) {
        nombreInput.addEventListener("input", actualizarCodigoCliente);
        telefonoInput.addEventListener("input", actualizarCodigoCliente);
    }

    const copyBtn = document.getElementById("copyCustomerCode");
    console.log("copyBtn:", copyBtn);
    if (copyBtn) {
        copyBtn.addEventListener("click", function () {
            const codeInput = document.getElementById("customerCode");
            codeInput.select();
            codeInput.setSelectionRange(0, 99999);
            document.execCommand("copy");
            this.innerHTML = '<i class="bi bi-clipboard-check"></i>';
            setTimeout(() => {
                this.innerHTML = '<i class="bi bi-clipboard"></i>';
            }, 1500);
            console.log("Código de cliente copiado:", codeInput.value);
        });
    }

    const btnWhatsapp = document.getElementById("whatsappCheckoutBtn");
    console.log("btnWhatsapp:", btnWhatsapp);
    if (btnWhatsapp) {
        btnWhatsapp.addEventListener("click", async function (e) {
            e.preventDefault();

            console.log("Botón de checkout por WhatsApp presionado");

            const nombre = document.getElementById("customerName").value.trim();
            const telefono = document.getElementById("customerPhone").value.trim();
            const pago = document.getElementById("paymentType").value;
            const entrega = document.getElementById("deliveryPlace").value.trim();
            const codigo_cliente = document.getElementById("customerCode").value;

            console.log("Datos para checkout:", {
                nombre,
                telefono,
                codigo_cliente,
                pago,
                entrega,
            });

            if (!nombre || !telefono || !pago || !entrega || !codigo_cliente) {
                showAlert("Por favor completa todos los campos.", "warning");
                console.warn("Faltan campos para checkout");
                return;
            }

            try {
                const respCliente = await fetch(`https://bk-ecommerce-0e4f.onrender.com/clientes/whatsapp/${encodeURIComponent(telefono)}`);
                if (respCliente.ok) {
                    const cliente = await respCliente.json();
                    if (cliente && cliente.nombre.toLowerCase() !== nombre.toLowerCase()) {
                        showAlert(`El número de WhatsApp ya está registrado con el nombre "${cliente.nombre}". Por favor, verifica tus datos.`, "danger");
                        return;
                    }
                }
            } catch (err) {
                showAlert("No se pudo verificar el número de WhatsApp. Intenta de nuevo.", "danger");
                console.error("Error al verificar cliente:", err);
                return;
            }

            let productos = [];
            if (Array.isArray(cart) && cart.length > 0) {
                productos = cart
                    .map(
                        (item) =>
                            `• ${item.name} (${item.size ? "Talla: " + item.size : ""}) x${item.quantity
                            } - R$${(Number(item.price) * Number(item.quantity)).toFixed(2)}`
                    )
                    .join("%0A");
            } else {
                showAlert("El carrito está vacío.", "warning");
                console.warn("El carrito está vacío");
                return;
            }

            const subtotal = cart.reduce((sum, item) => {
                const price = Number(item.price) || 0;
                const quantity = Number(item.quantity) || 0;
                return sum + price * quantity;
            }, 0);

            const total = typeof window.totalConDescuento === "number" ? window.totalConDescuento : subtotal;

            const productosBackend = cart.map((item) => ({
                id_producto: item.id,
                talla: item.size || "Único",
                cantidad: Number(item.quantity),
                precio_unitario: Number(item.price),
            }));

            const pedidoData = {
                nombre,
                numero_whatsapp: telefono,
                productos: productosBackend,
                total,
            };

            if (window.cuponAplicado && window.idTemporadaActual) {
                pedidoData.cupon = window.cuponAplicado;
                pedidoData.id_temporada = window.idTemporadaActual;
            }

            console.log("Enviando pedido al backend:", pedidoData);

            try {
                const response = await fetch("https://bk-ecommerce-0e4f.onrender.com/pedidos", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(pedidoData),
                });

                const data = await response.json();

                if (!response.ok) {
                    if (data && data.error) {
                        showAlert(data.error + " Verifica tu número de WhatsApp y nombre.", "danger");
                    } else {
                        showAlert("No se pudo registrar el pedido en el sistema. Verifica tu número de WhatsApp y nombre.", "danger");
                    }
                    console.error("Error al registrar el pedido en el backend");
                    return;
                }
                showAlert("¡Pedido registrado correctamente!", "success");
                console.log("Pedido registrado en backend correctamente");
            } catch (error) {
                showAlert("Error de conexión al registrar el pedido.", "danger");
                console.error("Error de conexión al registrar el pedido:", error);
                return;
            }

            const mensaje =
                `*Nuevo pedido desde la tienda web*%0A` +
                `*Nombre:* ${nombre}%0A` +
                `*Teléfono:* ${telefono}%0A` +
                `*Código Cliente:* ${codigo_cliente}%0A` +
                `*Tipo de pago:* ${pago}%0A` +
                `*Lugar de entrega:* ${entrega}%0A` +
                `%0A*Productos:*%0A${productos}%0A` +
                `%0A*Subtotal:* R$${subtotal.toFixed(2)}%0A` +
                `*Total:* R$${total.toFixed(2)}`;

            const numero = "5511910221292";
            const url = `https://wa.me/${numero}?text=${mensaje}`;

            console.log("Abriendo WhatsApp con URL:", url);
            window.open(url, "_blank");

            cart.length = 0;
            localStorage.setItem("cart", JSON.stringify([])); 

            // Limpia los campos del formulario
            document.getElementById("customerName").value = "";
            document.getElementById("customerPhone").value = "";
            document.getElementById("customerCode").value = "";
            document.getElementById("paymentType").selectedIndex = 0;
            document.getElementById("deliveryPlace").value = "";

            window.totalConDescuento = undefined;
            window.cuponAplicado = undefined;
            window.idTemporadaActual = undefined;

            if (typeof renderCart === "function") renderCart();
            if (typeof loadCartItems === "function") loadCartItems();
            if (typeof updateCartSummary === "function") updateCartSummary();
            if (typeof updateCartCount === "function") updateCartCount();
        });
    }
});
