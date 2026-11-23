# POWER BATERIAS — HERO V06: abertura cinematográfica e plano de qualidade

**Data:** 23/11/2026  
**Escopo:** somente primeira tela. O layout aprovado (logo, carro preto à direita, frase à esquerda e botões arredondados) permanece.

## 1. Abertura premium — implementada

| Momento aproximado | Visual |
| --- | --- |
| 0–0,4 s | Tela preta, ambiente esverdeado discreto e feixe elétrico atravessando o quadro |
| 0,35–1,2 s | Marca Power Baterias surge com transição limpa |
| 0,8–2,05 s | Frase “A energia que move você” e linha de energia preenchendo |
| 2,07–2,95 s | Cortina escura sobe e revela o hero |
| Após abertura | Título, descrição, botões e indicadores surgem com animação de entrada |

O efeito pode ser pulado pelo botão **Pular abertura** ou pela tecla Escape. Ele também é omitido para pessoas que escolheram reduzir movimento e para links diretos para seções internas. Há fallback visual automático caso o JavaScript falhe.

## 2. Animações do cenário — implementadas em CSS V06

- **Rodas estáticas:** mantidas exatamente como estão na foto. Não usar recortes falsos, rotação ou deslocamento de toda a carroceria.
- **Fumaça traseira:** cinco volumes suaves partem da área próxima à traseira e se dissipam lentamente, com intensidade maior do que na versão anterior.
- **Iluminação falhando:** brilhos verdes do ambiente oscilam em intervalos irregulares, com algumas falhas breves.
- **Asfalto molhado:** reflexos verdes e brancos muito sutis variam de intensidade, sem deslocar o carro.
- **Hero:** mantém transições de texto e pequenos efeitos de entrada elegantes.
- **Performance:** efeitos ambientais pausam quando a primeira dobra está fora da tela ou o navegador fica oculto; movimento reduzido desativa os efeitos.

Esses efeitos dão sensação de uma campanha publicitária, mas **não** são um vídeo renderizado a 60 FPS nem transformam a imagem original em 4K.

## 3. Melhoria real da qualidade visual — próxima produção

A imagem `assets/hero-car.webp` é um recorte comprimido de uma referência anterior, com resolução de cerca de **850 × 659 pixels**. CSS não recupera texturas e detalhes perdidos.

Para alcançar resultado UHD profissional, produzir uma **nova arte de origem**, sem textos ou elementos de navegador incorporados, com carro/fundo/cenário em camadas. Especificação recomendada:

- Arquivo mestre do carro e cenário com pelo menos **3.200 px de largura** (ideal 3.840 px ou mais no material original), em excelente nitidez;
- Exportações otimizadas (ex.: WebP/AVIF em tamanhos diferentes para celular e desktop) e fallback WebP/JPEG;
- Preservar posição 3/4 frontal do sedã preto e luz verde da identidade da loja;
- Textura realista de asfalto úmido, reflexos coerentes com os pontos de luz, fumaça fisicamente plausível;
- Ajustar contraste e compressão mantendo boa velocidade em celulares;
- Para movimento de alta fidelidade: produzir pequeno loop renderizado em **60 quadros/s** e oferecer imagens estáticas a quem prefere movimento reduzido. Resolução 4K/60 poderá ser pesada; escolher bitrates e variantes com base em testes reais.

**Importante:** a V06 ainda usa a imagem atual e não deve ser apresentada como 4K verdadeira.

## 4. Plano de testes antes do domínio comercial

- Verificar primeira abertura e botão de pular com mouse, teclado e celular.
- Verificar Chrome e navegadores móveis; garantir que falhas em animação não bloqueiem navegação.
- Confirmar visibilidade da fumaça junto à roda traseira sem cobrir farol, texto ou botões.
- Testar fluidêz em celular de entrada, desativando efeitos excessivos quando necessário.
- Conferir legibilidade e responsividade em 360px, 390px, 768px, 1366px e 1920px.
- Conferir `prefers-reduced-motion`, foco visível e contrastes.
- Medir peso da página, LCP e deslocamentos visuais antes de troca de assets.

## 5. Regras comerciais mantidas

- Nenhum preço de baterias, carrinho ou checkout.
- Consultas pelo WhatsApp oficial da Power Baterias.
- Serviços de socorro/teste e demais condições seguem nas seções já existentes, sujeitos à validação da loja.

## Arquivos alterados
- `index.html` — abertura com logo e novas camadas do cenário.
- `assets/power-hero.css` — animações cinematográficas e adaptação responsiva.
- `assets/power-hero.js` — sequência de abertura, controle de pular e redução de movimento.
