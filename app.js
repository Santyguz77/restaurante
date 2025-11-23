// Configuración de la API
const API_URL = 'https://merchants-gossip-regarded-actor.trycloudflare.com/api'; // Cambiar por tu VPS en producción

// Estado global de la aplicación
const AppState = {
	menuItems: [],
	tables: [],
	orders: [],
	transactions: [],
	waiters: [],
	config: {},
	cashClosures: [],
	isOnline: navigator.onLine
};

// Utilidades para LocalStorage
const Storage = {
	get(key) {
		const data = localStorage.getItem(key);
		return data ? JSON.parse(data) : null;
	},
	set(key, value) {
		localStorage.setItem(key, JSON.stringify(value));
	},
	remove(key) {
		localStorage.removeItem(key);
	}
};

// Cliente API
const API = {
	async getAll(table) {
		try {
			const response = await fetch(`${API_URL}/${table}`);
			if (!response.ok) throw new Error('Error al obtener datos');
			const data = await response.json();
			Storage.set(table, data);
			return data;
		} catch (error) {
			console.error(`Error obteniendo ${table}:`, error);
			return Storage.get(table) || [];
		}
	},
	
	async save(table, items) {
		try {
			const response = await fetch(`${API_URL}/${table}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(items)
			});
			if (!response.ok) throw new Error('Error al guardar');
			Storage.set(table, items);
			return await response.json();
		} catch (error) {
			console.error(`Error guardando ${table}:`, error);
			Storage.set(table, items);
			return { success: false, error: error.message };
		}
	},
	
	async update(table, id, item) {
		try {
			const response = await fetch(`${API_URL}/${table}/${id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(item)
			});
			if (!response.ok) throw new Error('Error al actualizar');
			return await response.json();
		} catch (error) {
			console.error(`Error actualizando ${table}/${id}:`, error);
			return { success: false, error: error.message };
		}
	},
	
	async delete(table, id) {
		try {
			const response = await fetch(`${API_URL}/${table}/${id}`, {
				method: 'DELETE'
			});
			if (!response.ok) throw new Error('Error al eliminar');
			return await response.json();
		} catch (error) {
			console.error(`Error eliminando ${table}/${id}:`, error);
			return { success: false, error: error.message };
		}
	}
};

// Utilidades generales
const Utils = {
	generateId() {
		return Date.now().toString(36) + Math.random().toString(36).substr(2);
	},
	
	formatCurrency(amount) {
		return new Intl.NumberFormat('es-MX', {
			style: 'currency',
			currency: 'MXN'
		}).format(amount);
	},
	
	formatDate(date) {
		return new Intl.DateTimeFormat('es-MX', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(date));
	},
	
	showNotification(message, type = 'info') {
		// Implementar notificaciones toast si se desea
		console.log(`[${type.toUpperCase()}] ${message}`);
		alert(message);
	}
};

// Registro del Service Worker
if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('/service-worker.js')
			.then(reg => console.log('✅ Service Worker registrado'))
			.catch(err => console.error('❌ Error en Service Worker:', err));
	});
}

// Detectar cambios en la conexión
window.addEventListener('online', () => {
	AppState.isOnline = true;
	Utils.showNotification('Conexión restaurada', 'success');
});

window.addEventListener('offline', () => {
	AppState.isOnline = false;
	Utils.showNotification('Sin conexión - Modo offline', 'warning');
});

// Cargar datos iniciales
async function loadInitialData() {
	AppState.menuItems = await API.getAll('menu_items');
	AppState.tables = await API.getAll('tables');
	AppState.orders = await API.getAll('orders');
	AppState.transactions = await API.getAll('transactions');
	AppState.waiters = await API.getAll('waiters');
	AppState.cashClosures = await API.getAll('cash_closures');
	const configArray = await API.getAll('config');
	AppState.config = configArray.length > 0 ? configArray[0] : {};
}

// Inicializar datos de ejemplo si no existen
async function initializeDefaultData() {
	if (AppState.menuItems.length === 0) {
		AppState.menuItems = [
			{
				id: Utils.generateId(),
				name: 'Hamburguesa Clásica',
				description: 'Carne de res, lechuga, tomate, queso',
				price: 120,
				category: 'Hamburguesas',
				available: true
			},
			{
				id: Utils.generateId(),
				name: 'Pizza Margarita',
				description: 'Tomate, mozzarella, albahaca',
				price: 150,
				category: 'Pizzas',
				available: true
			},
			{
				id: Utils.generateId(),
				name: 'Ensalada César',
				description: 'Lechuga romana, pollo, crutones, parmesano',
				price: 95,
				category: 'Ensaladas',
				available: true
			}
		];
		await API.save('menu_items', AppState.menuItems);
	}
	
	if (AppState.tables.length === 0) {
		AppState.tables = [];
		for (let i = 1; i <= 10; i++) {
			AppState.tables.push({
				id: Utils.generateId(),
				number: i,
				capacity: 4,
				status: 'available', // available, occupied, reserved
				currentOrder: null
			});
		}
		await API.save('tables', AppState.tables);
	}
	
	if (AppState.waiters.length === 0) {
		AppState.waiters = [
			{
				id: Utils.generateId(),
				name: 'Juan Pérez',
				active: true
			},
			{
				id: Utils.generateId(),
				name: 'María García',
				active: true
			}
		];
		await API.save('waiters', AppState.waiters);
	}
}

// Cargar cierres de caja
async function loadCashClosures() {
	return await API.getAll('cash_closures');
}

// Exportar para uso global
window.AppState = AppState;
window.API = API;
window.Utils = Utils;
window.Storage = Storage;
window.loadInitialData = loadInitialData;
window.initializeDefaultData = initializeDefaultData;
window.loadCashClosures = loadCashClosures;
