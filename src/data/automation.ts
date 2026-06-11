export interface PainPoint {
  number: string;
  title: string;
  description: string;
  icon: string;
}

export interface Capability {
  tag: string;
  title: string;
  description: string;
  icon: string;
}

export interface UseCase {
  title: string;
  description: string;
  icon: string;
}

export interface ProcessStep {
  number: string;
  title: string;
  description: string;
  icon: string;
}

export interface Result {
  title: string;
  before: string;
  after: string;
  compact?: boolean;
  icon: string;
}

export const painPoints: PainPoint[] = [
  {
    number: '01',
    title: 'Horas en data entry',
    description: 'Mover datos entre CRM, hojas de cálculo y correos. Una y otra vez, todos los días.',
    icon: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
  },
  {
    number: '02',
    title: 'Procesos que dependen de alguien',
    description: 'Si esa persona falta, el proceso se detiene. Un solo punto de falla en tu operación.',
    icon: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  },
  {
    number: '03',
    title: 'Errores humanos repetitivos',
    description: 'Copiar mal un número, olvidar un paso, enviar el archivo equivocado. Errores que cuestan dinero.',
    icon: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
  },
  {
    number: '04',
    title: 'Escala imposible',
    description: 'Más clientes = más trabajo manual = más contrataciones. Un ciclo que no termina.',
    icon: '<path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/>',
  },
];

export const capabilities: Capability[] = [
  {
    tag: 'Captura',
    title: 'Captura y procesa',
    description: 'Extrae datos de correos, PDFs, formularios y cualquier fuente automáticamente. Sin copiar y pegar.',
    icon: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  },
  {
    tag: 'Decide',
    title: 'Decide y ejecuta',
    description: 'Toma decisiones basadas en reglas y contexto de tu negocio. Ejecuta acciones sin esperar aprobación manual.',
    icon: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  },
  {
    tag: 'Conecta',
    title: 'Conecta y escala',
    description: 'Se integra con tus herramientas existentes — CRM, ERP, correo, hojas de cálculo — y crece contigo.',
    icon: '<path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>',
  },
];

export const useCases: UseCase[] = [
  {
    title: 'Soporte al cliente',
    description: 'Respuestas instantáneas 24/7 que entienden contexto, resuelven dudas y escalan solo cuando es necesario.',
    icon: '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>',
  },
  {
    title: 'Calificación de leads',
    description: 'Solo habla con quien va a comprar. El agente califica, prioriza y enruta automáticamente.',
    icon: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
  },
  {
    title: 'Data entry y documentos',
    description: 'Cero horas copiando datos. El agente extrae, valida y distribuye información entre tus sistemas.',
    icon: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  },
  {
    title: 'Reportes automáticos',
    description: 'De 8 horas a 15 minutos. Genera reportes consolidados desde múltiples fuentes sin tocar una hoja de cálculo.',
    icon: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
  },
  {
    title: 'Workflows internos',
    description: 'Tus herramientas, conectadas. Automatiza aprobaciones, notificaciones y flujos entre departamentos.',
    icon: '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>',
  },
  {
    title: 'Inventario y alertas',
    description: 'Anticípate a los problemas. Monitorea niveles, detecta anomalías y actúa antes de que sea tarde.',
    icon: '<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>',
  },
];

export const processSteps: ProcessStep[] = [
  {
    number: '01',
    title: 'Diagnóstico',
    description: 'Mapeo tus flujos actuales e identifico las oportunidades de automatización con mayor impacto en tu operación.',
    icon: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  },
  {
    number: '02',
    title: 'Diseño',
    description: 'Arquitectamos el agente, sus guardrails y puntos de integración. Definimos qué puede y qué no puede hacer.',
    icon: '<path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>',
  },
  {
    number: '03',
    title: 'Construcción',
    description: 'Construyo, pruebo y refino hasta que funcione impecablemente en tu entorno real.',
    icon: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  },
  {
    number: '04',
    title: 'Operación',
    description: 'Monitoreamos, optimizamos y evolucionamos el agente contigo. No te dejamos solo después del lanzamiento.',
    icon: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
  },
];

export const results: Result[] = [
  {
    title: 'Tiempo de respuesta',
    before: '4 horas',
    after: '12 seg',
    icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  },
  {
    title: 'Data entry semanal',
    before: '20 hrs',
    after: '0 hrs',
    icon: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
  },
  {
    title: 'Calificación de leads',
    before: 'Manual, al día siguiente',
    after: 'Instantánea, 24/7',
    compact: true,
    icon: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  },
  {
    title: 'Generación de reportes',
    before: '1 día',
    after: '15 min',
    icon: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="8" y2="18"/><line x1="12" y1="11" x2="12" y2="18"/><line x1="16" y1="15" x2="16" y2="18"/>',
  },
];
