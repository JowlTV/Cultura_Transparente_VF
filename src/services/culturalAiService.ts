export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isProjectFinal?: boolean;
}

export const CULTURAL_CONSULTANT_SYSTEM_PROMPT = `
Você é o Consultor Especialista de Elaboração de Projetos Culturais da plataforma Cultura Transparente de Viamão/RS.
Sua missão é atuar como um consultor sênior em gestão cultural e elaboração técnica de propostas para editais públicos e instrumentos de fomento:
- Política Nacional Aldir Blanc (PNAB - Lei nº 14.399/2022)
- Lei Paulo Gustavo (LPG - Lei Complementar nº 195/2022)
- Emendas Parlamentares Federais e Estaduais destinadas a Viamão/RS
- Editais Municipais da Secretaria de Cultura de Viamão e Região Metropolitana.

DIRETRIZES DE ATUAÇÃO E METODOLOGIA ITERATIVA:
1. Conduza o proponente cultural de forma acolhedora, objetiva e passo a passo.
2. Não faça todas as perguntas de uma vez. Faça perguntas em blocos curtos (1 ou 2 por vez) para coletar:
   - OBJETO & LOCAL: Qual a ideia do projeto? Formato (oficina, show, peça, mostra, audiovisual, livro, festival)? Onde será realizado em Viamão/RS? Público-alvo estimado?
   - JUSTIFICATIVA: Qual a relevância artística, comunitária e impacto cultural para o município?
   - ACESSIBILIDADE & DEMOCRATIZAÇÃO:
     * Acessibilidade física/arquitetônica (rampas, sanitários adaptados, assentos)
     * Acessibilidade comunicacional (Libras, audiodescrição, material ampliado/braile)
     * Democratização (gratuidade total ou ingressos populares, contrapartida social em escolas ou comunidades periféricas)
   - METAS E CRONOGRAMA: Quantidade de ações/produtos, etapas (Pré-produção, Produção, Pós-produção e Prestação de contas)
   - ORÇAMENTO ESTIMADO: Rubricas principais (cachês artísticos, técnicos, logística, acessibilidade, divulgação) com valores aproximados e compatíveis com os tetos dos editais.
   - REGULARIDADE FISCAL: Lembre o usuário das certidões obrigatórias (CND Federal, Estadual RS, Municipal de Viamão, CNDT e FGTS para PJ).

GATILHO DE CONSOLIDAÇÃO DO PROJETO FINAL:
Quando o usuário disser que terminou, solicitar a consolidação ("terminei", "finalizar", "gerar projeto", "consolidar", "exportar", "concluir") ou após responder aos pontos essenciais:
Você DEVE gerar o projeto cultural completo, estruturado e formal em Markdown, INICIANDO OBRIGATORIAMENTE COM A TAG:
[PROJETO_FINAL]

Estrutura obrigatória dentro do [PROJETO_FINAL]:
# PROJETO CULTURAL: [Nome do Projeto]
## Edital Alvo: [PNAB Viamão / LPG Viamão / Emenda Parlamentar / Municipal Viamão]
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
    titulo: 'Documentário e Memória Viva das Comunidades Tradicionais',
    edital: 'LPG Viamão - Audiovisual',
    segmento: 'Audiovisual / Patrimônio Imaterial',
    orcamento: 'R$ 40.000,00',
    promptInicial: 'Preciso estruturar uma proposta audiovisual para edital da Lei Paulo Gustavo em Viamão para gravar um minidocumentário sobre mestres da cultura popular e memórias de Itapuã e Águas Claras com audiodescrição e Libras.',
  },
  {
    titulo: 'Circulação Teatral nas Escolas Públicas',
    edital: 'PNAB Viamão - Difusão e Circulação',
    segmento: 'Teatro / Artes Cênicas',
    orcamento: 'R$ 30.000,00',
    promptInicial: 'Gostaria de montar uma proposta para circular um espetáculo teatral infantojuvenil sobre educação ambiental por 6 escolas municipais de Viamão com audiodescrição e material didático acessível.',
  },
  {
    titulo: 'Mostra Fotográfica & Painéis Táteis de Viamão',
    edital: 'PNAB Viamão - Memória e Patrimônio',
    segmento: 'Artes Visuais / Fotografia',
    orcamento: 'R$ 20.000,00',
    promptInicial: 'Quero propor uma exposição fotográfica e catálogo digital sobre patrimônio histórico de Viamão, com painéis táteis para pessoas com deficiência visual e oficinas práticas para a comunidade escolar.',
  },
];

export async function sendMessageToAssistant(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
): Promise<{ text: string; hasFinalProject: boolean; finalProjectMarkdown?: string; isError?: boolean }> {
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
      if (!data.success && data.error) {
        return {
          text: `⚠️ **Aviso do Assistente de IA:** ${data.error}`,
          hasFinalProject: false,
          isError: true,
        };
      }
    } else {
      let errText = 'Falha na resposta do servidor.';
      try {
        const errJson = await res.json();
        if (errJson.error) errText = errJson.error;
      } catch {}
      return {
        text: `⚠️ **Erro na comunicação com a IA:** ${errText}`,
        hasFinalProject: false,
        isError: true,
      };
    }
  } catch (err: any) {
    return {
      text: '⚠️ **Indisponibilidade de Conexão:** Não foi possível conectar ao assistente de IA no momento. Por favor, verifique sua conexão ou tente novamente.',
      hasFinalProject: false,
      isError: true,
    };
  }

  return {
    text: '⚠️ O assistente de IA não pôde gerar uma resposta no momento. Por favor, tente novamente.',
    hasFinalProject: false,
    isError: true,
  };
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

