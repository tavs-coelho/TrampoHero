import React, { useState, useRef } from 'react';
import { UserProfile, KycInfo, KycStatus } from '../../types';
import { apiService } from '../../services/apiService';

interface KycViewProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  setView: (v: any) => void;
}

interface FileState {
  file: File | null;
  preview: string | null;
}

interface KycSubmitResponse {
  success: boolean;
  error?: string;
  data?: {
    kycStatus: KycStatus;
    documentFrontUrl: string | null;
    documentBackUrl: string | null;
    selfieUrl: string | null;
    submittedAt: string;
  };
}

const KYC_STATUS_LABELS: Record<KycStatus, string> = {
  not_submitted: 'Não Enviado',
  pending: 'Em Análise',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
};

const KYC_STATUS_COLORS: Record<KycStatus, string> = {
  not_submitted: 'bg-slate-100 text-slate-600',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};

export const KycView: React.FC<KycViewProps> = ({ user, setUser, showToast, setView }) => {
  const kycStatus: KycStatus = user.kyc?.status ?? 'not_submitted';

  const [documentFront, setDocumentFront] = useState<FileState>({ file: null, preview: null });
  const [documentBack, setDocumentBack] = useState<FileState>({ file: null, preview: null });
  const [selfie, setSelfie] = useState<FileState>({ file: null, preview: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<FileState>>,
  ) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Arquivo inválido. Use JPEG, PNG ou WebP.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Arquivo muito grande. Tamanho máximo: 5 MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setter({ file, preview: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!documentFront.file || !documentBack.file || !selfie.file) {
      showToast('Anexe todos os três documentos antes de enviar.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiService.submitKycDocuments(
        documentFront.file,
        documentBack.file,
        selfie.file,
      ) as KycSubmitResponse;

      if (result.success) {
        const kycInfo: KycInfo = {
          status: 'pending',
          documentFrontUrl: result.data?.documentFrontUrl ?? null,
          documentBackUrl: result.data?.documentBackUrl ?? null,
          selfieUrl: result.data?.selfieUrl ?? null,
          submittedAt: result.data?.submittedAt ?? new Date().toISOString(),
        };
        setUser(prev => ({ ...prev, kyc: kycInfo }));
        showToast('Documentos enviados! Sua conta está em análise.', 'success');
      } else {
        showToast(result.error ?? 'Erro ao enviar documentos.', 'error');
      }
    } catch {
      showToast('Erro de conexão. Tente novamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const DocumentSlot: React.FC<{
    label: string;
    hint: string;
    icon: string;
    state: FileState;
    inputRef: React.RefObject<HTMLInputElement>;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }> = ({ label, hint, icon, state, inputRef, onChange }) => (
    <div className="bg-slate-50 rounded-2xl p-4 border-2 border-dashed border-slate-200 hover:border-indigo-300 transition-colors">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onChange}
      />
      {state.preview ? (
        <div className="relative">
          <img
            src={state.preview}
            alt={label}
            className="w-full h-32 object-cover rounded-xl"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-2 right-2 bg-white text-slate-700 text-[9px] font-black px-2 py-1 rounded-lg shadow border border-slate-200"
          >
            <i className="fas fa-sync-alt mr-1"></i>Trocar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center gap-2 py-4 text-slate-400 hover:text-indigo-500 transition-colors"
        >
          <i className={`fas ${icon} text-2xl`}></i>
          <span className="text-xs font-black text-slate-700">{label}</span>
          <span className="text-[10px] text-slate-400 text-center">{hint}</span>
          <span className="text-[9px] font-bold text-indigo-600 border border-indigo-200 px-3 py-1 rounded-full">
            Anexar Imagem
          </span>
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-white p-6 rounded-[3rem] border border-slate-100 shadow-lg">
        <button
          onClick={() => setView('profile')}
          className="flex items-center gap-2 text-slate-400 text-xs font-bold mb-4 hover:text-slate-700 transition-colors"
        >
          <i className="fas fa-arrow-left"></i>Voltar ao Perfil
        </button>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center flex-shrink-0">
            <i className="fas fa-id-card text-indigo-600 text-2xl"></i>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Verificação de Conta</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Verificação de identidade (KYC)
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mt-4 flex items-center gap-2">
          <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${KYC_STATUS_COLORS[kycStatus]}`}>
            {KYC_STATUS_LABELS[kycStatus]}
          </span>
          {kycStatus === 'approved' && (
            <i className="fas fa-circle-check text-emerald-500"></i>
          )}
        </div>
      </div>

      {/* Approved state */}
      {kycStatus === 'approved' && (
        <div className="bg-emerald-50 p-6 rounded-[2.5rem] border border-emerald-200 text-center">
          <i className="fas fa-shield-check text-emerald-500 text-4xl mb-3"></i>
          <h3 className="font-black text-slate-900 text-lg">Identidade Verificada!</h3>
          <p className="text-sm text-slate-500 mt-2">
            Sua conta foi verificada com sucesso. Você pode usar todos os recursos da plataforma.
          </p>
        </div>
      )}

      {/* Pending state */}
      {kycStatus === 'pending' && (
        <div className="bg-amber-50 p-6 rounded-[2.5rem] border border-amber-200 text-center">
          <i className="fas fa-clock text-amber-500 text-4xl mb-3"></i>
          <h3 className="font-black text-slate-900 text-lg">Em Análise</h3>
          <p className="text-sm text-slate-500 mt-2">
            Seus documentos foram enviados e estão sendo analisados. O processo leva até 2 dias úteis.
          </p>
          {user.kyc?.submittedAt && (
            <p className="text-[10px] text-slate-400 mt-3">
              Enviado em: {new Date(user.kyc.submittedAt).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
      )}

      {/* Rejected state */}
      {kycStatus === 'rejected' && (
        <div className="bg-red-50 p-6 rounded-[2.5rem] border border-red-200">
          <div className="flex items-center gap-3 mb-3">
            <i className="fas fa-circle-xmark text-red-500 text-2xl"></i>
            <h3 className="font-black text-slate-900">Verificação Rejeitada</h3>
          </div>
          {user.kyc?.rejectionReason && (
            <p className="text-sm text-red-700 bg-red-100 p-3 rounded-xl">
              {user.kyc.rejectionReason}
            </p>
          )}
          <p className="text-xs text-slate-500 mt-3">
            Por favor, reenvie seus documentos com as correções necessárias.
          </p>
        </div>
      )}

      {/* Upload form – shown for not_submitted or rejected */}
      {(kycStatus === 'not_submitted' || kycStatus === 'rejected') && (
        <>
          {/* Instructions */}
          <div className="bg-indigo-50 p-5 rounded-[2.5rem] border border-indigo-100">
            <h3 className="font-black text-slate-900 text-sm mb-3 flex items-center gap-2">
              <i className="fas fa-circle-info text-indigo-500"></i>
              Como Funciona
            </h3>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <i className="fas fa-check text-indigo-400 mt-0.5 flex-shrink-0"></i>
                Envie a frente e o verso do seu RG ou CNH
              </li>
              <li className="flex items-start gap-2">
                <i className="fas fa-check text-indigo-400 mt-0.5 flex-shrink-0"></i>
                Envie uma selfie segurando o documento
              </li>
              <li className="flex items-start gap-2">
                <i className="fas fa-check text-indigo-400 mt-0.5 flex-shrink-0"></i>
                Imagens nítidas, bem iluminadas e sem cortes
              </li>
              <li className="flex items-start gap-2">
                <i className="fas fa-check text-indigo-400 mt-0.5 flex-shrink-0"></i>
                Formatos aceitos: JPEG, PNG ou WebP (máx. 5 MB)
              </li>
            </ul>
          </div>

          {/* Document upload slots */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
              <i className="fas fa-upload text-indigo-600"></i>
              Anexar Documentos
            </h3>

            <DocumentSlot
              label="Frente do Documento"
              hint="RG ou CNH – lado da foto"
              icon="fa-id-card"
              state={documentFront}
              inputRef={frontInputRef}
              onChange={(e) => handleFileChange(e, setDocumentFront)}
            />

            <DocumentSlot
              label="Verso do Documento"
              hint="RG ou CNH – lado do código de barras"
              icon="fa-address-card"
              state={documentBack}
              inputRef={backInputRef}
              onChange={(e) => handleFileChange(e, setDocumentBack)}
            />

            <DocumentSlot
              label="Selfie com Documento"
              hint="Foto do rosto segurando o documento"
              icon="fa-camera"
              state={selfie}
              inputRef={selfieInputRef}
              onChange={(e) => handleFileChange(e, setSelfie)}
            />

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !documentFront.file || !documentBack.file || !selfie.file}
              className="w-full py-4 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
            >
              {isSubmitting ? (
                <span><i className="fas fa-spinner fa-spin mr-2"></i>Enviando...</span>
              ) : (
                <span><i className="fas fa-paper-plane mr-2"></i>Enviar para Verificação</span>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
