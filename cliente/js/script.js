let products = []
let categories = []
let cart = []
let currentCategory = "all"
let currentSort = "name"
const productsPerPage = 8
let currentPage = 1

async function loadProductsAndCategories() {
  const resProd = await fetch("https://bk-ecommerce-0e4f.onrender.com/producto")
  let productosBK = await resProd.json()

  products = productosBK.map((p) => ({
    id: p.id_producto || p.id,
    name: p.nombre,
    price: p.precio,
    originalPrice: p.originalPrice || p.precio,
    category: p.categoria?.nombre || p.category || "",
    image: p.imagen ? p.imagen : "/placeholder.svg", // <-- Solo la URL de Cloudinary
    featured: p.destacado || false,
    rating: p.rating || 4.5,
    reviews: p.reviews || 0,
    description: p.descripcion || "",
    sizes: p.stock_tallas ? Object.keys(p.stock_tallas) : ["Único"],
    colors: p.colors || ["azul"],
  }))

  function renderFooterCategories() {
      const list = document.getElementById("categoryList");
      if (!list) return;
      list.innerHTML = categories
          .map(cat => `<li><a href="#" class="text-white text-decoration-none">${cat.nombre}</a></li>`)
          .join("");
  }

  const resCat = await fetch("https://bk-ecommerce-0e4f.onrender.com/categoria")
  categories = await resCat.json()

  renderFooterCategories()
  renderCategoryButtons()

  loadCartFromStorage()
  updateCartCount()

  if (window.location.pathname.includes("cart.html")) {
    initCart()
  } else {
    initHomePage()
  }
}

function renderCategoryButtons() {
  const btnGroup = document.getElementById("categoryFilterButtons")
  if (!btnGroup) return

  let html = `
        <button type="button" class="btn btn-outline-primary${currentCategory === "all" ? " active" : ""}" onclick="filterByCategory('all', this)">
            Todas
        </button>
    `
  categories.forEach(cat => {
    html += `
            <button type="button" class="btn btn-outline-primary${currentCategory === cat.nombre ? " active" : ""}" onclick="filterByCategory('${cat.nombre}', this)">
                ${cat.nombre}
            </button>
        `
  })
  btnGroup.innerHTML = html
}

function filterByCategory(category, btn) {
  currentCategory = category
  currentPage = 1
  renderCategoryButtons()
  loadAllProducts()
}

document.addEventListener("DOMContentLoaded", () => {
  loadProductsAndCategories()
})

function initHomePage() {
  loadFeaturedProducts()
  loadAllProducts()
  setupSearchFunctionality()
}

function loadFeaturedProducts() {
  const featuredContainer = document.getElementById("featuredProducts")
  if (!featuredContainer) return

  const featuredProducts = products.filter((product) => product.featured)

  featuredContainer.innerHTML = featuredProducts
    .map(
      (product) => `
    <div class="col-lg-6 col-md-12">
      <div class="featured-product">
        <div class="row g-0">
          <div class="col-md-4">
            <div class="product-image">
              <a href="product-detail.html?id=${product.id}">
                <img src="${product.image}" alt="${product.name}" class="img-fluid">
              </a>
              ${product.originalPrice > product.price ? `<div class="product-badge">-${Math.round((1 - product.price / product.originalPrice) * 100)}%</div>` : ""}
            </div>
          </div>
          <div class="col-md-8">
            <div class="product-info">
              <h5 class="product-title">
                <a href="product-detail.html?id=${product.id}" class="text-decoration-none">${product.name}</a>
              </h5>
              <div class="product-rating">
                <div class="stars">
                  ${generateStars(product.rating)}
                </div>
                <span class="text-muted ms-2">(${product.reviews})</span>
              </div>
              <div class="product-price">
                R$ ${product.price}
                ${product.originalPrice > product.price ? `<span class="original-price">R$ ${product.originalPrice}</span>` : ""}
              </div>
              <button class="btn btn-primary btn-sm" onclick="addToCartQuick(${product.id})">
                <i class="bi bi-cart-plus me-1"></i>Agregar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
    )
    .join("")
}

function loadAllProducts() {
  const productsContainer = document.getElementById("productsGrid")
  if (!productsContainer) return

  const filteredProducts = filterProducts()
  const sortedProducts = sortProductsList(filteredProducts)
  const paginatedProducts = paginateProducts(sortedProducts)

  productsContainer.innerHTML = paginatedProducts
    .map(
      (product) => `
    <div class="col-lg-3 col-md-4 col-sm-6">
      <div class="product-card">
        <div class="product-image">
          <a href="product-detail.html?id=${product.id}">
            <img src="${product.image}" alt="${product.name}" class="img-fluid">
          </a>
          ${product.originalPrice > product.price ? `<div class="product-badge">-${Math.round((1 - product.price / product.originalPrice) * 100)}%</div>` : ""}
          <div class="product-actions">
            <button class="btn btn-sm btn-outline-light me-1" onclick="toggleWishlist(${product.id})">
              <i class="bi bi-heart"></i>
            </button>
            <button class="btn btn-sm btn-outline-light" onclick="quickView(${product.id})">
              <i class="bi bi-eye"></i>
            </button>
          </div>
        </div>
        <div class="product-info">
          <h5 class="product-title">
            <a href="product-detail.html?id=${product.id}" class="text-decoration-none">${product.name}</a>
          </h5>
          <div class="product-rating">
            <div class="stars">
              ${generateStars(product.rating)}
            </div>
            <span class="text-muted ms-2">(${product.reviews})</span>
          </div>
          <div class="product-price">
            R$ ${product.price}
            ${product.originalPrice > product.price ? `<span class="original-price">R$ ${product.originalPrice}</span>` : ""}
          </div>
          <button class="btn btn-primary w-100" onclick="addToCartQuick(${product.id})">
            <i class="bi bi-cart-plus me-1"></i>Agregar al Carrito
          </button>
        </div>
      </div>
    </div>
  `,
    )
    .join("")

  updateLoadMoreButton()
}

// ===== CART FUNCTIONS =====
function initCart() {
  loadCartItems()
  loadRecentlyViewed()
  updateCartSummary()
}

function loadCartItems() {
  const cartContainer = document.getElementById("cartItems")
  const emptyCart = document.getElementById("emptyCart")

  if (cart.length === 0) {
    cartContainer.style.display = "none"
    emptyCart.style.display = "block"
    return
  }

  cartContainer.style.display = "block"
  emptyCart.style.display = "none"

  cartContainer.innerHTML = cart
    .map(
      (item) => `
    <div class="cart-item">
      <div class="row align-items-center">
        <div class="col-md-2">
          <img src="${item.image}" alt="${item.name}" class="cart-item-image">
        </div>
        <div class="col-md-4">
          <div class="cart-item-info">
            <h5>${item.name}</h5>
          </div>
        </div>
        <div class="col-md-2">
          <div class="quantity-selector">
            <button type="button" class="btn btn-outline-secondary btn-sm" onclick="updateCartQuantity(${item.id}, ${item.quantity - 1})">
              <i class="bi bi-dash"></i>
            </button>
            <input type="number" class="form-control form-control-sm text-center" value="${item.quantity}" min="1" readonly>
            <button type="button" class="btn btn-outline-secondary btn-sm" onclick="updateCartQuantity(${item.id}, ${item.quantity + 1})">
              <i class="bi bi-plus"></i>
            </button>
          </div>
        </div>
        <div class="col-md-2">
          <div class="cart-item-price">R$ ${(item.price * item.quantity).toFixed(2)}</div>
        </div>
        <div class="col-md-2 text-end">
          <button class="btn btn-outline-danger btn-sm" onclick="removeFromCart(${item.id})">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
    </div>
  `,
    )
    .join("")
}

function addToCartQuick(productId) {
  const product = products.find((p) => p.id === productId)
  if (!product) return

  const cartItem = {
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
    size: product.sizes[0], // Default to first available size
    quantity: 1,
  }

  // Check if item already exists in cart
  const existingItemIndex = cart.findIndex(
    (item) => item.id === cartItem.id && item.size === cartItem.size && item.color === cartItem.color,
  )

  if (existingItemIndex > -1) {
    cart[existingItemIndex].quantity += 1
  } else {
    cart.push(cartItem)
  }

  saveCartToStorage()
  updateCartCount()
  showAlert("Producto agregado al carrito", "success")
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId)
  saveCartToStorage()
  updateCartCount()

  if (window.location.pathname.includes("cart.html")) {
    loadCartItems()
    updateCartSummary()
  }

  showAlert("Producto eliminado del carrito", "info")
}

function updateCartQuantity(productId, newQuantity) {
  if (newQuantity < 1) {
    removeFromCart(productId)
    return
  }

  const item = cart.find((item) => item.id === productId)
  if (item) {
    item.quantity = newQuantity
    saveCartToStorage()
    updateCartCount()
    loadCartItems()
    updateCartSummary()
  }
}

function updateCartSummary() {
  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0)
  const shipping = subtotal > 50 ? 0 : 0
  const total = subtotal + shipping

  document.getElementById("subtotal").textContent = `R$ ${subtotal.toFixed(2)}`
  document.getElementById("shipping").textContent =
    subtotal > 50
      ? "Gratis"
      : "Consultar tarifa"
  document.getElementById("total").textContent = `R$ ${total.toFixed(2)}`

  const checkoutBtn = document.getElementById("checkoutBtn")
  if (checkoutBtn) {
    checkoutBtn.disabled = cart.length === 0
  }
}

// ===== UTILITY FUNCTIONS =====
function filterProducts() {
  if (currentCategory === "all") {
    return products
  }
  return products.filter((product) => product.category === currentCategory)
}

function sortProductsList(productList) {
  switch (currentSort) {
    case "price-low":
      return [...productList].sort((a, b) => a.price - b.price)
    case "price-high":
      return [...productList].sort((a, b) => b.price - a.price)
    case "newest":
      return [...productList].sort((a, b) => b.id - a.id)
    default:
      return [...productList].sort((a, b) => a.name.localeCompare(b.name))
  }
}

function paginateProducts(productList) {
  const startIndex = (currentPage - 1) * productsPerPage
  const endIndex = startIndex + productsPerPage
  return productList.slice(0, endIndex)
}

function generateStars(rating) {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 !== 0
  let stars = ""

  for (let i = 0; i < fullStars; i++) {
    stars += '<i class="bi bi-star-fill"></i>'
  }

  if (hasHalfStar) {
    stars += '<i class="bi bi-star-half"></i>'
  }

  const emptyStars = 5 - Math.ceil(rating)
  for (let i = 0; i < emptyStars; i++) {
    stars += '<i class="bi bi-star"></i>'
  }

  return stars
}

function getColorCode(colorName) {
  const colorMap = {
    azul: "#0d6efd",
    rosa: "#e91e63",
    negro: "#212529",
    blanco: "#ffffff",
    rojo: "#dc3545",
    verde: "#198754",
    amarillo: "#ffc107",
    gris: "#6c757d",
    crema: "#f8f9fa",
    marrón: "#8b4513",
    beige: "#f5f5dc",
  }
  return colorMap[colorName] || "#6c757d"
}

// ===== EVENT HANDLERS =====
function filterByCategory(category) {
  currentCategory = category
  currentPage = 1

  document.querySelectorAll(".btn-group .btn").forEach((btn) => {
    btn.classList.remove("active")
  })
  event.target.classList.add("active")

  loadAllProducts()
}

function sortProducts() {
  const sortSelect = document.getElementById("sortSelect")
  currentSort = sortSelect.value
  currentPage = 1
  loadAllProducts()
}

function searchProducts() {
  const searchInput = document.getElementById("searchInput")
  const searchTerm = searchInput.value.toLowerCase().trim()

  if (searchTerm) {
    const filteredProducts = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm),
    )

    const productsContainer = document.getElementById("productsGrid")
    if (productsContainer) {
      productsContainer.innerHTML = filteredProducts
        .map(
          (product) => `
        <div class="col-lg-3 col-md-4 col-sm-6">
          <div class="product-card">
            <div class="product-image">
              <img src="${product.image}" alt="${product.name}" class="img-fluid">
            </div>
            <div class="product-info">
              <h5 class="product-title">
                <a href="product-detail.html?id=${product.id}" class="text-decoration-none">${product.name}</a>
              </h5>
              <div class="product-price">R$ ${product.price}</div>
              <button class="btn btn-primary w-100" onclick="addToCartQuick(${product.id})">
                <i class="bi bi-cart-plus me-1"></i>Agregar al Carrito
              </button>
            </div>
          </div>
        </div>
      `,
        )
        .join("")
    }

    showAlert(`Se encontraron ${filteredProducts.length} productos para "${searchTerm}"`, "info")
  }
}

function loadMoreProducts() {
  currentPage++
  loadAllProducts()
}

function updateLoadMoreButton() {
  const loadMoreBtn = document.getElementById("loadMoreBtn")
  if (!loadMoreBtn) return

  const filteredProducts = filterProducts()
  const totalProducts = filteredProducts.length
  const displayedProducts = currentPage * productsPerPage

  if (displayedProducts >= totalProducts) {
    loadMoreBtn.style.display = "none"
  } else {
    loadMoreBtn.style.display = "block"
  }
}

function changeQuantity(delta) {
  const quantityInput = document.getElementById("quantityInput")
  const currentValue = Number.parseInt(quantityInput.value)
  const max = Number(quantityInput.max) || 1
  const newValue = Math.max(1, Math.min(max, currentValue + delta))
  quantityInput.value = newValue
}

function changeMainImage(src) {
  document.getElementById("mainProductImage").src = src

  document.querySelectorAll(".thumbnail-img").forEach((img) => {
    img.classList.remove("active")
  })
  event.target.classList.add("active")
}

function selectColor(color) {
  document.querySelectorAll(".color-option").forEach((option) => {
    option.classList.remove("active")
  })
  event.target.classList.add("active")
}

function shareProduct() {
  if (navigator.share) {
    navigator.share({
      title: document.getElementById("productTitle").textContent,
      url: window.location.href,
    })
  } else {
    navigator.clipboard.writeText(window.location.href)
    showAlert("Enlace copiado al portapapeles", "success")
  }
}

function quickView(productId) {
  window.location.href = `product-detail.html?id=${productId}`
}

function scrollToProducts() {
  document.getElementById("products").scrollIntoView({ behavior: "smooth" })
}

function setupSearchFunctionality() {
  const searchInput = document.getElementById("searchInput")
  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        searchProducts()
      }
    })
  }
}

function applyPromoCode() {
  const promoCode = document.getElementById("promoCode").value.trim()

  if (promoCode.toLowerCase() === "descuento10") {
    showAlert("¡Código promocional aplicado! 10% de descuento", "success")
    updateCartSummary()
  } else if (promoCode) {
    showAlert("Código promocional no válido", "danger")
  }
}

function proceedToCheckout() {
  if (cart.length === 0) {
    showAlert("Tu carrito está vacío", "warning")
    return
  }

  showAlert("Redirigiendo al proceso de pago...", "info")
}

function loadRecentlyViewed() {
  const recentlyViewed = JSON.parse(localStorage.getItem("recentlyViewed") || "[]")
  const recentContainer = document.getElementById("recentlyViewed")

  if (!recentContainer || recentlyViewed.length === 0) return

  const recentProducts = recentlyViewed
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean)
    .slice(0, 4)

  recentContainer.innerHTML = recentProducts
    .map(
      (product) => `
    <div class="col-lg-3 col-md-4 col-sm-6">
      <div class="product-card">
        <div class="product-image">
          <img src="${product.image}" alt="${product.name}" class="img-fluid">
        </div>
        <div class="product-info">
          <h6 class="product-title">
            <a href="product-detail.html?id=${product.id}" class="text-decoration-none">${product.name}</a>
          </h6>
          <div class="product-price">R$ ${product.price}</div>
        </div>
      </div>
    </div>
  `,
    )
    .join("")
}

// ===== STORAGE FUNCTIONS =====
function saveCartToStorage() {
  localStorage.setItem("cart", JSON.stringify(cart))
}

function loadCartFromStorage() {
  const savedCart = localStorage.getItem("cart")
  if (savedCart) {
    cart = JSON.parse(savedCart)
  }
}

function updateCartCount() {
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const cartCountElements = document.querySelectorAll("#cartCount")
  cartCountElements.forEach((element) => {
    element.textContent = cartCount
    element.style.display = cartCount > 0 ? "block" : "none"
  })
}

// ===== ALERT SYSTEM =====
function showAlert(message, type = "info") {
  const alertDiv = document.createElement("div")
  alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`
  alertDiv.style.cssText = "top: 100px; right: 20px; z-index: 9999; min-width: 300px;"
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `

  document.body.appendChild(alertDiv)

  setTimeout(() => {
    if (alertDiv.parentNode) {
      alertDiv.remove()
    }
  }, 3000)
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "k") {
    e.preventDefault()
    const searchInput = document.getElementById("searchInput")
    if (searchInput) {
      searchInput.focus()
    }
  }
})




window.filterByCategory = filterByCategory
window.sortProducts = sortProducts
window.searchProducts = searchProducts
window.loadMoreProducts = loadMoreProducts
window.addToCartQuick = addToCartQuick
window.removeFromCart = removeFromCart
window.updateCartQuantity = updateCartQuantity
window.changeQuantity = changeQuantity
window.changeMainImage = changeMainImage
window.selectColor = selectColor
window.shareProduct = shareProduct
window.quickView = quickView
window.scrollToProducts = scrollToProducts
window.applyPromoCode = applyPromoCode
window.proceedToCheckout = proceedToCheckout
window.cart = window.cart || [];