// O build injeta o contato comercial a partir da configuração central.
const whatsappUrl = document.documentElement.dataset.whatsapp;
export const wa = (message) => `${whatsappUrl}?text=${encodeURIComponent(message)}`;
