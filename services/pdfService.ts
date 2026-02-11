
import { jsPDF } from "jspdf";
import { Job, UserProfile, Certificate } from "../types";

export const generateContract = (job: Job, freelancer: UserProfile) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const date = new Date().toLocaleDateString('pt-BR');
  const time = new Date().toLocaleTimeString('pt-BR');

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(79, 70, 229); // Indigo 600
  doc.text("TrampoHero Pro", pageWidth / 2, 20, { align: "center" });
  
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.text("CONTRATO DE PRESTAÇÃO DE SERVIÇOS", pageWidth / 2, 35, { align: "center" });

  doc.setLineWidth(0.5);
  doc.line(20, 40, pageWidth - 20, 40);

  // Detalhes do Contrato
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  
  let y = 60;
  
  const addLine = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, 60, y);
    y += 10;
  };

  addLine("Contratante", job.employer);
  addLine("Contratado", freelancer.name);
  addLine("CPF/ID", freelancer.id);
  addLine("Serviço", job.title);
  addLine("Nicho", job.niche);
  
  y += 5;
  addLine("Data", date);
  addLine("Hora Check-in", time);
  addLine("Local", job.location);
  
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(22, 163, 74); // Green 600
  doc.text(`Valor Acordado: R$ ${job.payment.toFixed(2)}`, 20, y);
  
  y += 20;
  doc.setFontSize(10);
  doc.setTextColor(100);
  const terms = "Pelo presente instrumento, as partes acima qualificadas celebram contrato de prestação de serviços pontual. O Contratado compromete-se a realizar o serviço com zelo e pontualidade. O Contratante compromete-se a liberar o pagamento via plataforma TrampoHero após a conclusão. Em caso de 'No-Show' ou cancelamento, aplicam-se as taxas previstas nos Termos de Uso.";
  const splitTerms = doc.splitTextToSize(terms, pageWidth - 40);
  doc.text(splitTerms, 20, y);

  // Footer/Assinaturas Digitais
  y += 50;
  doc.setLineWidth(0.2);
  doc.line(20, y, 90, y);
  doc.line(120, y, pageWidth - 20, y);
  
  doc.text("Assinatura Digital Contratante", 25, y + 5);
  doc.text("Assinatura Digital Freelancer", 125, y + 5);
  
  doc.setFontSize(8);
  doc.text(`Hash de Validação: ${Math.random().toString(36).substring(2, 15).toUpperCase()}`, pageWidth / 2, pageWidth - 10, { align: "center" });

  // Salvar PDF
  doc.save(`Contrato_TrampoHero_${job.id}.pdf`);
  return true;
};

export const generateCertificate = (certificate: Certificate) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Background decorative border
  doc.setDrawColor(79, 70, 229); // Indigo 600
  doc.setLineWidth(2);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
  
  doc.setLineWidth(0.5);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24);
  
  // Header - Logo/Icon
  doc.setFillColor(79, 70, 229); // Indigo 600
  doc.circle(pageWidth / 2, 35, 12, 'F');
  
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("★", pageWidth / 2, 38, { align: "center" });
  
  // Title
  doc.setFontSize(28);
  doc.setTextColor(79, 70, 229); // Indigo 600
  doc.setFont("helvetica", "bold");
  doc.text("CERTIFICADO DE CONCLUSÃO", pageWidth / 2, 60, { align: "center" });
  
  // Subtitle
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.setFont("helvetica", "normal");
  doc.text("Certificamos que", pageWidth / 2, 75, { align: "center" });
  
  // Student Name
  doc.setFontSize(32);
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.setFont("helvetica", "bold");
  doc.text(certificate.userName.toUpperCase(), pageWidth / 2, 95, { align: "center" });
  
  // Completion text
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.setFont("helvetica", "normal");
  doc.text("concluiu com êxito o curso", pageWidth / 2, 110, { align: "center" });
  
  // Course Title
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.setFont("helvetica", "bold");
  const courseTitle = doc.splitTextToSize(certificate.courseTitle, pageWidth - 80);
  doc.text(courseTitle, pageWidth / 2, 125, { align: "center" });
  
  // Score badge
  const scoreY = 140;
  doc.setFillColor(245, 158, 11); // Amber 500
  doc.roundedRect(pageWidth / 2 - 25, scoreY - 8, 50, 16, 3, 3, 'F');
  
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text(`Nota: ${certificate.score}%`, pageWidth / 2, scoreY + 2, { align: "center" });
  
  // Details section
  let detailsY = 165;
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.setFont("helvetica", "normal");
  
  const details = [
    `Emissor: ${certificate.issuer}`,
    `Data de Emissão: ${new Date(certificate.issueDate).toLocaleDateString('pt-BR')}`,
    `Certificado Nº: ${certificate.certificateNumber}`,
    `ID do Aluno: ${certificate.userId}`
  ];
  
  details.forEach(detail => {
    doc.text(detail, pageWidth / 2, detailsY, { align: "center" });
    detailsY += 6;
  });
  
  // Signature line
  const sigY = pageHeight - 40;
  doc.setLineWidth(0.5);
  doc.setDrawColor(100, 116, 139); // Slate 500
  doc.line(pageWidth / 2 - 40, sigY, pageWidth / 2 + 40, sigY);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "bold");
  doc.text("TrampoHero Academy", pageWidth / 2, sigY + 6, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text("Plataforma de Capacitação Profissional", pageWidth / 2, sigY + 11, { align: "center" });
  
  // Footer - Validation hash
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text(
    `Hash de Validação: ${certificate.id.toUpperCase()}`,
    pageWidth / 2,
    pageHeight - 15,
    { align: "center" }
  );
  
  // Verification URL (placeholder - endpoint to be implemented)
  doc.setFontSize(7);
  doc.text("Verificação disponível em breve", pageWidth / 2, pageHeight - 10, { align: "center" });
  
  // Save PDF
  doc.save(`Certificado_${certificate.certificateNumber}.pdf`);
  return true;
};
