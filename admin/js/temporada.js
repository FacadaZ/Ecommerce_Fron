async function mostrarTemporadaActual() {
    try {
        const resp = await fetch('https://bk-ecommerce-0e4f.onrender.com/temporada');
        if (resp.ok) {
            const data = await resp.json();
            renderTemporadaActual(data);
        } else {
            renderTemporadaActual(null);
        }
    } catch (err) {
        renderTemporadaActual(null);
        console.error(err);
    }
}

async function mostrarTopUsuariosTemporadaAnterior(idTemporada, nombreTemporada = '') {
    const contenedor = document.getElementById('top-usuarios-temporada-anterior');
    if (!contenedor) return;
    contenedor.innerHTML = '<div class="text-secondary">Cargando puntos...</div>';
    try {
        const resp = await fetch(`https://bk-ecommerce-0e4f.onrender.com/puntos/top-temporada/${idTemporada}`);
        if (resp.ok) {
            const data = await resp.json();
            if (!data || data.length === 0) {
                contenedor.innerHTML = `<div class="alert alert-info">Nadie tenía puntos en la temporada "${nombreTemporada}".</div>`;
                return;
            }

            for (let i = 0; i < 3 && i < data.length; i++) {
                const u = data[i];
                if (u.id_cliente) {
                    const body = {
                        id_cliente: u.id_cliente,
                        id_temporada: idTemporada,
                        puesto: i + 1
                    };
                    console.log('Enviando insignia:', body);
                    fetch('https://bk-ecommerce-0e4f.onrender.com/api/usuario-insignia/top-temporada', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body)
                    });
                } else {
                    console.warn('No se puede asignar insignia, datos incompletos:', u);
                }
            }

            contenedor.innerHTML = `
                <h5>Ranking de la temporada: ${nombreTemporada}</h5>
                <ul class="list-group mb-3">
                    ${data.map((u, i) => {
                let insignia = '';
                let textoInsignia = '';
                if (i === 0) {
                    insignia = '<i class="bi bi-trophy-fill text-warning me-2" title="Oro"></i>';
                    textoInsignia = '<span class="badge bg-warning text-dark ms-2">TOP 1</span>';
                } else if (i === 1) {
                    insignia = '<i class="bi bi-trophy-fill text-secondary me-2" title="Plata"></i>';
                    textoInsignia = '<span class="badge bg-secondary ms-2">TOP 2</span>';
                } else if (i === 2) {
                    insignia = '<i class="bi bi-trophy-fill" style="color:#cd7f32" title="Bronce"></i>';
                    textoInsignia = '<span class="badge bg-brown ms-2" style="background:#cd7f32;color:white;">TOP 3</span>';
                }
                const esCliente = !!u.Cliente;
                return `
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                <span>
                                    ${insignia}
                                    <b>${esCliente ? u.Cliente.nombre : 'Sin nombre'}</b>
                                    <span class="text-muted">(${esCliente ? u.Cliente.codigo_cliente : 'Sin código'})</span>
                                    ${esCliente && textoInsignia ? textoInsignia : ''}
                                </span>
                                <span class="badge bg-success">${u.total_puntos} puntos</span>
                            </li>
                        `;
            }).join('')}
                </ul>
            `;
        } else {
            contenedor.innerHTML = `<div class="alert alert-danger">No se pudieron obtener los puntos.</div>`;
        }
    } catch (err) {
        contenedor.innerHTML = `<div class="alert alert-danger">Error al cargar los puntos.</div>`;
        console.error(err);
    }
}

async function mostrarTemporadasAnteriores() {
    try {
        const resp = await fetch('https://bk-ecommerce-0e4f.onrender.com/temporada/all');
        if (resp.ok) {
            const data = await resp.json();
            renderTemporadasAnteriores(data);
            // Si hay temporadas, muestra los puntos de la última (anterior) por defecto
            if (Array.isArray(data) && data.length > 0) {
                const ultimaTemporada = data[data.length - 1];
                mostrarTopUsuariosTemporadaAnterior(ultimaTemporada.id_temporada, ultimaTemporada.nombre);
            }
        } else {
            renderTemporadasAnteriores([]);
        }
    } catch (err) {
        renderTemporadasAnteriores([]);
        console.error(err);
    }
}


function renderTemporadaActual(temporada) {
    const contenedor = document.getElementById('temporada-actual');
    if (!contenedor) return;
    if (!temporada) {
        contenedor.innerHTML = `<div class="alert alert-danger">No se pudo obtener la temporada actual.</div>`;
        return;
    }
    contenedor.innerHTML = `
        <div class="card mb-3">
            <div class="card-body">
                <h5 class="card-title mb-2">${temporada.nombre}</h5>
                <p class="mb-1"><b>Inicio:</b> ${temporada.fecha_inicio}</p>
                <p class="mb-1"><b>Fin:</b> ${temporada.fecha_fin}</p>
                <span class="badge bg-primary">ID: ${temporada.id_temporada}</span>
            </div>
        </div>
    `;
}

function renderTemporadasAnteriores(temporadas) {
    const contenedor = document.getElementById('temporadas-anteriores');
    if (!contenedor) return;
    if (!temporadas || temporadas.length === 0) {
        contenedor.innerHTML = `<div class="alert alert-info">No hay temporadas anteriores.</div>`;
        return;
    }
    contenedor.innerHTML = `
        <h5>Temporadas anteriores</h5>
        <ul class="list-group mb-3">
            ${temporadas.map(t => `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <span>
                        <b>${t.nombre}</b> | Inicio: ${t.fecha_inicio} | Fin: ${t.fecha_fin} 
                        <span class="badge bg-secondary">ID: ${t.id_temporada}</span>
                    </span>
                    <button class="btn btn-outline-primary btn-sm" onclick="verRankingTemporadaAdmin('${t.id_temporada}', '${t.nombre}')">
                        Ver ranking
                    </button>
                </li>
            `).join('')}
        </ul>
    `;
}

// Permite ver el ranking de cualquier temporada anterior desde el botón
window.verRankingTemporadaAdmin = function (id_temporada, nombreTemporada) {
    mostrarTopUsuariosTemporadaAnterior(id_temporada, nombreTemporada);
};

function mostrarSeccionTemporada() {
    mostrarTemporadaActual();
    mostrarTemporadasAnteriores();
}

window.mostrarSeccionTemporada = mostrarSeccionTemporada;