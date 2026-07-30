export interface Service {
  id: string;
  number: string;
  title: string;
  tagline: string;
  description: string;
  highlights: string[];
  color: 'purple' | 'green' | 'orange' | 'blue';
}

export const services: Service[] = [
  {
    id: 'agentes-de-automatizacion',
    number: '01',
    title: 'Automatización con IA',
    tagline: 'Procesos repetibles con control y trazabilidad',
    description:
      'Construyo agentes, integraciones y reglas para clasificar información, preparar trabajo y ejecutar acciones dentro de permisos definidos. Los pasos sensibles pueden quedar sujetos a revisión humana.',
    highlights: [
      'Tareas y seguimientos repetitivos',
      'Agentes que clasifican, preparan y ejecutan',
      'Integraciones con correo, formularios, CRM y sistemas internos',
      'Bitácoras, alertas y puntos de aprobación',
    ],
    color: 'blue',
  },
  {
    id: 'sitios-web',
    number: '02',
    title: 'Sitios web',
    tagline: 'Una presencia clara que permite medir interés real',
    description:
      'Diseño y desarrollo sitios que explican una oferta, cargan rápido y registran las acciones importantes. El alcance puede incluir formularios, analítica y un panel privado para seguimiento.',
    highlights: [
      'Arquitectura de información y diseño propio',
      'Rendimiento, accesibilidad y preparación para buscadores',
      'Medición de fuentes, clics y solicitudes',
      'Panel de seguimiento cuando el proyecto lo necesita',
    ],
    color: 'green',
  },
  {
    id: 'e-commerce',
    number: '03',
    title: 'Catálogos y comercio',
    tagline: 'Productos, reservas y compras con una operación definida',
    description:
      'Construyo catálogos, solicitudes de reserva y flujos de compra. Los pagos se integran con un proveedor existente y sus comisiones, condiciones y disponibilidad se presentan desde el alcance.',
    highlights: [
      'Catálogo, filtros y fichas de producto o servicio',
      'Panel para contenido, pedidos o solicitudes',
      'Integración con una pasarela de pago acordada',
      'Reglas de inventario, entrega o reservación según alcance',
    ],
    color: 'orange',
  },
  {
    id: 'software-a-medida',
    number: '04',
    title: 'Software a medida',
    tagline: 'Herramientas que reflejan cómo trabaja tu organización',
    description:
      'Desarrollo backends, aplicaciones móviles, paneles y herramientas internas para procesos que requieren cuentas, permisos, información estructurada e integraciones.',
    highlights: [
      'Paneles internos y herramientas de gestión',
      'Conexiones y automatizaciones entre tus herramientas',
      'Integración con tu stack actual',
      'Pruebas, despliegue, monitoreo y documentación',
    ],
    color: 'purple',
  }
];
