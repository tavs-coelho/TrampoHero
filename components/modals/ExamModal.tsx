import React from 'react';
import { Course, Certificate } from '../../types';

export interface ExamModalProps {
  currentCourse: Course;
  currentQuestionIndex: number;
  userAnswers: number[];
  showExamResult: boolean;
  examScore: number;
  generatedCertificate: Certificate | null;
  handleAnswerQuestion: (answerIndex: number) => void;
  handleNextQuestion: () => void;
  handlePreviousQuestion: () => void;
  handleDownloadCertificate: (certificate: Certificate) => void;
  onClose: () => void;
  onRetry: () => void;
}

const ExamModal: React.FC<ExamModalProps> = ({
  currentCourse,
  currentQuestionIndex,
  userAnswers,
  showExamResult,
  examScore,
  generatedCertificate,
  handleAnswerQuestion,
  handleNextQuestion,
  handlePreviousQuestion,
  handleDownloadCertificate,
  onClose,
  onRetry,
}) => {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-6 animate-in fade-in duration-300 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] p-8 shadow-2xl relative my-8">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors text-xl"
        >
          &times;
        </button>
        
        {!showExamResult ? (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <i className="fas fa-graduation-cap text-3xl text-indigo-600"></i>
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">{currentCourse.title}</h2>
              <p className="text-slate-500 text-sm mb-4">{currentCourse.description}</p>
              <div className="flex items-center justify-center gap-4 text-xs">
                <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full font-bold">
                  <i className="fas fa-clock mr-1"></i> {currentCourse.duration}
                </span>
                <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-bold">
                  Nota mínima: {currentCourse.passingScore}%
                </span>
              </div>
            </div>

            {/* Progresso */}
            <div className="mb-6">
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                <span>Questão {currentQuestionIndex + 1} de {currentCourse.examQuestions.length}</span>
                <span>{Math.round(((currentQuestionIndex + 1) / currentCourse.examQuestions.length) * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / currentCourse.examQuestions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Questão */}
            <div className="bg-slate-50 rounded-2xl p-6 mb-6">
              <h3 className="font-black text-slate-900 text-lg mb-4">
                {currentCourse.examQuestions[currentQuestionIndex].question}
              </h3>
              <div className="space-y-3">
                {currentCourse.examQuestions[currentQuestionIndex].options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerQuestion(index)}
                    className={`w-full p-4 rounded-xl text-left transition-all ${
                      userAnswers[currentQuestionIndex] === index
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        userAnswers[currentQuestionIndex] === index
                          ? 'bg-white text-indigo-600'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="font-medium text-sm">{option}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Botões de navegação */}
            <div className="flex gap-3">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className={`flex-1 py-4 rounded-xl font-bold text-sm uppercase tracking-wide transition-all ${
                  currentQuestionIndex === 0
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                <i className="fas fa-arrow-left mr-2"></i> Anterior
              </button>
              <button
                onClick={handleNextQuestion}
                disabled={userAnswers[currentQuestionIndex] === undefined}
                className={`flex-1 py-4 rounded-xl font-bold text-sm uppercase tracking-wide transition-all ${
                  userAnswers[currentQuestionIndex] === undefined
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : currentQuestionIndex === currentCourse.examQuestions.length - 1
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg'
                }`}
              >
                {currentQuestionIndex === currentCourse.examQuestions.length - 1 ? (
                  <>
                    <i className="fas fa-check mr-2"></i> Finalizar
                  </>
                ) : (
                  <>
                    Próxima <i className="fas fa-arrow-right ml-2"></i>
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          /* Resultado do Exame */
          <div className="text-center">
            <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${
              examScore >= currentCourse.passingScore
                ? 'bg-emerald-100'
                : 'bg-red-100'
            }`}>
              <i className={`fas text-5xl ${
                examScore >= currentCourse.passingScore
                  ? 'fa-trophy text-emerald-600'
                  : 'fa-times text-red-600'
              }`}></i>
            </div>
            
            <h2 className="text-3xl font-black text-slate-900 mb-2">
              {examScore >= currentCourse.passingScore ? 'Parabéns!' : 'Não foi dessa vez'}
            </h2>
            
            <p className="text-slate-600 mb-6">
              {examScore >= currentCourse.passingScore
                ? 'Você foi aprovado no curso e recebeu seu certificado!'
                : `Você precisa de ${currentCourse.passingScore}% para ser aprovado. Estude mais e tente novamente!`
              }
            </p>
            
            <div className="bg-slate-50 rounded-2xl p-6 mb-6">
              <div className="text-6xl font-black text-slate-900 mb-2">{examScore}%</div>
              <p className="text-sm text-slate-600 font-bold">Sua pontuação</p>
            </div>
            
            {examScore >= currentCourse.passingScore && generatedCertificate && (
              <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-6 mb-6">
                <i className="fas fa-certificate text-3xl text-indigo-600 mb-3"></i>
                <h3 className="font-black text-slate-900 mb-2">Certificado Emitido</h3>
                <p className="text-xs text-slate-600 mb-3">
                  Certificado #{generatedCertificate.certificateNumber}
                </p>
                <p className="text-xs text-slate-500 mb-4">
                  Emissor: {currentCourse.certificateIssuer}
                </p>
                <button
                  onClick={() => handleDownloadCertificate(generatedCertificate)}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wide hover:bg-indigo-700 transition-all"
                >
                  <i className="fas fa-download mr-2"></i> Baixar Certificado (PDF)
                </button>
              </div>
            )}
            
            <button
              onClick={onClose}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-wide hover:bg-slate-800 transition-all"
            >
              Fechar
            </button>
            
            {examScore < currentCourse.passingScore && (
              <button
                onClick={onRetry}
                className="w-full mt-3 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-wide hover:bg-indigo-700 transition-all"
              >
                <i className="fas fa-redo mr-2"></i> Tentar Novamente
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamModal;
