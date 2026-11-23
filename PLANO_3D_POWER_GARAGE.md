# POWER GARAGE — caminho real até o carro 3D e o cofre do veículo

Atualizado em 23 de novembro de 2026.

## O que existe hoje
- `power-garage.html`: seletor de marca, modelo, ano e campo de versão e consulta pelo WhatsApp.
- Showroom com fotografia **2D** do sedã preto. Não há malha 3D real, rotação de veículo, capô articulado nem cofre específico.
- Fotografias de referência Heliar e Moura na home, catálogo e Garage.
- Não há motor de compatibilidade implementado, nem estoque eletrônico atualizado.

## Por que o carro não gira ainda
Uma fotografia 2D só registra um único ponto de vista. Rodar a foto no CSS distorce o veículo; não mostra porta, traseira e lataria sob novos ângulos. Para um giro verdadeiro é preciso um modelo tridimensional com geometria, texturas e materiais ou uma sequência de renders reais produzida previamente.

## Solução recomendada

**Começar com um único sedã preto premium, com uso comercial permitido, em GLB/GLTF**. Precisa de:
- Geometria de lataria, rodas, vidros, faróis e interior;
- Texturas PBR apropriadas (baseColor, metalness, roughness, normal);
- Desempenho aceitável no navegador;
- Capô separado e pivô correto, se a transição de abertura usar o mesmo modelo;
- Licença verificável para uso comercial na Power Baterias.

Pipeline:
1. Encontrar e licenciar um modelo de alta qualidade, ou desenvolver no Blender;
2. Preparar materiais, texturas e capô articulado;
3. Exportar GLB otimizado (compressão Draco/Meshopt e texturas KTX2 conforme projeto);
4. Criar showroom Three.js com rotação suave, arraste pelo mouse/toque, pausa e restauração;
5. Criar iluminação com sombras de contato e reflexo controlado de estúdio;
6. Pausar renderização quando a aba estiver oculta ou modelo fora da tela;
7. Fallback estático e modo reduzido para equipamentos modestos.

**Alternativa inicial**: vídeo pré-renderizado WebM de um carro girando em 360° num estúdio profissional. Tende a ser mais fácil para obter aparência realista, mas não permite controle livre da câmera ou interação técnica com o capô.

## A parte difícil: cofre real do Celta
Precisamos de modelo, ano-modelo, versão/motorização e uma foto real/licenciada do compartimento daquele carro. Uma foto de outro motor, um desenho abstrato ou um 3D genérico não devem receber etiqueta "Celta". Para a animação de encaixe, a posição, a escala e a orientação da bateria devem ser medidas/conferidas.

## Bateria em 3D
- Para cada SKU comercializado, confirmar marca, fotos do produto **exato**, dimensões, borne, polaridade, tensão, Ah, CCA e tecnologia;
- Criar modelo 3D físico coerente com medidas;
- Adicionar textura com rótulo original autorizado;
- Ligar a animação de colocação apenas à geometria validada;
- Se não houver regra técnica, exibir "compatibilidade não verificada", nunca o resultado "serve" baseado em animação.

## Referência dos fabricantes
- Heliar — catálogo automotivo: https://www.heliar.com/produtos/baterias-automotivas
- Heliar — busca por veículo: https://www.heliar.com/produtos/resultados-da-pesquisa-de-produtos
- A Heliar organiza produtos convencionais, EFB e AGM. Isso depende de aplicações específicas, não apenas de amperagem.
- Moura — página institucional: https://www.moura.com.br

A seleção por marca/modelo/ano do site do fabricante é uma **referência de experiência e possível fonte para consulta técnica manual**. Não pressupor integração automática/API sem autorização/documentação.

## Fotografias já integradas
- Heliar enviada pelo usuário: `assets/bateria-heliar-original.webp` (otimizada por corte e compressão, versão em etiqueta verde);
- Moura sem embalagem (foto correspondente à referência do usuário): URL externa temporária em `baterias.html`;
- Moura com apresentação branca/azul/amarela: URL externa temporária em `baterias.html`.

**Atenção:** as fotos Moura estão hospedadas em páginas de terceiros. Para publicação comercial definitiva, substituir por cópias locais dos arquivos enviados pelo proprietário e confirmar direitos de uso. Fotos não identificam por si só SKU, estoque, prazo de garantia ou compatibilidade.

## Caminho de execução recomendado
- **Sprint 1:** decidir GLB 3D licenciado versus vídeo de giro; inspecionar assets e criar teste isolado no `power-garage.html` sem afetar a home;
- **Sprint 2:** aprovar iluminação/material/câmera e tornar a rotação real em desktop e celular;
- **Sprint 3:** primeiro cofre real do Celta após documentação de ano e motor;
- **Sprint 4:** fotografias/SKUs verificados Heliar/Moura e modelos tridimensionais;
- **Sprint 5:** matriz de compatibilidade técnica com aprovação;
- **Sprint 6:** fluxo de tentativa de encaixe, explicação, sugestões e WhatsApp.

## O que pedir ao responsável da loja
1. Identificar quais referências de Heliar/Moura são realmente vendidas (foto da etiqueta/SKU).
2. Confirmar um Chevrolet Celta e versão exata para o primeiro motor (pode ser um carro disponível para fotografar).
3. Autorizar uso das fotos reais no site.
4. Se houver orçamento, adquirir/licenciar um modelo 3D automotivo de alta qualidade; caso contrário, avaliar alternativa de giro pré-renderizado.

Sem essas informações, o frontend ainda pode avançar, mas não é responsável marcar uma bateria como "compatível".
