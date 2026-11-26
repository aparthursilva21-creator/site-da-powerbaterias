# Power Garage V04 — refinamento de iluminação e motor

**Data:** 25/11/2026

## Implementado no GitHub (branch main)
- Nova página `power-garage.html` baseada no protótipo 3D enviado, mantendo header, logo e navegação do site.
- Módulo `garage-v4/power-garage-3d.js`: mantém giro, controle do carro e sequência de capô; reduz bloom, emissões dos faróis, intensidade das fontes verdes e brilho da plataforma.
- Bruma com sprites translúcidos atrás do carro, sem laser verde.
- Movimento do capô com limite de ângulo e ajuste pequeno de assentamento na posição fechada. Não substitui correção de geometria se a malha original tiver sobreposição.
- Mais detalhes geométricos no motor: mangueiras, cabos, abraçadeiras, tampa e conexões, ainda **ilustrativos**.
- `garage-v4/garage.css`: palco visual integrado ao fundo sem moldura de cartão, escala e botões aprimorados.
- `garage-v4/garage-logic.js`: corrige caso em que uma bateria maior que a faixa exemplo era considerada compatível apenas por caber no espaço; agora retorna aviso.
- `garage-v4/main.js`: WhatsApp correto, formulário, rótulos de simulação e carregamento condicional do modelo articulado.
- `garage-v4/catalog.js` e `engine-parts.js`: documentos de demonstração, **não catálogo validado**.

## MUITO IMPORTANTE — CAPÔ 3D

O arquivo `sport-sedan-hood.glb` usado no protótipo que o proprietário testou **ainda não está no GitHub**. Lá está `sport-sedan.glb`, sem a peça independente no mesmo formato.

O site agora procura primeiro `assets/sport-sedan-hood.glb` e, quando não o encontra, mostra o modelo antigo `sport-sedan.glb` sem afirmar que consegue abrir o capô. Exibe uma mensagem orientando o envio.

### Um passo necessário para ativar a versão completa:

1. Obtenha o arquivo original `sport-sedan-hood.glb` que foi enviado na conversa (aprox. 4 MB).
2. Abra o repositório: https://github.com/aparthursilva21-creator/site-da-powerbaterias
3. Entre na pasta `assets`, depois clique em `Add file > Upload files`.
4. Envie `sport-sedan-hood.glb` **com esse nome exato**, sem renomear.
5. Salve o commit na `main` e atualize `power-garage.html` após a publicação.
6. O site detectará `Hood` dentro do arquivo e reativará a sequência do capô e do motor.

**Observação:** o modelo ainda pode conter pequena sobreposição de polígonos na posição fechada, dependendo da geometria. A correção definitiva exige consertar o GLB/encaixe; o código já reduz a ultrapassagem da animação e o excesso visual. Não afirmar conserto absoluto sem renderização real.

## Testes executados
- Os sete arquivos HTML/CSS/JS referenciados foram conferidos no GitHub.
- JavaScript revisado passou por verificação sintática.
- Testes puros: Celta exemplo 60Ah = encaixe simulado; 40Ah = encaixa, mas aviso; 100Ah = não cabe; 70Ah acima da faixa em suporte maior = aviso.
- CSS revisado possui chaves equilibradas.
- **Pendente:** teste visual real do WebGL/Three.js no navegador, após publicar o GLB de capô.

## Próxima evolução
O cofre atual continua sendo geometria procedural. Para atingir qualidade cinematográfica será preciso modelar ou licenciar um motor 3D com proporções, peças, conexões, tampas e texturas convincentes, mantendo a visualização genérica explicitamente identificada. As baterias Heliar e Moura exigem SKUs e dimensões reais para aplicação, além de seus modelos 3D próprios.
