/**
 * pdfService.js
 *
 * Generates a signed PDF contract / Nota Fiscal for a completed TrampoHero job.
 *
 * The PDF includes:
 *  - Parties involved (freelancer & employer)
 *  - Job details (title, date, payment)
 *  - Legal terms for temporary service provision
 *  - A SHA-256 validation hash printed in the footer
 *
 * The file is saved under `backend/contracts/<hash>.pdf` and the function
 * returns a relative download URL that the calling route can expose.
 */

import PDFDocument from 'pdfkit';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Directory where contract PDFs are persisted
const CONTRACTS_DIR = path.join(__dirname, '..', '..', 'contracts');

/**
 * Ensures the contracts output directory exists and is writable.
 * Throws a descriptive error if the directory cannot be created or written to.
 */
function ensureContractsDir() {
  try {
    if (!fs.existsSync(CONTRACTS_DIR)) {
      fs.mkdirSync(CONTRACTS_DIR, { recursive: true });
    }
  } catch (err) {
    throw new Error(
      `Failed to create contracts directory at "${CONTRACTS_DIR}": ${err instanceof Error ? err.message : String(err)}`
    );
  }

  let stats;
  try {
    stats = fs.statSync(CONTRACTS_DIR);
  } catch (err) {
    throw new Error(
      `Contracts path "${CONTRACTS_DIR}" is not accessible: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (!stats.isDirectory()) {
    throw new Error(`Contracts path "${CONTRACTS_DIR}" exists but is not a directory.`);
  }

  try {
    fs.accessSync(CONTRACTS_DIR, fs.constants.W_OK);
  } catch (err) {
    throw new Error(
      `Contracts directory "${CONTRACTS_DIR}" is not writable: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

/**
 * Builds a deterministic validation hash from job + party data.
 *
 * @param {object} freelancer - { name, email }
 * @param {object} employer   - { name, email }
 * @param {object} job        - { _id, title, payment, date }
 * @returns {string} 64-char hex SHA-256 digest
 */
function buildValidationHash(freelancer, employer, job) {
  const payload = JSON.stringify({
    jobId: String(job._id),
    freelancerEmail: freelancer.email,
    employerEmail: employer.email,
    payment: job.payment,
    date: job.date,
  });
  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Generates a PDF contract for a completed job and saves it to disk.
 *
 * @param {object} freelancer - Freelancer user document (name, email)
 * @param {object} employer   - Employer user document  (name, email)
 * @param {object} job        - Job document (title, payment, date, _id, etc.)
 * @returns {Promise<{ filePath: string, downloadUrl: string, validationHash: string }>}
 */
export async function generateJobContract(freelancer, employer, job) {
  ensureContractsDir();

  const hash = buildValidationHash(freelancer, employer, job);
  const timestamp = Date.now();
  const fileName = `${hash}-${timestamp}.pdf`;
  const filePath = path.join(CONTRACTS_DIR, fileName);
  const downloadUrl = `/api/contracts/${fileName}`;

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 60, size: 'A4' });
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // ── Header ──────────────────────────────────────────────────────────────
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('CONTRATO DE PRESTAÇÃO DE SERVIÇOS TEMPORÁRIOS', { align: 'center' })
      .moveDown(0.5);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text('TrampoHero Plataforma Digital de Trabalho Temporário', { align: 'center' })
      .moveDown(1.5);

    // ── Parties ─────────────────────────────────────────────────────────────
    doc.fontSize(12).font('Helvetica-Bold').text('PARTES ENVOLVIDAS').moveDown(0.4);

    doc.fontSize(10).font('Helvetica');
    doc.text(`Prestador de Serviço (Freelancer): ${freelancer.name}  <${freelancer.email}>`);
    doc.text(`Contratante (Empregador):           ${employer.name}  <${employer.email}>`);
    doc.moveDown(1);

    // ── Job details ─────────────────────────────────────────────────────────
    doc.fontSize(12).font('Helvetica-Bold').text('DADOS DA VAGA').moveDown(0.4);

    doc.fontSize(10).font('Helvetica');
    doc.text(`Título da vaga:    ${job.title}`);
    doc.text(`Nicho:             ${job.niche ?? '-'}`);
    doc.text(`Local:             ${job.location ?? '-'}`);
    doc.text(`Data:              ${job.date ?? '-'}`);
    doc.text(`Horário de início: ${job.startTime ?? '-'}`);
    doc.text(`Remuneração:       R$ ${Number(job.payment).toFixed(2)} (por ${job.paymentType ?? 'dia'})`);
    doc.text(`Status:            Concluída`);
    doc.moveDown(1);

    // ── Legal terms ─────────────────────────────────────────────────────────
    doc.fontSize(12).font('Helvetica-Bold').text('TERMOS LEGAIS').moveDown(0.4);

    const terms = [
      '1. O presente contrato regula a prestação de serviço temporário intermediada pela plataforma TrampoHero, ' +
        'nos termos da Lei nº 6.019/74 e legislação vigente sobre trabalho avulso e serviços temporários.',

      '2. A relação estabelecida entre as partes é de natureza civil/comercial, não configurando vínculo ' +
        'empregatício entre o Prestador de Serviço e a Plataforma TrampoHero.',

      '3. O Prestador de Serviço declara possuir capacidade civil plena e autoriza a plataforma a intermediar ' +
        'a remuneração pelo serviço prestado conforme valor acordado acima.',

      '4. A Contratante se compromete a efetuar o pagamento integral da remuneração acordada após a conclusão ' +
        'e aprovação do serviço, de acordo com os mecanismos de pagamento da plataforma.',

      '5. Em caso de disputa, as partes concordam em buscar resolução primeiramente por meio dos canais de ' +
        'atendimento da plataforma TrampoHero antes de recorrer a instâncias judiciais.',

      '6. Este documento tem validade jurídica e pode ser utilizado como comprovante de prestação de serviço ' +
        'para fins fiscais e previdenciários.',

      '7. A Nota Fiscal de prestação de serviço deverá ser emitida pelo Prestador de Serviço quando aplicável, ' +
        'de acordo com sua situação cadastral na Receita Federal (MEI, Autônomo, PJ).',
    ];

    doc.fontSize(10).font('Helvetica');
    terms.forEach((term) => {
      doc.text(term, { align: 'justify' }).moveDown(0.6);
    });

    doc.moveDown(0.5);

    // ── Signatures ──────────────────────────────────────────────────────────
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('ASSINATURAS DIGITAIS', { align: 'center' })
      .moveDown(0.8);

    const sigY = doc.y;
    doc.fontSize(10).font('Helvetica');
    doc.text('_________________________________', 60, sigY);
    doc.text(freelancer.name, 60, doc.y);
    doc.text('Prestador de Serviço', 60, doc.y);

    doc.text('_________________________________', 300, sigY);
    doc.text(employer.name, 300, doc.y - 26);
    doc.text('Contratante', 300, doc.y);

    doc.moveDown(2);

    // ── Footer: validation hash ──────────────────────────────────────────────
    const pageBottom = doc.page.height - doc.page.margins.bottom - 30;
    const now = new Date();
    doc
      .fontSize(7)
      .font('Helvetica')
      .fillColor('#888888')
      .text(`Hash de validação: ${hash}`, 60, pageBottom, { align: 'left', width: doc.page.width - 120 })
      .text(`Gerado em: ${now.toLocaleString('pt-BR')}  –  TrampoHero © ${now.getFullYear()}`, {
        align: 'right',
        width: doc.page.width - 120,
      });

    doc.end();

    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  return { filePath, downloadUrl, validationHash: hash };
}
