import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGenerateContent } = vi.hoisted(() => {
  const mockGenerateContent = vi.fn();
  return { mockGenerateContent };
});

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      models = { generateContent: mockGenerateContent };
    },
  };
});

import {
  getSmartJobInsight,
  getRecurrentSuggestion,
  generateVoiceJob,
  generateJobDescription,
  getSavingsReport,
  translateMessage,
  supportAssistant,
} from '../geminiService';
import { Niche } from '../../types';
import type { Job } from '../../types';

const mockJob: Job = {
  id: 'job-1',
  employerId: 'emp-1',
  title: 'Garçom para Evento',
  employer: 'Restaurante X',
  employerRating: 4.5,
  niche: Niche.EVENTS,
  location: 'São Paulo, SP',
  coordinates: { lat: -23.55, lng: -46.63 },
  payment: 150,
  paymentType: 'dia',
  description: 'Servir em evento corporativo',
  date: '2026-02-15',
  startTime: '18:00',
  status: 'open',
};

describe('geminiService', () => {
  beforeEach(() => {
    mockGenerateContent.mockReset();
  });

  describe('getSmartJobInsight', () => {
    it('should return AI-generated insight when API succeeds', async () => {
      mockGenerateContent.mockResolvedValue({
        text: 'Oportunidade imperdível para garçons!',
      });

      const result = await getSmartJobInsight(mockJob);
      expect(result).toBe('Oportunidade imperdível para garçons!');
      expect(mockGenerateContent).toHaveBeenCalledOnce();
    });

    it('should return fallback text when API fails', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API error'));

      const result = await getSmartJobInsight(mockJob);
      expect(result).toBe('Oportunidade urgente para profissionais qualificados.');
    });
  });

  describe('getRecurrentSuggestion', () => {
    it('should return AI-generated suggestion when API succeeds', async () => {
      mockGenerateContent.mockResolvedValue({
        text: 'Contrate novamente!',
      });

      const result = await getRecurrentSuggestion('João', 4.8);
      expect(result).toBe('Contrate novamente!');
    });

    it('should return fallback suggestion when API fails', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API error'));

      const result = await getRecurrentSuggestion('João', 4.8);
      expect(result).toContain('João');
    });
  });

  describe('generateVoiceJob', () => {
    it('should return parsed JSON when API succeeds', async () => {
      const voiceJobData = {
        title: 'Pintor',
        payment: 200,
        niche: 'Construção',
        startTime: '08:00',
      };
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(voiceJobData),
      });

      const result = await generateVoiceJob('Preciso de um pintor amanhã às 8h');
      expect(result).toEqual(voiceJobData);
    });

    it('should return null when API fails', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API error'));

      const result = await generateVoiceJob('teste');
      expect(result).toBeNull();
    });
  });

  describe('generateJobDescription', () => {
    it('should return AI-generated description when API succeeds', async () => {
      mockGenerateContent.mockResolvedValue({
        text: 'Vaga para garçom com experiência.',
      });

      const result = await generateJobDescription('Garçom', 'Gastronomia');
      expect(result).toBe('Vaga para garçom com experiência.');
    });

    it('should return fallback description when API fails', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API error'));

      const result = await generateJobDescription('Garçom', 'Gastronomia');
      expect(result).toContain('Descrição gerada automaticamente');
    });
  });

  describe('getSavingsReport', () => {
    it('should return AI-generated report when API succeeds', async () => {
      mockGenerateContent.mockResolvedValue({
        text: 'Você economizou 40%!',
      });

      const result = await getSavingsReport(5, 1000);
      expect(result).toBe('Você economizou 40%!');
    });

    it('should return fallback report when API fails', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API error'));

      const result = await getSavingsReport(5, 1000);
      expect(result).toContain('economia');
    });
  });

  describe('translateMessage', () => {
    it('should return translated text when API succeeds', async () => {
      mockGenerateContent.mockResolvedValue({
        text: 'Hello, how are you?',
      });

      const result = await translateMessage('Olá, como vai?', 'English');
      expect(result).toBe('Hello, how are you?');
    });

    it('should return original text when API fails', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API error'));

      const result = await translateMessage('Olá, como vai?', 'English');
      expect(result).toBe('Olá, como vai?');
    });
  });

  describe('supportAssistant', () => {
    it('should return AI-generated support response when API succeeds', async () => {
      mockGenerateContent.mockResolvedValue({
        text: 'O Hero Pay permite antecipar seus recebíveis.',
      });

      const result = await supportAssistant('Como funciona o Hero Pay?');
      expect(result).toBe('O Hero Pay permite antecipar seus recebíveis.');
    });

    it('should return fallback message when API fails', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API error'));

      const result = await supportAssistant('Como funciona o Hero Pay?');
      expect(result).toContain('instabilidade');
    });
  });
});
