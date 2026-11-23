# POWER BATERIAS — Reestruturação V07

Data: 23/11/2026

## Objetivo
Separar as funcionalidades do site em páginas próprias, manter o hero aprovado e substituir a parte inferior da home (antes parecida com slides) por seções comerciais curtas e consistentes. A Power Garage rejeitada deixa de aparecer inteira na home.

## Páginas
- `index.html`: abertura V06 e hero preservados; chamadas compactas para Garage, baterias, serviços, SOS, sobre e loja.
- `power-garage.html`: página separada com foto de apresentação, seleção de marca/modelo/ano/versão, resumo local e consulta técnica pelo WhatsApp. **Sem 3D real e sem compatibilidade automática ainda.**
- `baterias.html`: linhas Heliar, Moura e nota sobre Start-Stop, sem preços nem afirmação de estoque/SKU.
- `servicos.html`: instalação, testes, palhetas, lâmpadas e óleo/filtro.
- `socorro.html`: serviço de visita e diagnóstico com valor de R$100 informado, sujeito a confirmação; formulário que prepara mensagem WhatsApp.
- `sobre.html`: apresentação real da empresa; fotos e vídeo do proprietário pendentes.
- `loja.html`: endereço comercial, WhatsApp, Instagram e link para rota; fotos e horário pendentes de confirmação.

## Arquivos novos
- `assets/site-v07.css`: design system preto/grafite, tipografia moderada, verde mais próximo do logo, layouts responsivos.
- `assets/site-v07.js`: navegação móvel das páginas internas, formulário SOS e consulta de veículo via WhatsApp.

## Arquivos deliberadamente preservados
- `assets/power-hero.css`, `assets/power-hero.js`, `assets/hero-car.webp` e `assets/power-logo-traced.svg`. O hero aprovado e a abertura cinematográfica continuam presentes.
- Arquivos antigos como `assets/power-garage.css`, `assets/power-garage.js`, `styles.css`, `app.js` permanecem no repositório para histórico, mas **não são carregados pela home nova**.

## Testes efetuados
Verificação estrutural por leitura de arquivo através do GitHub:
- HTML das 7 páginas possui pares de `<section>` e `</section>` equilibrados.
- Todas carregam o CSS e JS compartilhados.
- Menu e contatos aparecem nas 7 páginas.
- `assets/site-v07.js` foi validado sintaticamente.
- O CSS novo possui número equilibrado de chaves.
- O simulador antigo saiu do HTML da home.
- O hero permanece no HTML da home.

**Ainda pendente:** testes visuais reais no navegador desktop/mobile e verificação da publicação GitHub Pages. A versão não deve ser apresentada como aprovada visualmente antes dessa revisão.

## Próxima fase (sem fingir realismo)
1. Aprovar composição da home e páginas internas, inclusive tipografia e dimensões.
2. Escolher e licenciar um sedã 3D realista para showroom com giro 360°.
3. Implementar transição de câmera e fluxo de estados, com fallback leve.
4. Conseguir fotos reais e documentadas do cofre do **Celta específico** (ano/versão) para primeira experiência.
5. Selecionar SKUs atuais realmente comercializados de Heliar e Moura, com fotografias oficiais e fichas técnicas.
6. Montar regras de compatibilidade auditáveis; nunca declarar que serve apenas por 60Ah.
7. Adicionar animação da bateria 3D e inspeção detalhada com dados reais.

## Restrições
- Sem preço de bateria nem checkout.
- WhatsApp oficial: (61) 99519-1090.
- O serviço SOS informado por R$100 precisa de confirmação de disponibilidade e cobertura.
- Não divulgar horários, estoque, imagens da loja ou credenciais comerciais não confirmados.
