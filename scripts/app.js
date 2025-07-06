class MiRanchoApp {
    constructor() {
        this.db = foodDB; // Instancia de la DB
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        
        this.initElements();
        this.initEventListeners();
        this.initServiceWorker();
        this.renderApp();
    }

    initElements() {
        this.elements = {
            appContent: document.getElementById('app-content'),
            installBtn: document.getElementById('installBtn'),
            monthSelect: document.createElement('select'),
            yearSelect: document.createElement('select'),
            generateBtn: document.createElement('button'),
            dayControls: document.createElement('div'),
            monthTitle: document.createElement('h2'),
            daySelect: document.createElement('select'),
            breakfastBtn: document.createElement('button'),
            lunchBtn: document.createElement('button'),
            snackBtn: document.createElement('button'),
            extraAmount: document.createElement('input'),
            extraDescription: document.createElement('input'),
            addExtraBtn: document.createElement('button'),
            tableBody: document.createElement('tbody'),
            totalBreakfast: document.createElement('p'),
            totalLunch: document.createElement('p'),
            totalSnack: document.createElement('p'),
            totalExtra: document.createElement('p'),
            totalMonth: document.createElement('div'),
            breakfastCount: document.createElement('p'),
            lunchCount: document.createElement('p'),
            snackCount: document.createElement('p'),
            extraCount: document.createElement('p'),
            exportBtn: document.createElement('button'),
            printBtn: document.createElement('button'),
            clearMonthBtn: document.createElement('button')
        };

        // Configurar elementos básicos
        this.elements.generateBtn.textContent = '📅 Generar Mes';
        this.elements.breakfastBtn.textContent = '☕ Desayuno ($1.60)';
        this.elements.lunchBtn.textContent = '🍲 Almuerzo ($3.16)';
        this.elements.snackBtn.textContent = '🍎 Merienda ($1.60)';
        this.elements.addExtraBtn.textContent = '💾 Agregar Gasto';
        this.elements.exportBtn.textContent = '📤 Exportar';
        this.elements.printBtn.textContent = '🖨️ Imprimir';
        this.elements.clearMonthBtn.textContent = '🗑️ Limpiar Mes';

        // Configurar inputs
        this.elements.extraAmount.type = 'number';
        this.elements.extraAmount.placeholder = 'Monto';
        this.elements.extraAmount.step = '0.01';
        this.elements.extraAmount.min = '0';
        
        this.elements.extraDescription.type = 'text';
        this.elements.extraDescription.placeholder = 'Descripción';
    }

    initEventListeners() {
        this.elements.generateBtn.addEventListener('click', () => this.generateMonth());
        this.elements.breakfastBtn.addEventListener('click', () => this.toggleMeal('breakfast'));
        this.elements.lunchBtn.addEventListener('click', () => this.toggleMeal('lunch'));
        this.elements.snackBtn.addEventListener('click', () => this.toggleMeal('snack'));
        this.elements.daySelect.addEventListener('change', () => this.updateButtonStates());
        this.elements.addExtraBtn.addEventListener('click', () => this.addExtra());
        this.elements.exportBtn.addEventListener('click', () => this.exportData());
        this.elements.printBtn.addEventListener('click', () => window.print());
        this.elements.clearMonthBtn.addEventListener('click', () => this.clearCurrentMonth());
        this.elements.installBtn.addEventListener('click', () => this.promptInstall());
    }

    initServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('sw.js')
                    .then(registration => {
                        console.log('ServiceWorker registrado con éxito:', registration.scope);
                    })
                    .catch(err => {
                        console.log('Error al registrar ServiceWorker:', err);
                    });
            });
        }

        // Manejar la instalación como PWA
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.elements.installBtn.style.display = 'block';
        });

        window.addEventListener('appinstalled', () => {
            this.elements.installBtn.style.display = 'none';
            console.log('Aplicación instalada con éxito');
        });
    }

    promptInstall() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            this.deferredPrompt.userChoice.then(choiceResult => {
                if (choiceResult.outcome === 'accepted') {
                    this.elements.installBtn.style.display = 'none';
                }
                this.deferredPrompt = null;
            });
        }
    }

    renderApp() {
        // Limpiar contenido
        this.elements.appContent.innerHTML = '';
        
        // Crear selectores de mes y año
        const monthSelector = document.createElement('div');
        monthSelector.className = 'month-selector';
        
        // Configurar meses
        this.elements.monthSelect.id = 'month';
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        months.forEach((month, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = month;
            if (index === this.currentMonth) option.selected = true;
            this.elements.monthSelect.appendChild(option);
        });
        
        // Configurar años
        this.elements.yearSelect.id = 'year';
        for (let year = 2023; year <= 2026; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            if (year === this.currentYear) option.selected = true;
            this.elements.yearSelect.appendChild(option);
        }
        
        // Agregar elementos al selector de mes
        monthSelector.appendChild(this.elements.monthSelect);
        monthSelector.appendChild(this.elements.yearSelect);
        monthSelector.appendChild(this.elements.generateBtn);
        
        // Crear header
        const header = document.createElement('div');
        header.className = 'header';
        header.appendChild(monthSelector);
        
        // Crear contenedor principal
        const mainContainer = document.createElement('div');
        mainContainer.appendChild(header);
        
        // Configurar controles de día (inicialmente ocultos)
        this.elements.dayControls.id = 'day-controls';
        this.elements.dayControls.className = 'day-controls';
        this.elements.dayControls.style.display = 'none';
        
        // Agregar controles de día al contenedor principal cuando estén listos
        mainContainer.appendChild(this.elements.dayControls);
        
        // Agregar todo al contenido de la app
        this.elements.appContent.appendChild(mainContainer);
        
        // Verificar si hay datos para el mes actual
        const currentMonthKey = `${this.currentYear}-${this.currentMonth}`;
        if (this.db.currentData[currentMonthKey]) {
            this.generateMonth();
        }
    }

    generateMonth() {
        this.currentMonth = parseInt(this.elements.monthSelect.value);
        this.currentYear = parseInt(this.elements.yearSelect.value);
        
        // Obtener el número de días en el mes
        const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        
        // Limpiar select de días
        this.elements.daySelect.innerHTML = '';
        
        // Generar opciones para cada día
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(this.currentYear, this.currentMonth, i);
            const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${i}`;
            this.elements.daySelect.appendChild(option);
        }
        
        // Inicializar datos del mes
        this.db.initializeMonth(this.currentYear, this.currentMonth);
        
        // Mostrar controles
        this.elements.dayControls.style.display = 'block';
        this.elements.monthTitle.textContent = `Control de consumo para ${this.elements.monthSelect.options[this.currentMonth].text} ${this.currentYear}`;
        
        // Construir la interfaz de controles de día
        this.elements.dayControls.innerHTML = '';
        
        // Agregar título
        this.elements.dayControls.appendChild(this.elements.monthTitle);
        
        // Crear contenedor de controles
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'controls';
        
        // Contenedor para selector de día
        const daySelectContainer = document.createElement('div');
        daySelectContainer.className = 'day-select-container';
        daySelectContainer.appendChild(this.elements.daySelect);
        controlsContainer.appendChild(daySelectContainer);
        
        // Botones de comidas
        const mealButtons = document.createElement('div');
        mealButtons.className = 'meal-buttons';
        
        // Configurar clases de los botones
        this.elements.breakfastBtn.className = 'btn btn-success';
        this.elements.lunchBtn.className = 'btn btn-danger';
        this.elements.snackBtn.className = 'btn btn-success';
        
        mealButtons.appendChild(this.elements.breakfastBtn);
        mealButtons.appendChild(this.elements.lunchBtn);
        mealButtons.appendChild(this.elements.snackBtn);
        controlsContainer.appendChild(mealButtons);
        
        this.elements.dayControls.appendChild(controlsContainer);
        
        // Crear sección de gastos adicionales
        const extraInput = document.createElement('div');
        extraInput.className = 'extra-input';
        
        const extraTitle = document.createElement('h3');
        extraTitle.textContent = '➕ Gasto adicional';
        extraInput.appendChild(extraTitle);
        
        const extraControls = document.createElement('div');
        extraControls.className = 'extra-input-controls';
        
        this.elements.addExtraBtn.className = 'btn btn-outline';
        this.elements.addExtraBtn.style.flex = '1 1 100%';
        
        extraControls.appendChild(this.elements.extraAmount);
        extraControls.appendChild(this.elements.extraDescription);
        extraControls.appendChild(this.elements.addExtraBtn);
        
        extraInput.appendChild(extraControls);
        this.elements.dayControls.appendChild(extraInput);
        
        // Crear tabla
        const tableContainer = document.createElement('div');
        tableContainer.style.overflowX = 'auto';
        
        const table = document.createElement('table');
        table.id = 'consumption-table';
        
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Fecha</th>
                <th>Desayuno</th>
                <th>Almuerzo</th>
                <th>Merienda</th>
                <th>Extras</th>
                <th>Total día</th>
            </tr>
        `;
        
        table.appendChild(thead);
        table.appendChild(this.elements.tableBody);
        tableContainer.appendChild(table);
        this.elements.dayControls.appendChild(tableContainer);
        
        // Crear resumen
        const summary = document.createElement('div');
        summary.className = 'summary';
        
        const summaryTitle = document.createElement('h3');
        summaryTitle.textContent = '📊 Resumen Mensual';
        summary.appendChild(summaryTitle);
        
        const summaryGrid = document.createElement('div');
        summaryGrid.className = 'summary-grid';
        
        // Desayunos
        const breakfastItem = document.createElement('div');
        breakfastItem.className = 'summary-item';
        breakfastItem.innerHTML = `
            <h4>Desayunos</h4>
            <p id="total-breakfast">$0.00</p>
            <p id="breakfast-count">0 desayunos</p>
        `;
        summaryGrid.appendChild(breakfastItem);
        
        // Almuerzos
        const lunchItem = document.createElement('div');
        lunchItem.className = 'summary-item';
        lunchItem.innerHTML = `
            <h4>Almuerzos</h4>
            <p id="total-lunch">$0.00</p>
            <p id="lunch-count">0 almuerzos</p>
        `;
        summaryGrid.appendChild(lunchItem);
        
        // Meriendas
        const snackItem = document.createElement('div');
        snackItem.className = 'summary-item';
        snackItem.innerHTML = `
            <h4>Meriendas</h4>
            <p id="total-snack">$0.00</p>
            <p id="snack-count">0 meriendas</p>
        `;
        summaryGrid.appendChild(snackItem);
        
        // Extras
        const extraItem = document.createElement('div');
        extraItem.className = 'summary-item';
        extraItem.innerHTML = `
            <h4>Gastos extras</h4>
            <p id="total-extra">$0.00</p>
            <p id="extra-count">0 extras</p>
        `;
        summaryGrid.appendChild(extraItem);
        
        summary.appendChild(summaryGrid);
        this.elements.dayControls.appendChild(summary);
        
        // Tarjeta de pago
        const paymentCard = document.createElement('div');
        paymentCard.className = 'payment-card';
        paymentCard.innerHTML = `
            <h3>💳 Total a pagar este mes</h3>
            <div class="payment-amount" id="total-month">$0.00</div>
            <p>Incluye todos los consumos registrados más gastos adicionales</p>
        `;
        this.elements.dayControls.appendChild(paymentCard);
        
        // Botones de acción
        const actionButtons = document.createElement('div');
        actionButtons.className = 'action-buttons';
        
        this.elements.exportBtn.className = 'btn btn-primary';
        this.elements.printBtn.className = 'btn btn-outline';
        this.elements.clearMonthBtn.className = 'btn btn-danger';
        
        actionButtons.appendChild(this.elements.exportBtn);
        actionButtons.appendChild(this.elements.printBtn);
        actionButtons.appendChild(this.elements.clearMonthBtn);
        this.elements.dayControls.appendChild(actionButtons);
        
        // Actualizar la tabla
        this.updateTable();
    }

    updateTable() {
        const monthData = this.db.getMonthData(this.currentYear, this.currentMonth);
        if (!monthData) return;
        
        // Limpiar tabla
        this.elements.tableBody.innerHTML = '';
        
        // Resetear totales
        monthData.totals = {
            breakfast: 0,
            lunch: 0,
            snack: 0,
            extra: 0,
            breakfastCount: 0,
            lunchCount: 0,
            snackCount: 0,
            extraCount: 0
        };
        
        // Agregar filas para cada día
        for (const [day, data] of Object.entries(monthData.days)) {
            const date = new Date(this.currentYear, this.currentMonth, parseInt(day));
            const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
            
            // Calcular total del día
            let dayTotal = 0;
            if (data.breakfast) {
                dayTotal += this.db.PRICES.breakfast;
                monthData.totals.breakfast += this.db.PRICES.breakfast;
                monthData.totals.breakfastCount++;
            }
            if (data.lunch) {
                dayTotal += this.db.PRICES.lunch;
                monthData.totals.lunch += this.db.PRICES.lunch;
                monthData.totals.lunchCount++;
            }
            if (data.snack) {
                dayTotal += this.db.PRICES.snack;
                monthData.totals.snack += this.db.PRICES.snack;
                monthData.totals.snackCount++;
            }
            
            // Sumar extras
            let extrasTotal = 0;
            let extrasText = '';
            if (data.extras && data.extras.length > 0) {
                extrasTotal = data.extras.reduce((sum, extra) => sum + extra.amount, 0);
                extrasText = data.extras.map(extra => `${extra.description}: ${this.formatMoney(extra.amount)}`).join(', ');
                monthData.totals.extra += extrasTotal;
                monthData.totals.extraCount += data.extras.length;
            }
            
            dayTotal += extrasTotal;
            
            // Crear fila
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${day}</td>
                <td>${data.breakfast ? this.formatMoney(this.db.PRICES.breakfast) : '-'}</td>
                <td>${data.lunch ? this.formatMoney(this.db.PRICES.lunch) : '-'}</td>
                <td>${data.snack ? this.formatMoney(this.db.PRICES.snack) : '-'}</td>
                <td>${extrasText || '-'}</td>
                <td><strong>${this.formatMoney(dayTotal)}</strong></td>
            `;
            this.elements.tableBody.appendChild(row);
        }
        
        // Actualizar resumen
        const monthlyTotal = monthData.totals.breakfast + monthData.totals.lunch + 
                            monthData.totals.snack + monthData.totals.extra;
        
        this.elements.totalBreakfast.textContent = this.formatMoney(monthData.totals.breakfast);
        this.elements.totalLunch.textContent = this.formatMoney(monthData.totals.lunch);
        this.elements.totalSnack.textContent = this.formatMoney(monthData.totals.snack);
        this.elements.totalExtra.textContent = this.formatMoney(monthData.totals.extra);
        this.elements.totalMonth.textContent = this.formatMoney(monthlyTotal);
        
        this.elements.breakfastCount.textContent = `${monthData.totals.breakfastCount} desayuno${monthData.totals.breakfastCount !== 1 ? 's' : ''}`;
        this.elements.lunchCount.textContent = `${monthData.totals.lunchCount} almuerzo${monthData.totals.lunchCount !== 1 ? 's' : ''}`;
        this.elements.snackCount.textContent = `${monthData.totals.snackCount} merienda${monthData.totals.snackCount !== 1 ? 's' : ''}`;
        this.elements.extraCount.textContent = `${monthData.totals.extraCount} extra${monthData.totals.extraCount !== 1 ? 's' : ''}`;
        
        // Actualizar estado de los botones para el día seleccionado
        this.updateButtonStates();
        
        // Guardar los datos
        this.db.saveData();
    }

    updateButtonStates() {
        const day = parseInt(this.elements.daySelect.value);
        const monthData = this.db.getMonthData(this.currentYear, this.currentMonth);
        if (!monthData || !monthData.days[day]) return;
        
        const dayData = monthData.days[day];
        
        // Actualizar clases de los botones
        this.elements.breakfastBtn.className = dayData.breakfast ? 'btn btn-success active' : 'btn btn-success';
        this.elements.lunchBtn.className = dayData.lunch ? 'btn btn-danger active' : 'btn btn-danger';
        this.elements.snackBtn.className = dayData.snack ? 'btn btn-success active' : 'btn btn-success';
        
        // Actualizar íconos
        const breakfastIcon = dayData.breakfast ? '✅' : '☕';
        const lunchIcon = dayData.lunch ? '✅' : '🍲';
        const snackIcon = dayData.snack ? '✅' : '🍎';
        
        this.elements.breakfastBtn.innerHTML = `<span class="icon">${breakfastIcon}</span> Desayuno (${this.formatMoney(this.db.PRICES.breakfast)})`;
        this.elements.lunchBtn.innerHTML = `<span class="icon">${lunchIcon}</span> Almuerzo (${this.formatMoney(this.db.PRICES.lunch)})`;
        this.elements.snackBtn.innerHTML = `<span class="icon">${snackIcon}</span> Merienda (${this.formatMoney(this.db.PRICES.snack)})`;
    }

    toggleMeal(mealType) {
        const day = parseInt(this.elements.daySelect.value);
        if (this.db.toggleMeal(this.currentYear, this.currentMonth, day, mealType)) {
            this.updateTable();
        }
    }

    addExtra() {
        const day = parseInt(this.elements.daySelect.value);
        const amount = parseFloat(this.elements.extraAmount.value);
        const description = this.elements.extraDescription.value.trim();
        
        if (isNaN(amount) {
            alert('Por favor ingrese un monto válido');
            return;
        }
        
        if (amount <= 0) {
            alert('El monto debe ser mayor a cero');
            return;
        }
        
        if (!description) {
            alert('Por favor ingrese una descripción');
            return;
        }
        
        if (this.db.addExtra(this.currentYear, this.currentMonth, day, amount, description)) {
            // Limpiar campos
            this.elements.extraAmount.value = '';
            this.elements.extraDescription.value = '';
            
            this.updateTable();
        } else {
            alert('Error al agregar el gasto adicional');
        }
    }

    clearCurrentMonth() {
        if (confirm('¿Estás seguro que quieres borrar todos los datos de este mes? Esta acción no se puede deshacer.')) {
            if (this.db.clearMonth(this.currentYear, this.currentMonth)) {
                this.updateTable();
            }
        }
    }

    exportData() {
        const csvContent = this.db.generateCSV(this.currentYear, this.currentMonth);
        if (!csvContent) {
            alert('No hay datos para exportar');
            return;
        }
        
        // Descargar archivo
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `consumo_${this.elements.monthSelect.options[this.currentMonth].text}_${this.currentYear}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    formatMoney(amount) {
        return '$' + amount.toFixed(2);
    }
}

// Iniciar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const app = new MiRanchoApp();
});