# Validação

`npm test` gera a saída estática e verifica páginas, âncoras, referências de arquivos, SEO, links de atendimento, filtros, dados de compatibilidade e mensagens do Power SOS. Para ver cada asserção individual em ambientes que só exibem o resultado por arquivo, execute `node --test --test-isolation=none tests/*.test.mjs` depois do build.

## Playwright

Inicie `npm run dev`. Com Python 3.10+ e Playwright instalados, execute o teste apontando para a URL informada pelo servidor.

```sh
python -m pip install playwright
python -m playwright install chromium
python tests/browser_smoke.py http://localhost:3000/
```

Use `CHROMIUM_EXECUTABLE` se preferir informar o caminho de um Chromium já instalado. Para testar o build sem iniciar um servidor, execute `npm run build` seguido de `python tests/browser_smoke.py --offline`. Nesse modo, o Playwright entrega ao Chromium os arquivos de `dist/` sob uma origem HTTPS de teste com o subdiretório do GitHub Pages e bloqueia requisições externas. Defina `POWER_SCREENSHOTS` com uma pasta gravável para capturar a página inicial em desktop e mobile. As interações de teste interceptam o WhatsApp e o mapa. O teste inclui larguras de 320 a 2560 px, navegação mobile por teclado, filtros, detalhes de bateria, consulta do Garage, visualização ou alternativa estática, SOS e mapa sob demanda.

## axe-core e Lighthouse

Para executar axe-core junto com o teste de navegador, extraia `package/axe.min.js` de `npm pack axe-core@4.11.1` em uma pasta externa ao site e forneça o caminho absoluto em `AXE_JS`.

```sh
AXE_JS=/caminho/axe.min.js python tests/browser_smoke.py http://localhost:3000/
```

Com uma instalação do Chrome compatível com Lighthouse, execute a auditoria abaixo usando a URL do build servido. Repita nos principais fluxos e, após a publicação, no endereço HTTPS definitivo.

```sh
npx --yes lighthouse@13.6.0 http://localhost:3000/ --chrome-flags="--headless" --output=html --output-path=./lighthouse-home.html
```

Resultados automatizados de acessibilidade devem ser acompanhados por navegação manual por teclado, inspeção de estados, zoom e teste com leitor de tela. O Lighthouse mede desempenho de laboratório. O INP real deve ser avaliado com dados de campo quando disponíveis.

## Validação do build

- **PASSOU · Node.js 24** · 15 testes. Saída estática de 37 páginas com metadados, rotas e referências locais válidas.
- **PASSOU · Chromium 156, Playwright 1.62** · 15 rotas principais em nove larguras. Navegação desktop e mobile, teclado, conteúdo sem JavaScript, pesquisa, filtros, rota de produto, quatro estados de compatibilidade, visualizador GLB e câmera, falha do GLB, bateria educativa, movimento reduzido, geolocalização concedida e negada, mensagem de WhatsApp interceptada e mapa sob demanda. Nenhuma exceção JavaScript ou falha HTTP interna inesperada na execução.
- **PASSOU · axe-core 4.11.1** · A análise automatizada das 15 rotas principais em viewport de 1440 px não detectou violações nas regras WCAG executadas.
- **Lighthouse 13.6.0 · Chromium, build em loopback** · Página inicial mobile com notas 95 em desempenho e 100 em acessibilidade, boas práticas e SEO. LCP de 2,49 s, CLS de 0 e TBT de 180 ms. No desktop, as quatro notas foram 100, com LCP de 0,73 s, CLS de 0 e TBT de 0 ms. Garage, catálogo, SOS e contato obtiveram 100 em acessibilidade mobile. As medições são de laboratório. O INP de campo ainda precisa de medição.
- **NÃO EXECUTADO** · Safari, Firefox, Edge, inspeção com leitor de tela e hospedagem GitHub Pages publicada. A validação do mapa e do WhatsApp usou respostas interceptadas e não enviou dados a serviços externos.
