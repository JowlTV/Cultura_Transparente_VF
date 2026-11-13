/**
 * =============================================================================
 * CULTURA TRANSPARENTE - EXPORTAÇÃO NATIVA PARA GOOGLE DRIVE
 * Módulo: src/utils/googleDriveExport.ts
 * =============================================================================
 * Utiliza o Google Identity Services (GIS) exclusivamente no navegador,
 * com o escopo não-sensível 'https://www.googleapis.com/auth/drive.file'.
 * Cria o arquivo via Drive API com conversão automática para Google Docs nativo.
 * O token permanece estritamente em memória durante a sessão.
 * Suporta o formato padrão (11 seções) e Lei Rouanet (12 seções com conferência de regras).
 */

import {
  ProjectDraftSections,
  SECTION_METADATA_PADRAO,
  SECTION_METADATA_ROUANET,
  isRouanetPolicy,
  ConferenciaRegrasResult,
} from './docxExport';
import { REGRAS_GERAIS_ROUANET } from './regrasRouanet';

/** Escapa texto antes de inseri-lo no HTML convertido em Google Doc. */
function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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
  fontesCitadas?: Array<{ documento: string; trecho: string }>,
  politica?: string,
  conferenciaRegras?: ConferenciaRegrasResult
): string {
  const isRouanet = isRouanetPolicy(sections, politica);
  const dataHoje = new Date().toLocaleDateString('pt-BR');
  const edital = sections.edital_politica || (isRouanet ? 'Lei Rouanet (IN MinC nº 29/2026 - Salic)' : 'Instrumento a Definir');
  const proponente = sections.perfil_proponente?.slice(0, 80) || sections.tipo_proponente || '[Proponente / Coletivo]';
  const territorio = sections.local_cronograma || sections.publico_territorio || 'Viamão/RS e Região';

  const sectionDefs = isRouanet ? SECTION_METADATA_ROUANET : SECTION_METADATA_PADRAO;

  let bodyHtml = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222; max-width: 800px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; border-bottom: 2px solid #6A0DAD; padding-bottom: 15px; margin-bottom: 25px;">
      <h3 style="margin: 0; color: #2D0652; text-transform: uppercase; letter-spacing: 1px;">
        ${isRouanet ? 'MINISTÉRIO DA CULTURA · GOVERNO FEDERAL' : 'MUNICÍPIO DE VIAMÃO / RS'}
      </h3>
      <p style="margin: 4px 0 0; color: #6A0DAD; font-weight: bold; font-size: 13px;">
        ${isRouanet ? 'PROGRAMA NACIONAL DE APOIO À CULTURA (PRONAC) · LEI ROUANET (IN MINC Nº 29/2026)' : 'Plataforma Cultura Transparente · Apoio ao Fomento Cultural'}
      </p>
      <h1 style="margin: 15px 0 5px; color: #2D0652; font-size: 24px;">${escapeHtml(title)}</h1>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px;">
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; width: 30%; background-color: #f9f6fd; color: #2D0652;">Mecanismo / Edital</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(edital)}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f9f6fd; color: #2D0652;">Proponente</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(proponente)}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f9f6fd; color: #2D0652;">Território de Realização</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(territorio)}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f9f6fd; color: #2D0652;">Data de Elaboração</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${dataHoje}</td>
      </tr>
    </table>
  `;

  sectionDefs.forEach(sec => {
    let rawVal = sections[sec.key];
    if (!rawVal && (sec as any).fallbackKeys) {
      for (const fk of (sec as any).fallbackKeys) {
        if (sections[fk] && sections[fk]!.trim()) {
          rawVal = sections[fk];
          break;
        }
      }
    }

    const val = rawVal || (isRouanet ? '<p style="color: #666; font-style: italic;">[a preencher]</p>' : '<p style="color: #888; font-style: italic;">[Seção pendente de preenchimento]</p>');
    const formattedVal = val.split('\n\n').map(p => `<p style="margin: 6px 0;">${escapeHtml(p).replace(/\n/g, '<br/>')}</p>`).join('');

    bodyHtml += `
      <div style="margin-bottom: 22px;">
        <h2 style="font-size: 17px; color: #2D0652; border-bottom: 1px solid #eee; padding-bottom: 4px; margin-bottom: 8px;">
          ${sec.num}. ${escapeHtml(sec.title)}
        </h2>
        <div style="font-size: 14px; color: #333;">
          ${formattedVal}
        </div>
      </div>
    `;
  });

  // Seção de Conferência de Regras
  if (isRouanet || conferenciaRegras) {
    bodyHtml += `
      <div style="margin-top: 30px; padding: 15px; background-color: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 6px;">
        <h2 style="font-size: 16px; color: #2D0652; margin: 0 0 10px 0; border-bottom: 1px solid #CBD5E1; padding-bottom: 6px;">
          Conferência de Regras Objetivas (IN MinC nº 29/2026)
        </h2>
    `;

    if (conferenciaRegras) {
      if (conferenciaRegras.aprovacoes && conferenciaRegras.aprovacoes.length > 0) {
        bodyHtml += `<h4 style="color: #166534; margin: 10px 0 5px;">✔ Itens Conformes:</h4><ul style="margin: 0; padding-left: 20px; font-size: 13px;">`;
        conferenciaRegras.aprovacoes.forEach(ap => {
          bodyHtml += `<li><strong>${escapeHtml(ap.descricao)}:</strong> ${escapeHtml(ap.referencia)} - <em>"${escapeHtml(ap.citacao)}"</em></li>`;
        });
        bodyHtml += `</ul>`;
      }
      if (conferenciaRegras.infracoes && conferenciaRegras.infracoes.length > 0) {
        bodyHtml += `<h4 style="color: #B91C1C; margin: 10px 0 5px;">⚠ Limites Excedidos:</h4><ul style="margin: 0; padding-left: 20px; font-size: 13px;">`;
        conferenciaRegras.infracoes.forEach(inf => {
          bodyHtml += `<li><strong>${escapeHtml(inf.descricao)}:</strong> ${escapeHtml(inf.referencia)} - <em>"${escapeHtml(inf.citacao)}"</em></li>`;
        });
        bodyHtml += `</ul>`;
      }
      if (conferenciaRegras.pendencias && conferenciaRegras.pendencias.length > 0) {
        bodyHtml += `<h4 style="color: #D97706; margin: 10px 0 5px;">ℹ Informações Pendentes:</h4><ul style="margin: 0; padding-left: 20px; font-size: 13px;">`;
        conferenciaRegras.pendencias.forEach(pen => {
          bodyHtml += `<li><strong>${escapeHtml(pen.descricao)}:</strong> ${escapeHtml(pen.pendencia)} (${escapeHtml(pen.referencia)})</li>`;
        });
        bodyHtml += `</ul>`;
      }
    } else {
      bodyHtml += `
        <p style="font-size: 13px; color: #475569;">
          Limites objetivos da IN MinC nº 29/2026 a conferir nesta proposta (citações literais):
        </p>
        <ul style="font-size: 13px; color: #475569;">
          ${REGRAS_GERAIS_ROUANET.map(r => `<li><strong>${escapeHtml(r.desc)} (${escapeHtml(r.ref)}):</strong> <em>"${escapeHtml(r.cit)}"</em></li>`).join('')}
        </ul>
      `;
    }

    bodyHtml += `</div>`;
  }

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

  const avisoFinal = isRouanet
    ? 'AVISO INSTITUCIONAL (LEI ROUANET · IN MINC Nº 29/2026): A estruturação orientada do projeto não garante aprovação pelo Ministério da Cultura nem pela CNIC (Arts. 45 a 50). A aprovação no Pronac autoriza a captação de recursos junto a patrocinadores, e a execução depende do sucesso dessa captação (Arts. 47 e 48). A submissão da proposta é feita diretamente pelo próprio proponente no Salic (https://salic.cultura.gov.br).'
    : 'Documento gerado com auxílio do assistente de IA da plataforma Cultura Transparente de Viamão/RS. Nenhuma informação pessoal sensível é gravada em servidor; complete os dados cadastrais antes de submeter ao edital.';

  bodyHtml += `
    <div style="margin-top: 35px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 10px; color: #666; font-style: italic;">
      ${avisoFinal}
    </div>
  </div>`;

  return bodyHtml;
}

export async function exportToGoogleDrive(options: {
  title: string;
  sections: ProjectDraftSections;
  fontesCitadas?: Array<{ documento: string; trecho: string }>;
  politica?: string;
  conferenciaRegras?: ConferenciaRegrasResult;
}): Promise<{ fileId: string; webViewLink: string }> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('VITE_GOOGLE_CLIENT_ID não está configurado.');
  }

  if (!window.google?.accounts?.oauth2) {
    throw new Error('Biblioteca Google Identity Services (GIS) ainda não foi carregada no navegador.');
  }

  return new Promise((resolve, reject) => {
    try {
      const oauth2 = window.google?.accounts?.oauth2;
      if (!oauth2) {
        throw new Error('Biblioteca Google Identity Services (GIS) ainda não foi carregada no navegador.');
      }
      const tokenClient = oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: async response => {
          if (response.error) {
            reject(new Error(response.error_description || response.error));
            return;
          }

          const accessToken = response.access_token;
          if (!accessToken) {
            reject(new Error('Nenhum token de acesso retornado pelo Google.'));
            return;
          }

          try {
            const htmlContent = convertProjectToHtml(
              options.title,
              options.sections,
              options.fontesCitadas,
              options.politica,
              options.conferenciaRegras
            );

            const metadata = {
              name: `${options.title || 'Projeto_Cultural_Viamao'}_${new Date().toISOString().slice(0, 10)}`,
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

            const uploadRes = await fetch(
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

            if (!uploadRes.ok) {
              const errBody = await uploadRes.text();
              throw new Error(`Erro ao enviar para Google Drive: ${uploadRes.status} ${errBody}`);
            }

            const driveFile = await uploadRes.json();
            resolve({
              fileId: driveFile.id,
              webViewLink: driveFile.webViewLink,
            });
          } catch (uploadErr) {
            reject(uploadErr);
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: '' });
    } catch (err) {
      reject(err);
    }
  });
}
