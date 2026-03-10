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
      'Automatizamos tareas repetitivas y flujos operativos con agentes, integraciones y reglas que monitorean, responden y ejecutan por ti. Ideal cuando el equipo pierde tiempo copiando datos, persiguiendo pendientes o conectando herramientas a mano.',
    highlights: [
      'Automatización de tareas y seguimientos repetitivos',
      'Agentes con IA para clasificar, responder y ejecutar',
      'Integraciones entre CRM, formularios, correo y operaciones',
      'Monitoreo, alertas y trazabilidad en tiempo real',
    ],
    color: 'blue',
  },
  {
    id: 'sitios-web',
    number: '02',
    title: 'Sitios web',
    tagline: 'Sitios rápidos, distintivos y orientados a conversión',
    description:
      'Diseñamos y desarrollamos sitios que explican mejor tu valor, cargan rápido y reducen fricción en la decisión del usuario. Cada interacción responde a la identidad y objetivos de tu marca.',
    highlights: [
      'Arquitectura visual alineada a tu marca',
      'Performance y SEO técnico desde la base',
      'Experiencias inmersivas sin sacrificar velocidad',
      'Estructura pensada para captar leads o ventas',
    ],
    color: 'green',
  },
  {
    id: 'e-commerce',
    number: '03',
    title: 'E-commerce',
    tagline: 'Tiendas online con identidad, rendimiento y control',
    description:
      'E-commerce a medida con control total sobre catálogo, contenido y márgenes. Integramos pagos, inventario, logística y operación con una experiencia coherente con tu marca.',
    highlights: [
      'Checkout y catálogo optimizados para conversión',
      'Backoffice y CMS adaptados a tu operación',
      'Pagos, inventario y logística integrados',
      'Menos dependencia de fees y restricciones externas',
    ],
    color: 'orange',
  },
  {
    id: 'software-a-medida',
    number: '04',
    title: 'Software a medida',
    tagline: 'Sistemas diseñados alrededor de tu operación',
    description:
      'Desarrollamos paneles, plataformas internas, herramientas de gestión y software propietario para negocios cuya lógica ya no cabe en soluciones genéricas. El sistema se adapta a tu proceso, no al revés.',
    highlights: [
      'Paneles internos y herramientas de gestión',
      'APIs, automatizaciones y servicios propios',
      'Integración con tu stack actual',
      'Arquitectura escalable y mantenible',
    ],
    color: 'purple',
  }
];
