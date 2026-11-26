// DADOS FICTÍCIOS DE DEMONSTRAÇÃO. Medidas em metros. Não usar para recomendar bateria real.
export const BATTERIES = [
  { id: 'b40',  ah: 40,  L: 0.207, W: 0.175, H: 0.175 },
  { id: 'b50',  ah: 50,  L: 0.242, W: 0.175, H: 0.175 },
  { id: 'b60',  ah: 60,  L: 0.242, W: 0.175, H: 0.190 },
  { id: 'b70',  ah: 70,  L: 0.278, W: 0.175, H: 0.190 },
  { id: 'b90',  ah: 90,  L: 0.306, W: 0.175, H: 0.190 },
  { id: 'b100', ah: 100, L: 0.353, W: 0.175, H: 0.190 },
  { id: 'b150', ah: 150, L: 0.513, W: 0.189, H: 0.223, label: 'Bateria de caminhão' },
].map((b) => ({ brand: 'Moura', ...b }));
const bay = (trayL, trayW, maxH, lo, hi) => ({ trayL, trayW, maxH, recommendedAh: [lo, hi] });
export const VEHICLES = {
  Chevrolet: { Celta: { years: '2000–2015', engines: ['1.0 Flex', '1.4 Flex', '1.0 VHC'], bay: bay(0.26, 0.19, 0.20, 60, 60) },
               Onix:  { years: '2012–2024', engines: ['1.0 Flex', '1.4 Flex'], bay: bay(0.28, 0.19, 0.20, 50, 70) } },
  Fiat:      { Uno:   { years: '2010–2021', engines: ['1.0 Fire', '1.4 Evo'], bay: bay(0.26, 0.19, 0.20, 50, 60) },
               Argo:  { years: '2017–2024', engines: ['1.0 Firefly', '1.3 Firefly'], bay: bay(0.28, 0.19, 0.20, 50, 70) } },
  Volkswagen:{ Gol:   { years: '2008–2023', engines: ['1.0 Flex', '1.6 Flex'], bay: bay(0.26, 0.19, 0.20, 50, 60) },
               Polo:  { years: '2018–2024', engines: ['1.0 TSI', '1.6 MSI'], bay: bay(0.29, 0.19, 0.20, 55, 75) } },
  Honda:     { Civic: { years: '2012–2020', engines: ['1.8 Flex', '2.0 Flex'], bay: bay(0.32, 0.19, 0.20, 60, 90) } },
  Toyota:    { Corolla:{ years: '2015–2024', engines: ['1.8 Flex', '2.0 Flex'], bay: bay(0.32, 0.19, 0.20, 60, 90) } },
  Hyundai:   { HB20:  { years: '2013–2024', engines: ['1.0 Flex', '1.6 Flex'], bay: bay(0.28, 0.19, 0.20, 50, 70) } },
};
