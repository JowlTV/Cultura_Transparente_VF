/**
 * =============================================================================
 * CULTURA TRANSPARENTE - EXPORTAÇÃO NATIVA PARA GOOGLE DRIVE
 * Módulo: src/utils/googleDriveExport.ts
 * =============================================================================
 * Utiliza o Google Identity Services (GIS) exclusivamente no navegador,
 * com o escopo não-sensível 'https://www.googleapis.com/auth/drive.file'.
 * Cria o arquivo via Drive API com conversão automática para Google Docs nativo.
 * O token permanece estritamente em memória durante a sessão.
 */

import { ProjectDraftSections } from './docxExport';

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              error?: string;
              error_description?: string;
            }) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

export function isGoogleDriveConfigured(): boolean {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  return typeof clientId === 'string' && clientId.trim().length > 0;
}

export function convertProjectToHtml(
  title: string,
  sections: ProjectDraftSections,
  fontesCitadas?: Array<{ documento: string; trecho: string }>
): string {
  const dataHoje = new Date().toLocaleDateString('pt-BR');
  const edital = sections.edital_politica || 'Instrumento a Definir';
  const proponente = sections.tipo_proponente || '[Proponente / Coletivo]';
  const territorio = sections.publico_territorio || 'Viamão/RS';

  const sectionDefs = [
    { key: 'edital_politica', num: '1', title: 'Edital ou Política Cultural' },
    { key: 'ideia_projeto', num: '2', title: 'Ideia Central e Síntese da Proposta' },
    { key: 'tipo_proponente', num: '3', title: 'Identificação e Perfil do Proponente' },
    { key: 'objetivo_principal', num: '4', title: 'Objetivo Principal e Justificativa de Impacto Cultural' },
    { key: 'publico_territorio', num: '5', title: 'Público-Alvo e Abrangência Territorial em Viamão' },
    { key: 'atividades_metodologia', num: '6', title: 'Atividades e Metodologia de Execução' },
    { key: 'acessibilidade', num: '7', title: 'Plano de Acessibilidade (Física, Comunicacional e Atitudinal)' },
    { key: 'contrapartida_social', num: '8', title: 'Contrapartida Social Gratuita para a Comunidade' },
    { key: 'cronograma', num: '9', title: 'Cronograma de Execução' },
    { key: 'orcamento', num: '10', title: 'Planilha Orçamentária Detalhada' },
    { key: 'revisao_final', num: '11', title: 'Revisão Final e Documentos de Habilitação' },
  ];

  let bodyHtml = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222; max-width: 800px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; border-bottom: 2px solid #6A0DAD; padding-bottom: 15px; margin-bottom: 25px;">
      <h3 style="margin: 0; color: #2D0652; text-transform: uppercase; letter-spacing: 1px;">Município de Viamão / RS</h3>
      <p style="margin: 4px 0 0; color: #6A0DAD; font-weight: bold; font-size: 13px;">Plataforma Cultura Transparente · Apoio ao Fomento Cultural</p>
      <h1 style="margin: 15px 0 5px; color: #2D0652; font-size: 24px;">${title}</h1>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px;">
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; width: 30%; background-color: #f9f6fd; color: #2D0652;">Instrumento / Edital</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${edital}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f9f6fd; color: #2D0652;">Proponente</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${proponente}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f9f6fd; color: #2D0652;">Território de Realização</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${territorio}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f9f6fd; color: #2D0652;">Data de Elaboração</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${dataHoje}</td>
      </tr>
    </table>
  `;

  sectionDefs.forEach(sec => {
    const val = sections[sec.key] || '<p style="color: #888; font-style: italic;">[Seção pendente de preenchimento]</p>';
    const formattedVal = val.includes('<p>') ? val : val.split('\n\n').map(p => `<p style="margin: 6px 0;">${p.replace(/\n/g, '<br/>')}</p>`).join('');

    bodyHtml += `
      <div style="margin-bottom: 22px;">
        <h2 style="font-size: 17px; color: #2D0652; border-bottom: 1px solid #eee; padding-bottom: 4px; margin-bottom: 8px;">
          ${sec.num}. ${sec.title}
        </h2>
        <div style="font-size: 14px; color: #333;">
          ${formattedVal}
        </div>
      </div>
    `;
  });

  if (fontesCitadas && fontesCitadas.length > 0) {
    bodyHtml += `
      <div style="margin-top: 30px; padding: 15px; background-color: #FAF4EB; border-left: 4px solid #6A0DAD;">
        <h3 style="margin: 0 0 8px; font-size: 14px; color: #2D0652;">Documentos Oficiais Citados e Fundamentação Legal</h3>
        <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #444;">
          ${fontesCitadas.map(f => `<li><strong>${f.documento}:</strong> ${f.trecho}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  bodyHtml += `
    <div style="margin-top: 35px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 10px; color: #666; font-style: italic;">
      Documento gerado com auxílio do assistente de IA da plataforma Cultura Transparente de Viamão/RS. Nenhuma informação pessoal sensível é gravada em servidor; complete os dados cadastrais antes de submeter ao edital.
    </div>
  </div>`;

  return bodyHtml;
}

export async function exportToGoogleDrive(options: {
  title: string;
  sections: ProjectDraftSections;
  fontesCitadas?: Array<{ documento: string; trecho: string }>;
}): Promise<{ fileId: string; webViewLink: string }> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('VITE_GOOGLE_CLIENT_ID não está configurado.');
  }

  // Verifica se o SDK do Google está carregado
  if (!window.google?.accounts?.oauth2) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Não foi possível carregar o Google Identity Services.'));
      document.head.appendChild(script);
    });
  }

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = window.google!.accounts!.oauth2!.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            reject(new Error(tokenResponse.error_description || tokenResponse.error));
            return;
          }

          const accessToken = tokenResponse.access_token;
          if (!accessToken) {
            reject(new Error('Token de acesso do Google não fornecido.'));
            return;
          }

          try {
            const htmlContent = convertProjectToHtml(options.title, options.sections, options.fontesCitadas);

            const metadata = {
              name: `Projeto Cultural - ${options.title}`,
              mimeType: 'application/vnd.google-apps.document',
            };

            const boundary = '-------314159265358979323846';
            const delimiter = `\r\n--${boundary}\r\n`;
            const closeDelimiter = `\r\n--${boundary}--`;

            const multipartRequestBody =
              delimiter +
              'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
              JSON.stringify(metadata) +
              delimiter +
              'Content-Type: text/html; charset=UTF-8\r\n\r\n' +
              htmlContent +
              closeDelimiter;

            const res = await fetch(
              'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': `multipart/related; boundary=${boundary}`,
                },
                body: multipartRequestBody,
              }
            );

            if (!res.ok) {
              const errBody = await res.text();
              throw new Error(`Falha ao salvar no Google Drive: ${errBody}`);
            }

            const data = await res.json();
            const link = data.webViewLink || `https://docs.google.com/document/d/${data.id}/edit`;
            resolve({
              fileId: data.id,
              webViewLink: link,
            });
          } catch (uploadErr) {
            reject(uploadErr);
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (clientErr) {
      reject(clientErr);
    }
  });
}
