        let pin = '';
        let currentUser = '';

        // URL base del backend — ajusta si cambias de puerto
        const API = 'http://localhost:8000';

        async function login() {
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();

            if (!username || !password) {
                document.getElementById('login-error').style.display = 'block';
                document.getElementById('login-error').textContent = 'Ingresa usuario y contraseña';
                return;
            }

            try {
                const res = await fetch(`${API}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                if (res.ok) {
                    const data = await res.json();
                    currentUser = data.username;
                    document.getElementById('userName').textContent = currentUser;
                    document.getElementById('login-error').style.display = 'none';
                    document.getElementById('loginPage').style.display = 'none';
                    document.getElementById('dashboard').style.display = 'block';
                    cargarGeneral();
                } else {
                    document.getElementById('login-error').style.display = 'block';
                    document.getElementById('login-error').textContent = 'Usuario o contraseña incorrectos';
                }
            } catch (e) {
                document.getElementById('login-error').style.display = 'block';
                document.getElementById('login-error').textContent = 'No se pudo conectar con el servidor';
            }
        }

        function logout() {
            if (confirm('¿Desea cerrar sesión?')) {
                document.getElementById('loginPage').style.display = 'flex';
                document.getElementById('dashboard').style.display = 'none';
                document.getElementById('username').value = '';
                document.getElementById('password').value = '';
                pin = '';
                updateDots();
            }
        }

        function openModal() {
            document.getElementById('createUserModal').classList.add('active');
        }

        function closeModal() {
            document.getElementById('createUserModal').classList.remove('active');
        }

        function cerrarModal(id) {
            const el = document.getElementById(id);
            if (el) el.classList.remove('active');
        }

        function registerUser() {
            showToast('Usuario registrado exitosamente', 'success');
            closeModal();
        }

        function _resetearFiltros(sectionName) {
            const mapa = {
                'documentos':   { texto: 'buscador-docs',    desde: 'desde-docs',       hasta: 'hasta-docs',       key: 'documentos', cardId: 'card-docs-total',      grupo: null },
                'no-llego':     { texto: 'buscar-nollego-p', desde: 'desde-nollego-p',  hasta: 'hasta-nollego-p',  key: 'nollego-p',  cardId: 'card-nollego-p-total', grupo: '_cardsNP' },
                'noexterOrden': { texto: 'buscar-nollego-e', desde: 'desde-nollego-e',  hasta: 'hasta-nollego-e',  key: 'nollego-e',  cardId: 'card-nollego-e-total', grupo: '_cardsNE' },
                'llego':        { texto: 'buscar-llego-p',   desde: 'desde-llego-p',    hasta: 'hasta-llego-p',    key: 'llego-p',    cardId: 'card-llego-p-total',   grupo: '_cardsLP' },
                'exterOrden':   { texto: 'buscar-llego-e',   desde: 'desde-llego-e',    hasta: 'hasta-llego-e',    key: 'llego-e',    cardId: 'card-llego-e-total',   grupo: '_cardsLE' },
            };
            // Reset mensajes (sin inputs de texto/fecha)
            if (sectionName === 'mensajes') {
                cardFiltros.mensajes = 'all';
                _activarCard(null, _cardsMsg);
                return;
            }
            const cfg = mapa[sectionName];
            if (!cfg) return;
            const _id = id => document.getElementById(id);
            if (_id(cfg.texto)) _id(cfg.texto).value = '';
            if (_id(cfg.desde)) _id(cfg.desde).value = '';
            if (_id(cfg.hasta)) _id(cfg.hasta).value = '';
            if (cardFiltros[cfg.key] !== undefined) {
                cardFiltros[cfg.key] = 'all';
                const grupos = { _cardsNP, _cardsNE, _cardsLP, _cardsLE,
                                 documentos: _cardsDoc };
                const g = cfg.grupo ? grupos[cfg.grupo] : _cardsDoc;
                _activarCard(cfg.cardId, g);
            }
        }

        function showSection(sectionName, evt) {
            // Permite llamar desde onclick sin pasar event
            if (evt) event = evt;

            _resetearFiltros(sectionName);

            if (sectionName === 'no-llego')      cargarBandeja('nollego-p');
            if (sectionName === 'noexterOrden')  cargarBandeja('nollego-e');
            if (sectionName === 'llego')         cargarLlego('llego-p');
            if (sectionName === 'exterOrden')    cargarLlego('llego-e');

            // Ocultar todas las secciones
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });

            // Mostrar sección seleccionada
            const targetSection = document.getElementById(`section-${sectionName}`);
            if (targetSection) {
                targetSection.classList.add('active');
            }

            // Actualizar navegación activa (solo si se originó desde un nav-item)
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            const navMatch = document.querySelector(`.nav-item[onclick*="'${sectionName}'"]`);
            if (navMatch) navMatch.classList.add('active');
            else if (event && event.currentTarget && event.currentTarget.classList.contains('nav-item')) {
                event.currentTarget.classList.add('active');
            }

            // Actualizar título del header
            const titles = {
                'general': 'General',
                'perfil': 'Perfil',
                'documentos': 'Documentos',
                'no-llego': 'No llegó Orden',
                'llego': 'Llegó Orden',
                'noexterOrden': 'No llegó Orden Externa',
                'exterOrden': 'Llegó Orden Externa',
                'calendario': 'Calendario de Vencimientos',
                'mensajes': 'Notificaciones',
                'pedidos': 'Reportes',
                'financiero': 'Dashboard Financiero',
                'empresas': 'Empresas Proveedoras',
            };
            document.querySelector('.header-title').textContent = titles[sectionName] || 'General';

            // Cargar datos según la sección
            if (sectionName === 'general')     cargarGeneral();
            if (sectionName === 'documentos')  cargarDocumentos();
            if (sectionName === 'calendario')  cargarCalendario();
            if (sectionName === 'mensajes')    cargarMensajes();
            if (sectionName === 'financiero')  cargarMetricas();
            if (sectionName === 'empresas')    cargarEmpresasSeccion();
            if (sectionName === 'perfil')      cargarPerfil();
        }

        // Cerrar modal al hacer clic fuera
        window.onclick = function (event) {
            const modal = document.getElementById('createUserModal');
            if (event.target === modal) {
                closeModal();
            }
        }

        // Animación de entrada para elementos
        document.addEventListener('DOMContentLoaded', function () {
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };

            const observer = new IntersectionObserver(function (entries) {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                });
            }, observerOptions);

            // Observar tarjetas para animación
            document.querySelectorAll('.stat-card, .course-card, .pending-item').forEach(el => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
                el.style.transition = 'all 0.6s ease';
                observer.observe(el);
            });
        });

        // Funcionalidad de búsqueda rápida
        document.addEventListener('keydown', function (e) {
            if (e.ctrlKey && e.key === '/') {
                e.preventDefault();
                const searchTerm = prompt('Buscar en el sistema:');
                if (searchTerm) {
                    showToast('Buscando: ' + searchTerm, 'info');
                }
            }
        });

        // Función para exportar datos
        function exportData(type) {
            const data = {
                timestamp: new Date().toLocaleString(),
                type: type,
                user: currentUser
            };
            console.log('Exportando datos:', data);
            showToast('Reporte exportado exitosamente', 'success');
        }

        // Manejo de errores global
        window.onerror = function (msg, url, lineNo, columnNo, error) {
            console.error('Error: ' + msg + '\nURL: ' + url + '\nLinea: ' + lineNo);
            return false;
        };


        // ── Variables globales del flujo ──────────────────────────────────
        let tipoSeleccionado = 'Propio';
        let requerimientoActual = null;
        let todosLosDocumentos = [];

        // ── Modal Nuevo Requerimiento ─────────────────────────────────────
        function abrirModalNuevoReq() {
            document.getElementById('modal-nuevo-req').classList.add('active');

            // Resetear PASO 1
            document.getElementById('paso-subir-pdf').style.display  = 'block';
            document.getElementById('dropzone-req').style.display    = 'block';
            document.getElementById('pdf-loading').style.display     = 'none';

            // Resetear PASO 2
            document.getElementById('paso-formulario').style.display = 'none';
            document.getElementById('items-container').innerHTML     = '';
            document.getElementById('totales-preview').style.display = 'none';

            // Limpiar campos del formulario
            ['req-descripcion','req-area','req-plazo','req-fecha',
            'req-pedido','req-referencia'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });

            // Limpiar selectores de empresa
            ['global-empresa-ganadora','global-empresa-perd1','global-empresa-perd2']
                .forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.value = '';
                });

            // Limpiar el input de archivo — clave para permitir subir de nuevo
            const inputPdf = document.getElementById('input-pdf-req');
            inputPdf.value = '';
            // Clonar y reemplazar el input para forzar el reset completo
            const nuevoInput = inputPdf.cloneNode(true);
            inputPdf.parentNode.replaceChild(nuevoInput, inputPdf);
            nuevoInput.addEventListener('change', function() { procesarPDFReq(this); });

            requerimientoActual = null;
            archivoPDFReq = null;
            seleccionarTipo('Propio');
            cargarEmpresasSelector();
        }

        let empresasLista = [];

        async function cargarEmpresasSelector() {
            try {
                const res = await fetch(`${API}/empresas`);
                empresasLista = await res.json();
            } catch (e) {
                empresasLista = [];
            }

            const placeholder = `<option value="">-- Seleccionar empresa --</option>`;
            const opciones = empresasLista.map(e =>
                `<option value="${e.desc_empresa}">${e.desc_empresa}${e.rubro ? ' (' + e.rubro + ')' : ''}</option>`
            ).join('');
            const html = placeholder + opciones;

            ['global-empresa-ganadora', 'global-empresa-perd1', 'global-empresa-perd2']
                .forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.innerHTML = html;
                });
        }

        function actualizarNombresEmpresas() {
            const g  = document.getElementById('global-empresa-ganadora').value || 'Ganadora';
            const p1 = document.getElementById('global-empresa-perd1').value    || 'Perdedora 1';
            const p2 = document.getElementById('global-empresa-perd2').value    || 'Perdedora 2';

            document.getElementById('label-total-ganadora').textContent = `Total ${g}`;
            document.getElementById('label-total-perd1').textContent    = `Total ${p1}`;
            document.getElementById('label-total-perd2').textContent    = `Total ${p2}`;

        }       

        function opcionesEmpresas(idSeleccionado = '') {
            const placeholder = `<option value="">-- Seleccionar empresa --</option>`;
            const opciones = empresasLista.map(e =>
                `<option value="${e.desc_empresa}" ${e.desc_empresa === idSeleccionado ? 'selected' : ''}>
                    ${e.desc_empresa} (${e.rubro || 'Sin rubro'})
                </option>`
            ).join('');
            return placeholder + opciones;
        }

        function cerrarModalNuevoReq() {
            document.getElementById('modal-nuevo-req').classList.remove('active');

            // Limpiar input de archivo al cerrar también
            const inputPdf = document.getElementById('input-pdf-req');
            if (inputPdf) {
                const nuevoInput = inputPdf.cloneNode(true);
                inputPdf.parentNode.replaceChild(nuevoInput, inputPdf);
                nuevoInput.addEventListener('change', function() { procesarPDFReq(this); });
            }

            requerimientoActual = null;
        }

        function seleccionarTipo(tipo) {
            tipoSeleccionado = tipo;
            const btnPropio   = document.getElementById('btn-tipo-propio');
            const btnExterno  = document.getElementById('btn-tipo-externo');
            if (tipo === 'Propio') {
                btnPropio.style.background  = 'var(--secondary)';
                btnPropio.style.color       = 'white';
                btnPropio.style.borderColor = 'var(--secondary)';
                btnExterno.style.background = 'white';
                btnExterno.style.color      = '#374151';
                btnExterno.style.borderColor= '#e5e7eb';
            } else {
                btnExterno.style.background  = 'var(--primary)';
                btnExterno.style.color       = 'white';
                btnExterno.style.borderColor = 'var(--primary)';
                btnPropio.style.background   = 'white';
                btnPropio.style.color        = '#374151';
                btnPropio.style.borderColor  = '#e5e7eb';
            }
        }

        // ── Procesar PDF con OCR ──────────────────────────────────────────
        let archivoPDFReq = null;   // ← PDF del requerimiento guardado globalmente

        async function procesarPDFReq(input) {
            if (!input.files.length) return;
            const archivo = input.files[0];
            archivoPDFReq = archivo;   // ← guardar para subir al confirmar

            document.getElementById('dropzone-req').style.display  = 'none';
            document.getElementById('pdf-loading').style.display   = 'block';

            const formData = new FormData();
            formData.append('archivo', archivo);
            formData.append('tipo', tipoSeleccionado);

            try {
                const res = await fetch(`${API}/ocr/leer-requerimiento`, {
                    method: 'POST',
                    body: formData
                });

                if (!res.ok) throw new Error('Error al procesar el PDF');
                const data = await res.json();
                // Solo guarda los datos del OCR, sin requerimiento_id aún
                requerimientoActual = {
                    descripcion: data.denominacion   || data.descripcion || '',
                    area:        data.organo_unidad  || data.area        || '',
                    plazo:       data.plazo          || '',
                    items:       data.items          || [],
                };

                // Prellenar formulario
                document.getElementById('req-descripcion').value = requerimientoActual.descripcion;
                document.getElementById('req-area').value        = requerimientoActual.area;
                document.getElementById('req-plazo').value       = requerimientoActual.plazo;
                document.getElementById('req-fecha').value       = new Date().toLocaleDateString('es-PE');

                // Renderizar ítems
                renderizarItemsFormulario(requerimientoActual.items);

                document.getElementById('pdf-loading').style.display   = 'none';
                document.getElementById('paso-formulario').style.display = 'block';

            } catch (e) {
                document.getElementById('pdf-loading').style.display  = 'none';
                document.getElementById('dropzone-req').style.display = 'block';
                showToast('Error al leer el PDF. Verifica que el backend esté corriendo.', 'error');
            }
        }

        function renderizarItemsFormulario(items) {
            const container = document.getElementById('items-container');
            container.innerHTML = items.map((it, idx) => `
                <div style="background:white;border:1px solid #e5e7eb;border-radius:8px;
                            padding:12px;margin-bottom:10px">
                    <div style="font-size:0.8rem;font-weight:600;color:var(--primary);margin-bottom:8px">
                        Ítem ${it.item || it.numero_item} — ${it.descripcion}
                        <span style="font-weight:400;color:#9ca3af">
                            (${it.cantidad} ${it.unidad_de_medida || it.unidad_medida || ''})
                        </span>
                    </div>

                    <!-- Fila 1: Precio ganadora → total ganadora (automático) -->
                    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:8px">
                        <div>
                            <label style="font-size:0.75rem;color:#065f46;font-weight:600;
                                        display:block;margin-bottom:3px">
                                Precio unitario con IGV <span style="color:red">*</span>
                            </label>
                            <input type="number" id="item-precio-${idx}"
                                placeholder="0.00" step="0.01" min="0"
                                oninput="recalcularItem(${idx})"
                                style="padding:8px 10px;width:100%;border:2px solid #10b981;
                                    border-radius:6px;font-size:0.85rem">
                        </div>
                        <div style="background:#f0fdf4;border-radius:6px;padding:8px 10px">
                            <div style="font-size:0.7rem;color:#065f46;margin-bottom:3px">
                                Total ganadora
                                <span style="font-weight:400;color:#9ca3af">(precio × ${it.cantidad})</span>
                            </div>
                            <div id="item-total-g-${idx}"
                                style="font-size:0.95rem;font-weight:700;color:#065f46">
                                S/ 0.00
                            </div>
                        </div>
                        <div style="background:#f9fafb;border-radius:6px;padding:8px 10px">
                            <div style="font-size:0.7rem;color:#6b7280;margin-bottom:3px">
                                Valor unitario / IGV
                            </div>
                            <div id="item-calc-${idx}" style="font-size:0.8rem;color:#6b7280">
                                S/ 0.00 / S/ 0.00
                            </div>
                        </div>
                    </div>

                    <!-- Fila 2: Totales perdedoras (sugeridos pero editables) -->
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                        <div>
                            <label style="font-size:0.75rem;color:#92400e;font-weight:600;
                                        display:block;margin-bottom:3px">
                                Total perdedora 1
                                <span style="font-weight:400;color:#9ca3af;font-size:0.7rem">
                                    (sugerido, editable)
                                </span>
                            </label>
                            <input type="number" id="item-costo-p1-${idx}"
                                placeholder="0.00" step="0.01" min="0"
                                oninput="actualizarResumenPerdedoras()"
                                style="padding:8px 10px;width:100%;border:2px solid #f59e0b;
                                    border-radius:6px;font-size:0.85rem;background:#fffbeb">
                        </div>
                        <div>
                            <label style="font-size:0.75rem;color:#991b1b;font-weight:600;
                                        display:block;margin-bottom:3px">
                                Total perdedora 2
                                <span style="font-weight:400;color:#9ca3af;font-size:0.7rem">
                                    (sugerido, editable)
                                </span>
                            </label>
                            <input type="number" id="item-costo-p2-${idx}"
                                placeholder="0.00" step="0.01" min="0"
                                oninput="actualizarResumenPerdedoras()"
                                style="padding:8px 10px;width:100%;border:2px solid #ef4444;
                                    border-radius:6px;font-size:0.85rem;background:#fff5f5">
                        </div>
                    </div>
                </div>
            `).join('');

            document.getElementById('totales-preview').style.display = 'none';
        }

        function recalcularItem(idx) {
            if (!requerimientoActual) return;
            const it       = requerimientoActual.items[idx];
            const precio   = parseFloat(document.getElementById(`item-precio-${idx}`)?.value) || 0;
            const cantidad = it.cantidad || 0;
            const vu       = precio > 0 ? precio / 1.18 : 0;
            const igv      = vu * 0.18;
            const totalG   = precio * cantidad;

            // Actualizar display ganadora
            const elTotalG = document.getElementById(`item-total-g-${idx}`);
            const elCalc   = document.getElementById(`item-calc-${idx}`);
            if (elTotalG) elTotalG.textContent = `S/ ${totalG.toFixed(2)}`;
            if (elCalc)   elCalc.textContent   = `S/ ${vu.toFixed(2)} / S/ ${igv.toFixed(2)}`;

            // Recalcular totales de perdedoras siempre en base al nuevo precio
            const campP1 = document.getElementById(`item-costo-p1-${idx}`);
            const campP2 = document.getElementById(`item-costo-p2-${idx}`);

            if (totalG > 0) {
                // Usar factores fijos por ítem para que no cambien al recalcular
                if (!it._factor1) it._factor1 = 1.05 + Math.random() * 0.03;
                if (!it._factor2) it._factor2 = 1.05 + Math.random() * 0.03;
                if (campP1) campP1.value = (totalG * it._factor1).toFixed(2);
                if (campP2) campP2.value = (totalG * it._factor2).toFixed(2);
            } else {
                if (campP1) campP1.value = '';
                if (campP2) campP2.value = '';
            }

            actualizarResumenGlobal();
        }

        function actualizarResumenPerdedoras() {
            actualizarResumenGlobal();
        }

        function actualizarResumenGlobal() {
            if (!requerimientoActual) return;
            const items = requerimientoActual.items;
            let sumG = 0, sumP1 = 0, sumP2 = 0;

            items.forEach((it, idx) => {
                const precio   = parseFloat(document.getElementById(`item-precio-${idx}`)?.value) || 0;
                const cantidad = it.cantidad || 0;
                sumG  += precio * cantidad;
                sumP1 += parseFloat(document.getElementById(`item-costo-p1-${idx}`)?.value) || 0;
                sumP2 += parseFloat(document.getElementById(`item-costo-p2-${idx}`)?.value) || 0;
            });

            document.getElementById('totales-preview').style.display = 'block';
            document.getElementById('valor-total-ganadora').textContent = `S/ ${sumG.toFixed(2)}`;
            document.getElementById('valor-total-perd1').textContent    = `S/ ${sumP1.toFixed(2)}`;
            document.getElementById('valor-total-perd2').textContent    = `S/ ${sumP2.toFixed(2)}`;
        }

        // Recalcular solo el resumen cuando el usuario edita un costo de perdedora
        function actualizarResumenPerdedoras() {
            if (!requerimientoActual) return;
            const items = requerimientoActual.items;
            let sumG = 0, sumP1 = 0, sumP2 = 0;

            items.forEach((it, idx) => {
                const precio   = parseFloat(document.getElementById(`item-precio-${idx}`)?.value) || 0;
                const cantidad = it.cantidad || 0;
                sumG  += precio * cantidad;
                sumP1 += parseFloat(document.getElementById(`item-costo-p1-${idx}`)?.value) || 0;
                sumP2 += parseFloat(document.getElementById(`item-costo-p2-${idx}`)?.value) || 0;
            });

            document.getElementById('totales-preview').style.display = 'block';
            document.getElementById('valor-total-ganadora').textContent = `S/ ${sumG.toFixed(2)}`;
            document.getElementById('valor-total-perd1').textContent    = `S/ ${sumP1.toFixed(2)}`;
            document.getElementById('valor-total-perd2').textContent    = `S/ ${sumP2.toFixed(2)}`;
        }

        // ── Guardar requerimiento ─────────────────────────────────────────
        async function guardarRequerimiento() {
            if (!requerimientoActual) return;

            // ── Validaciones obligatorias ─────────────────────────────────
            const descripcion = document.getElementById('req-descripcion').value.trim();
            const area        = document.getElementById('req-area').value.trim();
            const plazo       = document.getElementById('req-plazo').value.trim();
            const pedido      = document.getElementById('req-pedido').value.trim();
            const referencia  = document.getElementById('req-referencia').value.trim();
            const empresaG    = document.getElementById('global-empresa-ganadora').value;
            const empresaP1   = document.getElementById('global-empresa-perd1').value;
            const empresaP2   = document.getElementById('global-empresa-perd2').value;

            if (!descripcion) { showToast('La descripción es obligatoria', 'warning'); return; }
            if (!area)        { showToast('El área / unidad es obligatoria', 'warning'); return; }
            if (!plazo)       { showToast('El plazo es obligatorio', 'warning'); return; }
            if (!pedido)      { showToast('El N° de pedido es obligatorio', 'warning'); return; }
            if (!referencia)  { showToast('La referencia es obligatoria', 'warning'); return; }
            if (!empresaG)    { showToast('Debes seleccionar la empresa ganadora', 'warning'); return; }
            if (!empresaP1)   { showToast('Debes seleccionar la empresa perdedora 1', 'warning'); return; }
            if (!empresaP2)   { showToast('Debes seleccionar la empresa perdedora 2', 'warning'); return; }

            if (empresaG === empresaP1) { showToast('La empresa ganadora y la perdedora 1 no pueden ser iguales', 'warning'); return; }
            if (empresaG === empresaP2) { showToast('La empresa ganadora y la perdedora 2 no pueden ser iguales', 'warning'); return; }
            if (empresaP1 === empresaP2) { showToast('Las empresas perdedoras 1 y 2 no pueden ser iguales entre sí', 'warning'); return; }

            // Validar que todos los ítems tengan precio
            const items = requerimientoActual.items;
            for (let i = 0; i < items.length; i++) {
                const precio = parseFloat(document.getElementById(`item-precio-${i}`)?.value) || 0;
                if (precio <= 0) {
                    showToast(`El ítem ${i + 1} debe tener un precio mayor a 0`, 'warning');
                    return;
                }
            }            

            try {
                // Paso 1: Crear el requerimiento con el tipo seleccionado en ese momento
                const resReq = await fetch(`${API}/requerimientos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        descripcion:   document.getElementById('req-descripcion').value,
                        plazo:         document.getElementById('req-plazo').value,
                        area:          document.getElementById('req-area').value,
                        numero_pedido: document.getElementById('req-pedido').value,
                        referencia:    document.getElementById('req-referencia').value,
                        tipo:          tipoSeleccionado,   // ← toma el valor actual del botón
                    })
                });

                if (!resReq.ok) throw new Error('Error al crear requerimiento');
                const reqData = await resReq.json();
                const requerimientoId = reqData.id;
                const idReq           = reqData.id_req;

                // Paso 1b: Subir PDF del requerimiento si existe
                if (archivoPDFReq) {
                    const fdReq = new FormData();
                    fdReq.append('archivo', archivoPDFReq);
                    fdReq.append('requerimiento_id', requerimientoId);
                    fdReq.append('id_req', idReq);
                    await fetch(`${API}/ocr/guardar-pdf-req`, { method: 'POST', body: fdReq });
                }

                // Paso 2: Crear los ítems vinculados al requerimiento recién creado
                const itemsOCR = requerimientoActual.items;
                const itemsCreados = [];

                for (let i = 0; i < itemsOCR.length; i++) {
                    const it     = itemsOCR[i];
                    const caract = Array.isArray(it.caracteristicas)
                        ? it.caracteristicas.join(' | ')
                        : (it.caracteristicas || '');

                    const resItem = await fetch(`${API}/items`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify([{
                            requerimiento_id: requerimientoId,
                            numero_item:      it.item || it.numero_item,
                            cantidad:         it.cantidad,
                            unidad_medida:    it.unidad_de_medida || it.unidad_medida,
                            descripcion:      it.descripcion,
                            caracteristicas:  caract,
                        }])
                    });

                    if (!resItem.ok) continue;

                    // Obtener el id del ítem recién insertado consultando
                    // solo los ítems de ESTE requerimiento y tomando el último
                    const resLista   = await fetch(`${API}/items/${requerimientoId}`);
                    const lista      = await resLista.json();

                    // Filtrar por numero_item dentro de este requerimiento específico
                    const numeroItem = it.item || it.numero_item;
                    const itemCreado = lista
                        .filter(x => x.requerimiento_id === requerimientoId
                                && x.numero_item === numeroItem)
                        .pop(); // tomar el último en caso de duplicados

                    if (itemCreado) {
                        itemsCreados.push({ ...it, id: itemCreado.id });
                    }
                }

                // Validar que se crearon todos los ítems
                if (itemsCreados.length !== itemsOCR.length) {
                    console.warn(`Se esperaban ${itemsOCR.length} ítems pero se crearon ${itemsCreados.length}`);
                }

                // Paso 3: Actualizar empresa y precio de cada ítem
                const empresa = document.getElementById('global-empresa-ganadora').value;
                const perd1   = document.getElementById('global-empresa-perd1').value;
                const perd2   = document.getElementById('global-empresa-perd2').value;

                // Actualizar empresa y precio de cada ítem
                for (let i = 0; i < itemsCreados.length; i++) {
                    const precio  = parseFloat(document.getElementById(`item-precio-${i}`)?.value)    || 0;
                    const costoP1 = parseFloat(document.getElementById(`item-costo-p1-${i}`)?.value) || null;
                    const costoP2 = parseFloat(document.getElementById(`item-costo-p2-${i}`)?.value) || null;

                    console.log(`Ítem ${i}: precio=${precio}, costoP1=${costoP1}, costoP2=${costoP2}`);

                    await fetch(`${API}/ocr/actualizar-item/${itemsCreados[i].id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            empresa_ganadora:    empresaG,
                            precio:              precio,
                            empresa_perdedora_1: empresaP1,
                            empresa_perdedora_2: empresaP2,
                            costo_perdedora_1:   costoP1,
                            costo_perdedora_2:   costoP2,
                        })
                    });
                }

                cerrarModalNuevoReq();
                await cargarDocumentos();
                showToast(`✓ Requerimiento ${idReq} guardado y derivado a "${tipoSeleccionado}"`, 'success');

            } catch (e) {
                console.error(e);
                showToast('Error al guardar. Verifica la conexión con el backend.', 'error');
            }
        }

        // ── Sección General ───────────────────────────────────────────────
        async function cargarGeneral() {
            // Saludo dinámico
            const hora = new Date().getHours();
            const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';
            const el = document.getElementById('gen-saludo-texto');
            if (el) el.textContent = `${saludo}, ${currentUser || 'Usuario'} 👋`;

            // Fecha actual
            const hoy = new Date();
            const dias = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
            const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
            const fechaEl = document.getElementById('gen-fecha-hoy');
            if (fechaEl) fechaEl.textContent =
                `${dias[hoy.getDay()]}, ${hoy.getDate()} de ${meses[hoy.getMonth()]} de ${hoy.getFullYear()}`;

            // Datos del backend en paralelo
            try {
                const [metricas, reqs, conOrdenP, conOrdenE] = await Promise.all([
                    fetch(`${API}/requerimientos/metricas`).then(r => r.json()),
                    fetch(`${API}/requerimientos`).then(r => r.json()),
                    fetch(`${API}/requerimientos/con-orden?tipo=Propio`).then(r => r.json()),
                    fetch(`${API}/requerimientos/con-orden?tipo=Externo`).then(r => r.json()),
                ]);

                // ── KPIs
                const monFmt = v => {
                    const n = (Number(v)||0).toFixed(2).split('.');
                    return 'S/ ' + n[0].replace(/\B(?=(\d{3})+(?!\d))/g,',') + '.' + n[1];
                };
                const gs = (id, v) => { const e = document.getElementById(id); if(e) e.textContent = v; };
                gs('gen-k-total',   metricas.total_reqs);
                gs('gen-k-total-sub', `Propio: ${metricas.propio_count || '—'} · Externo: ${metricas.externo_count || '—'}`);
                gs('gen-k-con',     metricas.con_orden);
                gs('gen-k-con-sub', `Pagados: ${metricas.pagados || 0} · Espera: ${metricas.espera_pago || 0}`);
                gs('gen-k-sin',     metricas.sin_orden);
                gs('gen-k-sin-sub', `Activos: ${metricas.activos_sin_orden || 0} · Baja: ${metricas.de_baja || 0}`);
                gs('gen-k-espera',  metricas.espera_pago || 0);
                gs('gen-k-espera-sub', monFmt(metricas.monto_espera));
                gs('gen-k-monto',   monFmt(metricas.monto_total));
                gs('gen-k-monto-sub', `Cobrado: ${monFmt(metricas.monto_pagado)}`);

                // ── Conteo bandejas
                const sinOrdenP = reqs.filter(r => r.tiene_orden === 0 && r.tipo === 'Propio' && !r.de_baja).length;
                const sinOrdenE = reqs.filter(r => r.tiene_orden === 0 && r.tipo === 'Externo' && !r.de_baja).length;
                const deBaja    = reqs.filter(r => r.de_baja).length;
                gs('gen-b-nollego-p', sinOrdenP);
                gs('gen-b-nollego-e', sinOrdenE);
                gs('gen-b-llego-p',   conOrdenP.length);
                gs('gen-b-llego-e',   conOrdenE.length);
                gs('gen-b-baja',      deBaja);

                // ── Alertas de vencimiento (top 5 más urgentes)
                const todosConOrden = [...conOrdenP, ...conOrdenE];
                const eventos = calcularVencimientos(todosConOrden)
                    .sort((a, b) => a.dias_restantes - b.dias_restantes)
                    .slice(0, 5);
                const alertasEl = document.getElementById('gen-alertas');
                if (alertasEl) {
                    if (!eventos.length) {
                        alertasEl.innerHTML = '<p style="color:#9ca3af;text-align:center;padding:16px;font-size:0.82rem">Sin vencimientos próximos</p>';
                    } else {
                        alertasEl.innerHTML = eventos.map(e => {
                            const c = colorDias(e.dias_restantes);
                            const label = e.dias_restantes <= 0
                                ? `Venció hace ${Math.abs(e.dias_restantes)}d`
                                : `Faltan ${e.dias_restantes}d`;
                            const bg = e.dias_restantes <= 0 ? '#fff1f2'
                                     : e.dias_restantes <= 7 ? '#fff7ed'
                                     : '#f0fdf4';
                            return `
                            <div class="gen-alerta" style="background:${bg};border-color:${c}">
                                <div class="gen-alerta-info">
                                    <div class="gen-alerta-id">${e.id_req}
                                        <span style="color:#6b7280;font-weight:400;margin-left:6px;font-size:0.75rem">${e.tipo_orden} ${e.numero_orden}</span>
                                    </div>
                                    <div class="gen-alerta-desc" title="${e.descripcion}">${e.descripcion}</div>
                                </div>
                                <span class="gen-alerta-tag" style="background:${c}22;color:${c}">${label}</span>
                            </div>`;
                        }).join('');
                    }
                }

                // ── Últimos 6 requerimientos
                const ultimos = reqs.slice(0, 6);
                const tbody = document.getElementById('gen-ultimos-tbody');
                if (tbody) {
                    tbody.innerHTML = ultimos.length ? ultimos.map(r => `
                        <tr>
                            <td style="color:#1e3a8a;font-weight:700;font-size:0.8rem">${r.id_req}</td>
                            <td style="color:#374151;font-size:0.78rem;max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"
                                title="${r.descripcion||''}">${r.descripcion||'—'}</td>
                            <td style="font-size:0.78rem;color:#6b7280">${r.empresa_ganadora||'—'}</td>
                            <td style="text-align:right;font-size:0.78rem;font-weight:600;color:#1f2937">${monFmt(r.precio_total)}</td>
                            <td style="text-align:center">
                                <span style="font-size:0.7rem;padding:2px 8px;border-radius:999px;font-weight:700;
                                    background:${r.tipo==='Propio'?'#dbeafe':'#f5f3ff'};
                                    color:${r.tipo==='Propio'?'#1d4ed8':'#6d28d9'}">${r.tipo}</span>
                            </td>
                        </tr>`).join('')
                        : '<tr><td colspan="5" style="text-align:center;padding:16px;color:#9ca3af">Sin registros</td></tr>';
                }

            } catch(e) {
                console.error('Error cargando General:', e);
            }
        }

        // ── Filtros por card ──────────────────────────────────────────────
        const cardFiltros = {
            documentos: 'all',
            'nollego-p': 'all',
            'nollego-e': 'all',
            'llego-p':   'all',
            'llego-e':   'all',
            mensajes:    'all',
        };

        const _cardsDoc   = ['card-docs-total','card-docs-propio','card-docs-externo','card-docs-sin-orden'];
        const _cardsNP    = ['card-nollego-p-total','card-nollego-p-baja','card-nollego-p-activo'];
        const _cardsNE    = ['card-nollego-e-total','card-nollego-e-baja','card-nollego-e-activo'];
        const _cardsLP    = ['card-llego-p-total','card-llego-p-espera','card-llego-p-pagado'];
        const _cardsLE    = ['card-llego-e-total','card-llego-e-espera','card-llego-e-pagado'];
        const _cardsMsg   = ['card-msg-critico','card-msg-proximo','card-msg-ok'];

        function _activarCard(activeId, grupo) {
            grupo.forEach(id => document.getElementById(id)?.classList.remove('card-active'));
            if (activeId) document.getElementById(activeId)?.classList.add('card-active');
        }

        function filtroCardDocs(filtro) {
            const mismo = cardFiltros.documentos === filtro && filtro !== 'all';
            cardFiltros.documentos = mismo ? 'all' : filtro;
            const mapa = { all: 'card-docs-total', Propio: 'card-docs-propio',
                           Externo: 'card-docs-externo', 'sin-orden': 'card-docs-sin-orden' };
            _activarCard(cardFiltros.documentos === 'all' ? 'card-docs-total' : mapa[cardFiltros.documentos], _cardsDoc);
            filtrarDocumentos();
        }

        function filtroCardBandeja(bandeja, filtro) {
            const mismo = cardFiltros[bandeja] === filtro && filtro !== 'all';
            cardFiltros[bandeja] = mismo ? 'all' : filtro;
            const grupo = bandeja === 'nollego-p' ? _cardsNP : _cardsNE;
            const mapa = { 'nollego-p': { all:'card-nollego-p-total', baja:'card-nollego-p-baja', activo:'card-nollego-p-activo' },
                           'nollego-e': { all:'card-nollego-e-total', baja:'card-nollego-e-baja', activo:'card-nollego-e-activo' } };
            _activarCard(mapa[bandeja][cardFiltros[bandeja]], grupo);
            filtrarBandeja(bandeja);
        }

        function filtroCardMensajes(filtro) {
            const mismo = cardFiltros.mensajes === filtro;
            cardFiltros.mensajes = mismo ? 'all' : filtro;
            const mapa = { all: null, critico: 'card-msg-critico', proximo: 'card-msg-proximo', ok: 'card-msg-ok' };
            _activarCard(mapa[cardFiltros.mensajes], _cardsMsg);
            renderizarMensajes();
        }

        function filtroCardLlego(bandeja, filtro) {
            const mismo = cardFiltros[bandeja] === filtro && filtro !== 'all';
            cardFiltros[bandeja] = mismo ? 'all' : filtro;
            const grupo = bandeja === 'llego-p' ? _cardsLP : _cardsLE;
            const mapa = { 'llego-p': { all:'card-llego-p-total', 'Espera pago':'card-llego-p-espera', 'Llegó pago':'card-llego-p-pagado' },
                           'llego-e': { all:'card-llego-e-total', 'Espera pago':'card-llego-e-espera', 'Llegó pago':'card-llego-e-pagado' } };
            _activarCard(mapa[bandeja][cardFiltros[bandeja]], grupo);
            filtrarLlego(bandeja);
        }

        // ── Cargar tabla de documentos ────────────────────────────────────
        async function cargarDocumentos() {
            try {
                const res  = await fetch(`${API}/requerimientos`);
                const data = await res.json();
                todosLosDocumentos = data;
                cardFiltros.documentos = 'all';
                _activarCard('card-docs-total', _cardsDoc);
                renderizarTablaDocumentos(data);
                actualizarMetricasDocumentos(data);
            } catch (e) {
                document.getElementById('tbody-documentos').innerHTML =
                    '<tr><td colspan="7" style="text-align:center;color:#ef4444">Error al cargar datos</td></tr>';
            }
        }

        function renderizarTablaDocumentos(data) {
            const s = paginacionState['documentos'];
            if (data !== undefined) { s.datos = data; s.p = 1; }
            const pagData = s.datos.slice((s.p - 1) * s.n, s.p * s.n);
            const tbody = document.getElementById('tbody-documentos');
            if (!s.datos.length) {
                tbody.innerHTML =
                    '<tr><td colspan="7" style="text-align:center;color:#9ca3af;padding:30px">No hay requerimientos registrados</td></tr>';
                actualizarControlesPaginacion('documentos', 0);
                return;
            }
            tbody.innerHTML = pagData.map(r => `
                <tr>
                    <td><strong style="color:var(--primary)">${r.id_req}</strong></td>
                    <td title="${r.descripcion}">${r.descripcion ? r.descripcion.substring(0, 50) + (r.descripcion.length > 50 ? '...' : '') : '—'}</td>
                    <td>${r.area || '—'}</td>
                    <td>${r.plazo || '—'}</td>
                    <td>${r.fecha_registro || '—'}</td>
                    <td>
                        <span class="status-badge ${r.tipo === 'Propio' ? 'status-completed' : 'status-pending'}">
                            ${r.tipo}
                        </span>
                    </td>
                    <td>
                        <button class="btn-view" onclick="verItems(${r.id}, '${r.id_req}')">
                            <i class="fas fa-list"></i> Ver
                        </button>
                    </td>
                </tr>
            `).join('');
            actualizarControlesPaginacion('documentos', s.datos.length);
        }

        function actualizarMetricasDocumentos(data) {
            document.getElementById('docs-total').textContent    = data.length;
            document.getElementById('docs-propios').textContent  = data.filter(r => r.tipo === 'Propio').length;
            document.getElementById('docs-externos').textContent = data.filter(r => r.tipo === 'Externo').length;
            document.getElementById('docs-sin-orden').textContent= data.filter(r => r.tiene_orden === 0).length;
        }

        function filtrarDocumentos() {
            const q     = document.getElementById('buscador-docs').value.toLowerCase();
            const desde = document.getElementById('desde-docs').value;
            const hasta = document.getElementById('hasta-docs').value;

            // Base (texto + fecha): actualiza contadores de cards
            let base = todosLosDocumentos;
            if (q) base = base.filter(r =>
                (r.descripcion || '').toLowerCase().includes(q) ||
                (r.area        || '').toLowerCase().includes(q) ||
                (r.id_req      || '').toLowerCase().includes(q)
            );
            base = _filtroFecha(base, 'fecha_registro', desde, hasta);
            actualizarMetricasDocumentos(base);

            // Card encima: filtra la tabla
            let filtrados = base;
            const cf = cardFiltros.documentos;
            if (cf === 'Propio')    filtrados = filtrados.filter(r => r.tipo === 'Propio');
            if (cf === 'Externo')   filtrados = filtrados.filter(r => r.tipo === 'Externo');
            if (cf === 'sin-orden') filtrados = filtrados.filter(r => r.tiene_orden === 0);
            renderizarTablaDocumentos(filtrados);
        }

        function _filtroFecha(lista, campo, desde, hasta) {
            if (desde) lista = lista.filter(r => (r[campo] || '') >= desde);
            if (hasta) lista = lista.filter(r => (r[campo] || '') <= hasta);
            return lista;
        }

        // ── Ver ítems de un requerimiento ─────────────────────────────────
        async function verItems(requerimientoId, idReq) {
            document.getElementById('modal-items-titulo').textContent = `Ítems — ${idReq}`;
            document.getElementById('modal-ver-items').classList.add('active');
            document.getElementById('modal-items-contenido').innerHTML =
                '<p style="text-align:center;padding:20px"><i class="fas fa-spinner fa-spin"></i> Cargando...</p>';

            try {
                const res   = await fetch(`${API}/items/${requerimientoId}`);
                const items = await res.json();

                if (!items.length) {
                    document.getElementById('modal-items-contenido').innerHTML =
                        '<p style="text-align:center;color:#9ca3af;padding:20px">Sin ítems registrados</p>';
                    return;
                }

                document.getElementById('modal-items-contenido').innerHTML = `
                    <div style="overflow-x:auto">
                        <table style="width:100%;border-collapse:collapse;font-size:0.82rem">
                            <thead>
                                <tr style="background:#f3f4f6">
                                    <th style="padding:8px;border-bottom:1px solid #e5e7eb">Ítem</th>
                                    <th style="padding:8px;border-bottom:1px solid #e5e7eb">Descripción</th>
                                    <th style="padding:8px;text-align:right;border-bottom:1px solid #e5e7eb">Cant.</th>
                                    <th style="padding:8px;border-bottom:1px solid #e5e7eb">Unidad</th>
                                    <th style="padding:8px;text-align:right;border-bottom:1px solid #e5e7eb;
                                            background:#d1fae5;color:#065f46">
                                        Precio ${items[0]?.empresa_ganadora || 'Ganadora'}
                                    </th>
                                    <th style="padding:8px;text-align:right;border-bottom:1px solid #e5e7eb;
                                            background:#d1fae5;color:#065f46">
                                        Total ${items[0]?.empresa_ganadora || 'Ganadora'}
                                    </th>
                                    <th style="padding:8px;text-align:right;border-bottom:1px solid #e5e7eb;
                                            background:#fef3c7;color:#92400e">
                                        Total ${items[0]?.empresa_perdedora_1 || 'Perdedora 1'}
                                    </th>
                                    <th style="padding:8px;text-align:right;border-bottom:1px solid #e5e7eb;
                                            background:#fee2e2;color:#991b1b">
                                        Total ${items[0]?.empresa_perdedora_2 || 'Perdedora 2'}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                ${items.map(it => `
                                    <tr style="border-bottom:1px solid #f3f4f6">
                                        <td style="padding:8px">${it.numero_item}</td>
                                        <td style="padding:8px;max-width:200px;white-space:nowrap;
                                                overflow:hidden;text-overflow:ellipsis"
                                            title="${it.descripcion || ''}">${it.descripcion || '—'}</td>
                                        <td style="padding:8px;text-align:right">${it.cantidad}</td>
                                        <td style="padding:8px">${it.unidad_medida || '—'}</td>
                                        <td style="padding:8px;text-align:right;background:#f0fdf4">
                                            S/ ${(it.precio || 0).toFixed(2)}
                                        </td>
                                        <td style="padding:8px;text-align:right;font-weight:600;
                                                color:#065f46;background:#f0fdf4">
                                            S/ ${(it.total_ganadora || 0).toFixed(2)}
                                        </td>
                                        <td style="padding:8px;text-align:right;background:#fffbeb;color:#92400e">
                                            S/ ${(it.costo_perdedora_1 || 0).toFixed(2)}
                                        </td>
                                        <td style="padding:8px;text-align:right;background:#fff5f5;color:#991b1b">
                                            S/ ${(it.costo_perdedora_2 || 0).toFixed(2)}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr style="font-weight:700;font-size:0.85rem">
                                    <td colspan="4" style="padding:10px 8px;text-align:right;
                                                        background:#f3f4f6">Total requerimiento:</td>
                                    <td style="padding:10px 8px;text-align:right;background:#d1fae5;color:#065f46">
                                        —
                                    </td>
                                    <td style="padding:10px 8px;text-align:right;background:#d1fae5;color:#065f46">
                                        S/ ${items.reduce((s, it) => s + (it.total_ganadora   || 0), 0).toFixed(2)}
                                    </td>
                                    <td style="padding:10px 8px;text-align:right;background:#fef3c7;color:#92400e">
                                        S/ ${items.reduce((s, it) => s + (it.costo_perdedora_1 || 0), 0).toFixed(2)}
                                    </td>
                                    <td style="padding:10px 8px;text-align:right;background:#fee2e2;color:#991b1b">
                                        S/ ${items.reduce((s, it) => s + (it.costo_perdedora_2 || 0), 0).toFixed(2)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                `;

            } catch (e) {
                document.getElementById('modal-items-contenido').innerHTML =
                    '<p style="text-align:center;color:#ef4444;padding:20px">Error al cargar ítems</p>';
            }
        }

        function cerrarModalItems() {
            document.getElementById('modal-ver-items').classList.remove('active');
        }

        // ── Variables bandejas ────────────────────────────────────────────
        let datosBandeja = { 'nollego-p': [], 'nollego-e': [] };
        let requerimientoOrdenActual = null;
        let archivoPDFOrden = null;

        // ── Cargar bandeja ────────────────────────────────────────────────
        async function cargarBandeja(bandeja) {
            const tipo = bandeja === 'nollego-p' ? 'Propio' : 'Externo';
            const tbody = document.getElementById(`tbody-${bandeja}`);
            tbody.innerHTML = `<tr><td colspan="12"
                style="text-align:center;padding:30px;color:#9ca3af">
                <i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>`;

            try {
                // Revisar bajas automáticamente al cargar
                await fetch(`${API}/requerimientos/revisar-bajas`, { method: 'POST' });

                const res  = await fetch(`${API}/requerimientos?tiene_orden=0&tipo=${tipo}`);
                const data = await res.json();
                datosBandeja[bandeja] = data;
                cardFiltros[bandeja] = 'all';
                _activarCard(bandeja === 'nollego-p' ? 'card-nollego-p-total' : 'card-nollego-e-total',
                             bandeja === 'nollego-p' ? _cardsNP : _cardsNE);
                renderizarBandeja(bandeja, data);
                actualizarMetricasBandeja(bandeja, data);
            } catch (e) {
                tbody.innerHTML = `<tr><td colspan="12"
                    style="text-align:center;color:#ef4444;padding:20px">
                    Error al cargar datos</td></tr>`;
            }
        }

        function renderizarBandeja(bandeja, data) {
            const s = paginacionState[bandeja];
            if (data !== undefined) { s.datos = data; s.p = 1; }
            const pagData = s.datos.slice((s.p - 1) * s.n, s.p * s.n);
            const tbody = document.getElementById(`tbody-${bandeja}`);
            if (!s.datos.length) {
                tbody.innerHTML = `<tr><td colspan="11"
                    style="text-align:center;color:#9ca3af;padding:30px">
                    No hay requerimientos en esta bandeja</td></tr>`;
                actualizarControlesPaginacion(bandeja, 0);
                return;
            }
            tbody.innerHTML = pagData.map(r => `
                <tr style="${r.de_baja ? 'opacity:0.6;background:#fff5f5' : ''}">
                    <td><strong style="color:var(--primary);font-size:0.8rem">${r.id_req}</strong></td>
                    <td style="font-size:0.82rem">${r.fecha_registro || '—'}</td>
                    <td style="font-size:0.82rem">${r.empresa_ganadora || '—'}</td>
                    <td style="font-size:0.82rem">${r.plazo || '—'}</td>
                    <td style="font-size:0.82rem">${r.numero_pedido || '—'}</td>
                    <td style="font-size:0.82rem;max-width:160px;white-space:nowrap;
                            overflow:hidden;text-overflow:ellipsis"
                        title="${r.descripcion || ''}">${r.descripcion || '—'}</td>
                    <td style="font-size:0.82rem">${r.referencia || '—'}</td>
                    <td style="font-size:0.82rem">${r.area || '—'}</td>
                    <td style="font-size:0.82rem;font-weight:600;color:var(--primary)">
                        S/ ${(r.precio_total || 0).toLocaleString('es-PE', {minimumFractionDigits:2})}
                    </td>
                    <td style="text-align:center">
                        ${r.de_baja
                            ? '<span class="status-badge status-pending">De baja</span>'
                            : '<span class="status-badge status-completed">Activo</span>'
                        }
                    </td>
                    <td style="display:flex;gap:6px;align-items:center">
                        <button class="btn-view"
                            onclick="abrirModalOrden(${r.id}, '${r.id_req}')"
                            ${r.de_baja ? 'disabled style="opacity:0.4;cursor:not-allowed"' : ''}>
                            <i class="fas fa-upload"></i> Cargar PDF
                        </button>
                        <button
                            onclick="darDeBajaManual(${r.id}, '${r.id_req}', this)"
                            ${r.de_baja ? 'disabled' : ''}
                            style="${r.de_baja
                                ? 'opacity:0.4;cursor:not-allowed;padding:6px 10px;border:1px solid #d1d5db;border-radius:6px;background:white;font-size:0.78rem'
                                : 'padding:6px 10px;border:1px solid #ef4444;border-radius:6px;background:white;color:#ef4444;cursor:pointer;font-size:0.78rem;transition:all 0.2s'}"
                            onmouseover="${r.de_baja ? '' : "this.style.background='#fee2e2'"}"
                            onmouseout="${r.de_baja ? '' : "this.style.background='white'"}">
                            <i class="fas fa-arrow-down"></i> ${r.de_baja ? 'De baja' : 'Dar de baja'}
                        </button>
                    </td>
                </tr>
            `).join('');
            actualizarControlesPaginacion(bandeja, s.datos.length);
        }

        function actualizarMetricasBandeja(bandeja, data) {
            const sufijo = bandeja === 'nollego-p' ? 'p' : 'e';
            const bajas  = data.filter(r => r.de_baja).length;
            document.getElementById(`nollego-${sufijo}-total`).textContent   = data.length;
            document.getElementById(`nollego-${sufijo}-baja`).textContent    = bajas;
            document.getElementById(`nollego-${sufijo}-activos`).textContent = data.length - bajas;
        }

        function filtrarBandeja(bandeja) {
            const sufijo = bandeja === 'nollego-p' ? 'p' : 'e';
            const q      = document.getElementById(`buscar-nollego-${sufijo}`).value.toLowerCase();
            const desde  = document.getElementById(`desde-${bandeja}`).value;
            const hasta  = document.getElementById(`hasta-${bandeja}`).value;

            // Base (texto + fecha): actualiza contadores de cards
            let base = datosBandeja[bandeja];
            if (q) base = base.filter(r =>
                (r.descripcion     || '').toLowerCase().includes(q) ||
                (r.empresa_ganadora|| '').toLowerCase().includes(q) ||
                (r.area            || '').toLowerCase().includes(q) ||
                (r.id_req          || '').toLowerCase().includes(q)
            );
            base = _filtroFecha(base, 'fecha_registro', desde, hasta);
            actualizarMetricasBandeja(bandeja, base);

            // Card encima: filtra la tabla
            let filtrados = base;
            const cf = cardFiltros[bandeja];
            if (cf === 'baja')   filtrados = filtrados.filter(r => r.de_baja);
            if (cf === 'activo') filtrados = filtrados.filter(r => !r.de_baja);
            renderizarBandeja(bandeja, filtrados);
        }

        // ── Modal asignar orden ───────────────────────────────────────────
        function abrirModalOrden(reqId, idReq) {
            requerimientoOrdenActual = reqId;
            archivoPDFOrden = null;
            document.getElementById('modal-asignar-orden').classList.add('active');
            document.getElementById('orden-req-info').textContent = `Requerimiento: ${idReq}`;

            // Resetear dropzone
            document.getElementById('pdf-orden-nombre').textContent =
                'Haz clic para subir el PDF de la orden';
            document.getElementById('dropzone-orden').style.borderColor = '#e5e7eb';
            document.getElementById('orden-loading').style.display = 'none';
            document.getElementById('orden-ocr-ok').style.display  = 'none';

            // Limpiar campos
            document.getElementById('orden-tipo').value   = 'OS';
            document.getElementById('orden-numero').value = '';
            document.getElementById('orden-siaf').value   = '';
            document.getElementById('orden-fecha').value  = '';

            // Resetear input file
            const inputOrden = document.getElementById('input-pdf-orden');
            const nuevoInput = inputOrden.cloneNode(true);
            inputOrden.parentNode.replaceChild(nuevoInput, inputOrden);
            nuevoInput.addEventListener('change', function() { procesarPDFOrden(this); });
        }

        function cerrarModalOrden() {
            document.getElementById('modal-asignar-orden').classList.remove('active');
            requerimientoOrdenActual = null;
            archivoPDFOrden = null;
        }

        function seleccionarPDFOrden(input) {
            if (input.files.length) {
                archivoPDFOrden = input.files[0];
                document.getElementById('pdf-orden-nombre').textContent =
                    `✓ ${archivoPDFOrden.name}`;
            }
        }

        async function confirmarOrden() {
            const numeroOrden = document.getElementById('orden-numero').value.trim();
            const tipoOrden   = document.getElementById('orden-tipo').value;
            const siaf        = document.getElementById('orden-siaf').value.trim();
            const fechaOrden  = document.getElementById('orden-fecha').value;

            // Validaciones obligatorias
            if (!archivoPDFOrden) {
                showToast('Debes subir el PDF de la orden', 'warning');
                return;
            }
            if (!numeroOrden) {
                showToast('El número de orden es obligatorio', 'warning');
                return;
            }
            if (!siaf) {
                showToast('El código SIAF es obligatorio', 'warning');
                return;
            }
            if (!fechaOrden) {
                showToast('La fecha de orden es obligatoria', 'warning');
                return;
            }

            try {
                // Subir PDF con nombre estructurado
                const formData = new FormData();
                formData.append('archivo', archivoPDFOrden);
                formData.append('requerimiento_id', requerimientoOrdenActual);
                formData.append('tipo_orden', tipoOrden);
                formData.append('numero_orden', numeroOrden);
                const resPdf = await fetch(`${API}/ocr/subir-pdf-orden`, {
                    method: 'POST',
                    body: formData
                });
                if (!resPdf.ok) throw new Error('Error al subir el PDF');
                const pdfData = await resPdf.json();

                // Crear la orden (incluye ruta del PDF guardado)
                const res = await fetch(`${API}/ordenes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        requerimiento_id: requerimientoOrdenActual,
                        tipo_orden:       tipoOrden,
                        numero_orden:     numeroOrden,
                        codigo_siaf:      document.getElementById('orden-siaf').value.trim() || null,
                        fecha_orden:      document.getElementById('orden-fecha').value.trim() || null,
                        pdf_orden_ruta:   pdfData.ruta || null,
                    })
                });

                if (!res.ok) throw new Error('Error al crear la orden');

                cerrarModalOrden();
                await cargarBandeja('nollego-p');
                await cargarBandeja('nollego-e');
                showToast('✓ Orden asignada correctamente. El requerimiento fue trasladado a "Llegó Orden".', 'success');

            } catch (e) {
                showToast('Error al asignar la orden: ' + e.message, 'error');
            }
        }   
        
        // ── Variables llegó orden ─────────────────────────────────────────
        let datosLlego = { 'llego-p': [], 'llego-e': [] };
        let ordenActualId      = null;

        // ── Paginación ────────────────────────────────────────────────────
        const paginacionState = {
            'documentos': { p: 1, n: 10, datos: [] },
            'nollego-p':  { p: 1, n: 10, datos: [] },
            'nollego-e':  { p: 1, n: 10, datos: [] },
            'llego-p':    { p: 1, n: 10, datos: [] },
            'llego-e':    { p: 1, n: 10, datos: [] },
            'mensajes':   { p: 1, n: 10, datos: [] },
            'empresas':   { p: 1, n: 10, datos: [] },
        };

        function actualizarControlesPaginacion(key, total) {
            const el = document.getElementById(`paginacion-${key}`);
            if (!el) return;
            const s = paginacionState[key];
            const totalPags = Math.max(1, Math.ceil(total / s.n));
            if (total <= s.n) { el.innerHTML = ''; return; }
            el.innerHTML = `
                <button onclick="cambiarPagina('${key}',-1)" ${s.p <= 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i> Anterior
                </button>
                <span class="pag-info">Página ${s.p} de ${totalPags}</span>
                <button onclick="cambiarPagina('${key}',1)" ${s.p >= totalPags ? 'disabled' : ''}>
                    Siguiente <i class="fas fa-chevron-right"></i>
                </button>
                <span style="color:#9ca3af;margin-left:8px">(${total} registros)</span>
            `;
        }

        function cambiarPagina(key, delta) {
            const s = paginacionState[key];
            const totalPags = Math.ceil(s.datos.length / s.n);
            s.p = Math.max(1, Math.min(s.p + delta, totalPags));
            if (key === 'documentos')      renderizarTablaDocumentos();
            else if (key === 'nollego-p')  renderizarBandeja('nollego-p');
            else if (key === 'nollego-e')  renderizarBandeja('nollego-e');
            else if (key === 'llego-p')    renderizarLlego('llego-p');
            else if (key === 'llego-e')    renderizarLlego('llego-e');
            else if (key === 'mensajes')   renderizarMensajes();
            else if (key === 'empresas')   renderizarEmpresasSeccion();
        }
        let estadoSeleccionado = 'Espera pago';
        let archivoFactura     = null;

        // ── Cargar llegó orden ────────────────────────────────────────────
        async function cargarLlego(bandeja) {
            const tipo  = bandeja === 'llego-p' ? 'Propio' : 'Externo';
            const tbody = document.getElementById(`tbody-${bandeja}`);
            tbody.innerHTML = `<tr><td colspan="14"
                style="text-align:center;padding:30px;color:#9ca3af">
                <i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>`;

            try {
                const res  = await fetch(`${API}/requerimientos/con-orden?tipo=${tipo}`);
                const data = await res.json();
                datosLlego[bandeja] = data;
                cardFiltros[bandeja] = 'all';
                _activarCard(bandeja === 'llego-p' ? 'card-llego-p-total' : 'card-llego-e-total',
                             bandeja === 'llego-p' ? _cardsLP : _cardsLE);
                renderizarLlego(bandeja, data);
                actualizarMetricasLlego(bandeja, data);
            } catch (e) {
                tbody.innerHTML = `<tr><td colspan="14"
                    style="text-align:center;color:#ef4444;padding:20px">
                    Error al cargar datos</td></tr>`;
            }
        }

        function renderizarLlego(bandeja, data) {
            const s = paginacionState[bandeja];
            if (data !== undefined) { s.datos = data; s.p = 1; }
            const pagData = s.datos.slice((s.p - 1) * s.n, s.p * s.n);
            const tbody = document.getElementById(`tbody-${bandeja}`);
            if (!s.datos.length) {
                tbody.innerHTML = `<tr><td colspan="15"
                    style="text-align:center;color:#9ca3af;padding:30px">
                    No hay requerimientos con orden asignada</td></tr>`;
                actualizarControlesPaginacion(bandeja, 0);
                return;
            }
            const monFmt = v => { const n=(Number(v)||0).toFixed(2).split('.'); return 'S/ '+n[0].replace(/\B(?=(\d{3})+(?!\d))/g,',')+'.'+n[1]; };
            tbody.innerHTML = pagData.map(r => `
                <tr>
                    <td><strong style="color:var(--primary);font-size:0.8rem">${r.id_req}</strong></td>
                    <td style="font-size:0.82rem">${r.fecha_orden      || '—'}</td>
                    <td style="font-size:0.82rem">${r.fecha_asignacion || '—'}</td>
                    <td style="font-size:0.82rem">${r.empresa_ganadora || '—'}</td>
                    <td style="font-size:0.82rem">${r.plazo            || '—'}</td>
                    <td style="font-size:0.82rem">${r.numero_pedido    || '—'}</td>
                    <td style="font-size:0.82rem;text-align:center">
                        <span class="status-badge"
                            style="background:${r.tipo_orden==='OS'?'#dbeafe':'#fce7f3'};
                                   color:${r.tipo_orden==='OS'?'#1e40af':'#9d174d'}">
                            ${r.tipo_orden || '—'}
                        </span>
                    </td>
                    <td style="font-size:0.82rem;font-weight:500">${r.numero_orden  || '—'}</td>
                    <td style="font-size:0.82rem;font-family:monospace">${r.codigo_siaf || '—'}</td>
                    <td style="font-size:0.82rem;max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"
                        title="${r.descripcion||''}">${r.descripcion || '—'}</td>
                    <td style="font-size:0.82rem">${r.area || '—'}</td>
                    <td style="font-size:0.82rem;font-weight:600;color:var(--primary)">${monFmt(r.precio_total)}</td>
                    <td>
                        <span class="status-badge ${r.estado==='Llegó pago'?'status-completed':'status-pending'}">
                            ${r.estado || 'Espera pago'}
                        </span>
                    </td>
                    <td style="white-space:nowrap;min-width:90px">
                        ${r.pdf_factura_ruta
                            ? `<button class="btn-view" style="margin-bottom:3px;display:block;width:100%"
                                onclick="verPDF('${r.pdf_factura_ruta.replace(/\\/g,"/")}')">
                                <i class="fas fa-file-pdf" style="color:#ef4444"></i> Factura</button>`
                            : '<span style="color:#d1d5db;font-size:0.78rem">Sin factura</span>'
                        }
                        ${r.pdf_detalle_factura_ruta
                            ? `<button class="btn-view" style="display:block;width:100%"
                                onclick="verPDF('${r.pdf_detalle_factura_ruta.replace(/\\/g,"/")}')">
                                <i class="fas fa-file-pdf" style="color:#f97316"></i> Detalle</button>`
                            : ''
                        }
                    </td>
                    <td style="min-width:100px">
                        <button class="btn-view" style="width:100%;justify-content:center"
                            onclick="abrirModalEstado(${r.orden_id},'${r.id_req}','${r.estado||'Espera pago'}')">
                            <i class="fas fa-edit"></i>
                            ${r.estado==='Llegó pago' ? 'Ver' : 'Actualizar'}
                        </button>
                    </td>
                </tr>
            `).join('');
            actualizarControlesPaginacion(bandeja, s.datos.length);
        }

        function actualizarMetricasLlego(bandeja, data) {
            const sufijo = bandeja === 'llego-p' ? 'p' : 'e';
            const espera = data.filter(r => r.estado === 'Espera pago').length;
            const pagado = data.filter(r => r.estado === 'Llegó pago').length;
            document.getElementById(`llego-${sufijo}-total`).textContent  = data.length;
            document.getElementById(`llego-${sufijo}-espera`).textContent = espera;
            document.getElementById(`llego-${sufijo}-pagado`).textContent = pagado;
        }

        function filtrarLlego(bandeja) {
            const sufijo = bandeja === 'llego-p' ? 'p' : 'e';
            const q      = document.getElementById(`buscar-llego-${sufijo}`).value.toLowerCase();
            const desde  = document.getElementById(`desde-${bandeja}`).value;
            const hasta  = document.getElementById(`hasta-${bandeja}`).value;

            // Base (texto + fecha): actualiza contadores de cards
            let base = datosLlego[bandeja];
            if (q) base = base.filter(r =>
                (r.descripcion     || '').toLowerCase().includes(q) ||
                (r.empresa_ganadora|| '').toLowerCase().includes(q) ||
                (r.codigo_siaf     || '').toLowerCase().includes(q) ||
                (r.numero_orden    || '').toLowerCase().includes(q) ||
                (r.id_req          || '').toLowerCase().includes(q)
            );
            base = _filtroFecha(base, 'fecha_registro', desde, hasta);
            actualizarMetricasLlego(bandeja, base);

            // Card encima: filtra la tabla
            let filtrados = base;
            const cf = cardFiltros[bandeja];
            if (cf !== 'all') filtrados = filtrados.filter(r => r.estado === cf);
            renderizarLlego(bandeja, filtrados);
        }

        // ── Modal estado de pago ──────────────────────────────────────────
        function abrirModalEstado(ordenId, idReq, estadoActual) {
            ordenActualId      = ordenId;
            archivoFactura     = null;
            archivoDetalle     = null;
            estadoSeleccionado = estadoActual || 'Espera pago';

            document.getElementById('modal-estado-pago').classList.add('active');
            document.getElementById('estado-req-info').textContent = `Requerimiento: ${idReq}`;

            // Resetear dropzones
            document.getElementById('pdf-factura-nombre').textContent  = 'Subir factura (opcional)';
            document.getElementById('pdf-detalle-nombre').textContent  = 'Subir detalle de factura (opcional)';
            document.getElementById('dropzone-factura').style.borderColor = '#e5e7eb';
            document.getElementById('dropzone-detalle').style.borderColor = '#e5e7eb';

            // Resetear inputs
            ['input-pdf-factura', 'input-pdf-detalle'].forEach(id => {
                const el     = document.getElementById(id);
                const nuevo  = el.cloneNode(true);
                el.parentNode.replaceChild(nuevo, el);
                if (id === 'input-pdf-factura') {
                    nuevo.addEventListener('change', function() { seleccionarFactura(this); });
                } else {
                    nuevo.addEventListener('change', function() { seleccionarDetalle(this); });
                }
            });

            seleccionarEstadoPago(estadoSeleccionado);
        }

        function cerrarModalEstado() {
            document.getElementById('modal-estado-pago').classList.remove('active');
            ordenActualId  = null;
            archivoFactura = null;
        }

        function seleccionarEstadoPago(estado) {
            estadoSeleccionado = estado;
            const btnEspera = document.getElementById('btn-espera-pago');
            const btnLlego  = document.getElementById('btn-llego-pago');
            const secFact   = document.getElementById('seccion-factura');

            if (estado === 'Espera pago') {
                btnEspera.style.background  = '#fef3c7';
                btnEspera.style.borderColor = '#f59e0b';
                btnEspera.style.color       = '#92400e';
                btnLlego.style.background   = 'white';
                btnLlego.style.borderColor  = '#e5e7eb';
                btnLlego.style.color        = '#6b7280';
                secFact.style.display       = 'none';
            } else {
                btnLlego.style.background   = '#d1fae5';
                btnLlego.style.borderColor  = '#10b981';
                btnLlego.style.color        = '#065f46';
                btnEspera.style.background  = 'white';
                btnEspera.style.borderColor = '#e5e7eb';
                btnEspera.style.color       = '#6b7280';
                secFact.style.display       = 'block';
            }
        }

        let archivoDetalle = null;

        function seleccionarFactura(input) {
            if (input.files.length) {
                archivoFactura = input.files[0];
                document.getElementById('pdf-factura-nombre').textContent =
                    `✓ ${archivoFactura.name}`;
                document.getElementById('dropzone-factura').style.borderColor = '#10b981';
            }
        }

        function seleccionarDetalle(input) {
            if (input.files.length) {
                archivoDetalle = input.files[0];
                document.getElementById('pdf-detalle-nombre').textContent =
                    `✓ ${archivoDetalle.name}`;
                document.getElementById('dropzone-detalle').style.borderColor = '#3b82f6';
            }
        }

        async function confirmarEstadoPago() {
            if (!ordenActualId) return;

            try {
                // Actualizar estado
                const res = await fetch(`${API}/ordenes/${ordenActualId}/estado`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ estado: estadoSeleccionado })
                });
                if (!res.ok) throw new Error('Error al actualizar estado');

                // Subir archivos si se seleccionaron
                if (archivoFactura || archivoDetalle) {
                    const formData = new FormData();
                    if (archivoFactura)  formData.append('archivo',         archivoFactura);
                    if (archivoDetalle)  formData.append('archivo_detalle', archivoDetalle);

                    const resFact = await fetch(
                        `${API}/ordenes/${ordenActualId}/cargar-factura`,
                        { method: 'POST', body: formData }
                    );
                    if (!resFact.ok) {
                        const err = await resFact.json();
                        showToast(`Estado actualizado pero error al subir archivos: ${err.detail}`, 'warning');
                    }
                }

                cerrarModalEstado();
                await cargarLlego('llego-p');
                await cargarLlego('llego-e');
                showToast(`✓ Estado actualizado a "${estadoSeleccionado}"`, 'success');

            } catch (e) {
                showToast('Error al actualizar: ' + e.message, 'error');
            }
        }  
        
        async function darDeBajaManual(id, idReq, btn) {
            if (!confirm(`¿Dar de baja el requerimiento ${idReq}?\nEsta acción no se puede deshacer.`)) {
                return;
            }
            try {
                const res = await fetch(`${API}/requerimientos/${id}/dar-baja`, {
                    method: 'PATCH'
                });
                if (!res.ok) {
                    const err = await res.json();
                    showToast(err.detail || 'Error al dar de baja', 'error');
                    return;
                }
                // Actualizar visualmente sin recargar toda la tabla
                const fila = btn.closest('tr');
                fila.style.opacity   = '0.6';
                fila.style.background = '#fff5f5';
                btn.disabled          = true;
                btn.style.opacity     = '0.4';
                btn.style.cursor      = 'not-allowed';
                btn.innerHTML         = '<i class="fas fa-arrow-down"></i> De baja';

                // Deshabilitar también el botón de cargar PDF
                const btnCargar = fila.querySelector('.btn-view');
                if (btnCargar) {
                    btnCargar.disabled     = true;
                    btnCargar.style.opacity = '0.4';
                    btnCargar.style.cursor  = 'not-allowed';
                }

                // Actualizar métricas
                await cargarBandeja('nollego-p');
                await cargarBandeja('nollego-e');

            } catch (e) {
                showToast('Error al conectar con el servidor', 'error');
            }
        }

        async function procesarPDFOrden(input) {
            if (!input.files.length) return;
            archivoPDFOrden = input.files[0];

            // Mostrar nombre del archivo
            document.getElementById('pdf-orden-nombre').textContent = `✓ ${archivoPDFOrden.name}`;
            document.getElementById('dropzone-orden').style.borderColor = '#10b981';

            // Mostrar loading
            document.getElementById('orden-loading').style.display = 'block';
            document.getElementById('orden-ocr-ok').style.display  = 'none';

            try {
                const formData = new FormData();
                formData.append('archivo', archivoPDFOrden);

                const res = await fetch(`${API}/ocr/leer-orden`, {
                    method: 'POST',
                    body: formData
                });

                if (!res.ok) throw new Error('Error al leer el PDF');
                const datos = await res.json();

                // Prellenar formulario con los datos extraídos
                if (datos.tipo_orden) {
                    document.getElementById('orden-tipo').value = datos.tipo_orden;
                }
                if (datos.numero_orden) {
                    document.getElementById('orden-numero').value = datos.numero_orden;
                }
                if (datos.codigo_siaf) {
                    document.getElementById('orden-siaf').value = datos.codigo_siaf;
                }
                if (datos.fecha_orden) {
                    document.getElementById('orden-fecha').value = datos.fecha_orden;
                }

                // Ocultar loading, mostrar éxito
                document.getElementById('orden-loading').style.display = 'none';
                document.getElementById('orden-ocr-ok').style.display  = 'flex';

            } catch (e) {
                document.getElementById('orden-loading').style.display = 'none';
                document.getElementById('pdf-orden-nombre').textContent =
                    'Error al leer el PDF. Completa los campos manualmente.';
                document.getElementById('dropzone-orden').style.borderColor = '#ef4444';
            }
        }


        // ══════════════════════════════════════════════════════════════
        // REPORTES — Exportar a Excel
        // ══════════════════════════════════════════════════════════════

        function exportarFiltrado(key) {
            const datos = paginacionState[key]?.datos;
            if (!datos || !datos.length) {
                showToast('No hay datos para exportar con los filtros actuales', 'warning');
                return;
            }
            const tipo    = key.endsWith('-p') ? 'Propio' : 'Externo';
            const esLlego = key.startsWith('llego');
            const bandejaMap = esLlego ? 'llego' : 'nollego';
            const hoja    = esLlego ? `Llegó - ${tipo}` : `No llegó - ${tipo}`;
            const nombre  = esLlego
                ? `Llego_${tipo}_Filtrado_${hoyStr()}.xlsx`
                : `NoLlego_${tipo}_Filtrado_${hoyStr()}.xlsx`;
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mapearColumnas(datos, bandejaMap)), hoja);
            XLSX.writeFile(wb, nombre);
            showToast(`✓ ${datos.length} registros exportados`, 'success');
        }

        async function exportarBandeja(bandeja, tipo) {
            try {
                let url, nombreHoja, nombreArchivo;
                if (bandeja === 'nollego') {
                    url = `${API}/requerimientos?tiene_orden=0&tipo=${tipo}`;
                    nombreHoja = `No llegó - ${tipo}`;
                    nombreArchivo = `NoLlego_${tipo}_${hoyStr()}.xlsx`;
                } else {
                    url = `${API}/requerimientos/con-orden?tipo=${tipo}`;
                    nombreHoja = `Llegó - ${tipo}`;
                    nombreArchivo = `Llego_${tipo}_${hoyStr()}.xlsx`;
                }

                const res = await fetch(url);
                if (!res.ok) throw new Error('Error al obtener datos');
                const datos = await res.json();

                const wb = XLSX.utils.book_new();
                const ws = XLSX.utils.json_to_sheet(mapearColumnas(datos, bandeja));
                XLSX.utils.book_append_sheet(wb, ws, nombreHoja);
                XLSX.writeFile(wb, nombreArchivo);
            } catch (e) {
                showToast('Error al exportar. Verifica la conexión con el backend.', 'error');
                console.error(e);
            }
        }

        async function exportarTodo() {
            try {
                const [nlp, nle, lp, le] = await Promise.all([
                    fetch(`${API}/requerimientos?tiene_orden=0&tipo=Propio`).then(r => r.json()),
                    fetch(`${API}/requerimientos?tiene_orden=0&tipo=Externo`).then(r => r.json()),
                    fetch(`${API}/requerimientos/con-orden?tipo=Propio`).then(r => r.json()),
                    fetch(`${API}/requerimientos/con-orden?tipo=Externo`).then(r => r.json()),
                ]);

                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mapearColumnas(nlp, 'nollego')), 'No llegó - Propio');
                XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mapearColumnas(nle, 'nollego')), 'No llegó - Externo');
                XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mapearColumnas(lp,  'llego')),   'Llegó - Propio');
                XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mapearColumnas(le,  'llego')),   'Llegó - Externo');
                XLSX.writeFile(wb, `PRECOTI_Reporte_${hoyStr()}.xlsx`);
            } catch (e) {
                showToast('Error al exportar. Verifica la conexión con el backend.', 'error');
                console.error(e);
            }
        }

        function moneda(val) {
            return 'S/ ' + Number(val || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        function mapearColumnas(datos, bandeja) {
            if (bandeja === 'nollego') {
                return datos.map(r => ({
                    'ID_REQ':           r.id_req          || '',
                    'Fecha Registro':   r.fecha_registro   || '',
                    'Empresa':          r.empresa_ganadora || '',
                    'Plazo':            r.plazo            || '',
                    'N° Pedido':        r.numero_pedido    || '',
                    'Descripción':      r.descripcion      || '',
                    'Referencia':       r.referencia       || '',
                    'Área':             r.area             || '',
                    'Total':            moneda(r.precio_total),
                    'De baja':          r.de_baja ? 'Sí' : 'No',
                }));
            } else {
                return datos.map(r => ({
                    'ID_REQ':           r.id_req           || '',
                    'Fecha Registro':   r.fecha_registro    || '',
                    'Fecha Orden':      r.fecha_orden       || '',
                    'Empresa':          r.empresa_ganadora  || '',
                    'Plazo':            r.plazo             || '',
                    'N° Pedido':        r.numero_pedido     || '',
                    'Tipo Orden':       r.tipo_orden        || '',
                    'N° Orden':         r.numero_orden      || '',
                    'SIAF':             r.codigo_siaf       || '',
                    'Descripción':      r.descripcion       || '',
                    'Referencia':       r.referencia        || '',
                    'Área':             r.area              || '',
                    'Total':            moneda(r.precio_total),
                    'Estado':           r.estado            || '',
                }));
            }
        }

        function hoyStr() {
            const h = new Date();
            return `${h.getFullYear()}${String(h.getMonth()+1).padStart(2,'0')}${String(h.getDate()).padStart(2,'0')}`;
        }


        // ══════════════════════════════════════════════════════════════
        // CALENDARIO — Vencimientos de órdenes
        // ══════════════════════════════════════════════════════════════

        let calAnio = new Date().getFullYear();
        let calMes  = new Date().getMonth();    // 0-based
        let calEventos = [];   // [{id_req, descripcion, tipo_orden, numero_orden, estado, fecha_venc, dias_restantes}]

        async function cargarCalendario() {
            try {
                const [rp, re] = await Promise.all([
                    fetch(`${API}/requerimientos/con-orden?tipo=Propio`).then(r => r.json()),
                    fetch(`${API}/requerimientos/con-orden?tipo=Externo`).then(r => r.json()),
                ]);
                calEventos = calcularVencimientos([...rp, ...re]);
                renderizarCalendario(calAnio, calMes);
            } catch (e) {
                console.error('Error cargando calendario:', e);
            }
        }

        function calcularVencimientos(reqs) {
            const hoy = new Date(); hoy.setHours(0,0,0,0);
            return reqs
                .filter(r => r.fecha_orden && r.plazo)
                .map(r => {
                    // fecha_orden puede ser YYYY-MM-DD o DD/MM/YYYY
                    let base;
                    if (r.fecha_orden.includes('/')) {
                        const [d, m, a] = r.fecha_orden.split('/');
                        base = new Date(+a, +m-1, +d);
                    } else {
                        const [a, m, d] = r.fecha_orden.split('-');
                        base = new Date(+a, +m-1, +d);
                    }
                    // plazo puede ser "15 días calendario" o "15" → extraer número
                    const diasPlazo = parseInt(r.plazo, 10) || 0;
                    base.setDate(base.getDate() + diasPlazo);
                    const diasRestantes = Math.floor((base - hoy) / 86400000);
                    return {
                        id_req:        r.id_req,
                        descripcion:   r.descripcion,
                        tipo_orden:    r.tipo_orden,
                        numero_orden:  r.numero_orden,
                        estado:        r.estado,
                        fecha_venc:    base,
                        dias_restantes: diasRestantes,
                    };
                });
        }

        function renderizarCalendario(anio, mes) {
            const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                           'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
            document.getElementById('cal-titulo').textContent = `${meses[mes]} ${anio}`;

            const grid = document.getElementById('cal-grid');
            grid.innerHTML = '';

            // Cabecera días
            ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].forEach(d => {
                const th = document.createElement('div');
                th.textContent = d;
                th.style.cssText = 'font-weight:600; font-size:0.75rem; color:#6b7280; padding:4px 0;';
                grid.appendChild(th);
            });

            const primero = new Date(anio, mes, 1).getDay();
            const diasEnMes = new Date(anio, mes+1, 0).getDate();
            const hoy = new Date(); hoy.setHours(0,0,0,0);

            // Espacios vacíos antes del día 1
            for (let i = 0; i < primero; i++) {
                grid.appendChild(document.createElement('div'));
            }

            // Días
            for (let dia = 1; dia <= diasEnMes; dia++) {
                const fecha = new Date(anio, mes, dia);
                const eventos = calEventos.filter(e => {
                    const f = e.fecha_venc;
                    return f.getFullYear()===anio && f.getMonth()===mes && f.getDate()===dia;
                });

                const cell = document.createElement('div');
                cell.style.cssText = `border-radius:8px; padding:4px 2px; font-size:0.85rem;
                    text-align:center; cursor:${eventos.length?'pointer':'default'};
                    position:relative; min-height:36px;`;

                if (fecha.getTime() === hoy.getTime()) {
                    cell.style.background = '#eff6ff';
                    cell.style.fontWeight = '700';
                    cell.style.color = '#1e3a8a';
                }

                cell.textContent = dia;

                if (eventos.length) {
                    const dot = document.createElement('div');
                    const min = Math.min(...eventos.map(e => e.dias_restantes));
                    dot.style.cssText = `
                        width:8px; height:8px; border-radius:50%; margin:2px auto 0;
                        background:${colorDias(min)};
                    `;
                    cell.appendChild(dot);
                    cell.onclick = () => mostrarDetallesDia(fecha, eventos);
                    cell.title = `${eventos.length} vencimiento(s)`;
                    cell.style.background = colorDias(min) + '22';
                }

                grid.appendChild(cell);
            }
        }

        function colorDias(dias) {
            if (dias <= 0)  return '#ef4444';
            if (dias <= 7)  return '#f97316';
            if (dias <= 30) return '#eab308';
            return '#10b981';
        }

        function navegarMes(delta) {
            calMes += delta;
            if (calMes < 0)  { calMes = 11; calAnio--; }
            if (calMes > 11) { calMes = 0;  calAnio++; }
            renderizarCalendario(calAnio, calMes);
            document.getElementById('cal-detalle-lista').innerHTML = '';
            document.getElementById('cal-detalle-vacio').style.display = 'block';
        }

        function mostrarDetallesDia(fecha, eventos) {
            const meses = ['enero','febrero','marzo','abril','mayo','junio',
                           'julio','agosto','septiembre','octubre','noviembre','diciembre'];
            document.getElementById('cal-detalle-vacio').style.display = 'none';
            const lista = document.getElementById('cal-detalle-lista');
            lista.innerHTML = `<p style="font-weight:600; color:#374151; margin-bottom:10px;">
                ${fecha.getDate()} de ${meses[fecha.getMonth()]} ${fecha.getFullYear()}</p>`;

            eventos.forEach(e => {
                const color = colorDias(e.dias_restantes);
                const label = e.dias_restantes <= 0
                    ? `Venció hace ${Math.abs(e.dias_restantes)} día(s)`
                    : e.dias_restantes === 0
                        ? 'Vence hoy'
                        : `Faltan ${e.dias_restantes} día(s)`;

                lista.innerHTML += `
                <div style="border-left:3px solid ${color}; padding:10px 12px; margin-bottom:10px;
                     background:${color}11; border-radius:0 8px 8px 0;">
                    <div style="font-weight:600; font-size:0.9rem; color:#1f2937;">${e.id_req}</div>
                    <div style="font-size:0.8rem; color:#6b7280; margin:2px 0;">${e.descripcion}</div>
                    <div style="font-size:0.8rem; color:#374151;">${e.tipo_orden} ${e.numero_orden} · ${e.estado}</div>
                    <div style="font-size:0.78rem; font-weight:600; color:${color}; margin-top:4px;">${label}</div>
                </div>`;
            });
        }


        // ══════════════════════════════════════════════════════════════
        // MENSAJES — Notificaciones de vencimientos
        // ══════════════════════════════════════════════════════════════

        let mensajesEventos = [];

        async function cargarMensajes() {
            document.getElementById('msg-lista').innerHTML =
                '<p style="color:#9ca3af; text-align:center; padding:40px;">Cargando…</p>';
            try {
                const [rp, re] = await Promise.all([
                    fetch(`${API}/requerimientos/con-orden?tipo=Propio`).then(r => r.json()),
                    fetch(`${API}/requerimientos/con-orden?tipo=Externo`).then(r => r.json()),
                ]);
                mensajesEventos = calcularVencimientos([...rp, ...re]);
                mensajesEventos.sort((a, b) => a.dias_restantes - b.dias_restantes);
                cardFiltros.mensajes = 'all';
                _activarCard(null, _cardsMsg);
                renderizarMensajes(mensajesEventos);
            } catch (e) {
                document.getElementById('msg-lista').innerHTML =
                    '<p style="color:#ef4444; text-align:center; padding:40px;">Error al cargar. Verifica la conexión con el backend.</p>';
                console.error(e);
            }
        }

        function renderizarMensajes(eventos) {
            const s = paginacionState['mensajes'];
            if (eventos !== undefined) { s.datos = eventos; s.p = 1; }
            const todos = s.datos;

            // Contadores siempre sobre el total completo
            const critico = todos.filter(e => e.dias_restantes <= 7);
            const proximo = todos.filter(e => e.dias_restantes > 7 && e.dias_restantes <= 30);
            const ok      = todos.filter(e => e.dias_restantes > 30);
            document.getElementById('msg-count-critico').textContent = critico.length;
            document.getElementById('msg-count-proximo').textContent = proximo.length;
            document.getElementById('msg-count-ok').textContent      = ok.length;

            // Aplicar filtro de card
            const cf = cardFiltros.mensajes;
            const filtrados = cf === 'critico' ? critico
                            : cf === 'proximo' ? proximo
                            : cf === 'ok'      ? ok
                            : todos;

            const lista = document.getElementById('msg-lista');
            if (!filtrados.length) {
                lista.innerHTML = '<p style="color:#9ca3af; text-align:center; padding:40px;">No hay órdenes en esta categoría.</p>';
                actualizarControlesPaginacion('mensajes', 0);
                return;
            }

            const pagData = filtrados.slice((s.p - 1) * s.n, s.p * s.n);
            lista.innerHTML = pagData.map(e => {
                const color = colorDias(e.dias_restantes);
                const label = e.dias_restantes <= 0
                    ? `Venció hace ${Math.abs(e.dias_restantes)} día(s)`
                    : `Faltan ${e.dias_restantes} día(s)`;
                const gcLink = linkGoogleCalendar(e);
                const fv = e.fecha_venc;
                const fvStr = `${String(fv.getDate()).padStart(2,'0')}/${String(fv.getMonth()+1).padStart(2,'0')}/${fv.getFullYear()}`;
                return `
                <div style="display:flex; align-items:center; gap:16px; background:#fff; border-radius:12px;
                     box-shadow:0 1px 4px rgba(0,0,0,0.07); padding:16px; border-left:4px solid ${color};">
                    <div style="flex:1; min-width:0;">
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                            <span style="font-weight:700; color:#1f2937;">${e.id_req}</span>
                            <span style="font-size:0.75rem; background:${color}22; color:${color};
                                  border-radius:999px; padding:2px 10px; font-weight:600;">${label}</span>
                        </div>
                        <div style="font-size:0.85rem; color:#374151; margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${e.descripcion}">${e.descripcion}</div>
                        <div style="font-size:0.8rem; color:#6b7280;">${e.tipo_orden} ${e.numero_orden} · ${e.estado} · Vence: ${fvStr}</div>
                    </div>
                    <a href="${gcLink}" target="_blank" title="Agregar a Google Calendar"
                       style="flex-shrink:0; font-size:0.78rem; color:#3b82f6; text-decoration:none;
                              border:1px solid #3b82f6; border-radius:8px; padding:6px 10px; white-space:nowrap;">
                        <i class="fas fa-calendar-plus"></i> Google Cal
                    </a>
                </div>`;
            }).join('');
            actualizarControlesPaginacion('mensajes', filtrados.length);
        }

        function linkGoogleCalendar(evento) {
            const fv = evento.fecha_venc;
            const fmt = d => `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
            const inicio = fmt(fv);
            const fin = fmt(new Date(fv.getTime() + 86400000)); // +1 día
            const texto = encodeURIComponent(`Vencimiento ${evento.id_req}: ${evento.tipo_orden} ${evento.numero_orden}`);
            const detalles = encodeURIComponent(`${evento.descripcion}\nEstado: ${evento.estado}`);
            return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${texto}&dates=${inicio}/${fin}&details=${detalles}`;
        }

        function descargarICS() {
            if (!mensajesEventos.length) {
                showToast('No hay vencimientos cargados. Abre la sección Mensajes primero.', 'warning');
                return;
            }
            const lineas = [
                'BEGIN:VCALENDAR',
                'VERSION:2.0',
                'PRODID:-//PRECOTI//Sistema de Gestión//ES',
                'CALSCALE:GREGORIAN',
                'METHOD:PUBLISH',
            ];
            mensajesEventos.forEach(e => {
                const fv = e.fecha_venc;
                const fmt = d => `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
                const fin = new Date(fv.getTime() + 86400000);
                lineas.push(
                    'BEGIN:VEVENT',
                    `DTSTART;VALUE=DATE:${fmt(fv)}`,
                    `DTEND;VALUE=DATE:${fmt(fin)}`,
                    `SUMMARY:Vencimiento ${e.id_req}: ${e.tipo_orden} ${e.numero_orden}`,
                    `DESCRIPTION:${e.descripcion}\\nEstado: ${e.estado}`,
                    `STATUS:CONFIRMED`,
                    'END:VEVENT',
                );
            });
            lineas.push('END:VCALENDAR');

            const blob = new Blob([lineas.join('\r\n')], { type: 'text/calendar' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `PRECOTI_Vencimientos_${hoyStr()}.ics`;
            a.click();
            URL.revokeObjectURL(a.href);
        }


        // ══════════════════════════════════════════════════════════════
        // TOAST NOTIFICATIONS
        // ══════════════════════════════════════════════════════════════

        function showToast(mensaje, tipo = 'info', duracion = 4000) {
            const iconos = { success: 'fa-check-circle', error: 'fa-times-circle',
                             warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');
            toast.className = `toast ${tipo}`;
            toast.innerHTML = `<i class="fas ${iconos[tipo] || iconos.info}"></i><span>${mensaje}</span>`;
            container.appendChild(toast);
            setTimeout(() => {
                toast.style.animation = 'toastOut 0.3s ease forwards';
                setTimeout(() => toast.remove(), 300);
            }, duracion);
        }


        // ══════════════════════════════════════════════════════════════
        // BUSCADOR GLOBAL (Ctrl+/)
        // ══════════════════════════════════════════════════════════════

        document.addEventListener('keydown', e => {
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                abrirBusqueda();
            }
        });

        function abrirBusqueda() {
            document.getElementById('modal-busqueda').classList.add('open');
            document.getElementById('busqueda-input').value = '';
            document.getElementById('busqueda-resultados').innerHTML =
                '<p id="busqueda-hint" style="padding:20px;color:#9ca3af;font-size:0.88rem;">Escribe al menos 2 caracteres…</p>';
            setTimeout(() => document.getElementById('busqueda-input').focus(), 50);
        }

        function cerrarBusqueda() {
            document.getElementById('modal-busqueda').classList.remove('open');
        }

        let _buscarTimer = null;
        async function buscarGlobal(q) {
            clearTimeout(_buscarTimer);
            const div = document.getElementById('busqueda-resultados');
            if (q.trim().length < 2) {
                div.innerHTML = '<p id="busqueda-hint" style="padding:20px;color:#9ca3af;font-size:0.88rem;">Escribe al menos 2 caracteres…</p>';
                return;
            }
            _buscarTimer = setTimeout(async () => {
                div.innerHTML = '<p style="padding:16px;color:#9ca3af;font-size:0.88rem;">Buscando…</p>';
                try {
                    const res = await fetch(`${API}/requerimientos/buscar?q=${encodeURIComponent(q)}`);
                    const data = await res.json();
                    if (!data.length) {
                        div.innerHTML = '<p style="padding:16px;color:#9ca3af;font-size:0.88rem;">Sin resultados</p>';
                        return;
                    }
                    div.innerHTML = data.map(r => {
                        const seccion = r.tiene_orden
                            ? (r.tipo === 'Propio' ? 'llego' : 'exterOrden')
                            : (r.tipo === 'Propio' ? 'no-llego' : 'noexterOrden');
                        const etiqueta = r.tiene_orden ? '✓ Con orden' : '⏳ Sin orden';
                        const color    = r.tiene_orden ? '#10b981' : '#f59e0b';
                        return `
                        <div class="busqueda-item" onclick="cerrarBusqueda(); document.querySelector('[onclick*=\\'showSection(\\\\\\\"${seccion}\\\\\\\")\\']').click()">
                            <div style="flex:1;">
                                <div style="display:flex;gap:8px;align-items:center;margin-bottom:2px;">
                                    <span class="bid">${r.id_req}</span>
                                    <span style="font-size:0.72rem;color:${color};font-weight:600;">${etiqueta}</span>
                                    ${r.de_baja ? '<span style="font-size:0.72rem;color:#ef4444;">DE BAJA</span>' : ''}
                                </div>
                                <div class="bdesc">${(r.descripcion||'').substring(0,80)}${r.descripcion?.length > 80 ? '…':''}</div>
                                <div style="font-size:0.78rem;color:#9ca3af;">${r.empresa_ganadora||''} ${r.numero_orden ? '· '+r.tipo_orden+' '+r.numero_orden : ''}</div>
                            </div>
                            <span style="font-size:0.75rem;color:#d1d5db;">${r.tipo}</span>
                        </div>`;
                    }).join('');
                } catch(e) {
                    div.innerHTML = '<p style="padding:16px;color:#ef4444;font-size:0.88rem;">Error al buscar</p>';
                }
            }, 300);
        }


        // ══════════════════════════════════════════════════════════════
        // DASHBOARD FINANCIERO — métricas reales
        // ══════════════════════════════════════════════════════════════

        // Instancias de charts para poder destruirlas antes de recrear
        const _finCharts = {};

        function _destroyChart(id) {
            if (_finCharts[id]) { _finCharts[id].destroy(); delete _finCharts[id]; }
        }

        function _s(id, val) {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        }

        function _mon(v) {
            const n = (Number(v) || 0).toFixed(2);
            const [int, dec] = n.split('.');
            return 'S/ ' + int.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + dec;
        }

        async function cargarMetricas() {
            try {
                const res = await fetch(`${API}/requerimientos/metricas`);
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    showToast('Error del servidor: ' + (err.detail || res.status), 'error');
                    return;
                }
                const m = await res.json();

                // ── KPIs ──────────────────────────────────────────────
                _s('fin-total',    m.total_reqs);
                _s('fin-con',      m.con_orden);
                _s('fin-sin',      m.sin_orden);
                _s('fin-monto',    _mon(m.monto_total));
                _s('fin-monto-espera',  _mon(m.monto_espera));
                _s('fin-monto-pagado',  _mon(m.monto_pagado));
                _s('fin-kpi-propio',    `Propio: ${m.propio_count}`);
                _s('fin-kpi-externo',   `Externo: ${m.externo_count}`);
                _s('fin-con-sub',       `<i class="fas fa-check"></i> Pagados: ${m.pagados} · Espera: ${m.espera_pago}`);
                const elConSub = document.getElementById('fin-con-sub');
                if (elConSub) elConSub.innerHTML = `<i class="fas fa-check"></i> Pagados: ${m.pagados} &nbsp;·&nbsp; Espera: ${m.espera_pago}`;
                _s('fin-mk-sin',    m.sin_orden);
                _s('fin-mk-baja',   m.de_baja);
                _s('fin-mk-activos',m.activos_sin_orden);
                _s('fin-oc',        m.oc_count);
                _s('fin-os',        m.os_count);

                // año evolución
                const elAnio = document.getElementById('fin-anio-evol');
                if (elAnio && m.evolucion && m.evolucion.length)
                    elAnio.textContent = new Date().getFullYear();

                // ── Gráficos (bloque independiente de los KPIs) ────────
                try {
                if (typeof Chart === 'undefined') {
                    showToast('Chart.js no cargó. Verifica la conexión a internet.', 'warning');
                    return;
                }
                Chart.defaults.font.family = 'inherit';
                Chart.defaults.color = '#64748b';

                // ── 1. Barras agrupadas: estado por tipo ───────────────
                _destroyChart('estado-tipo');
                _finCharts['estado-tipo'] = new Chart(
                    document.getElementById('chart-estado-tipo'), {
                    type: 'bar',
                    data: {
                        labels: m.labels_estado,
                        datasets: [
                            {
                                label: 'Propio',
                                data: m.estado_propio,
                                backgroundColor: 'rgba(59,130,246,0.75)',
                                borderColor: '#3b82f6',
                                borderWidth: 1,
                                borderRadius: 4,
                            },
                            {
                                label: 'Externo',
                                data: m.estado_externo,
                                backgroundColor: 'rgba(99,102,241,0.65)',
                                borderColor: '#6366f1',
                                borderWidth: 1,
                                borderRadius: 4,
                            }
                        ]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 }, stepSize: 1 } },
                            x: { grid: { display: false }, ticks: { font: { size: 10 } } }
                        }
                    }
                });

                // ── 2. Donut estado de pagos ───────────────────────────
                _destroyChart('pagos-donut');
                _finCharts['pagos-donut'] = new Chart(
                    document.getElementById('chart-pagos-donut'), {
                    type: 'doughnut',
                    data: {
                        labels: ['Espera pago', 'Llegó pago', 'Sin factura'],
                        datasets: [{
                            data: [m.espera_pago, m.pagados, m.sin_factura],
                            backgroundColor: ['#fbbf24', '#22c55e', '#cbd5e1'],
                            borderWidth: 2, borderColor: '#fff', hoverOffset: 6
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        cutout: '65%',
                        plugins: {
                            legend: { display: false },
                            tooltip: { callbacks: { label: c => ` ${c.label}: ${c.raw}` } }
                        }
                    }
                });
                const legendEl = document.getElementById('fin-pagos-legend');
                if (legendEl) {
                    const items = [
                        ['#fbbf24', 'Espera pago', m.espera_pago],
                        ['#22c55e', 'Llegó pago',  m.pagados],
                        ['#cbd5e1', 'Sin factura', m.sin_factura],
                    ];
                    legendEl.innerHTML = items.map(([c, label, val]) => `
                        <div class="fin-donut-legend-row">
                            <span><span class="fin-donut-dot" style="background:${c}"></span>${label}</span>
                            <strong>${val}</strong>
                        </div>`).join('');
                }

                // ── 3. Barras horizontales: monto por empresa ──────────
                _destroyChart('empresa-monto');
                const empLabels  = (m.monto_por_empresa || []).map(e => e.empresa);
                const empTotales = (m.monto_por_empresa || []).map(e => e.total);
                const empColors  = ['rgba(59,130,246,0.8)','rgba(16,185,129,0.8)','rgba(99,102,241,0.8)',
                                    'rgba(245,158,11,0.8)','rgba(239,68,68,0.7)','rgba(14,165,233,0.8)',
                                    'rgba(156,163,175,0.7)','rgba(168,85,247,0.7)'];
                _finCharts['empresa-monto'] = new Chart(
                    document.getElementById('chart-empresa-monto'), {
                    type: 'bar',
                    data: {
                        labels: empLabels,
                        datasets: [{
                            label: 'Monto S/',
                            data: empTotales,
                            backgroundColor: empColors.slice(0, empLabels.length),
                            borderRadius: 5, borderWidth: 0,
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true, maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: { callbacks: { label: c => ` S/ ${Number(c.raw).toLocaleString('es-PE', {minimumFractionDigits:2})}` } }
                        },
                        scales: {
                            x: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { callback: v => 'S/'+v, font: { size: 9 } } },
                            y: { grid: { display: false }, ticks: { font: { size: 9 } } }
                        }
                    }
                });

                // ── 4. Línea: evolución mensual ────────────────────────
                _destroyChart('evolucion');
                const evolMeses  = (m.evolucion || []).map(e => e.mes);
                const evolPropio = (m.evolucion || []).map(e => e.propio);
                const evolExt    = (m.evolucion || []).map(e => e.externo);
                _finCharts['evolucion'] = new Chart(
                    document.getElementById('chart-evolucion'), {
                    type: 'line',
                    data: {
                        labels: evolMeses,
                        datasets: [
                            {
                                label: 'Propio',
                                data: evolPropio,
                                borderColor: '#3b82f6',
                                backgroundColor: 'rgba(59,130,246,0.1)',
                                fill: true, tension: 0.4, borderWidth: 2,
                                pointRadius: 4, pointBackgroundColor: '#fff', pointBorderWidth: 2
                            },
                            {
                                label: 'Externo',
                                data: evolExt,
                                borderColor: '#6366f1',
                                backgroundColor: 'rgba(99,102,241,0.08)',
                                fill: true, tension: 0.4, borderWidth: 2,
                                pointRadius: 4, pointBackgroundColor: '#fff', pointBorderWidth: 2
                            }
                        ]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { position: 'top', align: 'start', labels: { boxWidth: 10, font: { size: 10 } } } },
                        scales: {
                            y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 9 }, stepSize: 1 } },
                            x: { grid: { display: false }, ticks: { font: { size: 9 } } }
                        }
                    }
                });

                // ── 5. Donut OC/OS ─────────────────────────────────────
                _destroyChart('tipo-orden');
                _finCharts['tipo-orden'] = new Chart(
                    document.getElementById('chart-tipo-orden'), {
                    type: 'doughnut',
                    data: {
                        labels: ['OC (Compra)', 'OS (Servicio)'],
                        datasets: [{
                            data: [m.oc_count, m.os_count],
                            backgroundColor: ['rgba(236,72,153,0.8)', 'rgba(139,92,246,0.8)'],
                            borderWidth: 2, borderColor: '#fff', hoverOffset: 6
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        cutout: '60%',
                        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } }
                    }
                });

                // ── 6. Barras: reqs por área (top 9 + Otras) ─────────
                _destroyChart('area');
                const areaLabels = (m.por_area || []).map(a => a.area);
                const areaTots   = (m.por_area || []).map(a => a.total);
                const areaColors = [
                    'rgba(15,35,64,0.85)','rgba(59,130,246,0.75)','rgba(99,102,241,0.75)',
                    'rgba(16,185,129,0.75)','rgba(245,158,11,0.75)','rgba(239,68,68,0.70)',
                    'rgba(14,165,233,0.75)','rgba(168,85,247,0.75)','rgba(251,146,60,0.75)',
                    'rgba(156,163,175,0.70)',  // "Otras"
                ];
                _finCharts['area'] = new Chart(
                    document.getElementById('chart-area'), {
                    type: 'bar',
                    data: {
                        labels: areaLabels,
                        datasets: [{
                            label: 'Requerimientos',
                            data: areaTots,
                            backgroundColor: areaColors.slice(0, areaLabels.length),
                            borderRadius: 5, borderWidth: 0,
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 9 }, stepSize: 1 } },
                            x: {
                                grid: { display: false },
                                ticks: {
                                    font: { size: 9 },
                                    maxRotation: 90,
                                    minRotation: 90,
                                }
                            }
                        }
                    }
                });

                // ── Tabla últimos reqs ─────────────────────────────────
                const badgeClass = e => {
                    if (e === 'Llegó pago')  return 'fin-badge-estado fin-badge-llego';
                    if (e === 'Espera pago') return 'fin-badge-estado fin-badge-espera';
                    if (e === 'De baja')     return 'fin-badge-estado fin-badge-baja';
                    if (e === 'Sin orden')   return 'fin-badge-estado fin-badge-sinorden';
                    return 'fin-badge-estado fin-badge-activo';
                };
                const tbody = document.getElementById('fin-tabla-body');
                if (tbody && m.ultimos) {
                    _s('fin-tabla-count', `Mostrando ${m.ultimos.length} registros`);
                    tbody.innerHTML = m.ultimos.map(r => `
                        <tr>
                            <td style="color:#1e3a8a;font-weight:700">${r.id_req}</td>
                            <td style="color:#6b7280">${r.fecha_registro}</td>
                            <td style="font-weight:600">${r.empresa}</td>
                            <td>
                                <span style="padding:2px 8px;border-radius:999px;font-size:0.72rem;font-weight:700;
                                    background:${r.tipo_orden==='OC'?'#fce7f3':'#f5f3ff'};
                                    color:${r.tipo_orden==='OC'?'#9d174d':'#6d28d9'}">
                                    ${r.tipo_orden}
                                </span>
                            </td>
                            <td style="color:#6b7280">${r.numero_orden}</td>
                            <td style="color:#6b7280;max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"
                                title="${r.descripcion}">${r.descripcion}</td>
                            <td style="text-align:right;font-weight:700;color:#1f2937">${_mon(r.precio_total)}</td>
                            <td style="text-align:center">
                                <span class="${badgeClass(r.estado)}">${r.estado}</span>
                            </td>
                        </tr>`).join('');
                }

                } catch(eChart) {
                    console.error('Error inicializando gráficos:', eChart);
                    showToast('Error al renderizar los gráficos: ' + eChart.message, 'warning');
                }

            } catch(e) {
                console.error('Error cargando métricas:', e);
                showToast('Error al cargar métricas: ' + e.message, 'error');
            }
        }


        // ══════════════════════════════════════════════════════════════
        // EMPRESAS — listar, agregar, eliminar
        // ══════════════════════════════════════════════════════════════

        let _empresasData = [];

        async function cargarEmpresasSeccion() {
            const tbody = document.getElementById('tbody-empresas');
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#9ca3af;padding:20px">Cargando…</td></tr>';
            try {
                const res = await fetch(`${API}/empresas`);
                _empresasData = await res.json();
                renderizarEmpresasSeccion(_empresasData);
            } catch(e) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#ef4444;padding:20px">Error al cargar empresas</td></tr>';
            }
        }

        function renderizarEmpresasSeccion(data) {
            const s = paginacionState['empresas'];
            if (data !== undefined) { s.datos = data; s.p = 1; }
            const pagData = s.datos.slice((s.p - 1) * s.n, s.p * s.n);
            const tbody = document.getElementById('tbody-empresas');
            if (!s.datos.length) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#9ca3af;padding:30px">No hay empresas registradas</td></tr>';
                actualizarControlesPaginacion('empresas', 0);
                return;
            }
            tbody.innerHTML = pagData.map(e => `
                <tr>
                    <td style="font-family:monospace;font-size:0.85rem;">${e.ruc}</td>
                    <td style="font-weight:600;">${e.desc_empresa}</td>
                    <td><span class="status-badge status-pending" style="font-size:0.75rem;">${e.rubro||'—'}</span></td>
                    <td style="font-size:0.85rem;">${e.correo||'—'}</td>
                    <td>
                        <button class="btn-view" style="background:#ef444420;color:#ef4444;border:1px solid #ef444440;"
                            onclick="eliminarEmpresa('${e.ruc}', '${e.desc_empresa}')">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </td>
                </tr>`).join('');
            actualizarControlesPaginacion('empresas', s.datos.length);
        }

        function filtrarEmpresas() {
            const q = document.getElementById('buscar-empresa').value.toLowerCase();
            const filtrados = _empresasData.filter(e =>
                (e.ruc         ||'').includes(q) ||
                (e.desc_empresa||'').toLowerCase().includes(q) ||
                (e.rubro       ||'').toLowerCase().includes(q) ||
                (e.correo      ||'').toLowerCase().includes(q)
            );
            renderizarEmpresasSeccion(filtrados);
        }

        function abrirModalEmpresa() {
            document.getElementById('modal-empresa').style.display = 'flex';
            document.getElementById('form-empresa').reset();
        }

        function cerrarModalEmpresa() {
            document.getElementById('modal-empresa').style.display = 'none';
        }

        async function guardarEmpresa() {
            const ruc          = document.getElementById('emp-ruc').value.trim();
            const desc_empresa = document.getElementById('emp-nombre').value.trim();
            const rubro        = document.getElementById('emp-rubro').value.trim();
            const correo       = document.getElementById('emp-correo').value.trim();

            if (!ruc)          { showToast('El RUC es obligatorio', 'warning'); return; }
            if (ruc.length !== 11 || !/^\d+$/.test(ruc))
                               { showToast('El RUC debe tener 11 dígitos numéricos', 'warning'); return; }
            if (!desc_empresa) { showToast('La razón social es obligatoria', 'warning'); return; }

            try {
                const res = await fetch(`${API}/empresas`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ruc, desc_empresa, rubro, correo }),
                });
                if (!res.ok) {
                    const err = await res.json();
                    showToast(err.detail || 'Error al guardar empresa', 'error');
                    return;
                }
                cerrarModalEmpresa();
                showToast(`✓ Empresa ${desc_empresa} registrada`, 'success');
                await cargarEmpresasSeccion();
            } catch(e) {
                showToast('Error al conectar con el backend', 'error');
            }
        }

        async function eliminarEmpresa(ruc, nombre) {
            if (!confirm(`¿Eliminar la empresa "${nombre}" (${ruc})?`)) return;
            try {
                const res = await fetch(`${API}/empresas/${ruc}`, { method: 'DELETE' });
                if (!res.ok) {
                    const err = await res.json();
                    showToast(err.detail || 'Error al eliminar', 'error');
                    return;
                }
                showToast(`✓ Empresa ${nombre} eliminada`, 'success');
                await cargarEmpresasSeccion();
            } catch(e) {
                showToast('Error al conectar con el backend', 'error');
            }
        }


        // ══════════════════════════════════════════════════════════════
        // VER PDF — helper para construir URL desde ruta del servidor
        // ══════════════════════════════════════════════════════════════

        function verPDF(rutaCompleta) {
            if (!rutaCompleta) return;
            // Extraer solo el nombre del archivo de la ruta completa del servidor
            const partes = rutaCompleta.replace(/\\/g, '/').split('/');
            const nombre = partes[partes.length - 1];
            // Determinar subcarpeta según prefijo o carpeta en la ruta
            let subcarpeta = 'facturas';
            if (rutaCompleta.replace(/\\/g, '/').includes('/ordenes/') ||
                nombre.startsWith('orden_') || /^(OS|OC)-/.test(nombre)) {
                subcarpeta = 'ordenes';
            } else if (rutaCompleta.replace(/\\/g, '/').includes('/requerimientos/') ||
                       nombre.startsWith('requerimiento_')) {
                subcarpeta = 'requerimientos';
            }
            const url = `${API}/pdfs/${subcarpeta}/${encodeURIComponent(nombre)}`;
            window.open(url, '_blank');
        }

        // ── Perfil ────────────────────────────────────────────────────────
        function cargarPerfil() {
            document.getElementById('perfil-nombre').textContent = currentUser;
            document.getElementById('perfil-avatar').textContent =
                currentUser ? currentUser.charAt(0).toUpperCase() : '?';
        }

        function abrirCambiarPassword() {
            ['cp-actual','cp-nueva','cp-confirmar'].forEach(id => {
                document.getElementById(id).value = '';
            });
            document.getElementById('modal-cambiar-password').classList.add('active');
        }

        async function cambiarPassword() {
            const actual    = document.getElementById('cp-actual').value.trim();
            const nueva     = document.getElementById('cp-nueva').value.trim();
            const confirmar = document.getElementById('cp-confirmar').value.trim();

            if (!actual || !nueva || !confirmar) {
                showToast('Completa todos los campos', 'warning'); return;
            }
            if (nueva !== confirmar) {
                showToast('Las contraseñas nuevas no coinciden', 'warning'); return;
            }
            if (nueva.length < 4) {
                showToast('La nueva contraseña debe tener al menos 4 caracteres', 'warning'); return;
            }

            try {
                const res = await fetch(`${API}/auth/cambiar-password`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: currentUser,
                        password_actual: actual,
                        password_nueva: nueva
                    })
                });
                const data = await res.json();
                if (!res.ok) { showToast(data.detail || 'Error al cambiar contraseña', 'error'); return; }
                showToast('✓ Contraseña actualizada correctamente', 'success');
                cerrarModal('modal-cambiar-password');
            } catch (e) {
                showToast('Error al conectar con el servidor', 'error');
            }
        }

        function abrirEditarPerfil() {
            document.getElementById('perfil-nuevo-username').value = currentUser;
            document.getElementById('perfil-pass-confirm').value = '';
            document.getElementById('modal-editar-perfil').classList.add('active');
        }

        async function guardarPerfil() {
            const nuevoUsername = document.getElementById('perfil-nuevo-username').value.trim();
            const password      = document.getElementById('perfil-pass-confirm').value.trim();

            if (!nuevoUsername) { showToast('El nombre de usuario no puede estar vacío', 'warning'); return; }
            if (!password)      { showToast('Ingresa tu contraseña actual para confirmar', 'warning'); return; }

            try {
                const res = await fetch(`${API}/auth/editar-perfil`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username_actual: currentUser,
                        username_nuevo: nuevoUsername,
                        password: password
                    })
                });
                const data = await res.json();
                if (!res.ok) { showToast(data.detail || 'Error al actualizar perfil', 'error'); return; }
                currentUser = nuevoUsername;
                document.getElementById('userName').textContent = currentUser;
                cargarPerfil();
                showToast('✓ Perfil actualizado correctamente', 'success');
                cerrarModal('modal-editar-perfil');
            } catch (e) {
                showToast('Error al conectar con el servidor', 'error');
            }
        }

        // Actualizar confirmarOrden para pasar pdf_path al crear la orden
        // (ya manejado en confirmarOrdenConPDF — wrapper que incluye el path)

