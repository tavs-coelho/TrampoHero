import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  createMockUser,
  createMockJob,
  createMockCourse,
  createMockCertificate,
} from '../../../__tests__/testUtils';
import {
  ExamModal,
  PrimeModal,
  PaymentModal,
  CreateJobModal,
  JobDetailModal,
} from '../index';
import { Niche } from '../../../types';

// Mock @stripe/react-stripe-js so PaymentModal can render without a real Stripe provider
vi.mock('@stripe/react-stripe-js', () => ({
  useStripe: () => null,
  useElements: () => null,
  CardElement: () => null,
  Elements: ({ children }: { children: React.ReactNode }) => children,
}));

describe('CreateJobModal', () => {
  const defaultProps = {
    newJobData: { title: '', payment: '', niche: Niche.RESTAURANT, date: '', startTime: '', description: '' },
    setNewJobData: vi.fn(),
    isGeneratingDesc: false,
    handleAutoDescription: vi.fn(),
    handleCreateJob: vi.fn(),
    onClose: vi.fn(),
  };

  it('renders modal title', () => {
    render(<CreateJobModal {...defaultProps} />);
    expect(screen.getByText('Publicar Vaga')).toBeInTheDocument();
  });

  it('renders form fields', () => {
    render(<CreateJobModal {...defaultProps} />);
    expect(screen.getByPlaceholderText(/Garçom/)).toBeInTheDocument();
  });

  it('renders publish button', () => {
    render(<CreateJobModal {...defaultProps} />);
    expect(screen.getByText('Publicar vaga')).toBeInTheDocument();
  });

  it('renders AI generate button', () => {
    render(<CreateJobModal {...defaultProps} />);
    expect(screen.getByText(/Gerar com IA/)).toBeInTheDocument();
  });
});

describe('ExamModal', () => {
  const course = createMockCourse();

  it('renders course title in exam mode', () => {
    render(
      <ExamModal
        currentCourse={course}
        currentQuestionIndex={0}
        userAnswers={[]}
        showExamResult={false}
        examScore={0}
        generatedCertificate={null}
        handleAnswerQuestion={vi.fn()}
        handleNextQuestion={vi.fn()}
        handlePreviousQuestion={vi.fn()}
        handleDownloadCertificate={vi.fn()}
        onClose={vi.fn()}
        onRetry={vi.fn()}
      />
    );
    expect(screen.getByText('Excelência no Atendimento')).toBeInTheDocument();
  });

  it('renders question text', () => {
    render(
      <ExamModal
        currentCourse={course}
        currentQuestionIndex={0}
        userAnswers={[]}
        showExamResult={false}
        examScore={0}
        generatedCertificate={null}
        handleAnswerQuestion={vi.fn()}
        handleNextQuestion={vi.fn()}
        handlePreviousQuestion={vi.fn()}
        handleDownloadCertificate={vi.fn()}
        onClose={vi.fn()}
        onRetry={vi.fn()}
      />
    );
    expect(screen.getByText('Qual a melhor prática de atendimento?')).toBeInTheDocument();
  });

  it('renders question progress', () => {
    render(
      <ExamModal
        currentCourse={course}
        currentQuestionIndex={0}
        userAnswers={[]}
        showExamResult={false}
        examScore={0}
        generatedCertificate={null}
        handleAnswerQuestion={vi.fn()}
        handleNextQuestion={vi.fn()}
        handlePreviousQuestion={vi.fn()}
        handleDownloadCertificate={vi.fn()}
        onClose={vi.fn()}
        onRetry={vi.fn()}
      />
    );
    expect(screen.getByText(/Questão 1 de 2/)).toBeInTheDocument();
  });

  it('renders answer options', () => {
    render(
      <ExamModal
        currentCourse={course}
        currentQuestionIndex={0}
        userAnswers={[]}
        showExamResult={false}
        examScore={0}
        generatedCertificate={null}
        handleAnswerQuestion={vi.fn()}
        handleNextQuestion={vi.fn()}
        handlePreviousQuestion={vi.fn()}
        handleDownloadCertificate={vi.fn()}
        onClose={vi.fn()}
        onRetry={vi.fn()}
      />
    );
    expect(screen.getByText('Ser cordial')).toBeInTheDocument();
  });

  it('renders pass result', () => {
    render(
      <ExamModal
        currentCourse={course}
        currentQuestionIndex={0}
        userAnswers={[1, 1]}
        showExamResult={true}
        examScore={100}
        generatedCertificate={createMockCertificate()}
        handleAnswerQuestion={vi.fn()}
        handleNextQuestion={vi.fn()}
        handlePreviousQuestion={vi.fn()}
        handleDownloadCertificate={vi.fn()}
        onClose={vi.fn()}
        onRetry={vi.fn()}
      />
    );
    expect(screen.getByText(/Parabéns/)).toBeInTheDocument();
  });

  it('renders fail result with retry', () => {
    render(
      <ExamModal
        currentCourse={course}
        currentQuestionIndex={0}
        userAnswers={[0, 0]}
        showExamResult={true}
        examScore={0}
        generatedCertificate={null}
        handleAnswerQuestion={vi.fn()}
        handleNextQuestion={vi.fn()}
        handlePreviousQuestion={vi.fn()}
        handleDownloadCertificate={vi.fn()}
        onClose={vi.fn()}
        onRetry={vi.fn()}
      />
    );
    expect(screen.getByText('Tentar Novamente')).toBeInTheDocument();
  });
});

describe('PrimeModal', () => {
  it('renders Hero Prime title', () => {
    render(
      <PrimeModal
        user={createMockUser()}
        handleSubscribePrime={vi.fn()}
        handleUnsubscribePrime={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Hero Prime')).toBeInTheDocument();
  });

  it('renders subscribe button for non-prime user', () => {
    render(
      <PrimeModal
        user={createMockUser({ isPrime: false })}
        handleSubscribePrime={vi.fn()}
        handleUnsubscribePrime={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText(/Assinar por/)).toBeInTheDocument();
  });

  it('renders cancel button for prime user', () => {
    render(
      <PrimeModal
        user={createMockUser({ isPrime: true })}
        handleSubscribePrime={vi.fn()}
        handleUnsubscribePrime={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Cancelar assinatura')).toBeInTheDocument();
  });

  it('renders benefits', () => {
    render(
      <PrimeModal
        user={createMockUser()}
        handleSubscribePrime={vi.fn()}
        handleUnsubscribePrime={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Taxa zero em saques')).toBeInTheDocument();
    expect(screen.getByText('Seguro de acidentes')).toBeInTheDocument();
    expect(screen.getByText('Vagas VIP')).toBeInTheDocument();
  });
});

describe('PaymentModal', () => {
  const defaultProps = {
    depositAmount: '100',
    setDepositAmount: vi.fn(),
    paymentMethod: 'pix' as const,
    setPaymentMethod: vi.fn(),
    isProcessingPayment: false,
    setIsProcessingPayment: vi.fn(),
    handleProcessPayment: vi.fn(),
    onPaymentSuccess: vi.fn(),
    showToast: vi.fn(),
    onClose: vi.fn(),
  };

  it('renders modal title', () => {
    render(<PaymentModal {...defaultProps} />);
    expect(screen.getByText('Adicionar Saldo')).toBeInTheDocument();
  });

  it('renders PIX option', () => {
    render(<PaymentModal {...defaultProps} />);
    expect(screen.getByText('PIX')).toBeInTheDocument();
  });

  it('renders card option', () => {
    render(<PaymentModal {...defaultProps} />);
    expect(screen.getByText(/Cartão/)).toBeInTheDocument();
  });

  it('renders PIX form when pix selected', () => {
    render(<PaymentModal {...defaultProps} paymentMethod="pix" />);
    expect(screen.getByText(/QR Code/)).toBeInTheDocument();
  });

  it('renders card form when card selected', () => {
    render(<PaymentModal {...defaultProps} paymentMethod="card" />);
    expect(screen.getByText(/Pagamento seguro via Stripe/)).toBeInTheDocument();
  });
});

describe('JobDetailModal', () => {
  const defaultProps = {
    job: createMockJob(),
    user: createMockUser(),
    isApplying: false,
    handleApply: vi.fn(),
    handleShare: vi.fn(),
    handleApproveCandidate: vi.fn(),
    handleCloseJob: vi.fn(),
    onClose: vi.fn(),
  };

  it('renders job title', () => {
    render(<JobDetailModal {...defaultProps} />);
    expect(screen.getByText('Garçom para Evento')).toBeInTheDocument();
  });

  it('renders apply button for freelancer', () => {
    render(<JobDetailModal {...defaultProps} />);
    expect(screen.getByText('Candidatar-se')).toBeInTheDocument();
  });

  it('renders share button for freelancer', () => {
    render(<JobDetailModal {...defaultProps} />);
    expect(screen.getByText(/Compartilhar/)).toBeInTheDocument();
  });

  it('renders employer view for job owner', () => {
    render(
      <JobDetailModal
        {...defaultProps}
        user={createMockUser({ id: 'emp-1', role: 'employer' })}
        job={createMockJob({ employerId: 'emp-1' })}
      />
    );
    expect(screen.getByText(/Candidatos/)).toBeInTheDocument();
  });
});
