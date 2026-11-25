# POWER GARAGE — COMEÇAR A TRABALHAR COM CARRO E BATERIAS 3D
## Manual para Windows 11, VS Code, Blender e GitHub Pages

Esta é a primeira versão 3D **real** da Power Garage. A página `power-garage.html` importa uma malha GLB de sedã, usa Three.js para girar o veículo, permite arrastar/usar zoom, pausar a rotação, centralizar a câmera e abrir um arquivo GLB direto do computador **sem enviar o arquivo para um servidor**.

**O que NÃO está pronto:** capô do modelo público, cofre do motor, bateria Heliar/Moura específica, vista interna e catálogo de compatibilidade auditado. Não confundir uma câmera aproximando do carro com capô realmente aberto.

## Passo 1 — Experimente o carro 3D atual

Abra:
https://aparthursilva21-creator.github.io/site-da-powerbaterias/power-garage.html

Você verá a experiência com um **Sport Sedan**, modelo original do site vinish.dev. Se houver bloqueio de rede, WebGL ou CDN, a foto de fallback aparece.

Controles:
- **Pausar/Girar:** desliga e liga rotação automática do modelo 3D.
- **Frente:** muda a câmera para visão frontal.
- **Centralizar:** devolve a câmera inicial, fecha um eventual `Hood_Pivot` e reinicia rotação.
- **Arraste:** gira a câmera ao redor do carro.
- **Roda do mouse / gesto de pinça:** aproxima ou afasta.
- **Consultar baterias:** seleciona marca/modelo/ano e aproxima a câmera (o capô ainda não abre no asset padrão).

## Passo 2 — Baixe seu primeiro carro

Link da biblioteca:
https://vinish.dev/free-3d-models/realistic-cars

Modelo utilizado por padrão:
https://models.vinish.dev/realistic-cars/sport-sedan.glb

1. Entre na biblioteca.
2. Procure **Sport Sedan**.
3. Clique em **Download GLB** (ou use o link direto acima).
4. Guarde o arquivo no computador, por exemplo em `Downloads\PowerGarage\sport-sedan.glb`.
5. Vá à página Power Garage.
6. Em **Testar meu arquivo .GLB**, clique em **Escolher arquivo**.
7. Escolha o `.glb` que você baixou.
8. O navegador tentará carregar o modelo ali mesmo. **Isso não publica o arquivo no GitHub**. Ele serve para testar e comparar modelos.

Esse modelo tem aproximadamente 3,8 MB, 143 mil triângulos e licença CC BY 4.0. Você pode usar comercialmente **com crédito**.

Crédito que deve permanecer no projeto se esse modelo for usado:
**“Sport Sedan” por vinish.dev (https://vinish.dev/free-3d-models/), licenciado sob CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/).**

Se recolorir ou modificar, indicar que a obra foi modificada.

**Atenção:** o modelo tem carroceria, interior e rodas, mas não há comprovação de motor e capô separados. Uma foto do hero não pode ser transformada em carro 360º por CSS.

## Passo 3 — Escolha o carro definitivo

Para o nosso visual, procure por estes atributos:
- Sedã preto premium, geometria e texturas reais;
- Dimensões próximas de um carro real, não um brinquedo;
- Faróis, vidros, rodas, pneus e interior com materiais próprios;
- Malha do **capô separada** da carroceria (ou passível de separação no Blender);
- Local sob o capô onde um motor possa ser adicionado;
- Licença comercial compatível com site público e publicação do GLB;
- GLB/GLTF preferível, FBX/OBJ possível quando convertido;
- Preferencialmente 3 a 15 MB após otimização para web.

Evite modelos com licença **Non-Commercial, Editorial Only** ou autor não identificado. Guarde a URL e as condições da licença.

## Passo 4 — Baixar e usar o Blender

Download oficial: https://www.blender.org/download/

O Blender é gratuito e permite editar modelos, materiais, peças separadas, texturas, pivôs e animações.

**Importar um GLB:**
1. Abra o Blender.
2. Exclua o cubo inicial se desejar.
3. Menu **File > Import > glTF 2.0 (.glb/.gltf)**.
4. Selecione o arquivo baixado.
5. Use a roda do mouse para zoom e clique do meio para orbitar.
6. Veja os componentes no painel **Outliner**, no canto superior direito.
7. Selecione o material correspondente à pintura e ajuste para grafite/preto. **Não altere vidro, cromados ou pneus por engano.**

## Passo 5 — Capô real que abre

Não basta colocar uma caixa falsa sobre o carro. É necessário separar a geometria verdadeira do capô.

1. Confirme primeiro se o modelo é editável e a licença permite adaptação.
2. Na visualização 3D, selecione a carroceria e entre no **Edit Mode** (Tab).
3. Se a malha já possuir o capô como objeto separado, use esse objeto. Caso contrário, será preciso selecionar cuidadosamente as faces correspondentes ao capô e separar usando **P > Selection**; modele as superfícies internas que faltarem.
4. Coloque o pivô no **eixo da dobradiça real próximo ao para-brisa**.
5. Organize o objeto de maneira que sua rotação abra a tampa no sentido correto.
6. Crie um **Empty** ou grupo com o nome exato **Hood_Pivot**, pai da malha do capô.
7. Ajuste a origem e os eixos locais desse pivô para a dobradiça.
8. Deixe o capô **fechado por padrão** e exporte.
9. Reimporte o GLB no showroom pelo botão **Testar meu arquivo .GLB**.
10. Ao clicar em **Consultar baterias**, o código tenta animar `Hood_Pivot` em torno do eixo local X. Ajuste a orientação local do grupo no Blender até abrir corretamente.

**Importante:** isso só mostra a tampa abrindo. Precisamos de um modelo próprio de **cofre/compartimento com motor e acessórios realistas**. Se o arquivo não contém o motor, o site não vai inventá-lo. Um modelo de motor genérico deve ser rotulado como visualização ilustrativa.

## Passo 6 — Como obter as baterias 3D

Biblioteca com um arquivo GLB genérico de bateria automotiva:
https://vinish.dev/free-3d-models/car-parts

Procure o item **Car Battery** (bateria com corpo, terminais e alça). É uma malha de referência, sob CC BY 4.0; **não é uma Heliar ou Moura realista pronta para publicação**.

Outra base possível, com modelo genérico CC0:
https://grab3d.com/models/vehicles/car-battery/

Depois:
1. Baixe o GLB e abra-o pelo campo **Testar meu arquivo .GLB**, para compreender o movimento 3D.
2. Abra a bateria no Blender.
3. Escolha **um SKU real e específico da Heliar ou Moura** comercializado pela loja.
4. Obtenha a ficha técnica oficial: medidas exatas, capacidade, polaridade, borne, tecnologia, corrente de partida etc.
5. Fotografe frontal, traseira, laterais e tampa desse SKU, com autorização; a imagem enviada inicialmente é **apenas referência visual**.
6. Modele a carcaça nas dimensões do produto, tampa, bornes e alça, com materiais e rótulos fiéis.
7. Crie uma variante 3D de inspeção para ser girada em zoom.
8. Para o futuro modo **“Ver por dentro”**, modele *separadamente* placas, separadores, conexões e invólucro, fiel à tecnologia da bateria específica. É uma **simulação didática virtual**: não estimular abertura física de baterias.
9. Exporte duas versões quando necessário: **visual leve para catálogo** e **detalhada para inspeção**.

## Passo 7 — Exportar do Blender

Menu:
**File > Export > glTF 2.0 (.glb/.gltf)**

Selecione **glTF Binary (.glb)** para embutir geometria e texturas em um arquivo.

Confira no arquivo exportado:
- Nome de peças como `Hood_Pivot`;
- Texturas incorporadas;
- Tamanho do arquivo;
- Dimensões e escala;
- Materiais PBR;
- Possibilidade de abrir no visualizador 3D;
- Origem e licença corretamente documentadas.

Documentação oficial: https://docs.blender.org/manual/en/latest/addons/scene_gltf2.html

## Passo 8 — Publicar o GLB definitivo no GitHub

1. Abra: https://github.com/aparthursilva21-creator/site-da-powerbaterias
2. Entre na pasta `assets`.
3. Clique **Add file > Upload files**.
4. Selecione o arquivo GLB já otimizado e renomeado como `power-garage-car.glb`.
5. Confirme o commit.
6. Abra o arquivo `assets/garage-showroom-v1.js` em modo de edição.
7. Substitua o valor da constante `DEMO_MODEL` pela string `'assets/power-garage-car.glb'`, ou peça ao ChatGPT para alterar isso diretamente.
8. Mantenha informações de licença/crédito do modelo correto visíveis na página.

**GitHub Pages não executa um servidor de API ou banco de dados.** Ele apenas publica os arquivos estáticos. Isso é suficiente para o showroom 3D, mas o sistema de compatibilidade precisará de dados técnicos verificáveis.

## Passo 9 — A lógica real de recomendação

Precisamos diferenciar pelo menos quatro estados:
1. **Recomendada:** existem dados verificados demonstrando compatibilidade técnica e aplicação aprovada.
2. **Cabe fisicamente, mas não indicada:** dimensões cabem segundo dados confirmados, porém algum requisito elétrico/tecnológico não atende.
3. **Fisicamente incompatível / não aplicável:** dimensões, fixação, polaridade, tecnologia ou outro fator impede aplicação.
4. **Não verificada:** faltam dados; pedir confirmação da loja.

**Atenção:** “Celta + 60Ah serve” e “Celta + 40Ah não serve” são **exemplos narrativos, não regras técnicas universais**. A escolha depende de ano, versão, motor e ficha oficial. Não automatizar recomendações só com amperagem.

## Status honesto

Feito no código:
- Tela do carro 3D com WebGL/Three.js, rotação automática e controle manual;
- Leitura de GLB do navegador;
- Câmera frontal, pausa e retorno;
- Aproximação quando envia seleção de veículo;
- Estrutura opcional para `Hood_Pivot`.

A validar visualmente:
- Funcionamento do modelo remoto com CORS e renderização;
- Qualidade real do modelo com luzes e pintura;
- Posicionamento da câmera;
- Comportamento responsivo.

Ainda por produzir:
- Modelo premium definitivo e autorizações;
- Motor e cofre realistas;
- GLB de produtos Heliar e Moura por SKU;
- Inspeção interna;
- Banco de aplicação e regras técnicas;
- Encaixe/colisão 3D com feedback auditável.

Não chamar isso de Power Garage finalizada.
