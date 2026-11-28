const address = 'QN 412, conjunto C, lotes 1 e 2, loja 8, Samambaia Norte, Brasília – DF';
const mapsQuery = encodeURIComponent(`Power Baterias, ${address}`);
const technicalVisitReference = process.env.POWER_TECHNICAL_VISIT_REFERENCE_BRL?.trim();
const services = [
  { id: 'baterias', title: 'Venda de baterias', description: 'Encontre opções Heliar e Moura para veículos nacionais e importados.' },
  { id: 'instalacao', title: 'Instalação de baterias', description: 'Conte com a equipe para confirmar a aplicação e substituir a bateria.' },
  { id: 'testes', title: 'Teste de bateria', description: 'Avalie a condição da bateria antes de decidir pela troca.' },
  { id: 'emergencial', title: 'Atendimento emergencial', description: 'Informe os sintomas e o local para consultar as opções de atendimento.' },
  { id: 'start-stop', title: 'Baterias Start-Stop', description: 'Consulte a tecnologia e a aplicação prescritas para o veículo.' },
  { id: 'lampadas', title: 'Troca de lâmpadas', description: 'Consulte a substituição de lâmpadas conforme o modelo do veículo.' },
  { id: 'palhetas', title: 'Troca de palhetas', description: 'Verifique a aplicação correta para recuperar a visibilidade na chuva.' },
  { id: 'oleo', title: 'Troca de óleo e filtro', description: 'Confirme o serviço e os insumos indicados para o seu veículo.' }
];

export const site = {
  name: 'Power Baterias',
  address,
  streetAddress: 'QN 412, conjunto C, lotes 1 e 2, loja 8, Samambaia Norte',
  postalCode: '72320-540',
  phone: '(61) 99519-1090',
  phoneE164: '+5561995191090',
  whatsappUrl: 'https://wa.me/5561995191090',
  instagram: '@poweer_baterias',
  instagramUrl: 'https://www.instagram.com/poweer_baterias/',
  mapsUrl: `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`,
  directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`,
  mapsEmbedUrl: `https://maps.google.com/maps?q=${mapsQuery}&output=embed`,
  googleBusinessUrl: null,
  verifiedRating: null,
  technicalVisit: {
    referenceBrl: technicalVisitReference ? Number(technicalVisitReference) : null,
    confirmed: false
  },
  canonicalOrigin: 'https://aparthursilva21-creator.github.io/site-da-powerbaterias/',
  brands: ['Heliar', 'Moura'],
  services,
  // Registre arquivos locais autorizados antes de habilitar o vídeo.
  heroVideo: { webm: null, mp4: null, mobileWebm: null, mobileMp4: null }
};
