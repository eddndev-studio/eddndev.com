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
    tagline: 'Menos trabajo manual, más operación resuelta',
    description:
      'Automatizo tareas repetitivas y flujos operativos con agentes, integraciones y reglas que monitorean, responden y ejecutan por ti. Ideal cuando el equipo pierde tiempo copiando datos, persiguiendo pendientes o conectando herramientas a mano.',
    highlights: [
      'Automatización de tareas y seguimientos repetitivos',
      'Agentes con IA para clasificar, responder y ejecutar',
      'Integraciones entre CRM, formularios, correo y operaciones',
      'Te enteras de todo: alertas y reportes en tiempo real',
    ],
    color: 'blue',
  },
  {
    id: 'sitios-web',
    number: '02',
    title: 'Sitios web',
    tagline: 'Sitios que se ven premium y convierten visitas en clientes',
    description:
      'Diseño y desarrollo sitios que explican mejor tu valor, cargan rápido y reducen fricción en la decisión del usuario. Cada interacción responde a la identidad y objetivos de tu marca.',
    highlights: [
      'Diseño alineado a tu marca, no a una plantilla',
      'Aparece en Google y abre al instante',
      'Experiencias inmersivas sin sacrificar velocidad',
      'Estructura pensada para captar leads o ventas',
    ],
    color: 'green',
  },
  {
    id: 'e-commerce',
    number: '03',
    title: 'E-commerce',
    tagline: 'Tu tienda, tus reglas: vende sin pagar comisiones',
    description:
      'E-commerce a medida con control total sobre catálogo, contenido y márgenes. Integro pagos, inventario, logística y operación con una experiencia coherente con tu marca.',
    highlights: [
      'Checkout y catálogo optimizados para conversión',
      'Backoffice y CMS adaptados a tu operación',
      'Pagos, inventario y logística integrados',
      'Sin comisiones por venta ni restricciones de plataforma',
    ],
    color: 'orange',
  },
  {
    id: 'software-a-medida',
    number: '04',
    title: 'Software a medida',
    tagline: 'Sistemas diseñados alrededor de tu operación',
    description:
      'Desarrollo paneles, plataformas internas, herramientas de gestión y software propietario para negocios cuya lógica ya no cabe en soluciones genéricas. El sistema se adapta a tu proceso, no al revés.',
    highlights: [
      'Paneles internos y herramientas de gestión',
      'Conexiones y automatizaciones entre tus herramientas',
      'Integración con tu stack actual',
      'Hecho para durar años, no meses',
    ],
    color: 'purple',
  }
];
