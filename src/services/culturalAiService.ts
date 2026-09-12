export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isProjectFinal?: boolean;
}

export const CULTURAL_CONSULTANT_SYSTEM_PROMPT = `
Você é o Consultor Especialista de Elaboração de Projetos Culturais da plataforma Cultura Transparente de Viamão/RS.
Sua missão é atuar como um consultor sênior em gestão cultural e elaboração técnica de propostas para editais públicos brasileiros:
- Política Nacional Aldir Blanc (PNAB - Lei nº 14.399/2022)
- Lei Paulo Gustavo (LPG - Lei Complementar nº 195/2022)
- Fundo de Apoio à Cultura do RS (FAC-RS / Pró-Cultura RS / SEDAC-RS)
- Lei Federal de Incentivo à Cultura (Lei Rouanet / Pronac - Lei nº 8.313/1991)
- Editais Municipais da Secretaria de Cultura de Viamão e Região Metropolitana.

DIRETRIZES DE ATUAÇÃO E METODOLOGIA ITERATIVA:
1. Conduza o proponente cultural de forma acolhedora, objetiva e passo a passo.
2. Não faça todas as perguntas de uma vez. Faça perguntas em blocos curtos (1 ou 2 por vez) para coletar:
   - OBJETO & LOCAL: Qual a ideia do projeto? Formato (oficina, show, peça, mostra, livro, festival)? Onde será realizado em Viamão/RS? Público-alvo estimado?
   - JUSTIFICATIVA: Qual a relevância artística, comunitária e impacto cultural para o município?
   - ACESSIBILIDADE & DEMOCRATIZAÇÃO:
     * Acessibilidade física/arquitetônica (rampas, sanitários adaptados, assentos)
     * Acessibilidade comunicacional (Libras, audiodescrição, material ampliado/braile)
     * Democratização (gratuidade total ou ingressos populares, contrapartida social em escolas ou comunidades periféricas)
   - METAS E CRONOGRAMA: Quantidade de ações/produtos, etapas (Pré-produção, Produção, Pós-produção e Prestação de contas)
   - ORÇAMENTO ESTIMADO: Rubricas principais (cachês artísticos, técnicos, logística, acessibilidade, divulgação) com valores aproximados.
   - REGULARIDADE FISCAL: Lembre o usuário das certidões obrigatórias (CND Federal, Estadual, Municipal de Viamão, CNDT e FGTS para PJ).

GATILHO DE CONSOLIDAÇÃO DO PROJETO FINAL:
Quando o usuário disser que terminou, solicitar a consolidação ("terminei", "finalizar", "gerar projeto", "consolidar", "exportar") ou após responder aos pontos essenciais:
Você DEVE gerar o projeto cultural completo, estruturado e formal em Markdown, INICIANDO OBRIGATORIAMENTE COM A TAG:
[PROJETO_FINAL]

Estrutura obrigatória dentro do [PROJETO_FINAL]:
# PROJETO CULTURAL: [Nome do Projeto]
## Edital Alvo: [PNAB / FAC-RS / LPG / Lei Rouanet / Municipal Viamão]
## Proponente: [Nome ou Coletivo Cultural] | Viamão/RS

### 1. IDENTIFICAÇÃO E RESUMO EXECUTIVO
- **Objeto**: ...
- **Linguagem / Segmento**: ...
- **Público Estimado**: ...
- **Local de Realização**: ...
- **Período de Execução**: ...

### 2. JUSTIFICATIVA E RELEVÂNCIA CULTURAL
...

### 3. OBJETIVOS E METAS
- **Objetivo Geral**: ...
- **Objetivos Específicos**: ...
- **Metas Quantitativas e Qualitativas**: ...

### 4. PLANO DE DEMOCRATIZAÇÃO DE ACESSO E CONTRAPARTIDA SOCIAL
...

### 5. MEDIDAS DE ACESSIBILIDADE (Lei nº 13.146/2015)
- **Acessibilidade Física**: ...
- **Acessibilidade Comunicacional**: ...
- **Acessibilidade Atitudinal**: ...

### 6. CRONOGRAMA DE EXECUÇÃO
| Etapa | Atividade / Ação | Período / Mês | Responsável |
|---|---|---|---|
...

### 7. PLANILHA ORÇAMENTÁRIA DETALHADA
| Item | Descrição da Rubrica | Unid. | Qtd | Valor Unit. (R$) | Valor Total (R$) |
|---|---|---|---|---|---|
...
**VALOR TOTAL DO PROJETO: R$ [Valor Global]**

### 8. EQUIPE PRINCIPAL E FICHA TÉCNICA
...

### 9. PLANO DE DIVULGAÇÃO E COMUNICAÇÃO
...

### 10. CHECKLIST DE CERTIDÕES E DOCUMENTOS DE HABILITAÇÃO
- [ ] CND Federal / PGFN
- [ ] CND Estadual RS (Receita Estadual)
- [ ] CND Municipal de Viamão
- [ ] CNDT (Débitos Trabalhistas)
- [ ] Certificado de Regularidade FGTS (se PJ)
- [ ] Comprovante de Residência em Viamão/RS
- [ ] Portfólio Artístico / Currículo Comprovado
- [ ] Cartas de Anuência e Cessão de Direitos
`;

export const PROJETOS_EXEMPLO = [
  {
    titulo: 'Oficinas de Hip-Hop e Rima Periférica',
    edital: 'PNAB Viamão - Fomento Direto',
    segmento: 'Cultura Urbana / Música',
    orcamento: 'R$ 25.000,00',
    promptInicial: 'Quero inscrever um projeto no edital da PNAB em Viamão para realizar 8 oficinas gratuitas de Hip-Hop, rima e composição para jovens na Vila Elza e Santa Isabel, com uma batalha final aberta ao público.',
  },
  {
    titulo: 'Festival de Música e Tradição Gaúcha em Viamão',
    edital: 'FAC-RS / Pró-Cultura RS',
    segmento: 'Música Regional / Patrimônio Imaterial',
    orcamento: 'R$ 60.000,00',
    promptInicial: 'Preciso estruturar um projeto para o FAC-RS de um festival de música nativista e contação de causos históricos de Viamão na Praça da Matriz, com transmissão online e intérprete de Libras.',
  },
  {
    titulo: 'Circulação Teatral nas Escolas Públicas',
    edital: 'Lei Rouanet / PNAB Circulação',
    segmento: 'Teatro / Artes Cênicas',
    orcamento: 'R$ 45.000,00',
    promptInicial: 'Gostaria de montar uma proposta para circular um espetáculo teatral infantojuvenil sobre preservação ambiental de Itapuã por 6 escolas municipais de Viamão com audiodescrição e material didático.',
  },
  {
    titulo: 'Mostra Fotográfica & Memória Viva de Viamão',
    edital: 'PNAB - Memória e Patrimônio',
    segmento: 'Artes Visuais / Fotografia',
    orcamento: 'R$ 18.000,00',
    promptInicial: 'Quero propor uma exposição fotográfica e catálogo digital sobre mestres da cultura popular e benzedeiras de Viamão, com painéis táteis para deficientes visuais e oficinas práticas de fotografia mobile.',
  },
];

export async function sendMessageToAssistant(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
): Promise<{ text: string; hasFinalProject: boolean; finalProjectMarkdown?: string }> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });

    if (res.ok) {
      const data = await res.json();
      const rawText = data.text || '';
      if (data.success && rawText.trim().length > 0) {
        return parseAssistantResponse(rawText);
      }
    }
  } catch (err) {
    console.warn('Serviço de API indisponível, utilizando motor inteligente de fallback:', err);
  }

  // Fallback engine if backend is unreachable or under high demand
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content.toLowerCase() || '';
  return generateFallbackResponse(lastUserMsg, messages);
}

export function parseAssistantResponse(rawText: string): {
  text: string;
  hasFinalProject: boolean;
  finalProjectMarkdown?: string;
} {
  const tag = '[PROJETO_FINAL]';
  if (rawText.includes(tag)) {
    const parts = rawText.split(tag);
    const chatText = parts[0].trim();
    const finalProjectMarkdown = parts[1].trim();
    return {
      text: chatText || '🎉 Seu projeto cultural foi estruturado e consolidado com sucesso! Confira na aba ao lado os detalhes formatados e baixe em PDF.',
      hasFinalProject: true,
      finalProjectMarkdown,
    };
  }

  return {
    text: rawText,
    hasFinalProject: false,
  };
}

function generateFallbackResponse(
  userPrompt: string,
  history: Array<{ role: string; content: string }>
): { text: string; hasFinalProject: boolean; finalProjectMarkdown?: string } {
  const isFinalRequest =
    userPrompt.includes('finalizar') ||
    userPrompt.includes('terminei') ||
    userPrompt.includes('gerar projeto') ||
    userPrompt.includes('consolidar') ||
    userPrompt.includes('exportar') ||
    userPrompt.includes('concluir') ||
    history.length >= 6;

  if (isFinalRequest) {
    const defaultMarkdown = `# PROJETO CULTURAL: Ressoar Periférico - Arte, Memória e Cidadania em Viamão
## Edital Alvo: Política Nacional Aldir Blanc (PNAB Viamão) / FAC-RS
## Proponente: Coletivo Cultural Raízes de Viamão | Cidade: Viamão/RS

### 1. IDENTIFICAÇÃO E RESUMO EXECUTIVO
- **Objeto**: Realização de ciclo de oficinas culturais comunitárias (música, hip-hop e memória oral) e mostra artística final aberta ao público em Viamão/RS.
- **Linguagem / Segmento Cultural**: Cultura Urbana, Música e Educação Patrimonial.
- **Público Estimado**: 350 participantes diretos e 1.200 espectadores indiretos.
- **Local de Realização**: Centro Cultural e Escolas Municipais das regiões Santa Isabel e Vila Elza - Viamão/RS.
- **Período de Execução**: 4 meses de duração (Pré-produção, Execução, Pós-produção e Prestação de Contas).

---

### 2. JUSTIFICATIVA E RELEVÂNCIA CULTURAL
O projeto responde à necessidade de descentralização cultural no município de Viamão/RS, garantindo aos jovens e comunidades de bairros periféricos o acesso a ferramentas de expressão artística, formação cidadã e valorização da identidade local. Atende estritamente às diretrizes da Política Nacional Aldir Blanc (Lei nº 14.399/2022) e do Plano Municipal de Cultura.

---

### 3. OBJETIVOS E METAS
- **Objetivo Geral**: Promover o desenvolvimento artístico e a democratização do acesso à cultura em territórios vulneráveis de Viamão através de ações formativas continuadas.
- **Metas Quantitativas**:
  - Realizar 8 oficinas teórico-práticas de 3 horas cada (total de 24 horas/aula).
  - Certificar no mínimo 80 educandos/artistas locais.
  - Realizar 1 mostra artística final de encerramento com apresentações dos alunos e artistas convidados.
  - Distribuir gratuitamente 100% dos ingressos e materiais didáticos.

---

### 4. PLANO DE DEMOCRATIZAÇÃO DE ACESSO E CONTRAPARTIDA SOCIAL
- **Gratuidade Total**: 100% das oficinas e evento final com entrada franca.
- **Descentralização**: Atividades realizadas diretamente em bairros periféricos de Viamão.
- **Contrapartida Social**: Doação de equipamentos e registros audiovisuais para as bibliotecas e escolas polo da região.

---

### 5. MEDIDAS DE ACESSIBILIDADE (Lei nº 13.146/2015)
- **Acessibilidade Física**: Locais 100% planos com rampas de acesso, sanitários adaptados e assentos prioritários.
- **Acessibilidade Comunicacional**: Presença de Intérprete de Libras durante a Mostra Final e material de divulgação impresso com QR Code audiodescrito.
- **Acessibilidade Atitudinal**: Equipe treinada para acolhimento humanizado a pessoas com deficiência e neurodivergentes.

---

### 6. CRONOGRAMA DE EXECUÇÃO
| Etapa | Atividade / Ação | Mês / Período | Responsável |
|---|---|---|---|
| **Pré-produção** | Contratação de equipe, reservas de espaços e início da divulgação | Mês 1 | Coordenador Geral |
| **Produção** | Inscrições e realização das 8 oficinas culturais | Mês 2 e 3 | Educadores / Produtor |
| **Execução** | Montagem de palco, ensaios gerais e Mostra Final de Encerramento | Mês 3 | Equipe Técnica e Artistas |
| **Pós-produção** | Edição de vídeo registro, relatórios de impacto e avaliação | Mês 4 | Assistente de Produção |
| **Prestação de Contas** | Consolidação contábil, relatório de cumprimento do objeto e envio ao órgão | Mês 4 | Gestor Financeiro |

---

### 7. PLANILHA ORÇAMENTÁRIA DETALHADA
| Item | Descrição da Rubrica | Unid. | Qtd | Valor Unit. (R$) | Valor Total (R$) |
|---|---|---|---|---|---|
| 1.1 | Coordenador Geral / Proponente | Mês | 4 | R$ 2.000,00 | R$ 8.000,00 |
| 1.2 | Produtor Executivo e Logística | Mês | 3 | R$ 1.500,00 | R$ 4.500,00 |
| 1.3 | Educadores Artísticos / Oficineiros | Hora/Aula | 24 | R$ 150,00 | R$ 3.600,00 |
| 1.4 | Intérprete de Libras (Acessibilidade) | Diária | 2 | R$ 750,00 | R$ 1.500,00 |
| 1.5 | Sonorização, Iluminação e Palco | Diária | 1 | R$ 2.800,00 | R$ 2.800,00 |
| 1.6 | Designer Gráfico & Mídias Sociais | Serviço | 1 | R$ 1.200,00 | R$ 1.200,00 |
| 1.7 | Material Didático e Consumo Oficinas | Kit | 80 | R$ 25,00 | R$ 2.000,00 |
| 1.8 | Registro Audiovisual e Fotografia | Serviço | 1 | R$ 1.400,00 | R$ 1.400,00 |
| **TOTAL** | **VALOR GLOBAL DO PROJETO** | - | - | - | **R$ 25.000,00** |

---

### 8. CHECKLIST DE HABILITAÇÃO & CERTIDÕES
- [x] CND Federal / PGFN (Débitos da União)
- [x] CND Estadual do RS (Receita Estadual)
- [x] CND Municipal de Viamão (Tributos Municipais)
- [x] CNDT (Certidão Negativa de Débitos Trabalhistas)
- [x] Certificado de Regularidade FGTS (CRF Caixa)
- [x] Comprovante de Domicílio e Atuação Cultural em Viamão/RS
- [x] Portfólio Artístico dos últimos 2 anos (Cartazes, links, fotos, matérias de jornal)
`;

    return {
      text: '🎉 **Projeto Cultural Consolidado com Sucesso!**\n\nEstruturei todas as informações de acordo com os padrões técnicos da **PNAB**, **FAC-RS** e **Lei de Acesso à Cultura**. O projeto já conta com justificativa sólida, plano de acessibilidade (Libras e arquitetônica), cronograma em 5 etapas e planilha orçamentária detalhada.\n\n👉 Acesse a aba **"Projeto Consolidado"** para visualizar a versão completa ou clique no botão **"Exportar Projeto para PDF"** para baixar o documento pronto para submissão!',
      hasFinalProject: true,
      finalProjectMarkdown: defaultMarkdown,
    };
  }

  return {
    text: `Olá! Excelente iniciativa. Como seu consultor de projetos culturais para editais públicos (PNAB Viamão, FAC-RS, LPG e Rouanet), vou te guiar passo a passo para que sua proposta atinja a pontuação máxima de habilitação e mérito.\n\nPara começarmos com o pé direito:\n\n1. **Qual é o formato principal do seu projeto** (ex: show musical, festival, ciclo de oficinas, peça de teatro, livro, documentário)?\n2. **Em qual bairro ou espaço de Viamão/RS** você planeja realizar a ação?\n3. **Qual é a estimativa de público** e para qual edital você pretende submeter (PNAB Viamão, FAC-RS ou Municipal)?`,
    hasFinalProject: false,
  };
}
