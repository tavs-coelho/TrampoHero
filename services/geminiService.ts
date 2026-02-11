
import { GoogleGenAI } from "@google/genai";
import { Job, UserProfile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getSmartJobInsight = async (job: Job) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise brevemente esta vaga: ${job.title}. Gere 1 frase de destaque comercial curta.`,
    });
    return response.text;
  } catch (error) {
    return "Oportunidade urgente para profissionais qualificados.";
  }
};

export const getRecurrentSuggestion = async (freelancerName: string, rating: number) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `O freelancer ${freelancerName} teve nota ${rating}. Gere uma sugestão de 1 frase para o empregador contratá-lo novamente na próxima semana.`,
    });
    return response.text;
  } catch (error) {
    return `${freelancerName} foi excelente! Que tal garantir sua agenda para a próxima semana?`;
  }
};

export const generateVoiceJob = async (audioPrompt: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      config: {
        responseMimeType: "application/json",
      },
      contents: `Transforme este comando de voz em um JSON de vaga de emprego. Comando: "${audioPrompt}". 
      Retorne um objeto com: title, payment (number), niche (Gastronomia, Construção, Eventos ou Serviços Gerais), startTime (HH:MM).`,
    });
    return JSON.parse(response.text);
  } catch (error) {
    return null;
  }
};

export const generateJobDescription = async (title: string, niche: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Escreva uma descrição de vaga curta, atraente e profissional para um app de bicos (gigs). 
      Vaga: ${title}. Nicho: ${niche}. 
      Máximo de 200 caracteres. Sem formatação markdown.`,
    });
    return response.text;
  } catch (error) {
    return "Descrição gerada automaticamente: Oportunidade para prestação de serviço pontual com pagamento garantido.";
  }
};

export const getSavingsReport = async (jobCount: number, totalPaid: number) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `O empregador contratou ${jobCount} freelancers e pagou R$ ${totalPaid}. 
      Compare brevemente com o custo de um funcionário fixo (incluindo encargos brasileiros) e gere uma frase de impacto sobre a economia gerada pelo TrampoHero Pro.`,
    });
    return response.text;
  } catch (error) {
    return "Sua economia este mês foi de aproximadamente 35% em comparação a contratos fixos.";
  }
};

export const translateMessage = async (text: string, targetLang: string = "Português") => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Traduza a seguinte mensagem para ${targetLang}. Retorne apenas a tradução: "${text}"`,
    });
    return response.text;
  } catch (error) {
    return text;
  }
};

export const supportAssistant = async (query: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      config: { systemInstruction: "Você é o Suporte Hero do app TrampoHero. Ajude com dúvidas sobre Hero Pay (antecipação), Hero Prime, e cursos da Academy." },
      contents: query,
    });
    return response.text;
  } catch (error) {
    return "Desculpe, estou com instabilidade. Tente novamente em instantes.";
  }
};
