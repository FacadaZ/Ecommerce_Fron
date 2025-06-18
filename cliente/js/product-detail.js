document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) return;

    const res = await fetch(`https://bk-ecommerce-0e4f.onrender.com/producto/${id}`);
    if (!res.ok) return;
    const prod = await res.json();

    document.getElementById("productTitle").textContent = prod.nombre;
    document.getElementById("productPrice").textContent = `R$ ${prod.precio}`;
    document.getElementById("productDescription").textContent = prod.descripcion;

    // Usa la URL directa de Cloudinary
    document.getElementById("mainProductImage").src = prod.imagen;

    document.querySelectorAll(".thumbnail-img").forEach(img => {
        img.src = prod.imagen;
    });

    let stockTallas = prod.stock_tallas || {};
    const sizeSelect = document.getElementById("sizeSelect");
    const quantityInput = document.getElementById("quantityInput");

    if (sizeSelect) {
        sizeSelect.innerHTML = `<option value="">Selecciona una talla</option>`;
        Object.keys(stockTallas).forEach(talla => {
            sizeSelect.innerHTML += `<option value="${talla}">${talla}</option>`;
        });
    }

    if (quantityInput) {
        quantityInput.disabled = true;
        quantityInput.value = 1;
    }

    if (sizeSelect && quantityInput) {
        sizeSelect.addEventListener("change", function () {
            const talla = this.value;
            if (talla && stockTallas[talla]) {
                quantityInput.max = stockTallas[talla];
                quantityInput.value = 1;
                quantityInput.disabled = false;
            } else {
                quantityInput.max = 1;
                quantityInput.value = 1;
                quantityInput.disabled = true;
            }
        });
    }

    if (prod.categoria && prod.categoria.nombre) {
        document.getElementById("productBreadcrumb").textContent = prod.categoria.nombre;
    }

    window.currentProductDetail = prod;
});

function changeMainImage(src) {
    document.getElementById("mainProductImage").src = src;
}

function addToCart() {
    const prod = window.currentProductDetail;
    if (!prod) return;

    const sizeSelect = document.getElementById("sizeSelect");
    const quantityInput = document.getElementById("quantityInput");
    const selectedSize = sizeSelect ? sizeSelect.value : "Único";
    const quantity = quantityInput ? parseInt(quantityInput.value) : 1;

    if (!selectedSize || selectedSize === "") {
        showAlert("Por favor selecciona una talla", "warning");
        return;
    }
    if (quantity < 1) {
        showAlert("Cantidad no válida", "warning");
        return;
    }

    const cartItem = {
        id: prod.id_producto || prod.id,
        name: prod.nombre,
        price: prod.precio,
        image: prod.imagen ? prod.imagen : "/placeholder.svg", // Usa la URL directa
        size: selectedSize,
        quantity: quantity,
    };

    const existingItemIndex = cart.findIndex(
        (item) => item.id === cartItem.id && item.size === cartItem.size
    );

    if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += quantity;
    } else {
        cart.push(cartItem);
    }

    saveCartToStorage();
    updateCartCount();
    showAlert("Producto agregado al carrito", "success");
}

window.addToCart = addToCart;
window.changeMainImage = changeMainImage;