import React, { useState } from 'react';
import { Plus, Trash2, X, Check, Sparkles } from 'lucide-react';
import { QuizDeck, QuizQuestion } from '../game/rules';
import { KahootShapeIcon } from './PlayerAvatar';

interface QuizCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDeck: (newDeck: QuizDeck) => void;
}

export const QuizCreatorModal: React.FC<QuizCreatorModalProps> = ({
  isOpen,
  onClose,
  onSaveDeck,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Conhecimentos Gerais');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'Fácil' | 'Médio' | 'Desafiador'>('Médio');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [questions, setQuestions] = useState<QuizQuestion[]>([
    {
      id: 'custom-q1',
      category: 'Rodada 1',
      question: 'Qual tecnologia permite entrar no quiz instantaneamente usando a câmera do celular?',
      timeLimit: 20,
      basePoints: 1000,
      correctOptionId: 'opt-1',
      explanation: 'O QR Code (Quick Response) permite leitura óptica instantânea para abrir a sala do quiz.',
      options: [
        { id: 'opt-1', text: 'QR Code', shape: 'triangle', color: 'red' },
        { id: 'opt-2', text: 'Cabo Coaxial', shape: 'diamond', color: 'blue' },
        { id: 'opt-3', text: 'Disquete 3.5"', shape: 'circle', color: 'amber' },
        { id: 'opt-4', text: 'Telégrafo', shape: 'square', color: 'green' },
      ],
    },
  ]);

  if (!isOpen) return null;

  const handleAddQuestion = () => {
    const idx = questions.length + 1;
    const qId = `custom-q${Date.now()}-${idx}`;
    setQuestions((prev) => [
      ...prev,
      {
        id: qId,
        category: `Pergunta ${idx}`,
        question: '',
        timeLimit: 20,
        basePoints: 1000,
        correctOptionId: `${qId}-a`,
        explanation: 'Explicação exibida após os jogadores responderem.',
        options: [
          { id: `${qId}-a`, text: '', shape: 'triangle', color: 'red' },
          { id: `${qId}-b`, text: '', shape: 'diamond', color: 'blue' },
          { id: `${qId}-c`, text: '', shape: 'circle', color: 'amber' },
          { id: `${qId}-d`, text: '', shape: 'square', color: 'green' },
        ],
      },
    ]);
  };

  const handleRemoveQuestion = (qIndex: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, idx) => idx !== qIndex));
  };

  const handleQuestionChange = (
    qIndex: number,
    field: keyof QuizQuestion,
    value: string | number
  ) => {
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === qIndex ? { ...q, [field]: value } : q))
    );
  };

  const handleOptionTextChange = (qIndex: number, optIndex: number, text: string) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== qIndex) return q;
        const updatedOpts = q.options.map((opt, oIdx) =>
          oIdx === optIndex ? { ...opt, text } : opt
        );
        return { ...q, options: updatedOpts };
      })
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Por favor, informe um título para o seu Quiz.');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        setErrorMsg(`A pergunta #${i + 1} está com o enunciado vazio.`);
        return;
      }
      const emptyOpt = q.options.some((o) => !o.text.trim());
      if (emptyOpt) {
        setErrorMsg(`Preencha todas as 4 alternativas da pergunta #${i + 1}.`);
        return;
      }
    }

    const generatedPin = String(Math.floor(100000 + Math.random() * 900000));
    const newDeck: QuizDeck = {
      id: `quiz-custom-${Date.now()}`,
      pin: generatedPin,
      title: title.trim(),
      category: category.trim() || 'Personalizado',
      description:
        description.trim() ||
        'Quiz personalizado criado no Estúdio Arena Quiz com QR Code exclusivo.',
      difficulty,
      playsCount: 1,
      questions,
    };

    onSaveDeck(newDeck);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-creator-title"
    >
      <div className="w-full max-w-4xl rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100 my-8 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div>
            <h2 id="quiz-creator-title" className="text-xl font-bold font-display text-white">
              Estúdio Criador de Quiz · Arena Quiz
            </h2>
            <p className="text-xs text-slate-400">
              Crie perguntas personalizadas e gere automaticamente um novo QR Code e PIN de sala.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar criador de quiz"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-6 overflow-y-auto pr-2 flex-1" noValidate>
          {errorMsg && (
            <div role="alert" className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-xs font-semibold text-red-300">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="quiz-title-input" className="block text-xs font-semibold text-slate-300 mb-1">
                Título do Quiz
              </label>
              <input
                id="quiz-title-input"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="Ex: Revisão de Biologia Celular - 2º Ano"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label htmlFor="quiz-difficulty-select" className="block text-xs font-semibold text-slate-300 mb-1">
                Dificuldade
              </label>
              <select
                id="quiz-difficulty-select"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'Fácil' | 'Médio' | 'Desafiador')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-400"
              >
                <option value="Fácil">Fácil</option>
                <option value="Médio">Médio</option>
                <option value="Desafiador">Desafiador</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="quiz-category-input" className="block text-xs font-semibold text-slate-300 mb-1">
                Categoria / Disciplina
              </label>
              <input
                id="quiz-category-input"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white"
              />
            </div>
            <div>
              <label htmlFor="quiz-desc-input" className="block text-xs font-semibold text-slate-300 mb-1">
                Descrição Curta
              </label>
              <input
                id="quiz-desc-input"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Resumo do desafio para os jogadores..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white"
              />
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200">
                Perguntas do Quiz ({questions.length})
              </h3>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Adicionar Pergunta
              </button>
            </div>

            {questions.map((q, qIdx) => (
              <div
                key={q.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-emerald-400">
                    PERGUNTA #{qIdx + 1}
                  </span>

                  <div className="flex items-center gap-3">
                    <label className="text-xs text-slate-400 flex items-center gap-1.5">
                      Tempo:
                      <select
                        aria-label={`Tempo da pergunta ${qIdx + 1}`}
                        value={q.timeLimit}
                        onChange={(e) =>
                          handleQuestionChange(qIdx, 'timeLimit', Number(e.target.value))
                        }
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs"
                      >
                        <option value={10}>10s</option>
                        <option value={15}>15s</option>
                        <option value={20}>20s</option>
                        <option value={30}>30s</option>
                      </select>
                    </label>

                    <label className="text-xs text-slate-400 flex items-center gap-1.5">
                      Pontos:
                      <select
                        aria-label={`Pontos da pergunta ${qIdx + 1}`}
                        value={q.basePoints}
                        onChange={(e) =>
                          handleQuestionChange(qIdx, 'basePoints', Number(e.target.value))
                        }
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs"
                      >
                        <option value={1000}>1.000 pts (Padrão)</option>
                        <option value={2000}>2.000 pts (Pontos Duplos)</option>
                      </select>
                    </label>

                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(qIdx)}
                        aria-label={`Remover pergunta ${qIdx + 1}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    aria-label={`Enunciado da pergunta ${qIdx + 1}`}
                    value={q.question}
                    onChange={(e) => handleQuestionChange(qIdx, 'question', e.target.value)}
                    placeholder="Digite o enunciado da pergunta..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {q.options.map((opt, optIdx) => {
                    const isCorrect = q.correctOptionId === opt.id;
                    const colorBadge = {
                      red: 'bg-red-600 text-white',
                      blue: 'bg-blue-600 text-white',
                      amber: 'bg-amber-500 text-slate-950',
                      green: 'bg-emerald-600 text-white',
                    }[opt.color];

                    return (
                      <div
                        key={opt.id}
                        className={`flex items-center gap-2 p-2 rounded-xl border ${
                          isCorrect
                            ? 'bg-emerald-950/30 border-emerald-500'
                            : 'bg-slate-900 border-slate-800'
                        }`}
                      >
                        <span className={`p-2 rounded-lg shrink-0 ${colorBadge}`}>
                          <KahootShapeIcon shape={opt.shape} className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          aria-label={`Alternativa ${optIdx + 1} da pergunta ${qIdx + 1}`}
                          value={opt.text}
                          onChange={(e) =>
                            handleOptionTextChange(qIdx, optIdx, e.target.value)
                          }
                          placeholder={`Alternativa ${optIdx + 1}`}
                          className="flex-1 bg-transparent text-xs text-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleQuestionChange(qIdx, 'correctOptionId', opt.id)
                          }
                          aria-label={`Marcar alternativa ${optIdx + 1} como correta`}
                          className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                            isCorrect
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                          {isCorrect ? 'Correta' : 'Marcar'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Salvar Quiz e Gerar QR Code
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
