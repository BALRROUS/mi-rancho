/**
 * Utilidades para la aplicación Mi Rancho - Control de Consumo
 * Funciones genéricas y de ayuda para toda la aplicación
 */

class AppUtils {
  constructor() {
    // Puedes inicializar configuraciones aquí si es necesario
  }

  /**
   * Formatea un número como dinero
   * @param {number} amount - Cantidad a formatear
   * @param {string} [currency='$'] - Símbolo de moneda
   * @returns {string} Cantidad formateada
   */
  static formatMoney(amount, currency = '$') {
    return `${currency}${parseFloat(amount).toFixed(2)}`;
  }

  /**
   * Obtiene el nombre del mes en español
   * @param {number} monthIndex - Índice del mes (0-11)
   * @returns {string} Nombre del mes
   */
  static getMonthName(monthIndex) {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[monthIndex];
  }

  /**
   * Obtiene el número de días en un mes específico
   * @param {number} year - 