import React from 'react';
import { Niche, Course, UserProfile } from '../../types';
import { COURSES } from '../../data/mockData';
import { MEDALS_REPO } from '../../data/mockData';

interface AcademyViewProps {
  user: UserProfile;
  handleStartCourse: (course: Course) => void;
  filterNiche: string;
  setFilterNiche: (v: string) => void;
}

export const AcademyView: React.FC<AcademyViewProps> = ({ user, handleStartCourse, filterNiche, setFilterNiche }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <header>
      <h2 className="text-2xl font-black text-slate-900">Hero Academy</h2>
      <p className="text-slate-500 text-sm mb-4">Capacite-se com cursos gratuitos da plataforma e certificados reconhecidos.</p>
      
      {/* Filtro por nicho */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button 
          onClick={() => setFilterNiche('All')}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
            filterNiche === 'All' 
              ? 'bg-slate-900 text-white' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Todos
        </button>
        {Object.values(Niche).map(niche => (
          <button 
            key={niche}
            onClick={() => setFilterNiche(niche)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              filterNiche === niche 
                ? 'bg-indigo-600 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {niche}
          </button>
        ))}
      </div>
    </header>

    {/* Cursos agrupados por nicho */}
    <div className="space-y-6">
      {Object.values(Niche).map(niche => {
        const nicheCourses = COURSES.filter(c => 
          c.niche === niche && (filterNiche === 'All' || filterNiche === niche)
        );
        
        if (nicheCourses.length === 0) return null;
        
        return (
          <div key={niche}>
            <h3 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2">
              <i className={`fas ${
                niche === Niche.RESTAURANT ? 'fa-utensils' :
                niche === Niche.CONSTRUCTION ? 'fa-hard-hat' :
                niche === Niche.EVENTS ? 'fa-calendar-check' :
                'fa-spray-can'
              } text-indigo-600`}></i>
              {niche}
            </h3>
            <div className="grid gap-4">
              {nicheCourses.map(course => {
                const isCompleted = user.medals.find(m => m.id === course.badgeId);
                return (
                  <div 
                    key={course.id} 
                    className={`bg-white p-6 rounded-[2.5rem] border transition-all ${
                      isCompleted 
                        ? 'border-emerald-200 shadow-sm' 
                        : 'border-slate-100 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-2 flex-wrap">
                        <span className="bg-amber-50 text-amber-600 text-micro font-bold px-2 py-1 rounded uppercase tracking-wide">
                          <i className="fas fa-clock mr-1"></i> {course.duration}
                        </span>
                        {course.price && course.price > 0 ? (
                          <span className="bg-indigo-50 text-indigo-600 text-micro font-bold px-2 py-1 rounded uppercase tracking-wide">
                            R$ {course.price}
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-600 text-micro font-bold px-2 py-1 rounded uppercase tracking-wide">
                            GRÁTIS
                          </span>
                        )}
                        <span className="bg-slate-100 text-slate-600 text-micro font-bold px-2 py-1 rounded uppercase tracking-wide">
                          {course.level === 'basic' ? 'Básico' : 
                           course.level === 'intermediate' ? 'Intermediário' : 
                           course.level === 'advanced' ? 'Avançado' : 'Certificação'}
                        </span>
                        <span className="bg-purple-50 text-purple-600 text-micro font-bold px-2 py-1 rounded uppercase tracking-wide">
                          <i className="fas fa-question-circle mr-1"></i> {course.examQuestions.length} questões
                        </span>
                      </div>
                      <i className={`fas ${MEDALS_REPO.find(m => m.id === course.badgeId)?.icon || 'fa-award'} ${
                        isCompleted ? 'text-emerald-500' : 'text-slate-200'
                      } text-2xl`}></i>
                    </div>
                    <h4 className="font-black text-slate-800 text-lg mb-1">{course.title}</h4>
                    <p className="text-xs text-slate-400 mb-3">{course.description}</p>
                    {!course.provider && (
                      <p className="text-xs text-indigo-600 font-semibold mb-3">
                        <i className="fas fa-certificate mr-1"></i>Emissor: {course.certificateIssuer}
                      </p>
                    )}
                    {course.provider && (
                      <p className="text-xs text-indigo-600 font-semibold mb-3">
                        <i className="fas fa-graduation-cap mr-1"></i>Parceiro: {course.provider}
                      </p>
                    )}
                    <button 
                      onClick={() => handleStartCourse(course)} 
                      className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wide transition-all ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-600 cursor-default'
                          : course.price && course.price > 0 
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
                          : 'bg-slate-900 text-white hover:bg-slate-800 shadow-md'
                      }`}
                      disabled={!!isCompleted}
                    >
                      {isCompleted ? (
                        <>
                          <i className="fas fa-check-circle mr-2"></i>Concluído
                        </>
                      ) : course.price && course.price > 0 ? (
                        <>
                          <i className="fas fa-shopping-cart mr-2"></i>Comprar Curso
                        </>
                      ) : (
                        <>
                          <i className="fas fa-play mr-2"></i>Iniciar Curso
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>

    {/* Info sobre ebooks */}
    <div className="bg-indigo-50 border-2 border-indigo-100 rounded-2xl p-6 text-center">
      <i className="fas fa-book-open text-3xl text-indigo-600 mb-3"></i>
      <h3 className="font-black text-slate-900 mb-2">Material de Estudo</h3>
      <p className="text-xs text-slate-600">
        Em breve, ebooks interativos estarão disponíveis para complementar seu aprendizado antes das provas!
      </p>
    </div>
  </div>
);
