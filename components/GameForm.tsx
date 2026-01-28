
import React, { useState } from 'react';
import { Game, Platform } from '../types';
import { Button } from './Button';
import { X, Trophy, Clock, Gamepad2, Star, Calendar } from 'lucide-react';

interface GameFormProps {
  game?: Game | null;
  onClose: () => void;
  onSave: (game: Partial<Game>) => Promise<void>;
}

export const GameForm: React.FC<GameFormProps> = ({ game, onClose, onSave }) => {
  const [title, setTitle] = useState(game?.title || '');
  const [platform, setPlatform] = useState<Platform>(game?.platform || 'PC');
  const [completionDate, setCompletionDate] = useState(game?.completion_date || new Date().toISOString().split('T')[0]);
  const [rating, setRating] = useState(game?.rating || 8);
  const [isPlatinum, setIsPlatinum] = useState(game?.is_platinum || false);
  const [hoursPlayed, setHoursPlayed] = useState(game?.hours_played || 0);
  
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave({
        id: game?.id,
        title,
        platform,
        completion_date: completionDate,
        rating,
        is_platinum: isPlatinum,
        hours_played: hoursPlayed,
        background_image: '' // Removido campo de URL, mantendo vazio
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/95 backdrop-blur-xl">
      <div className="glass rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-10 sm:zoom-in duration-300 border-x border-t sm:border border-white/10">
        <div className="flex items-center justify-between p-6 md:p-8 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center border border-purple-500/30">
              <Gamepad2 className="text-purple-500" size={24} />
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight uppercase italic">
              {game ? 'Editar Jogo' : 'Novo Registro'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-500 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5 md:space-y-6 max-h-[85vh] sm:max-h-[75vh] overflow-y-auto custom-scrollbar pb-10 sm:pb-8">
          {/* Nome do Jogo */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 block">Nome do Jogo</label>
            <input
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-white placeholder:text-slate-700 font-bold"
              placeholder="Ex: God of War Ragnarök"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Plataforma</label>
              <div className="relative">
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as Platform)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-white font-bold appearance-none cursor-pointer"
                >
                  <option value="PC">PC / Steam</option>
                  <option value="PS5">PlayStation 5</option>
                  <option value="Xbox">Xbox Series X/S</option>
                  <option value="Switch">Nintendo Switch</option>
                  <option value="Outro">Outro</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                   <Gamepad2 size={16} />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Data da Vitória</label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-white font-bold"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Tempo Gasto (h)</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="number"
                  min="0"
                  value={hoursPlayed}
                  onChange={(e) => setHoursPlayed(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-white font-bold"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Status de Honra</label>
              <button
                type="button"
                onClick={() => setIsPlatinum(!isPlatinum)}
                className={`w-full flex items-center justify-center gap-2 rounded-2xl py-4 border transition-all font-black uppercase tracking-tighter italic text-sm ${
                  isPlatinum 
                    ? 'bg-yellow-400/20 border-yellow-500/50 text-yellow-300 shadow-[0_0_20px_rgba(234,179,8,0.2)]' 
                    : 'bg-slate-900/50 border-white/10 text-slate-500 hover:border-white/20'
                }`}
              >
                <Trophy size={18} className={isPlatinum ? 'animate-bounce' : ''} />
                {isPlatinum ? 'PLATINADO!' : 'NÃO PLATINADO'}
              </button>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3 px-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nota da Experiência</label>
              <div className="flex items-center gap-1.5 text-amber-400 font-black text-xl">
                <Star size={20} fill="currentColor" />
                {rating}
              </div>
            </div>
            <div className="px-2">
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={rating}
                onChange={(e) => setRating(parseInt(e.target.value))}
                className="w-full accent-purple-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between mt-2 px-1">
                 {[0, 2, 4, 6, 8, 10].map(n => (
                   <span key={n} className="text-[8px] font-black text-slate-700">{n}</span>
                 ))}
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col md:flex-row gap-3 md:gap-4">
            <Button type="button" variant="ghost" onClick={onClose} className="w-full rounded-2xl py-4 font-bold border border-white/5 order-2 md:order-1">
              Cancelar
            </Button>
            <Button type="submit" isLoading={isLoading} className="w-full rounded-2xl py-4 font-black text-lg shadow-2xl order-1 md:order-2">
              {game ? 'Salvar Edição' : 'Confirmar Registro'}
            </Button>
          </div>
        </form>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};
