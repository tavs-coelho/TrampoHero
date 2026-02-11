
import { jsPDF } from "jspdf";
import { Job, UserProfile } from "../types";

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
