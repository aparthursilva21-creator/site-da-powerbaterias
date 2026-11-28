import { action, escape, intro, photo, site, wa } from '../shared.mjs';
import { articles, references, sourcesCheckedOn } from '../data/articles.mjs';

const styles = ['editorial'];
const consultation = (subject) => wa(`Olá! Gostaria de falar com a Power Baterias sobre ${subject}.`);
const articlePath = (article) => `artigo-${article.slug}.html`;
const sourcesCheckedLabel = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'UTC' })
  .format(new Date(sourcesCheckedOn));

const images = {
  battery: { src: './assets/images/battery.webp', alt: 'Bateria automotiva preta com dois terminais, um deles vermelho', width: 1536, height: 334 },
  service: { src: './assets/images/service.webp', alt: 'Mãos enluvadas junto à bateria no compartimento do motor', width: 1120, height: 840 },
  emergency: { src: './assets/images/sos.webp', alt: 'Automóvel escuro parado com os faróis acesos', width: 1030, height: 328 },
};

function editorialImage(key, className = '') {
  const { src, alt, width, height } = images[key];
  return `<figure class="editorial-figure editorial-figure--${key} ${className}">
    ${photo(src, alt, { width, height })}
    <figcaption>Imagem conceitual</figcaption>
  </figure>`;
}

function listSources(sources) {
  return `<ul class="editorial-sources">${sources.map(([label, url]) =>
    `<li><a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(label)}</a></li>`
  ).join('')}</ul>`;
}

function articleCard(article, featured = false) {
  return `<article class="knowledge-item${featured ? ' knowledge-item--featured' : ''}">
    ${featured ? editorialImage(article.image) : ''}
    <div class="knowledge-item-text">
      <p class="kicker">${escape(article.topic)}</p>
      <h2>${featured ? escape(article.title) : `<a href="./${articlePath(article)}">${escape(article.title)}</a>`}</h2>
      <p class="muted">${escape(article.description)}</p>
      ${featured ? action(`./${articlePath(article)}`, 'Ler o guia', { variant: 'secondary' }) : ''}
    </div>
  </article>`;
}

const knowledgePage = {
  path: 'conteudos.html',
  title: 'Central de Conhecimento',
  description: 'Guias da Power Baterias sobre compatibilidade, bateria fraca, Start-Stop, garantia, manutenção e descarte.',
  image: images.battery.src,
  styles,
  body: `
    ${intro('Central de conhecimento', 'Entenda a bateria do seu carro.', 'Guias sobre partida, compatibilidade, manutenção e os cuidados depois da troca.')}
    <section class="section wrap knowledge-list" aria-label="Guias e artigos">
      ${articleCard(articles[0], true)}
      <div class="knowledge-grid">${articles.slice(1).map((article) => articleCard(article)).join('')}</div>
    </section>
  `,
};

const articlePages = articles.map((article) => {
  const related = articles.filter((item) => item.topic === article.topic && item !== article);
  return {
    path: articlePath(article),
    title: article.title,
    description: article.description,
    image: images[article.image].src,
    message: `Olá! Li o artigo “${article.title}” e gostaria de orientação para o meu veículo.`,
    styles,
    body: `
      <div class="article-intro">${intro(article.topic, article.title, article.description)}</div>
      <div class="wrap article-layout">
        <aside class="article-aside">
          <a class="editorial-back" href="./conteudos.html">Central de Conhecimento</a>
          <nav aria-label="Nesta página">
            <p class="kicker">Neste guia</p>
            <ul>${article.sections.map(([heading], index) =>
              `<li><a href="#secao-${index + 1}">${escape(heading)}</a></li>`
            ).join('')}</ul>
          </nav>
        </aside>
        <article class="editorial-prose">
          ${editorialImage(article.image)}
          ${article.sections.map(([heading, ...paragraphs], index) => `
            <section class="editorial-chapter" id="secao-${index + 1}">
              <h2>${escape(heading)}</h2>
              ${paragraphs.map((paragraph) => `<p>${escape(paragraph)}</p>`).join('')}
            </section>
          `).join('')}
          <section class="editorial-chapter" id="fontes">
            <h2>Fontes consultadas</h2>
            <p class="article-source-date">Consulta em <time datetime="${sourcesCheckedOn}">${escape(sourcesCheckedLabel)}</time>.</p>
            ${listSources(article.sources)}
          </section>
          <div class="editorial-actions">
            ${action(`./${article.link[0]}`, article.link[1])}
            ${action(consultation(`o guia “${article.title}”`), 'Falar com um especialista', { variant: 'secondary', external: true })}
          </div>
          ${related.length ? `<section class="editorial-chapter">
            <h2>Leia também</h2>
            <ul class="editorial-sources">${related.map((item) =>
              `<li><a href="./${articlePath(item)}">${escape(item.title)}</a></li>`
            ).join('')}</ul>
          </section>` : ''}
        </article>
      </div>
    `,
  };
});

const articleIndex = {
  path: 'artigo.html',
  title: 'Guias sobre baterias automotivas',
  description: 'Índice de guias da Central de Conhecimento da Power Baterias.',
  styles,
  noindex: true,
  body: `
    ${intro('Guias', 'Escolha um artigo.', 'Encontre informações sobre baterias, partida e manutenção automotiva.')}
    <section class="section wrap editorial-prose" aria-label="Guias disponíveis">
      <ul class="editorial-sources">${articles.map((article) =>
        `<li><a href="./${articlePath(article)}">${escape(article.title)}</a></li>`
      ).join('')}</ul>
      ${action('./conteudos.html', 'Voltar à Central de Conhecimento', { variant: 'secondary' })}
    </section>
  `,
};

const serviceCopy = {
  baterias: 'Informe marca, modelo, ano e versão do veículo para orientar a escolha. Confira a tecnologia e as especificações indicadas para sua aplicação.',
  instalacao: 'Combine o atendimento para a montagem da peça adequada e tire dúvidas sobre os cuidados depois da substituição.',
  testes: 'Relate falhas de partida ou descargas recorrentes para orientar a avaliação da peça antes de decidir pela troca.',
  emergencial: 'Informe o que aconteceu e, se quiser, a região em que o carro está. A equipe orienta o próximo passo pelo WhatsApp.',
  'start-stop': 'Identifique se o veículo exige EFB ou AGM e confirme a aplicação conforme o manual ou catálogo técnico.',
  lampadas: 'Informe a posição da lâmpada e o veículo para consultar a peça compatível e a troca.',
  palhetas: 'Consulte as medidas e o encaixe das palhetas para recuperar a limpeza do para-brisa.',
  oleo: 'Consulte o atendimento para troca de óleo e filtro e informe o motor do veículo para conferir as especificações.',
};

const serviceDetails = {
  testes: { corner: 'top-left', alt: 'Aparelho de teste conectado a uma bateria automotiva' },
  lampadas: { corner: 'top-right', alt: 'Detalhe de um farol automotivo' },
  palhetas: { corner: 'bottom-left', alt: 'Palheta sobre um para-brisa molhado' },
  oleo: { corner: 'bottom-right', alt: 'Filtro de óleo e tampa de abastecimento em uma bancada' },
};

const serviceImages = { baterias: 'battery', instalacao: 'service', emergencial: 'emergency', 'start-stop': 'battery' };

function serviceImage(id) {
  const detail = serviceDetails[id];
  if (!detail) return editorialImage(serviceImages[id] || 'service', 'service-thumbnail');
  return `<figure class="editorial-figure service-thumbnail">
    <div class="service-quadrant service-quadrant--${detail.corner}">
      ${photo('./assets/images/maintenance.webp', detail.alt, { width: 1000, height: 1000 })}
    </div>
    <figcaption>Imagem conceitual</figcaption>
  </figure>`;
}

const servicesPage = {
  path: 'servicos.html',
  title: 'Serviços automotivos em Samambaia Norte',
  description: 'Conheça os serviços da Power Baterias em Brasília, incluindo venda e instalação, teste de bateria e manutenção automotiva.',
  image: images.service.src,
  message: 'Olá! Gostaria de informações sobre os serviços da Power Baterias.',
  styles,
  body: `
    ${intro('Serviços em Brasília, DF', 'Da partida à manutenção.', 'Venda, instalação e testes de bateria, além de serviços para o dia a dia do seu veículo.')}
    <section class="section wrap service-layout" aria-label="Serviços da Power Baterias">
      ${editorialImage('service', 'service-photo')}
      <div class="service-list">${site.services.map(({ id, title, description }) => `
        <article class="service-entry" id="servico-${escape(id)}">
          ${serviceImage(id)}
          <div>
            <h2>${escape(title)}</h2>
            <p>${escape(serviceCopy[id] || description)}</p>
            ${action(consultation(title.toLowerCase()), `Consultar ${title.toLowerCase()}`, { variant: 'secondary', external: true })}
          </div>
        </article>
      `).join('')}</div>
    </section>
    <section class="section wrap">
      <div class="editorial-band">
        <div><p class="kicker">Power SOS</p><h2>O carro ficou parado?</h2><p class="muted">Conte o que aconteceu e peça orientação para o próximo passo.</p></div>
        ${action('./power-sos.html', 'Abrir o Power SOS')}
      </div>
    </section>
  `,
};

const aboutPage = {
  path: 'sobre.html',
  title: 'Sobre a Power Baterias',
  description: 'Conheça a Power Baterias, loja de baterias automotivas e instalação em Samambaia Norte, Brasília.',
  styles,
  body: `
    ${intro('Sobre a Power Baterias', 'Energia para seguir viagem.', 'Loja de baterias automotivas e atendimento especializado em Samambaia Norte, Brasília.')}
    <section class="section wrap about-layout" aria-labelledby="about-purpose">
      <div>
        <p class="kicker">Brasília, DF</p>
        <h2 id="about-purpose">Orientação para cada partida.</h2>
        <p>A Power Baterias reúne venda, instalação e teste de baterias em Samambaia Norte. Ao solicitar atendimento, informe o veículo ou o que aconteceu na partida para receber orientação sobre o próximo passo.</p>
        <p>Orientamos a consulta para veículos nacionais e importados, incluindo aplicações Start-Stop. Trabalhamos com ${site.brands.map(escape).join(' e ')}.</p>
        <div class="editorial-actions">
          ${action('./servicos.html', 'Conhecer os serviços')}
          ${action('./baterias.html', 'Ver o catálogo', { variant: 'secondary' })}
        </div>
      </div>
      ${site.storePhoto ? `<figure class="editorial-figure about-photo">${photo(site.storePhoto, 'Fachada da loja Power Baterias em Samambaia Norte')}</figure>` : editorialImage('battery', 'about-photo')}
    </section>
    <section class="section wrap" aria-label="Loja em Samambaia Norte">
      <div class="editorial-band">
        <div>
          <p class="kicker">Samambaia Norte</p>
          <h2>Conheça a loja.</h2>
          <p class="muted">${escape(site.address)}</p>
        </div>
        <div class="editorial-actions">
          ${action('./contato.html', 'Contato e localização')}
          ${action(site.googleBusinessUrl || site.mapsUrl, site.googleBusinessUrl ? 'Ver avaliações no Google' : 'Buscar a loja no Google Maps', { variant: 'secondary', external: true })}
        </div>
      </div>
    </section>
  `,
};

const providerLinks = {
  whatsapp: ['WhatsApp · Política de privacidade', 'https://www.whatsapp.com/legal/privacy-policy/?lang=pt_br'],
  google: ['Google · Política de privacidade', 'https://policies.google.com/privacy?hl=pt-BR'],
  instagram: ['Instagram · Política de privacidade', 'https://privacycenter.instagram.com/policy/'],
  github: ['GitHub Docs · Sobre a hospedagem GitHub Pages', 'https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages'],
};

function legalPage({ path, title, description, sections, sources, subject }) {
  return {
    path, title, description, styles,
    body: `
      ${intro('Informações da loja', title, description)}
      <article class="section wrap legal-prose editorial-prose">
        ${sections.map(([heading, ...paragraphs]) => `
          <section class="editorial-chapter">
            <h2>${escape(heading)}</h2>
            ${paragraphs.map((paragraph) => `<p>${escape(paragraph)}</p>`).join('')}
          </section>
        `).join('')}
        ${sources.length ? `<section class="editorial-chapter"><h2>Referências</h2>${listSources(sources)}</section>` : ''}
        <div class="editorial-actions">
          ${action(consultation(subject), 'Falar com a Power Baterias', { external: true })}
          ${action('./contato.html', 'Ver canais de contato', { variant: 'secondary' })}
        </div>
      </article>
    `,
  };
}

const legalPages = [
  legalPage({
    path: 'privacidade.html',
    title: 'Política de privacidade',
    description: 'Saiba como os dados são tratados ao consultar o site e solicitar atendimento.',
    subject: 'privacidade e dados pessoais',
    sections: [
      ['Quem responde pelo atendimento', `A Power Baterias recebe solicitações pelo WhatsApp ${site.phone} e atende em ${site.address}. Use o canal de contato ao final da página para assuntos relacionados a dados pessoais.`],
      ['Consultas e formulários', 'A consulta do Power Garage e os campos do Power SOS são processados no navegador. O site institucional não mantém uma base de dados com essas informações. Ao abrir o WhatsApp, o conteúdo usado para preparar a mensagem é transferido ao serviço para que você revise e decida se deseja enviar. A Power Baterias recebe a conversa quando você a envia.'],
      ['Localização e serviços externos', 'A localização do Power SOS é opcional. Ao acionar o botão de localização, você pode conceder ou negar acesso pelo navegador. A posição aproximada é incluída como um link para o Google Maps na mensagem e pode ser removida antes de seguir. Ao abrir o mapa interativo ou seguir links para Google, Instagram e WhatsApp, seu navegador se conecta a esses serviços e o tratamento também segue as respectivas políticas.'],
      ['Uso no atendimento', 'Os dados enviados na conversa podem ser usados para responder ao pedido, analisar a compatibilidade, preparar um orçamento, combinar um serviço ou tratar assuntos de garantia. Envie apenas as informações necessárias ao atendimento. O site não pede CPF ou cadastro. A guarda de conversas e documentos depende da finalidade do atendimento e das obrigações aplicáveis.'],
      ['Hospedagem e registros técnicos', 'O provedor de hospedagem recebe dados técnicos de conexão necessários para servir o site e poderá guardar registros de segurança. No GitHub Pages, o GitHub informa que registra endereços IP para fins de segurança.'],
      ['Seus direitos', 'Nos termos da LGPD, você pode pedir confirmação de tratamento, acesso e correção. Conforme o caso, também pode solicitar eliminação, bloqueio, anonimização ou informações sobre compartilhamento. Entre em contato pelo canal abaixo. A ANPD disponibiliza informações sobre os direitos e seus canais de atendimento.'],
    ],
    sources: [references.lgpd, references.anpdDireitos, providerLinks.whatsapp, providerLinks.google, providerLinks.instagram, providerLinks.github],
  }),
  legalPage({
    path: 'termos.html',
    title: 'Termos de uso',
    description: 'Condições de navegação e consulta no site institucional da Power Baterias.',
    subject: 'os termos de uso do site',
    sections: [
      ['Finalidade do site', 'O site apresenta a loja, o catálogo, os serviços e guias sobre baterias automotivas. Solicitações de atendimento e orçamento são encaminhadas pelo WhatsApp. As condições comerciais aplicáveis a cada atendimento são informadas no respectivo canal.'],
      ['Consultas de compatibilidade', 'O Power Garage mostra as informações disponíveis para as configurações cadastradas. Confirme a aplicação exata com a equipe antes de comprar ou instalar. Dependendo da versão, podem ser necessários dados adicionais. Os artigos têm finalidade educativa e uma avaliação presencial pode ser necessária para identificar a causa de uma falha.'],
      ['Imagens, marcas e links', 'As marcas de produto identificam seus respectivos titulares. A legenda indica os cenários conceituais. Links externos levam a serviços independentes com termos e políticas próprios.'],
      ['Direitos do consumidor e atendimento', 'Aplicam-se as normas brasileiras pertinentes, incluindo o Código de Defesa do Consumidor. Para esclarecer dúvidas ou comunicar um problema de funcionamento do site, use os canais de atendimento da loja.'],
    ],
    sources: [references.cdc],
  }),
  legalPage({
    path: 'garantias.html',
    title: 'Garantias, trocas e devoluções',
    description: 'Consulte seus direitos e saiba como pedir a avaliação de um produto ou serviço.',
    subject: 'garantia, troca ou devolução',
    sections: [
      ['Garantia legal', 'Para produtos e serviços duráveis, o Código de Defesa do Consumidor estabelece prazo de 90 dias para reclamar de vício aparente ou de fácil constatação. A contagem parte da entrega do produto ou do término do serviço. Para vício oculto, o prazo se inicia quando o problema fica evidente.'],
      ['Garantia contratual', 'Quando oferecida, a garantia contratual complementa a legal e é formalizada em termo escrito. Consulte o termo aplicável ao modelo para conferir cobertura, duração e procedimento de atendimento.'],
      ['Trocas e devoluções', 'O direito de arrependimento do art. 49 do CDC se aplica à contratação fora do estabelecimento comercial, quando cabível, no prazo de sete dias a contar da assinatura ou do recebimento, conforme o caso. Para compras presenciais sem vício, consulte a loja sobre as condições comerciais de troca.'],
      ['Como solicitar avaliação', 'Identifique o produto ou serviço, relate o que aconteceu e informe a data da compra. Tenha em mãos a comprovação da compra e o termo de garantia, se disponível. Entre em contato para receber orientação sobre o procedimento aplicável.'],
    ],
    sources: [references.cdc],
  }),
  legalPage({
    path: 'cookies.html',
    title: 'Política de cookies',
    description: 'Confira os recursos de armazenamento e os serviços externos usados durante a navegação.',
    subject: 'cookies e privacidade',
    sections: [
      ['Armazenamento neste site', 'O código do site não grava cookies nem usa o armazenamento local ou de sessão do navegador. A interface não instala ferramentas de análise ou publicidade. As preferências de movimento são lidas da configuração do dispositivo.'],
      ['Quando a conexão sai do site', 'O mapa do Google é carregado somente após você acionar o controle na página de contato. O mapa e os links externos, quando abertos, seguem as políticas de seus provedores, que podem usar cookies ou tecnologias semelhantes. Você pode consultar o endereço e copiar os dados da loja sem carregar o mapa.'],
      ['Controle no navegador', 'As configurações de privacidade do navegador permitem bloquear, revisar e limpar cookies e dados de sites. Para entender como os dados fornecidos no atendimento são tratados, consulte a Política de Privacidade no rodapé.'],
    ],
    sources: [references.anpdCookies, providerLinks.google],
  }),
];

export const pages = [servicesPage, aboutPage, knowledgePage, articleIndex, ...articlePages, ...legalPages];
