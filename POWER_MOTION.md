# POWER MOTION — Hero 3D (primeira implementação)

## O que está funcionando no código

A primeira dobra utiliza Three.js e modelos GLB externos com licença CC0 para criar uma cena em 6 atos:

1. Falha de partida e luzes piscando.
2. Balão de chamada pelo motorista.
3. Moto de entrega da Power Baterias entra e estaciona.
4. Entregador aparece, capô abre (sobreposição 3D provisória) e bateria se desloca para o cofre.
5. Entregador e moto saem, carro liga e faróis ficam fortes.
6. Rodas giram, fumaça sutil e a sensação da estrada é animada em loop; a narrativa não reinicia sozinha.

Há botões para **rever** e **pausar**. A cena pausa fora da tela e respeita redução de movimento. Caso os modelos externos ou o WebGL não carreguem, uma fotografia estática da home permanece como alternativa.

**Limitação importante:** esta é a primeira montagem tridimensional em tempo real. O sedã é um modelo genérico, não uma Audi licenciada; o personagem não tem animação corporal detalhada de retirar a bateria e apertar parafusos, e a tampa do capô foi criada como peça sobreposta. Para atingir visual publicitário/cinematográfico, a evolução seguinte exigirá assets 3D específicos, rigging, animação de personagens, iluminação de estúdio mais refinada e revisão visual em diferentes dispositivos. Os testes de renderização no navegador devem ser feitos antes de considerar a produção concluída.

## Modelos 3D (CC0 1.0)

- Executive Sedan — https://3dassets.dev/assets/transport-collection-hd-executive-sedan-cfa7dfcf
- Neon Dispatch / Cargo Scooter — https://3dassets.dev/assets/neon-dispatch-electric-cargo-scooter
- Neon Dispatch / Static Courier — https://3dassets.dev/assets/neon-dispatch-static-street-courier

O site carrega via CDN as versões GLB desses assets; versões locais são recomendadas para a etapa final de produção. Os autores declaram licença CC0. Confira a licença e o funcionamento da CDN antes da publicação comercial definitiva.

Three.js: https://threejs.org/ (MIT).

## Arquivos envolvidos
- `index.html`: palco, import map e estados visuais.
- `assets/power-hero-3d.js`: renderização e transições.
- `styles.css`: composição do hero e controles.

## Não alterado nesta etapa
Power Garage (ainda ilustração), catálogo, serviço SOS, história, endereço e contatos.

## Próximos pontos
- Aprovar modelo, enquadramento e legibilidade em celular/desktop com screenshots reais.
- Produzir modelo de sedã premium de alta fidelidade, moto e personagem riggados.
- Animação explícita de ferramenta e bateria, sincronizada com o carro.
- Renderização de alta qualidade e assets locais otimizados, com poster e loop em WebM para aparelhos sem WebGL.
