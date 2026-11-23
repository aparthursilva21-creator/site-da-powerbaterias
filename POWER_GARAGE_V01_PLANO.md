# POWER GARAGE — Blocos V01 (proposta + implementação)

**Projeto:** Power Baterias | Samambaia Norte, Brasília/DF  
**Etapa:** protótipo visual navegável; não oferece consulta real de compatibilidade.

## Blocos construídos

| Bloco | Experiência nesta versão | Evolução para versão final |
|---|---|---|
| 01. Showroom | Carro preto de apresentação, plataforma circular com anéis animados, botão para iniciar | Modelo automotivo 3D com rotação real de 360° e iluminação premium |
| 02. Seleção | Marca > modelo > ano > motorização, inicialmente Chevrolet/GM, Fiat, VW, Ford, Honda, Toyota | Catálogo validado com versão, motorização, tecnologia Start-Stop e outras especificações |
| 03. Cofre | Laboratório com vista técnica **conceitual** e zona para bateria, transição após confirmar veículo | Cofre específico de cada carro, com foto licenciada/documentada ou modelo 3D de alta precisão |
| 04. Baterias | Mockups provisórios de Heliar 60Ah e Moura 60Ah e exemplo de bateria superdimensionada | Fotos recentes reais dos produtos, SKU, medidas, polos, CCA, tecnologia e fabricante |
| 05. Resultado | Bateria cai visualmente ou é recusada no **modelo ilustrativo**; feedback distingue simulação de validação | Regras reais de compatibilidade com justificativas e sugestões validadas |
| 06. Inspeção | Janela de visualização de bateria com protótipo 3D rotacionável, ficha com campos pendentes e WhatsApp | Modelos 3D de Heliar/Moura precisos, vistas internas didáticas e dados técnicos oficiais |

## Princípios de segurança da aplicação

**Nunca** apresentar um simples encaixe visual como confirmação de compatibilidade. Validar:
- **Veículo:** fabricante, modelo, geração, ano-modelo, versão/motorização e Start-Stop;
- **Bateria:** tensão nominal, Ah, CCA aplicável, dimensões C/L/A, polaridade, posição dos bornes, fixação, tecnologia química (convencional/EFB/AGM) e recomendações de aplicação do fabricante;
- **Dados:** origem rastreável, revisão, data de verificação e responsável por aprovação.
- Para ausência de dados, exibir **“consulte um especialista”**, nunca declarar compatível;
- Não inferir pelo fato de baterias possuírem a mesma amperagem;
- O exemplo “bateria superdimensionada” é *apenas um recurso visual*, não um teste técnico do veículo.

## Lista inicial de opções de navegação (não são mapeamentos de bateria)

- Chevrolet / GM: Celta, Onix, Prisma, Corsa, Classic
- Fiat: Uno, Palio, Argo, Mobi
- Volkswagen: Gol, Polo, Fox, Voyage
- Ford: Ka, Fiesta
- Honda: Civic, Fit, City
- Toyota: Corolla, Etios

As combinações de ano e motorização no protótipo ainda são genéricas. A versão definitiva usará regras por geração e ano para evitar combinações inexistentes.

## Dados comerciais

- Nenhum preço de baterias, carrinho de compra nem checkout.
- WhatsApp oficial: **(61) 99519-1090**.
- Mensagem preenchida com carro e bateria experimentada, incluindo aviso de que a simulação não é uma recomendação técnica.

## Arquitetura

- `index.html`: seis blocos visuais acessíveis a partir de `#garagem`.
- `assets/power-garage.css`: identidade preta/verde/branca, showroom, seleção, laboratório, cards e modal responsivos.
- `assets/power-garage.js`: seleção de carro, fluxo de navegação, animação demonstrativa e WhatsApp.
- O restante do site, incluindo hero e SOS, foi preservado.

## Próximas entregas sugeridas

1. Aprovar visual da vitrine e do seletor de veículos.
2. Substituir a apresentação estática do veículo por um modelo 3D com rotação real de qualidade.
3. Coletar e licenciar fotos verdadeiras do cofre do motor dos primeiros carros (idealmente começar pelo Celta), com posições corretas da bateria.
4. Obter fotos e fichas recentes da Heliar e da Moura por SKU efetivamente comercializado.
5. Construir matriz de compatibilidade aprovada por técnico da loja e pelos catálogos dos fabricantes.
6. Implementar busca inteligente e sugestão com explicação, sem depender de palpites da IA.
7. Produzir inspeção 3D fotorrealista dos produtos e vistas internas educativas sem sugerir desmontagem física pelo cliente.
8. Auditar desempenho em celular, acessibilidade e segurança antes da publicação comercial.

## Transparência

Esta V01 é **uma prova de conceito de interface**. O cofre mostrado não é uma foto de Celta ou de outro veículo, os produtos são representações estilizadas e não há AI conectada nem catálogo de compatibilidade verificado. Toda decisão de instalação precisa de avaliação técnica real.
