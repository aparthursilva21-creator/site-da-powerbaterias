# POWER MOTION — Hero V04 aprovado

## Direção visual
O usuário aprovou a composição com sedã preto em ângulo frontal de 3/4, asfalto molhado, reflexos verdes, logo Heliar Power Baterias e título **“Energia para seguir em frente.”**. O site deve manter a identidade preta, verde elétrica e branca, sem moldura ao redor do carro e com botões arredondados, não quadrados.

A montagem desta versão é baseada na imagem de referência aprovada pelo cliente, adaptada para uso como imagem automotiva do hero. Os textos, botões e navegação são elementos HTML reais, acessíveis e responsivos; o site não é uma screenshot estática.

## Movimento implementado
- Entrada com início sutil, acendimento e transição para o movimento contínuo.
- Dois arquivos WebP animados de rodas, criados a partir da arte do veículo.
- Leve deslocamento/suspensão da imagem, névoa e reflexos de pista animados por CSS.
- Controle para reiniciar a sequência (3 fases), respeito a `prefers-reduced-motion`, pausa fora da tela.
- CSS em `assets/power-hero.css`, JS em `assets/power-hero.js`.
- Imagens em `assets/hero-car.webp`, `assets/wheel-front.webp`, `assets/wheel-rear.webp`.
- Layout verificado em desktop e mobile com navegador Chromium local; scripts e links principais testados.

## Limitação assumida
**A imagem do carro é um render fixo com camadas animadas.** O efeito dá a sensação de deslocamento, mas não é um vídeo 3D fisicamente completo do carro dirigindo. O antigo módulo `assets/power-hero-3d.js` permanece no repositório como experimento legado, **não é mais importado** no `index.html`.

## Animação narrativa futura
A ideia completa continua no planejamento: falha na partida, chamado de socorro, motoqueiro com baú Power Baterias, instalação realista da bateria, partida, motoqueiro indo embora e carro seguindo em loop. Essa sequência exigirá storyboard, modelos/filmagens, rigging e produção audiovisual independente. Não substituir o visual aprovado por veículos 3D genéricos.

## Negócio
- Nenhum preço de bateria no site; vendas e consultas pelo WhatsApp da loja.
- O socorro técnico informado de R$ 100 permanece na seção específica, sujeito a confirmação das condições e área de cobertura.
- Informações e materiais reais da loja serão revisados antes do domínio definitivo.

## Status
Hero V04 publicado no código da branch `main` do repositório `aparthursilva21-creator/site-da-powerbaterias`. A atualização pública do GitHub Pages pode depender do ciclo de implantação da plataforma.
