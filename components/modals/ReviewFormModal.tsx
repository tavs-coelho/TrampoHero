import React, { useState } from 'react';
import { Job, Review } from '../../types';

interface ReviewFormModalProps {
  job: Job;
  authorId: string;
  onSubmit: (review: Omit<Review, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

export const ReviewFormModal: React.FC<ReviewFormModalProps> = ({ job, authorId, onSubmit, onClose }) => {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (rating === 0) return;
    onSubmit({
      rating,
      comment,
      authorId,
      targetId: job.employerId,
      jobId: job.id,
    });
  };

  const labels = ['', 'Péssimo', 'Ruim', 'Regular', 'Bom', 'Excelente'];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-black text-slate-900">Avaliar Trabalho</h2>
            <p className="text-sm text-slate-400 mt-1">{job.title}</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="text-center mb-8">
          <p className="text-sm font-bold text-slate-600 mb-4">Como foi sua experiência com <span className="text-indigo-600">{job.employer}</span>?</p>
          <div className="flex justify-center gap-3 mb-3">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(star)}
                className="transition-transform active:scale-90"
              >
                <i className={`fas fa-star text-3xl transition-colors ${
                  star <= (hovered || rating) ? 'text-amber-400' : 'text-slate-200'
                }`}></i>
              </button>
            ))}
          </div>
          {(hovered || rating) > 0 && (
            <p className="text-sm font-bold text-amber-500">{labels[hovered || rating]}</p>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-xs font-black text-slate-500 uppercase mb-2">
            Comentário (opcional)
          </label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Descreva sua experiência..."
            maxLength={500}
            rows={3}
            className="w-full border border-slate-200 rounded-2xl p-4 text-sm text-slate-700 placeholder-slate-300 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
          />
          <p className="text-[10px] text-slate-400 text-right mt-1">{comment.length}/500</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-4 border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-colors"
          >
            Pular
          </button>
          <button
            onClick={handleSubmit}
            disabled={rating === 0}
            className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
          >
            Enviar Avaliação
          </button>
        </div>
      </div>
    </div>
  );
};
