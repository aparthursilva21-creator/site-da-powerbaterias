// APENAS SIMULAÇÃO VISUAL — dados inventariados abaixo são exemplos para TESTE, não um catálogo técnico da loja.
// Medidas em metros: L = comprimento, W = largura, H = altura.
// Veículo: trayL/trayW = espaço útil do cofre (suporte da bateria), maxH = altura livre sob o capô,
// recommendedAh = faixa de capacidade recomendada.

export const BATTERIES = [
  { id: 'b40',  name: 'Exemplo 40 Ah',  ah: 40,  cca: 300, L: 0.207, W: 0.175, H: 0.175 },
  { id: 'b50',  name: 'Exemplo 50 Ah',  ah: 50,  cca: 380, L: 0.242, W: 0.175, H: 0.175 },
  { id: 'b60',  name: 'Exemplo 60 Ah',  ah: 60,  cca: 450, L: 0.242, W: 0.175, H: 0.190 },
  { id: 'b70',  name: 'Exemplo 70 Ah',  ah: 70,  cca: 520, L: 0.278, W: 0.175, H: 0.190 },
  { id: 'b90',  name: 'Exemplo 90 Ah',  ah: 90,  cca: 650, L: 0.306, W: 0.175, H: 0.190 },
  { id: 'b100', name: 'Exemplo 100 Ah', ah: 100, cca: 760, L: 0.353, W: 0.175, H: 0.190 },
  { id: 'b150', name: 'Exemplo 150 Ah', ah: 150, cca: 900, L: 0.508, W: 0.222, H: 0.220 },
];

const bay = (trayL, trayW, maxH, rec) => ({ trayL, trayW, maxH, recommendedAh: rec });

// Veículos para simulação. Ano e motorização não conferidos com catálogo técnico.
export const VEHICLES = {
  Chevrolet: {
    Celta:  { years: '2000–2015', engines: ['1.0 VHC', '1.0 Flex'], bay: bay(0.250, 0.180, 0.195, [50, 60]) },
    Onix:   { years: '2012–2024', engines: ['1.0', '1.4 Flex'],      bay: bay(0.250, 0.180, 0.195, [50, 60]) },
    Prisma: { years: '2006–2019', engines: ['1.0', '1.4 Flex'],      bay: bay(0.250, 0.180, 0.195, [50, 60]) },
  },
  Fiat: {
    Uno:   { years: '2010–2021', engines: ['1.0 Fire', '1.4 Evo'],  bay: bay(0.250, 0.180, 0.195, [50, 60]) },
    Palio: { years: '2000–2017', engines: ['1.0 Fire', '1.4', '1.6'], bay: bay(0.250, 0.180, 0.195, [50, 60]) },
    Strada:{ years: '2000–2024', engines: ['1.4 Fire', '1.3 Firefly'], bay: bay(0.282, 0.180, 0.195, [60, 70]) },
  },
  Volkswagen: {
    Gol:  { years: '2000–2023', engines: ['1.0', '1.6'],           bay: bay(0.250, 0.180, 0.195, [50, 60]) },
    Polo: { years: '2018–2024', engines: ['1.0 TSI', '1.6 MSI'],   bay: bay(0.282, 0.180, 0.195, [60, 70]) },
  },
  Ford: {
    Ka: { years: '2008–2021', engines: ['1.0', '1.5'],             bay: bay(0.250, 0.180, 0.195, [50, 60]) },
  },
  Hyundai: {
    HB20: { years: '2012–2024', engines: ['1.0', '1.6'],           bay: bay(0.250, 0.180, 0.195, [50, 60]) },
  },
  Toyota: {
    Corolla: { years: '2009–2024', engines: ['1.8', '2.0'],        bay: bay(0.282, 0.180, 0.195, [60, 70]) },
  },
  Honda: {
    Civic: { years: '2007–2016', engines: ['1.8', '2.0'],          bay: bay(0.312, 0.180, 0.195, [60, 90]) },
  },
};