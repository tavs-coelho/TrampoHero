
import { Job } from "../types";
import { env } from "./env";

/**
 * Internal helper — calls the server-side AI proxy.
 * The GEMINI_API_KEY never leaves the backend.
 */
const AI_ENDPOINT = `${env.VITE_API_URL}/ai/generate`;

async function generate(
  prompt: string,
  options: { systemInstruction?: string; responseMimeType?: string } = {},
): Promise<string> {
  const res = await fetch(AI_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, ...options }),
  });
  if (!res.ok) throw new Error(`AI proxy responded with ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'AI generation failed');
  return data.text as string;
}

export const getSmartJobInsight = async (job: Job) => {
  try {
    return await generate(
      `Analise brevemente esta vaga: ${job.title}. Gere 1 frase de destaque comercial curta.`,
    );
  } catch {
    return "Oportunidade urgente para profissionais qualificados.";
  }
};

export const getRecurrentSuggestion = async (freelancerName: string, rating: number) => {
  try {
    return await generate(
      `O freelancer ${freelancerName} teve nota ${rating}. Gere uma sugestão de 1 frase para o empregador contratá-lo novamente na próxima semana.`,
    );
  } catch {
    return `${freelancerName} foi excelente! Que tal garantir sua agenda para a próxima semana?`;
  }
};

export const generateVoiceJob = async (audioPrompt: string) => {
  try {
    const text = await generate(
      `Transforme este comando de voz em um JSON de vaga de emprego. Comando: "${audioPrompt}". 
      Retorne um objeto com: title, payment (number), niche (Gastronomia, Construção, Eventos ou Serviços Gerais), startTime (HH:MM).`,
      { responseMimeType: 'application/json' },
    );
    return JSON.parse(text);
  } catch {
    return null;
  }
};

export const generateJobDescription = async (title: string, niche: string) => {
  try {
    return await generate(
      `Escreva uma descrição de vaga curta, atraente e profissional para um app de bicos (gigs). 
      Vaga: ${title}. Nicho: ${niche}. 
      Máximo de 200 caracteres. Sem formatação markdown.`,
    );
  } catch {
    return "Descrição gerada automaticamente: Oportunidade para prestação de serviço pontual com pagamento garantido.";
  }
};

export const getSavingsReport = async (jobCount: number, totalPaid: number) => {
  try {
    return await generate(
      `O empregador contratou ${jobCount} freelancers e pagou R$ ${totalPaid}. 
      Compare brevemente com o custo de um funcionário fixo (incluindo encargos brasileiros) e gere uma frase de impacto sobre a economia gerada pelo TrampoHero Pro.`,
    );
  } catch {
    return "Sua economia este mês foi de aproximadamente 35% em comparação a contratos fixos.";
  }
};

export const translateMessage = async (text: string, targetLang: string = "Português") => {
  try {
    return await generate(
      `Traduza a seguinte mensagem para ${targetLang}. Retorne apenas a tradução: "${text}"`,
    );
  } catch {
    return text;
  }
};

export const supportAssistant = async (query: string) => {
  try {
    return await generate(query, {
      systemInstruction:
        "Você é o Suporte Hero do app TrampoHero. Ajude com dúvidas sobre Hero Pay (antecipação), Hero Prime, e cursos da Academy.",
    });
  } catch {
    return "Desculpe, estou com instabilidade. Tente novamente em instantes.";
  }
};
