document.getElementById('rankingModal').addEventListener('show.bs.modal', async function () {
    try {
        const resp = await fetch('https://bk-ecommerce-0e4f.onrender.com/puntos/top-temporada');
        const data = await resp.json();
        const contenedor = document.getElementById('rankingClientesModal');
        if (!contenedor) return;
        if (!Array.isArray(data) || data.length === 0) {
            contenedor.innerHTML = '<li class="list-group-item text-muted">Aún no hay ranking disponible.</li>';
        } else {
            contenedor.innerHTML = data.map((c, i) => {
                let Insignium = '';
                if (i === 0) Insignium = '<i class="bi bi-trophy-fill text-warning me-2" title="Oro"></i>';
                else if (i === 1) Insignium = '<i class="bi bi-trophy-fill text-secondary me-2" title="Plata"></i>';
                else if (i === 2) Insignium = '<i class="bi bi-trophy-fill" style="color:#cd7f32" title="Bronce"></i>';
                return `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <span>
                            ${Insignium}
                            <strong>${c.Cliente?.nombre || '-'}</strong>
                            <div id="insignias-usuario-${c.id_cliente || 'x'}" class="mt-1"></div>
                        </span>
                        <span class="badge bg-primary rounded-pill">${c.total_puntos} pts</span>
                    </li>
                `;
            }).join('');
            data.forEach(c => {
                if (c.id_cliente) {
                    mostrarInsigniasUsuarioEnRanking(c.id_cliente);
                }
            });
        }
    } catch (err) {
        document.getElementById('rankingClientesModal').innerHTML = '<li class="list-group-item text-danger">Error al cargar ranking.</li>';
    }

    cargarTemporadas();
});

async function mostrarInsigniasUsuarioEnRanking(id_cliente) {
    const contenedor = document.getElementById(`insignias-usuario-${id_cliente}`);
    if (!contenedor) return;
    try {
        const resp = await fetch(`https://bk-ecommerce-0e4f.onrender.com/api/usuario-insignia/${id_cliente}`);
        const data = await resp.json();
        console.log('Insignias para usuario', id_cliente, data);
        if (!data || data.length === 0) {
            contenedor.innerHTML = '';
            return;
        }
        contenedor.innerHTML = data.map(ui => `
            <span class="badge bg-warning text-dark me-1 mb-1">
                <i class="bi bi-trophy-fill"></i>
                ${ui.Insignium?.nombre || ''}
            </span>
        `).join('');
        // contenedor.innerHTML = data.map(ui => `
        //     <span class="badge bg-warning text-dark me-1 mb-1">
        //         <i class="bi bi-trophy-fill"></i>
        //         ${ui.Insignia?.nombre || ''}
        //     </span>
        // `).join('');
    } catch (err) {
        contenedor.innerHTML = '<span class="text-danger">Error al cargar insignias.</span>';
    }
}

async function cargarTemporadas() {
    try {
        const resp = await fetch('https://bk-ecommerce-0e4f.onrender.com/temporada/all');
        const temporadas = await resp.json();
        const contenedorTemporadas = document.getElementById('listaTemporadasModal');
        if (!contenedorTemporadas) return;
        if (!Array.isArray(temporadas) || temporadas.length === 0) {
            contenedorTemporadas.innerHTML = '<li class="list-group-item text-muted">No hay temporadas registradas.</li>';
        } else {
            contenedorTemporadas.innerHTML = temporadas.map(t =>
                `<li class="list-group-item d-flex justify-content-between align-items-center">
                    <span>
                        <strong>${t.nombre}</strong>
                        <span class="badge bg-info rounded-pill ms-2">${t.estado || ''}</span>
                    </span>
                    <button class="btn btn-primary btn-sm" onclick="verRankingTemporada('${t.id_temporada}', '${t.nombre}')">
                        Ver ranking
                    </button>
                </li>`
            ).join('');
        }
    } catch (err) {
        const contenedorTemporadas = document.getElementById('listaTemporadasModal');
        if (contenedorTemporadas)
            contenedorTemporadas.innerHTML = '<li class="list-group-item text-danger">Error al cargar temporadas.</li>';
    }
}

window.verRankingTemporada = async function(id_temporada, nombreTemporada) {
    const contenedor = document.getElementById('rankingClientesModal');
    if (!contenedor) return;
    contenedor.innerHTML = `<li class="list-group-item text-muted">Cargando ranking de "${nombreTemporada}"...</li>`;
    try {
        const resp = await fetch(`https://bk-ecommerce-0e4f.onrender.com/puntos/top-temporada/${id_temporada}`);
        const data = await resp.json();
        if (!Array.isArray(data) || data.length === 0) {
            contenedor.innerHTML = `<li class="list-group-item text-muted">No hay ranking disponible para "${nombreTemporada}".</li>`;
        } else {
            contenedor.innerHTML = data.map((c, i) => {
                let Insignium = '';
                if (i === 0) Insignium = '<i class="bi bi-trophy-fill text-warning me-2" title="Oro"></i>';
                else if (i === 1) Insignium = '<i class="bi bi-trophy-fill text-secondary me-2" title="Plata"></i>';
                else if (i === 2) Insignium = '<i class="bi bi-trophy-fill" style="color:#cd7f32" title="Bronce"></i>';
                return `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <span>
                            ${Insignium}
                            <strong>${c.Cliente?.nombre || '-'}</strong>
                            <div id="insignias-usuario-${c.id_cliente || 'x'}" class="mt-1"></div>
                        </span>
                        <span class="badge bg-primary rounded-pill">${c.total_puntos} pts</span>
                    </li>
                `;
            }).join('');
            data.forEach(c => {
                if (c.id_cliente) {
                    mostrarInsigniasUsuarioEnRanking(c.id_cliente);
                }
            });
        }
    } catch (err) {
        contenedor.innerHTML = `<li class="list-group-item text-danger">Error al cargar ranking de "${nombreTemporada}".</li>`;
    }
}