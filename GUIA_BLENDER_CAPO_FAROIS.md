# POWER GARAGE — COMO FAZER O CAPÔ DO CARRO ABRIR NO BLENDER

**Aplicado ao projeto:** `aparthursilva21-creator/site-da-powerbaterias`  
**Modelo já colocado no GitHub:** `sport-sedan.glb` (raiz do repositório)

## O que já está no site

- O showroom da página `power-garage.html` carrega **seu arquivo `sport-sedan.glb`**, não uma cópia hospedada em outro site.
- O carro é mostrado num palco 3D sem piso retangular; deve aparecer integrado ao fundo da página.
- Você pode girar o veículo com o mouse, pausar, aproximar e centralizar.
- O botão **Abrir capô** já está programado, mas só é habilitado quando o GLB contém o objeto `Hood_Pivot`.
- O botão **Faróis** habilita quando existem materiais de faróis reconhecíveis. Se não houver, use **Ajustar pintura e faróis do modelo** para experimentar um material manualmente.
- O painel de materiais **não salva** mudanças no GitHub: é só prévia, local ao navegador.

**Muito importante:** o arquivo atual não foi inspecionado aqui por dentro. Não há confirmação de que a geometria do capô esteja separada nem de que exista um motor. Se a tampa fizer parte da carroceria, ela precisará ser separada manualmente.

## 1. Instalar Blender e baixar o modelo

Blender oficial: https://www.blender.org/download/

1. Abra o GitHub: https://github.com/aparthursilva21-creator/site-da-powerbaterias
2. Clique em `sport-sedan.glb`.
3. Clique no botão de download do arquivo (ícone de seta ou **Download raw file**).
4. Salve como `sport-sedan.glb` em uma pasta fácil, por exemplo `Downloads/PowerGarage/`.
5. Abra o Blender.
6. Selecione o cubo inicial e pressione `X` e confirme a exclusão.
7. Vá em **File > Import > glTF 2.0 (.glb/.gltf)**.
8. Escolha o arquivo `sport-sedan.glb`.
9. Aguarde o modelo aparecer. A lista de objetos está no canto superior direito, no **Outliner**.
10. Salve uma cópia do trabalho em **File > Save As**, com o nome `power-garage-carro.blend`.

## 2. Conferir se existe um capô separado

1. No **Outliner**, expanda os objetos.
2. Procure nomes como `Hood`, `Bonnet`, `Capo`, `Body`, `CarBody`.
3. Clique no nome e observe o que fica laranja na visualização 3D.
4. Se apenas o capô ficar laranja, ótimo: essa peça pode ser movimentada.
5. Se o carro inteiro ficar laranja, a carroceria pode estar unificada. Precisaremos separar o capô em geometria.

### Separar o capô quando ele já for um conjunto de faces

1. Selecione a carroceria no modo **Object Mode**.
2. Pressione `Tab` para entrar em **Edit Mode**.
3. Mude para seleção de faces (`3`, sem usar o teclado numérico).
4. Selecione cuidadosamente as faces que pertencem **somente ao capô**.
5. Com essas faces selecionadas, pressione `P > Selection`.
6. Volte ao **Object Mode** com `Tab`.
7. Renomeie o novo objeto para `Hood_Mesh`.

**Atenção:** se o capô for soldado topologicamente ao restante da malha, precisarão ser reconstruídas as bordas internas, a espessura da chapa e o cofre. A simples separação não cria um compartimento de motor realista. Não separe faces aleatórias se ainda não souber identificar o capô.

## 3. Criar a dobradiça (Hood_Pivot)

Agora vamos criar o objeto que o site consegue controlar.

1. Selecione `Hood_Mesh`.
2. Entre em **Edit Mode** (`Tab`) e selecione uma ou mais faces ou vértices na posição da dobradiça do capô, normalmente na região próxima ao para-brisa.
3. Pressione `Shift + S > Cursor to Selected`: o cursor 3D vai para a posição da dobradiça.
4. Saia do **Edit Mode** (`Tab`).
5. Pressione `Shift + A > Empty > Plain Axes`. O Empty será criado na posição do cursor 3D.
6. Renomeie esse Empty no Outliner exatamente como **`Hood_Pivot`**.
7. Selecione o objeto `Hood_Mesh` e, segurando `Shift`, selecione `Hood_Pivot` **por último**.
8. Pressione `Ctrl + P > Object (Keep Transform)`.
9. Confira no Outliner que `Hood_Mesh` virou filho de `Hood_Pivot`.
10. Selecione **somente `Hood_Pivot`**.
11. Teste girar em torno do eixo local X, por exemplo com `R, X, X` seguido de `-60` (o eixo local pode variar conforme a orientação/importação). Se abrir na direção contrária, inverta o sinal.
12. **Desfaça a rotação de teste** (`Ctrl + Z`) para que o capô exporte **fechado por padrão**.

O site já procura `Hood_Pivot` e, ao clicar em **Abrir capô**, aplica aproximadamente **−1,06 radianos (−61°) ao eixo X local**. Caso o seu modelo abra no sentido errado, teremos que adaptar o sinal/eixo da animação no JavaScript.

## 4. Por que o motor talvez não apareça

A abertura do capô só funciona visualmente se houver geometria abaixo dele. O arquivo público Sport Sedan pode ter apenas o exterior e algum interior, sem cofre detalhado. **Ainda não confirmamos isso.**

Para obter o resultado que você imaginou, vamos precisar de:
- Superfície interna do capô;
- Compartimento do motor;
- Radiador, reservatórios, mangueiras, componentes e bateria;
- Ponto exato onde a bateria ficará;
- Texturas e materiais realistas;
- Ângulo de câmera preparado para a inspeção.

Você autorizou uma **visualização genérica realista** do motor no começo. Isso é viável, desde que fique claro que o cofre visual é ilustrativo, sem representar necessariamente o motor de um Celta.

## 5. Pintar o carro de preto de verdade

### Prévia rápida na Power Garage

1. Abra a página Power Garage.
2. Expanda **Ajustar pintura e faróis do modelo**.
3. No menu **Peça / material**, procure `Body`, `Paint`, `CarPaint` ou o nome mais próximo da lataria.
4. Clique em **Aplicar preto brilhante**.
5. Confira se apenas a carroceria mudou. Se vidro/rodas mudaram também, o modelo compartilha um material e precisa de correção no Blender.

Essa alteração é temporária.

### Cor permanente no Blender

1. Selecione o objeto da carroceria.
2. Abra **Material Properties** (ícone de esfera no painel da direita).
3. Escolha o material da pintura, sem confundir com borracha, vidros ou cromados.
4. Em `Principled BSDF`, use **Base Color** quase preta: por exemplo `#0A0E11`.
5. Use **Metallic** em torno de 0,5–0,75 e **Roughness** em torno de 0,17–0,27, depois ajuste visualmente.
6. Mantenha reflexos suficientes para a lataria não parecer apenas uma sombra preta.
7. Reexporte em GLB.

Os valores são pontos de partida artísticos, não configurações universais.

## 6. Fazer os faróis ficarem acesos

### Prévia rápida no navegador

1. Expanda **Ajustar pintura e faróis do modelo**.
2. Selecione o material correspondente à lente ou emissor do farol dianteiro.
3. Clique em **Acender material como farol**.
4. Confira se a luz apareceu somente nos faróis. O controle **Faróis ON/OFF** será habilitado para esse material.

### No Blender

1. Identifique as malhas dos faróis dianteiros.
2. Se houver somente uma textura de carroceria inteira, separe ou crie o material das lentes/emissores.
3. Nomeie as malhas ou materiais como `Headlight_L`, `Headlight_R`, `Front_Lamp` ou `DRL`.
4. No material Principled BSDF, configure uma cor clara e **Emission** azul-branco suave, com intensidade ajustada visualmente.
5. A luz emissiva faz a lente parecer acesa. Para iluminar fisicamente o asfalto adicione luzes reais na cena Three.js ou no projeto, com posição/direção corretas e desempenho adequado.
6. Exporte o GLB e teste novamente.

Não crie esferas brilhantes flutuando diante do carro: a luz tem que sair da região real dos faróis.

## 7. Exportar a versão definitiva

1. Deixe o capô fechado e a rotação da dobradiça no estado inicial.
2. Vá em **File > Export > glTF 2.0 (.glb/.gltf)**.
3. Selecione o formato **glTF Binary (.glb)**.
4. Verifique que geometria, hierarquia, materiais e texturas necessários serão exportados.
5. Salve como `power-garage-car.glb`.
6. Volte à Power Garage e use **Testar meu arquivo .GLB > Carro**.
7. Confira se os botões **Abrir capô** e **Faróis** ficam disponíveis e se funcionam corretamente.
8. Só quando aprovar, publique o modelo definitivo no GitHub, idealmente dentro de `assets/`.
9. Então alteramos a constante `DEMO_MODEL` em `assets/garage-showroom-v1.js` para `'assets/power-garage-car.glb'`.
10. Registre o crédito/licença do modelo original, quando aplicável.

## 8. Próxima cena cinematográfica

Quando a dobradiça e o motor existirem, o fluxo desejado será:

1. O sedã gira devagar no showroom.
2. O cliente seleciona o carro dele.
3. Clica em **Consultar baterias**.
4. A rotação para.
5. A câmera se aproxima.
6. O capô articulado abre.
7. A câmera sobrevoa e entra no compartimento.
8. A interface mostra baterias recomendadas e outras disponíveis.
9. Modelos 3D reais das baterias são posicionados no cofre.
10. O resultado é determinado pela **base técnica de compatibilidade**, não pela geometria visual do motor genérico.

Não considerar essa cena finalizada até existir geometria e dados corretos.

## Documentação de referência
- Blender: https://docs.blender.org/manual/pt/latest/addons/scene_gltf2.html
- Three.js GLTFLoader: https://threejs.org/docs/pages/GLTFLoader.html
- Three.js sistema de animação: https://threejs.org/manual/pages/animation-system.html

## Observação sobre direitos
O sedã foi obtido anteriormente da biblioteca vinish.dev e é usado com atribuição conforme a licença indicada. Preservar créditos e verificar as condições de qualquer modelo que substitua esse arquivo.
