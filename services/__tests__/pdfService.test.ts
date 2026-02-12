import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Niche, SubscriptionTier } from '../../types';
import type { Job, UserProfile, Certificate } from '../../types';

// Mock jsPDF
const mockText = vi.fn().mockReturnThis();
const mockSave = vi.fn();
const mockSetFont = vi.fn().mockReturnThis();
const mockSetFontSize = vi.fn().mockReturnThis();
const mockSetTextColor = vi.fn().mockReturnThis();
const mockSetLineWidth = vi.fn().mockReturnThis();
const mockSetDrawColor = vi.fn().mockReturnThis();
const mockSetFillColor = vi.fn().mockReturnThis();
const mockLine = vi.fn().mockReturnThis();
const mockRect = vi.fn().mockReturnThis();
const mockRoundedRect = vi.fn().mockReturnThis();
const mockCircle = vi.fn().mockReturnThis();
const mockSplitTextToSize = vi.fn().mockImplementation((text: string) => [text]);

vi.mock('jspdf', () => {
  return {
    jsPDF: class {
      text = mockText;
      save = mockSave;
      setFont = mockSetFont;
      setFontSize = mockSetFontSize;
      setTextColor = mockSetTextColor;
      setLineWidth = mockSetLineWidth;
      setDrawColor = mockSetDrawColor;
      setFillColor = mockSetFillColor;
      line = mockLine;
      rect = mockRect;
      roundedRect = mockRoundedRect;
      circle = mockCircle;
      splitTextToSize = mockSplitTextToSize;
      internal = {
        pageSize: {
          getWidth: () => 210,
          getHeight: () => 297,
        },
      };
    },
  };
});

import { generateContract, generateCertificate } from '../pdfService';

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

const mockFreelancer: UserProfile = {
  id: 'user-1',
  name: 'João Silva',
  bio: 'Garçom experiente',
  niche: Niche.EVENTS,
  rating: 4.8,
  tier: SubscriptionTier.PRO,
  wallet: { balance: 500, pending: 100, scheduled: 200, transactions: [] },
  role: 'freelancer',
  medals: [],
  history: [],
};

const mockCertificate: Certificate = {
  id: 'cert-123',
  userId: 'user-1',
  userName: 'João Silva',
  courseId: 'course-1',
  courseTitle: 'Garçom Profissional',
  issuer: 'TrampoHero Academy',
  issueDate: '2026-02-10',
  score: 95,
  certificateNumber: 'TH-2026-001',
};

describe('pdfService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateContract', () => {
    it('should generate a contract PDF and return true', () => {
      const result = generateContract(mockJob, mockFreelancer);

      expect(result).toBe(true);
      expect(mockSave).toHaveBeenCalledWith(`Contrato_TrampoHero_${mockJob.id}.pdf`);
    });

    it('should include employer and freelancer names', () => {
      generateContract(mockJob, mockFreelancer);

      expect(mockText).toHaveBeenCalledWith('Restaurante X', expect.any(Number), expect.any(Number));
      expect(mockText).toHaveBeenCalledWith('João Silva', expect.any(Number), expect.any(Number));
    });

    it('should include the job title', () => {
      generateContract(mockJob, mockFreelancer);

      expect(mockText).toHaveBeenCalledWith(
        'Garçom para Evento',
        expect.any(Number),
        expect.any(Number),
      );
    });

    it('should include the payment value', () => {
      generateContract(mockJob, mockFreelancer);

      expect(mockText).toHaveBeenCalledWith(
        'Valor Acordado: R$ 150.00',
        expect.any(Number),
        expect.any(Number),
      );
    });
  });

  describe('generateCertificate', () => {
    it('should generate a certificate PDF and return true', () => {
      const result = generateCertificate(mockCertificate);

      expect(result).toBe(true);
      expect(mockSave).toHaveBeenCalledWith(`Certificado_${mockCertificate.certificateNumber}.pdf`);
    });

    it('should include the student name in uppercase', () => {
      generateCertificate(mockCertificate);

      expect(mockText).toHaveBeenCalledWith(
        'JOÃO SILVA',
        expect.any(Number),
        expect.any(Number),
        expect.any(Object),
      );
    });

    it('should include the score', () => {
      generateCertificate(mockCertificate);

      expect(mockText).toHaveBeenCalledWith(
        'Nota: 95%',
        expect.any(Number),
        expect.any(Number),
        expect.any(Object),
      );
    });

    it('should include the certificate number', () => {
      generateCertificate(mockCertificate);

      expect(mockText).toHaveBeenCalledWith(
        'Certificado Nº: TH-2026-001',
        expect.any(Number),
        expect.any(Number),
        expect.any(Object),
      );
    });
  });
});
