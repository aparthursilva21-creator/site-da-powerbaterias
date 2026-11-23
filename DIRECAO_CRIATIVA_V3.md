# POWER BATERIAS — Direção Criativa V03

## Diagnóstico das referências recebidas
Os vídeos mostrados são apresentações de projetos de design/conceito de website para **Pilão, Mercado Livre e Havaianas**. A força vem de:
- fidelidade aos elementos visuais de cada marca, evitando um tema genérico;
- tipografia dominante e hierarquia de informação clara;
- objetos/produtos como protagonistas das composições;
- bom uso de movimento e transições entre cenas;
- interface com aparência de campanha publicitária, sem excesso de cards genéricos.

**O site V02 não atinge esse padrão.** Seus desenhos SVG improvisados, motoqueiro simplificado e cofre do motor genérico são apenas provas de funcionamento. Não devem ser confundidos com a produção visual final.

## Identidade
- A logomarca oficial enviada tem fundo preto/escuro, letras itálicas e esportivas, branco e verde vivo.
- Aplicar marca original em imagem de qualidade, sem substituir por ícone ou tipografia genérica.
- Paleta de referência derivada da marca: preto profundo `#080A08`, grafite `#151A16`, branco `#FFFFFF`, verde principal aproximado `#75C83C`.
- Evitar neon futurista exagerado, tons vermelhos e excesso de caixas com bordas.
- Titulares muito grandes, esportivos/condensados, espaços de respiro; componentes mais editoriais e precisos.
- A logo vetorizada provisória em `assets/power-logo-traced.svg` foi derivada da imagem enviada, mas não substitui o arquivo mestre original.

## Hero: narrativa cinematográfica solicitada
Layout: no desktop, automóvel preto de visual premium no lado esquerdo, texto curto e botões fortes à direita, em uma cena ampla. Evitar prender o carro em uma moldura com aparência de miniaplicativo.

Storyboard de referência (o timing exato será decidido com testes de animação):
1. **Falha**: sedã preto está parado, tenta dar partida, faróis piscam fracamente, efeitos de energia próximos ao motor.
2. **Chamada**: balão com símbolo de telefone emerge da cabine e sinaliza pedido de ajuda.
3. **Resgate**: motoqueiro com baú personalizado POWER BATERIAS entra no quadro e estaciona.
4. **Instalação**: capô abre, personagem retira bateria e faz ações visíveis de montagem e fixação.
5. **Partida**: motoqueiro sai por trás; faróis acendem com força; carro liga.
6. **Loop final**: rodas giram, sensação de asfalto andando, fumaça discreta e reflexos do carro, **sem repetir o conserto** automaticamente.
7. Botão "Rever animação"; site continua navegável enquanto a cena roda. Sem som automático e com alternativa para redução de movimento.

**Abordagem técnica recomendada:** storyboard e direção de arte aprovados primeiro; modelagem/rig/animação/render no Blender ou outra pipeline 3D; servir filme de abertura comprimido em WebM/MP4 com imagem de poster, e loop final separado; usar HTML/CSS/GSAP para integrar interface, legendas, estado e transições. A cena realista não será entregue com CSS/SVG improvisados.

**Questões de produção:** modelo 3D licenciado ou original para sedã premium; personagem/moto/equipamento; logotipo e design do baú; integração de câmera/perspectiva, luz, sombra, fumaça, som opcional e otimização mobile. Não usar marcas/modelos protegidos sem confirmar permissões.

## Power Garage
- A pessoa seleciona marca, modelo, ano, motorização e versão.
- O projeto evoluirá da visualização genérica para uma família de cenas técnicas de cofre do motor, por modelos suportados. Não prometer 3D preciso para todos os carros sem os modelos/medições.
- Bateria entra por animação de drag/drop ou seleção; dimensões da bateria são comparadas ao espaço físico disponível.
- **Compatibilidade real só com base técnica validada:** comprimento, largura, altura, polos, polaridade, tipo, tensão, Ah/CCA e requisitos Start-Stop conforme o veículo.
- Não confundir "cabe no desenho" com "é eletricamente compatível"; se não houver dados, indicar "Consultar especialista", nunca "compatível" por suposição.
- Começar por catálogo e veículos confirmados pela equipe, expandindo depois.

## Socorro Power
- Serviço de visita e teste técnico **R$ 100** conforme informação recebida.
- Explicar possibilidades de medição: tensão, carga, capacidade de partida e indicadores de condição da bateria, de acordo com o equipamento e teste realizado.
- Não garantir a vida útil exata restante; esclarecer cobertura, horários e condições com a loja.
- WhatsApp com veículo, problema e bairro.

## Sobre a loja — imagens reais
- Vídeo do pai/proprietário contando história verídica.
- Drone ou outras filmagens reais, fachada, equipe e ambientes internos.
- Depoimentos e avaliações somente se autorizados e atualizados.
- Fotos de produtos reais da loja quando disponíveis.

## Regras de venda
- **Não exibir preços de baterias, carrinho ou checkout.**
- Contato comercial via WhatsApp: (61) 99519-1090.
- Valor de R$100 pertence apenas ao serviço técnico de socorro e deve ser validado com a equipe antes da publicação definitiva.

## Ordem de execução
- [x] Identificar o erro de direção visual da V02.
- [x] Incluir no header uma vetorização aproximada da logo enviada.
- [ ] Aprovar composição final do primeiro frame (layout, enquadramento, texto, paleta e tamanho da marca).
- [ ] Construir uma home V03 estática com alta qualidade visual e excelente versão mobile.
- [ ] Produzir assets 3D reais para a narrativa do hero e integrar vídeo + loop.
- [ ] Construir a garagem usando catálogo e dados técnicos confiáveis.
- [ ] Adicionar materiais reais da loja e depoimento do proprietário.
- [ ] Validar acessibilidade, performance, direitos de ativos e comportamento no GitHub Pages.
- [ ] Só publicar a V03 como versão principal após revisão da loja.

## Situação atual
O repositório mantém uma V02 funcional, mas visualmente insuficiente. O trabalho de reconstrução deve acontecer nesta branch (`redesign-cinematico-v3`) e não no site principal até revisão.
