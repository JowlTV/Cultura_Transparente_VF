import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PdfExportOptions {
  filename?: string;
  projectName?: string;
  authorName?: string;
}

export async function exportElementToPdf(
  element: HTMLElement,
  options: PdfExportOptions = {}
): Promise<boolean> {
  const filename = options.filename || `${(options.projectName || 'Projeto_Cultural').replace(/[^a-zA-Z0-9_-]/g, '_')}_Proposta.pdf`;

  try {
    // Clone element to apply dedicated print/PDF light-mode styling for crisp contrast
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '800px';
    container.style.backgroundColor = '#ffffff';
    container.style.color = '#1a1a1a';
    container.style.fontFamily = 'Helvetica, Arial, sans-serif';
    container.style.padding = '32px';
    container.style.boxSizing = 'border-box';
    container.style.lineHeight = '1.6';

    // Build PDF header banner
    const headerHtml = `
      <div style="border-bottom: 2px solid #6A0DAD; padding-bottom: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <div style="font-size: 18px; font-weight: bold; color: #6A0DAD; letter-spacing: -0.5px;">CULTURA TRANSPARENTE • VIAMÃO / RS</div>
          <div style="font-size: 11px; color: #555555; margin-top: 2px;">Sistema de Auxílio ao Fazedor de Cultura • Estruturação de Projetos Culturais</div>
        </div>
        <div style="text-align: right; font-size: 10px; color: #777777;">
          <div>Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}</div>
          <div style="color: #FF4500; font-weight: bold;">Documento de Proposta Técnica</div>
        </div>
      </div>
    `;

    const contentClone = element.cloneNode(true) as HTMLElement;
    
    // Clean clone styling for print
    contentClone.style.color = '#1e293b';
    contentClone.style.backgroundColor = '#ffffff';

    // Fix table styles in clone
    const tables = contentClone.querySelectorAll('table');
    tables.forEach(table => {
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.marginBottom = '16px';
      table.style.fontSize = '11px';
      const ths = table.querySelectorAll('th');
      ths.forEach(th => {
        th.style.backgroundColor = '#f1f5f9';
        th.style.color = '#0f172a';
        th.style.border = '1px solid #cbd5e1';
        th.style.padding = '8px 10px';
        th.style.textAlign = 'left';
        th.style.fontWeight = 'bold';
      });
      const tds = table.querySelectorAll('td');
      tds.forEach(td => {
        td.style.border = '1px solid #e2e8f0';
        td.style.padding = '6px 10px';
        td.style.color = '#334155';
      });
    });

    // Fix headings in clone
    const h1s = contentClone.querySelectorAll('h1');
    h1s.forEach(h => {
      h.style.color = '#6A0DAD';
      h.style.fontSize = '20px';
      h.style.borderBottom = '1px solid #e2e8f0';
      h.style.paddingBottom = '6px';
      h.style.marginTop = '18px';
      h.style.marginBottom = '12px';
      h.style.fontWeight = 'bold';
    });

    const h2s = contentClone.querySelectorAll('h2');
    h2s.forEach(h => {
      h.style.color = '#0f172a';
      h.style.fontSize = '16px';
      h.style.marginTop = '16px';
      h.style.marginBottom = '8px';
      h.style.fontWeight = 'bold';
    });

    const h3s = contentClone.querySelectorAll('h3');
    h3s.forEach(h => {
      h.style.color = '#1e293b';
      h.style.fontSize = '13px';
      h.style.marginTop = '14px';
      h.style.marginBottom = '6px';
      h.style.fontWeight = 'bold';
    });

    const uls = contentClone.querySelectorAll<HTMLElement>('ul, ol');
    uls.forEach(ul => {
      ul.style.paddingLeft = '20px';
      ul.style.marginBottom = '12px';
      ul.style.fontSize = '12px';
    });

    const ps = contentClone.querySelectorAll('p');
    ps.forEach(p => {
      p.style.fontSize = '12px';
      p.style.marginBottom = '10px';
      p.style.lineHeight = '1.5';
    });

    // Build PDF footer note
    const footerHtml = `
      <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 30px; font-size: 9px; color: #888888; display: flex; justify-content: space-between;">
        <span>Elaborado com o Assistente ao Fazedor de Cultura • Cultura Transparente Viamão/RS</span>
        <span>Conformidade com Lei nº 14.399/2022 (PNAB), Lei nº 8.313/1991 (Rouanet) e FAC-RS</span>
      </div>
    `;

    container.innerHTML = headerHtml;
    container.appendChild(contentClone);
    container.innerHTML += footerHtml;

    document.body.appendChild(container);

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
    return true;
  } catch (err) {
    console.error('Erro ao exportar PDF:', err);
    return false;
  }
}
