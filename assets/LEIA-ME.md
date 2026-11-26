# Power Garage 3D — versão completa

## Como abrir (Windows)
1. Descompacte o ZIP numa pasta (não rode de dentro do ZIP).
2. Tenha o [Node.js LTS](https://nodejs.org/) instalado.
3. Dê dois cliques em **ABRIR-POWER-GARAGE.bat** e deixe a janela preta aberta.
4. Precisa de internet: o Three.js carrega do CDN `cdn.jsdelivr.net`.

Não abra o `.html` direto (duplo clique): o navegador bloqueia o carregamento do `.glb` assim. Use o `.bat`, ou o GitHub Pages.

## O que tem
- Carro girando num prato giratório com anel verde; arraste para girar, scroll para aproximar.
- **Abrir capô**: o carro para suave, vira de frente, a câmera sobe e o capô abre (~70°).
- **Cofre do motor completo**: motor 4 cilindros transversal (bloco, cabeçote, tampa de válvulas, bobinas, coletor de admissão, coletor de escape com protetor térmico, câmbio, correia com alternador/compressor/polias), radiador com eletroventilador, mangueiras, filtro de ar, servo-freio, caixa de fusíveis, reservatórios, torres de amortecedor, paredes internas e assoalho.
- Ao escolher o veículo, a bateria **recomendada** aparece e cai na bandeja (lado direito do cofre) com feedback "compatível". Qualquer outra pode ser testada: menor/maior que a ideal encaixa com aviso amarelo; bateria grande (ex.: caminhão) pousa na borda, balança e não entra, com aviso vermelho. **Medidas e faixas em `js/catalog.js` são fictícias** (Celta: recomendada 60 Ah).

## Correções dos bugs que você relatou
- **Ferragens atravessando o carro**: medi o GLB (frente da carroceria em z≈2,09; paredes internas em x≈±0,59). A moldura frontal, as torres e as caixas dos faróis que passavam disso foram removidas; todo o cofre fica dentro desses limites e só aparece depois que o capô se afasta.
- **Tela preta ao girar**: o canvas agora tem tamanho controlado (ResizeObserver), o corte de câmera é folgado (near 0,1 / far 120), as peças do carro não são mais descartadas pelo culling, e não existe nenhum plano grande na cena.

## Atualização — motor dentro do carro + baterias reais
- **Trava de contorno**: planos de corte (|x|≤0,60 · z entre 0,98 e 2,04 · y≥0,30 · abaixo da curva interna do capô, todos medidos no GLB) são aplicados a todo o cofre e à bateria. Mesmo que uma peça passe do limite, ela não é desenhada fora do carro.
- **Bateria nova (estilo Moura)**: caixa preta com friso de base, tampa com platô, 6 tampões, pegas rebaixadas nas pontas, polos cônicos (+ com capa vermelha), etiqueta com marca e Ah nas duas laterais. Marca em `brand` no `js/catalog.js`.

## Cofre refeito a partir da foto de referência (Gol G5 1.0)
- Bateria **transversal na frente-direita** (vista de frente), com os polos virados para o motor; servo-freio e reservatório do limpador atrás dela.
- Reservatório de arrefecimento na frente-esquerda; motor com tampa preta e bocal amarelo; câmbio e alternador recuados para dentro do limite do carro.

## Arquivos
`power-garage.html` · `css/garage.css` · `js/main.js` (cena e animações) · `js/engine-bay.js` (motor e cofre) · `js/garage-logic.js` + `js/catalog.js` (encaixe fictício) · `assets/sport-sedan-hood.glb` · `tests/logic.test.mjs` (`node tests/logic.test.mjs`).

## Para ajustar
- Velocidade do giro: `SPIN` em `js/main.js`. Ângulo do capô: `HOOD_OPEN`.
- Cor da pintura: `m.color.setHex(...)` no bloco `Paint_Grey` de `js/main.js`.

## Licença do carro
"Sport Sedan" por vinish.dev, CC BY 4.0 — mantenha o crédito no rodapé da página.
