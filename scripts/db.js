class FoodConsumptionDB {
    constructor() {
        this.PRICES = {
            breakfast: 1.60,
            lunch: 3.16,
            snack: 1.60
        };
        this.currentData = {};
        this.loadSavedData();
    }

    loadSavedData() {
        const savedData = localStorage.getItem('foodConsumptionData');
        if (savedData) {
            try {
                this.currentData = JSON.parse(savedData);
            } catch (e) {
                console.error('Error parsing saved data', e);
                this.currentData = {};
            }
        }
    }

    saveData() {
        localStorage.setItem('foodConsumptionData', JSON.stringify(this.currentData));
    }

    initializeMonth(year, month) {
        const monthKey = `${year}-${month}`;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        if (!this.currentData[monthKey]) {
            this.currentData[monthKey] = {
                days: {},
                totals: {
                    breakfast: 0,
                    lunch: 0,
                    snack: 0,
                    extra: 0,
                    breakfastCount: 0,
                    lunchCount: 0,
                    snackCount: 0,
                    extraCount: 0
                }
            };
            
            for (let i = 1; i <= daysInMonth; i++) {
                this.currentData[monthKey].days[i] = {
                    breakfast: false,
                    lunch: false,
                    snack: false,
                    extras: []
                };
            }
            
            this.saveData();
        }
        
        return this.currentData[monthKey];
    }

    toggleMeal(year, month, day, mealType) {
        const monthKey = `${year}-${month}`;
        if (this.currentData[monthKey] && this.currentData[monthKey].days[day]) {
            this.currentData[monthKey].days[day][mealType] = !this.currentData[monthKey].days[day][mealType];
            this.saveData();
            return true;
        }
        return false;
    }

    addExtra(year, month, day, amount, description) {
        const monthKey = `${year}-${month}`;
        if (this.currentData[monthKey] && this.currentData[monthKey].days[day]) {
            this.currentData[monthKey].days[day].extras.push({
                amount: parseFloat(amount),
                description: description.trim()
            });
            this.saveData();
            return true;
        }
        return false;
    }

    clearMonth(year, month) {
        const monthKey = `${year}-${month}`;
        if (this.currentData[monthKey]) {
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            
            this.currentData[monthKey] = {
                days: {},
                totals: {
                    breakfast: 0,
                    lunch: 0,
                    snack: 0,
                    extra: 0,
                    breakfastCount: 0,
                    lunchCount: 0,
                    snackCount: 0,
                    extraCount: 0
                }
            };
            
            for (let i = 1; i <= daysInMonth; i++) {
                this.currentData[monthKey].days[i] = {
                    breakfast: false,
                    lunch: false,
                    snack: false,
                    extras: []
                };
            }
            
            this.saveData();
            return true;
        }
        return false;
    }

    getMonthData(year, month) {
        const monthKey = `${year}-${month}`;
        return this.currentData[monthKey] || null;
    }

    generateCSV(year, month) {
        const monthData = this.getMonthData(year, month);
        if (!monthData) return null;
        
        let csvContent = "Fecha,Desayuno,Almuerzo,Merienda,Extras,Total del día\n";
        
        for (const [day, data] of Object.entries(monthData.days)) {
            const date = new Date(year, month, parseInt(day));
            const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
            
            let dayTotal = 0;
            let breakfastText = data.breakfast ? this.PRICES.breakfast.toFixed(2) : '';
            let lunchText = data.lunch ? this.PRICES.lunch.toFixed(2) : '';
            let snackText = data.snack ? this.PRICES.snack.toFixed(2) : '';
            
            if (data.breakfast) dayTotal += this.PRICES.breakfast;
            if (data.lunch) dayTotal += this.PRICES.lunch;
            if (data.snack) dayTotal += this.PRICES.snack;
            
            let extrasText = '';
            if (data.extras && data.extras.length > 0) {
                const extrasTotal = data.extras.reduce((sum, extra) => sum + extra.amount, 0);
                extrasText = data.extras.map(extra => `${extra.description}: $${extra.amount.toFixed(2)}`).join('; ');
                dayTotal += extrasTotal;
            }
            
            csvContent += `"${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${day}",${breakfastText},${lunchText},${snackText},"${extrasText}",${dayTotal.toFixed(2)}\n`;
        }
        
        const monthlyTotal = monthData.totals.breakfast + monthData.totals.lunch + 
                           monthData.totals.snack + monthData.totals.extra;
        csvContent += `\nResumen Mensual\n`;
        csvContent += `Total Desayunos,$${monthData.totals.breakfast.toFixed(2)}\n`;
        csvContent += `Total Almuerzos,$${monthData.totals.lunch.toFixed(2)}\n`;
        csvContent += `Total Meriendas,$${monthData.totals.snack.toFixed(2)}\n`;
        csvContent += `Total Extras,$${monthData.totals.extra.toFixed(2)}\n`;
        csvContent += `Total Mensual,$${monthlyTotal.toFixed(2)}\n`;
        
        return csvContent;
    }
}

// Exportar una instancia única de la base de datos
const foodDB = new FoodConsumptionDB();