import React from 'react';
import { UserProfile, Course, Certificate } from '../types';
import { generateCertificate } from '../services/pdfService';
import { MEDALS_REPO } from '../data/mockData';

export const useCourseActions = (deps: {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  currentCourse: Course | null;
  setCurrentCourse: React.Dispatch<React.SetStateAction<Course | null>>;
  currentQuestionIndex: number;
  setCurrentQuestionIndex: React.Dispatch<React.SetStateAction<number>>;
  userAnswers: number[];
  setUserAnswers: React.Dispatch<React.SetStateAction<number[]>>;
  setShowExamResult: React.Dispatch<React.SetStateAction<boolean>>;
  setExamScore: React.Dispatch<React.SetStateAction<number>>;
  setGeneratedCertificate: React.Dispatch<React.SetStateAction<Certificate | null>>;
  setShowExamModal: React.Dispatch<React.SetStateAction<boolean>>;
  showToast: (msg: string, type?: 'success'|'error'|'info') => void;
}) => {
  const {
    user, setUser, currentCourse, setCurrentCourse,
    currentQuestionIndex, setCurrentQuestionIndex,
    userAnswers, setUserAnswers,
    setShowExamResult, setExamScore,
    setGeneratedCertificate, setShowExamModal, showToast
  } = deps;

  const finishExam = () => {
    if (!currentCourse) return;
    
    // Calcula pontuação
    let correctAnswers = 0;
    currentCourse.examQuestions.forEach((question, index) => {
      if (userAnswers[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });
    
    const score = Math.round((correctAnswers / currentCourse.examQuestions.length) * 100);
    setExamScore(score);
    
    const passed = score >= currentCourse.passingScore;
    
    if (passed) {
      // Gera certificado
      const certificate: Certificate = {
        id: `cert-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        courseId: currentCourse.id,
        courseTitle: currentCourse.title,
        issuer: currentCourse.certificateIssuer,
        issueDate: new Date().toISOString().split('T')[0],
        score: score,
        certificateNumber: `TH-${Date.now().toString(36).toUpperCase()}`
      };
      
      // Armazena certificado para exibição no resultado
      setGeneratedCertificate(certificate);
      
      // Adiciona medalha
      const medal = MEDALS_REPO.find(m => m.id === currentCourse.badgeId);
      
      // Atualiza usuário
      setUser(prev => ({
        ...prev,
        medals: medal ? [...prev.medals, medal] : prev.medals,
        certificates: [...(prev.certificates || []), certificate],
        courseProgress: [
          ...(prev.courseProgress || []),
          {
            courseId: currentCourse.id,
            userId: user.id,
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            examScore: score,
            examAttempts: 1,
            passed: true,
            certificateId: certificate.id
          }
        ]
      }));
      
      showToast(`Parabéns! Você foi aprovado com ${score}%!`, "success");
    } else {
      setGeneratedCertificate(null);
      showToast(`Você obteve ${score}%. Nota mínima: ${currentCourse.passingScore}%`, "error");
    }
    
    setShowExamResult(true);
  };

  const handleStartCourse = (course: Course) => {
     // Verifica se já tem o curso
     if(user.medals.find(m => m.id === course.badgeId)) {
         showToast("Você já completou este curso!", "info");
         return;
     }

     // Se for curso pago, poderia verificar pagamento aqui
     if(course.price && course.price > 0) {
         showToast("Compra de cursos em desenvolvimento. Em breve!", "info");
         return;
     }

     // Inicia o curso - abre o modal de exame
     setCurrentCourse(course);
     setCurrentQuestionIndex(0);
     setUserAnswers([]);
     setShowExamResult(false);
     setGeneratedCertificate(null);
     setShowExamModal(true);
     showToast(`Leia o material (ebook será adicionado) e faça a prova!`, "info");
  };

  const handleAnswerQuestion = (answerIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setUserAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (!currentCourse) return;
    
    if (currentQuestionIndex < currentCourse.examQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Última pergunta - calcular resultado
      finishExam();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleDownloadCertificate = (certificate: Certificate) => {
    try {
      showToast("Gerando certificado em PDF...", "info");
      setTimeout(() => {
        generateCertificate(certificate);
        showToast("Certificado baixado com sucesso!", "success");
      }, 500);
    } catch (error) {
      console.error("Error generating certificate:", error);
      showToast("Erro ao gerar certificado. Tente novamente.", "error");
    }
  };

  return {
    handleStartCourse,
    handleAnswerQuestion,
    handleNextQuestion,
    handlePreviousQuestion,
    finishExam,
    handleDownloadCertificate,
  };
};
