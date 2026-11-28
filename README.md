# Power Baterias

Site institucional em português para a Power Baterias, em Samambaia Norte, Brasília. O Power Garage consulta aplicações documentadas, o catálogo reúne fichas técnicas de Heliar e Moura e o Power SOS prepara mensagens de atendimento pelo WhatsApp.

## Executar

Requisitos: Node.js 22 ou mais recente e npm. Instale as versões fixadas pelo lockfile.

```sh
npm ci
npm run dev
```

Abra `http://localhost:3000/`. O caminho `/site-da-powerbaterias/` simula a hospedagem do repositório. O comando `npm run build` entrega o site estático em `dist/`. O build gera HTML indexável, minifica CSS e JavaScript, inclui fontes locais e carrega Three.js, GSAP e o modelo 3D apenas nas páginas que os usam. O modelo automotivo é solicitado quando o visitante abre a visualização.

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `src/config.mjs` | Dados comerciais, marcas, serviços, SEO e vídeos do hero |
| `src/shared.mjs` | Componentes e utilitários compartilhados |
| `src/pages/` | Home, Garage, catálogo, fichas, conteúdo, páginas legais e atendimento |
| `src/client/` | Menu, filtros, compatibilidade, WhatsApp, geolocalização e 3D |
| `src/styles/` | Sistema visual e estilos de página |
| `src/data/` | Produtos, veículos, aplicações e artigos |
| `public/assets/` | Imagens, marca e modelos locais |
| `scripts/` | Geração estática e servidor local |
| `tests/` | Validação estrutural, regras de consulta e roteiros de navegador |

Os caminhos `loja.html` e `socorro.html` preservam os acessos da versão anterior com links às páginas atuais. A página 404 é gerada explicitamente para hospedagem estática. As fichas e os artigos têm URLs próprias, renderizadas durante o build.

## Atualizar conteúdo e dados

1. **Empresa.** Edite `src/config.mjs` para corrigir endereço, canais, serviços, perfil Google e mídia. Preencha `verifiedRating` com `stars` e `count` após confirmar os valores e a data. Para a referência interna da visita técnica, use a variável de ambiente `POWER_TECHNICAL_VISIT_REFERENCE_BRL` com um valor numérico. O build mantém essa referência fora dos arquivos públicos.
2. **Baterias.** Adicione uma entrada com ID único em `src/data/products.json`. Use o código do fabricante, a categoria, a tecnologia e somente especificações publicadas. Registre a fonte e a data de consulta. Para fotos autorizadas por modelo, coloque as imagens em `public/assets/images/products/` e referencie o vetor `images` com objetos `{ "src": "./assets/images/products/arquivo.webp", "alt": "Descrição" }`. Reexecute o build para gerar a ficha, o catálogo e o sitemap.
3. **Veículos.** Em `src/data/vehicles.json`, cadastre apenas combinações sustentadas pelo manual ou guia técnico. Use o formato dos registros existentes e associe os IDs correspondentes de aplicação. O tipo continua disponível para atendimento mesmo quando a base não cobre um veículo.
4. **Compatibilidade.** Em `src/data/compatibility.json`, cite as fontes, registre o campo `checkedAt` e os requisitos e restrições explícitos. Referencie candidatos por ID de produto. Reserve `exact: true` para aplicação documentada para a configuração identificada. Divergências conhecidas devolvem incompatibilidade. Informações insuficientes devolvem confirmação técnica ou dados indisponíveis. Revise tensão, capacidade, CCA, dimensões, polaridade, terminais, tecnologia, Start-Stop e instruções do fabricante antes de ampliar a base.
5. **Artigos.** Adicione o conteúdo em `src/data/articles.mjs` com slug único, título, resumo, seções e referências. Valide as instruções técnicas e atualize a data de revisão.
6. **Mídia.** Substitua `hero.webp`, `hero-mobile.webp`, `service.webp`, `garage.webp`, `sos.webp` ou `battery.webp` em `public/assets/images/` por arquivos autorizados e equivalentes em proporção. Ajuste o texto alternativo e as legendas onde for necessário. Para uma fachada oficial, adicione `public/assets/images/store.webp` e defina `site.storePhoto` como `./assets/images/store.webp`. Para vídeo, coloque WebM e MP4 otimizados em `public/assets/videos/`, informe os caminhos locais em `site.heroVideo` e teste também o enquadramento mobile. O player prioriza o poster, respeita movimento reduzido e oferece pausa.
7. **Modelos.** Os controles da garagem usam `public/assets/models/sport-sedan-hood.glb`. Ao trocar o GLB, atualize a referência em `src/pages/garage.mjs`, ajuste o enquadramento e valide o pivô e a direção do capô em `src/client/viewer.js`. Revise créditos e licença. A animação de capô e colocação da bateria depende da geometria e articulação do veículo ilustrativo. O componente educativo é modelado em `src/client/battery-scene.js`.

Nunca registre atendimento, garantias comerciais, avaliações, disponibilidade ou aplicações sem a respectiva confirmação. O site encaminha o orçamento pelo WhatsApp. Cada ficha mantém a condição comercial em aberto.

## GitHub Pages e domínio

O GitHub Pages serve a publicação atual a partir dos arquivos na raiz de `main`. O novo site é gerado em `dist/` e pode ser homologado com o servidor local antes de mudar a origem da publicação.

1. Valide a branch de desenvolvimento e resolva as pendências comerciais antes de aprovar a publicação.
2. No repositório, selecione **Settings → Pages → Build and deployment → GitHub Actions**. O workflow `Build e publicação no GitHub Pages` roda manualmente. Fora da `main`, executa o build e os testes. Na `main`, publica o artefato validado quando o workflow for acionado.
3. O endereço canônico padrão é `https://aparthursilva21-creator.github.io/site-da-powerbaterias/`. Se houver domínio próprio, configure o DNS no provedor, o domínio em GitHub Pages e a variável `POWER_SITE_URL` no repositório com a URL HTTPS final e barra no fim. O build recalcula canonical, Open Graph, robots e sitemap. Ative **Enforce HTTPS** após validar domínio e certificado.
4. Confira o endereço definitivo e submeta `sitemap.xml` no Google Search Console. Verifique o perfil comercial e o telefone. As URLs públicas dependem da configuração efetiva do Pages.

Para outro servidor estático, publique todo o conteúdo de `dist/` e configure `404.html` para respostas HTTP 404. As páginas geradas têm uma Content Security Policy compatível com a arquitetura estática e o mapa por solicitação do visitante.

## Testes

```sh
npm test
node --test --test-isolation=none tests/*.test.mjs
```

As verificações cobrem links internos, arquivos locais, metadados, filtros de catálogo, aplicações e regras do SOS. [Guia do Playwright, axe-core e Lighthouse](tests/README.md). Confirme as integrações no domínio final sem encaminhar mensagens reais durante QA.

## Inventário visual e licenças

| Recurso | Origem |
| --- | --- |
| `brand/power-logo-traced.svg`, `brand/bolt.svg` | Reaproveitados do repositório da Power Baterias. O histórico identifica a logomarca como vetorização da arte enviada pela loja. |
| `heliar-origem.webp` | Foto Heliar fornecida pelo cliente no repositório. Apresentada como linha SLI Tech. O arquivo original não identifica um código de bateria legível. |
| `hero.webp`, `hero-mobile.webp`, `battery.webp`, `garage.webp`, `sos.webp`, `service.webp`, `maintenance.webp` | Cenas conceituais geradas para o projeto com OpenAI ImageGen, otimizadas em WebP. Identificadas como ilustrações publicitárias ou educativas. |
| `sport-sedan-hood.glb` | Sport Sedan de [Vinish](https://vinish.dev/free-3d-models/realistic-cars), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Reaproveitado do repositório, que adaptou a malha com um capô móvel. |
| Geometria educativa de bateria | Modelo procedural original no código. Representação conceitual de chumbo-ácido de 12 V e seis células. |
| Manrope e Space Grotesk | Fontes locais via Fontsource, com SIL Open Font License em `dist/assets/fonts/`. |
| Ícones e controles | SVGs de interface inline. O símbolo do WhatsApp identifica o canal externo. Revise as diretrizes de marca aplicáveis ao uso comercial. |
| Three.js e GSAP | Versões fixadas em `package-lock.json`. Consulte os avisos de licença dos pacotes e a documentação de cada biblioteca. |

## Pendências para lançamento definitivo

- Confirmar endereço, número de loja, horário, dados de identificação empresarial, canais oficiais e perfil Google. Alguns diretórios públicos divergem do endereço informado no briefing. Validar a nota e o total de avaliações antes de exibi-los.
- Obter fotos da fachada, equipe e instalações, vídeos reais, depoimentos autorizados e fotografias de catálogo vinculadas aos modelos exatos. Validar quais produtos do catálogo técnico a loja oferece.
- Confirmar cobertura e condições do atendimento emergencial e da visita técnica. A referência de preço permanece fora do site gerado.
- Revisar as aplicações com a equipe, ampliar a cobertura da base e registrar critérios e restrições por versão. O sedã atual ilustra o uso da garagem sem representar os veículos consultados.
- Submeter privacidade, termos e garantia/trocas à revisão jurídica. Confirmar razão social, CNPJ, canal de privacidade, prazos de retenção reais, fornecedores e práticas comerciais.
- A campanha de oito cenas aguarda vídeo autorizado. A versão atual usa um poster conceitual com movimento de rolagem e alternativa estática. O site pode funcionar com esse poster.
- Se forem adicionados rastreadores ou cookies opcionais, revise a política e controle o consentimento antes de carregar scripts. No estado atual, o site não grava preferências, não instala analytics e solicita o mapa somente por ação explícita.

Use as fontes primárias do catálogo e do Garage para revisões técnicas. Faça as alterações em branch, rode os testes e verifique o build antes de publicar.
