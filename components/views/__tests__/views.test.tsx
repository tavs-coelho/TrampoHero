import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  createMockUser,
  createMockJob,
  createMockMessage,
  createMockChallenge,
  createMockRanking,
  createMockStoreProduct,
  createMockAdvertisement,
} from '../../../__tests__/testUtils';
import { Niche } from '../../../types';
import {
  BrowseView,
  ActiveJobView,
  WalletView,
  EmployerWalletView,
  ChatView,
  EmployerChatView,
  CoinsView,
  InsuranceView,
  CreditView,
  ReferralsView,
  AdsView,
  RankingView,
  ChallengesView,
  AnalyticsView,
  AcademyView,
  StoreView,
  TalentsView,
  EmployerActiveView,
  EmployerProfileView,
  ProfileView,
  DashboardView,
} from '../index';

describe('BrowseView', () => {
  it('renders heading', () => {
    render(
      <BrowseView
        sortedOpenJobs={[]}
        browseMode="list"
        setBrowseMode={vi.fn()}
        filterNiche="All"
        setFilterNiche={vi.fn()}
        setSelectedJob={vi.fn()}
        mapContainerRef={{ current: null }}
        user={createMockUser()}
        setView={vi.fn()}
        setShowPrimeModal={vi.fn()}
      />
    );
    expect(screen.getByText('Freelas Próximos')).toBeInTheDocument();
  });

  it('renders niche filter options', () => {
    render(
      <BrowseView
        sortedOpenJobs={[]}
        browseMode="list"
        setBrowseMode={vi.fn()}
        filterNiche="All"
        setFilterNiche={vi.fn()}
        setSelectedJob={vi.fn()}
        mapContainerRef={{ current: null }}
        user={createMockUser()}
        setView={vi.fn()}
        setShowPrimeModal={vi.fn()}
      />
    );
    expect(screen.getByText('Todos')).toBeInTheDocument();
  });

  it('renders job cards when jobs exist', () => {
    const job = createMockJob();
    render(
      <BrowseView
        sortedOpenJobs={[job]}
        browseMode="list"
        setBrowseMode={vi.fn()}
        filterNiche="All"
        setFilterNiche={vi.fn()}
        setSelectedJob={vi.fn()}
        mapContainerRef={{ current: null }}
        user={createMockUser()}
        setView={vi.fn()}
        setShowPrimeModal={vi.fn()}
      />
    );
    expect(screen.getByText('Garçom para Evento')).toBeInTheDocument();
  });
});

describe('ActiveJobView', () => {
  it('renders without active job', () => {
    render(
      <ActiveJobView
        activeJob={undefined}
        isCheckedIn={false}
        handleCheckIn={vi.fn()}
        handleCheckout={vi.fn()}
        setView={vi.fn()}
      />
    );
    expect(screen.getByText('Sem Job Ativo')).toBeInTheDocument();
  });

  it('renders with active job', () => {
    const job = createMockJob({ status: 'ongoing' });
    render(
      <ActiveJobView
        activeJob={job}
        isCheckedIn={false}
        handleCheckIn={vi.fn()}
        handleCheckout={vi.fn()}
        setView={vi.fn()}
      />
    );
    expect(screen.getByText('Job em Andamento')).toBeInTheDocument();
    expect(screen.getByText('Garçom para Evento')).toBeInTheDocument();
  });

  it('renders check-in button when not checked in', () => {
    const job = createMockJob({ status: 'ongoing' });
    render(
      <ActiveJobView
        activeJob={job}
        isCheckedIn={false}
        handleCheckIn={vi.fn()}
        handleCheckout={vi.fn()}
        setView={vi.fn()}
      />
    );
    expect(screen.getByText('Realizar Check-in')).toBeInTheDocument();
  });
});

describe('WalletView', () => {
  it('renders balance', () => {
    render(
      <WalletView
        user={createMockUser()}
        handleWithdraw={vi.fn()}
        handleAnticipate={vi.fn()}
        setShowPrimeModal={vi.fn()}
        setView={vi.fn()}
      />
    );
    expect(screen.getByText('Saldo Total')).toBeInTheDocument();
  });

  it('renders PIX withdraw button', () => {
    render(
      <WalletView
        user={createMockUser()}
        handleWithdraw={vi.fn()}
        handleAnticipate={vi.fn()}
        setShowPrimeModal={vi.fn()}
        setView={vi.fn()}
      />
    );
    expect(screen.getByText(/Sacar via PIX/)).toBeInTheDocument();
  });
});

describe('EmployerWalletView', () => {
  it('renders corporate wallet heading', () => {
    render(
      <EmployerWalletView
        user={createMockUser({ role: 'employer' })}
        handleWithdraw={vi.fn()}
        handleOpenAddBalance={vi.fn()}
        handleShowInvoices={vi.fn()}
      />
    );
    expect(screen.getByText('Carteira Corporativa')).toBeInTheDocument();
  });

  it('renders add balance button', () => {
    render(
      <EmployerWalletView
        user={createMockUser({ role: 'employer' })}
        handleWithdraw={vi.fn()}
        handleOpenAddBalance={vi.fn()}
        handleShowInvoices={vi.fn()}
      />
    );
    expect(screen.getByText(/Adicionar Saldo/)).toBeInTheDocument();
  });
});

describe('ChatView', () => {
  it('renders chat heading', () => {
    render(
      <ChatView
        user={createMockUser()}
        messages={[]}
        inputText=""
        setInputText={vi.fn()}
        handleSendMessage={vi.fn()}
        messagesEndRef={{ current: null }}
        setView={vi.fn()}
      />
    );
    expect(screen.getByText('Suporte Hero IA')).toBeInTheDocument();
  });

  it('renders messages', () => {
    const msg = createMockMessage({ text: 'Olá! Como posso ajudar?' });
    render(
      <ChatView
        user={createMockUser()}
        messages={[msg]}
        inputText=""
        setInputText={vi.fn()}
        handleSendMessage={vi.fn()}
        messagesEndRef={{ current: null }}
        setView={vi.fn()}
      />
    );
    expect(screen.getByText('Olá! Como posso ajudar?')).toBeInTheDocument();
  });
});

describe('EmployerChatView', () => {
  it('renders employer chat heading', () => {
    render(
      <EmployerChatView
        user={createMockUser({ role: 'employer' })}
        messages={[]}
        inputText=""
        setInputText={vi.fn()}
        handleSendMessage={vi.fn()}
        messagesEndRef={{ current: null }}
        setView={vi.fn()}
      />
    );
    expect(screen.getByText('Suporte Empresarial')).toBeInTheDocument();
  });
});

describe('CoinsView', () => {
  it('renders TrampoCoins heading', () => {
    render(
      <CoinsView
        user={createMockUser()}
        setUser={vi.fn()}
        showToast={vi.fn()}
        setView={vi.fn()}
      />
    );
    expect(screen.getByText('TrampoCoins')).toBeInTheDocument();
  });

  it('renders earn methods section', () => {
    render(
      <CoinsView
        user={createMockUser()}
        setUser={vi.fn()}
        showToast={vi.fn()}
        setView={vi.fn()}
      />
    );
    expect(screen.getByText('Como Ganhar Coins')).toBeInTheDocument();
  });
});

describe('InsuranceView', () => {
  it('renders TrampoProtect heading', () => {
    render(
      <InsuranceView
        user={createMockUser()}
        setUser={vi.fn()}
        showToast={vi.fn()}
        setView={vi.fn()}
      />
    );
    expect(screen.getByText('TrampoProtect')).toBeInTheDocument();
  });
});

describe('CreditView', () => {
  it('renders TrampoCredit heading', () => {
    render(
      <CreditView
        user={createMockUser()}
        setUser={vi.fn()}
        showToast={vi.fn()}
        setView={vi.fn()}
      />
    );
    expect(screen.getByText('TrampoCredit')).toBeInTheDocument();
  });

  it('renders credit limit', () => {
    render(
      <CreditView
        user={createMockUser()}
        setUser={vi.fn()}
        showToast={vi.fn()}
        setView={vi.fn()}
      />
    );
    expect(screen.getByText(/Limite Disponível/)).toBeInTheDocument();
  });
});

describe('ReferralsView', () => {
  it('renders referrals heading', () => {
    render(
      <ReferralsView
        user={createMockUser()}
        handleApplyReferralCode={vi.fn()}
        handleCompleteReferral={vi.fn()}
        showToast={vi.fn()}
        setView={vi.fn()}
      />
    );
    expect(screen.getByText('Indique e Ganhe')).toBeInTheDocument();
  });

  it('renders referral code', () => {
    render(
      <ReferralsView
        user={createMockUser({ referralCode: 'MYCODE' })}
        handleApplyReferralCode={vi.fn()}
        handleCompleteReferral={vi.fn()}
        showToast={vi.fn()}
        setView={vi.fn()}
      />
    );
    expect(screen.getByText('MYCODE')).toBeInTheDocument();
  });
});

describe('AdsView', () => {
  it('renders TrampoAds heading', () => {
    const ad = createMockAdvertisement();
    render(
      <AdsView
        user={createMockUser({ role: 'employer' })}
        advertisements={[ad]}
        showToast={vi.fn()}
        setView={vi.fn()}
      />
    );
    expect(screen.getByText(/TrampoAds/)).toBeInTheDocument();
  });
});

describe('RankingView', () => {
  it('renders ranking heading', () => {
    render(
      <RankingView
        rankings={[createMockRanking()]}
        user={createMockUser()}
        setView={vi.fn()}
      />
    );
    expect(screen.getByText(/Ranking de Talentos/)).toBeInTheDocument();
  });

  it('renders ranked talent', () => {
    render(
      <RankingView
        rankings={[createMockRanking({ userName: 'Carlos Oliveira' })]}
        user={createMockUser()}
        setView={vi.fn()}
      />
    );
    expect(screen.getByText('Carlos Oliveira')).toBeInTheDocument();
  });
});

describe('ChallengesView', () => {
  it('renders challenges heading', () => {
    render(
      <ChallengesView
        challenges={[createMockChallenge()]}
        setView={vi.fn()}
      />
    );
    expect(screen.getByText(/Desafios Semanais/)).toBeInTheDocument();
  });

  it('renders challenge title', () => {
    render(
      <ChallengesView
        challenges={[createMockChallenge()]}
        setView={vi.fn()}
      />
    );
    expect(screen.getByText(/Desafio da Semana/)).toBeInTheDocument();
  });
});

describe('AnalyticsView', () => {
  it('renders analytics heading', () => {
    render(
      <AnalyticsView
        user={createMockUser()}
        setUser={vi.fn()}
        showToast={vi.fn()}
        setView={vi.fn()}
      />
    );
    expect(screen.getByText('Analytics Premium')).toBeInTheDocument();
  });
});

describe('AcademyView', () => {
  it('renders academy heading', () => {
    render(
      <AcademyView
        user={createMockUser()}
        handleStartCourse={vi.fn()}
        filterNiche="All"
        setFilterNiche={vi.fn()}
      />
    );
    expect(screen.getByText('Hero Academy')).toBeInTheDocument();
  });

  it('renders niche filter', () => {
    render(
      <AcademyView
        user={createMockUser()}
        handleStartCourse={vi.fn()}
        filterNiche="All"
        setFilterNiche={vi.fn()}
      />
    );
    expect(screen.getByText('Todos')).toBeInTheDocument();
  });
});

describe('StoreView', () => {
  it('renders store heading', () => {
    render(
      <StoreView
        storeProducts={[]}
        cart={[]}
        setCart={vi.fn()}
        handleStoreCheckout={vi.fn()}
        showToast={vi.fn()}
        setView={vi.fn()}
      />
    );
    expect(screen.getByText(/TrampoStore/)).toBeInTheDocument();
  });

  it('renders product when provided', () => {
    const product = createMockStoreProduct();
    render(
      <StoreView
        storeProducts={[product]}
        cart={[]}
        setCart={vi.fn()}
        handleStoreCheckout={vi.fn()}
        showToast={vi.fn()}
        setView={vi.fn()}
      />
    );
    expect(screen.getByText('Kit Garçom Profissional')).toBeInTheDocument();
  });
});

describe('TalentsView', () => {
  it('renders talents heading', () => {
    render(
      <TalentsView
        handleInviteTalent={vi.fn()}
        setView={vi.fn()}
      />
    );
    expect(screen.getByText('Talentos Disponíveis')).toBeInTheDocument();
  });
});

describe('EmployerActiveView', () => {
  it('renders monitoring heading', () => {
    render(
      <EmployerActiveView setView={vi.fn()} />
    );
    expect(screen.getByText('Monitoramento de Jobs')).toBeInTheDocument();
  });

  it('renders back button', () => {
    render(
      <EmployerActiveView setView={vi.fn()} />
    );
    expect(screen.getByText('Voltar ao Painel')).toBeInTheDocument();
  });
});

describe('EmployerProfileView', () => {
  it('renders employer name', () => {
    render(
      <EmployerProfileView
        user={createMockUser({ name: 'Empresa ABC', role: 'employer' })}
        filteredEmployerJobs={[]}
      />
    );
    expect(screen.getByText('Empresa ABC')).toBeInTheDocument();
  });

  it('renders verified badge', () => {
    render(
      <EmployerProfileView
        user={createMockUser({ role: 'employer' })}
        filteredEmployerJobs={[]}
      />
    );
    expect(screen.getByText('Empresa Verificada')).toBeInTheDocument();
  });
});

describe('ProfileView', () => {
  it('renders user name', () => {
    render(
      <ProfileView
        user={createMockUser({ name: 'Maria Silva' })}
        setView={vi.fn()}
        handleDownloadCertificate={vi.fn()}
        showToast={vi.fn()}
      />
    );
    expect(screen.getByText('Maria Silva')).toBeInTheDocument();
  });

  it('renders exclusive resources section', () => {
    render(
      <ProfileView
        user={createMockUser()}
        setView={vi.fn()}
        handleDownloadCertificate={vi.fn()}
        showToast={vi.fn()}
      />
    );
    expect(screen.getByText('Recursos Exclusivos')).toBeInTheDocument();
  });
});

describe('DashboardView', () => {
  it('renders dashboard heading', () => {
    render(
      <DashboardView
        user={createMockUser({ role: 'employer' })}
        filteredEmployerJobs={[]}
        filterNiche="All"
        setFilterNiche={vi.fn()}
        filterStatus="All"
        setFilterStatus={vi.fn()}
        filterDate=""
        setFilterDate={vi.fn()}
        handleManageJob={vi.fn()}
        simulateVoiceCreate={vi.fn()}
        isRecording={false}
        setShowCreateJobModal={vi.fn()}
        aiSuggestion={null}
        handleShowInvoices={vi.fn()}
        handleOpenAddBalance={vi.fn()}
        handleInviteTalent={vi.fn()}
        setView={vi.fn()}
      />
    );
    expect(screen.getByText('Painel de Controle')).toBeInTheDocument();
  });

  it('renders create job prompt when no jobs', () => {
    render(
      <DashboardView
        user={createMockUser({ role: 'employer' })}
        filteredEmployerJobs={[]}
        filterNiche="All"
        setFilterNiche={vi.fn()}
        filterStatus="All"
        setFilterStatus={vi.fn()}
        filterDate=""
        setFilterDate={vi.fn()}
        handleManageJob={vi.fn()}
        simulateVoiceCreate={vi.fn()}
        isRecording={false}
        setShowCreateJobModal={vi.fn()}
        aiSuggestion={null}
        handleShowInvoices={vi.fn()}
        handleOpenAddBalance={vi.fn()}
        handleInviteTalent={vi.fn()}
        setView={vi.fn()}
      />
    );
    expect(screen.getByText('Criar Primeira Vaga')).toBeInTheDocument();
  });
});
