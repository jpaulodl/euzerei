
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from './services/supabase';
import { Game, User, MainPlatform, Platform } from './types';
import { GameCard } from './components/GameCard';
import { GameForm } from './components/GameForm';
import { Button } from './components/Button';
import { 
  Plus, 
  LogOut, 
  Loader2, 
  Gamepad2, 
  LayoutGrid, 
  Search, 
  Eye, 
  EyeOff, 
  User as UserIcon, 
  Mail, 
  Lock, 
  ChevronRight, 
  Filter, 
  ArrowUpDown,
  Download
} from 'lucide-react';
// @ts-ignore
import { jsPDF } from 'jspdf';
// @ts-ignore
import 'jspdf-autotable';

type SortOption = 'date-desc' | 'date-asc' | 'rating-desc' | 'rating-asc' | 'time-desc' | 'time-asc';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filtering and Sorting state
  const [filterPlatform, setFilterPlatform] = useState<Platform | 'Todos'>('Todos');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  // Auth states
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gamertag, setGamertag] = useState('');
  const [mainPlatform, setMainPlatform] = useState<MainPlatform>('PC');
  const [showPassword, setShowPassword] = useState(false);

  const fetchGames = useCallback(async (userId: string) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('user_id', userId)
      .order('completion_date', { ascending: false });
    
    if (error) {
      console.error("Erro ao buscar jogos:", error.message);
    } else if (data) {
      setGames(data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user as any);
        fetchGames(session.user.id);
      }
      setIsLoading(false);
    });

    // Escutar mudanças na autenticação (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user as any);
        fetchGames(session.user.id);
      } else {
        setUser(null);
        setGames([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchGames]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          alert(`Erro no login: ${error.message}`);
        } else if (data.user) {
          setUser(data.user as any);
          fetchGames(data.user.id);
        }
      } else {
        if (password !== confirmPassword) {
          alert("As senhas não coincidem!");
          setIsAuthLoading(false);
          return;
        }
        
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password, 
          options: { 
            data: { 
              gamertag,
              main_platform: mainPlatform
            } 
          } 
        });

        if (error) {
          alert(`Erro no cadastro: ${error.message}`);
        } else if (data.user) {
          // Se o e-mail de confirmação estiver ativado, o usuário existirá mas pode não ter sessão
          if (!data.session) {
            alert("Cadastro realizado! Por favor, verifique seu e-mail para confirmar a conta antes de entrar.");
            setIsLogin(true); // Volta para tela de login
          } else {
            setUser(data.user as any);
            fetchGames(data.user.id);
          }
        }
      }
    } catch (err: any) {
      alert("Ocorreu um erro inesperado.");
      console.error(err);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setGames([]);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setGamertag('');
  };

  const handleSaveGame = async (gameData: Partial<Game>) => {
    if (!user) return;
    
    const gameToSave = { ...gameData, user_id: user.id };
    
    if (gameData.id) {
      const { error } = await supabase.from('games').update(gameToSave).eq('id', gameData.id);
      if (error) alert("Erro ao atualizar: " + error.message);
    } else {
      const { error } = await supabase.from('games').insert(gameToSave);
      if (error) alert("Erro ao inserir: " + error.message);
    }
    fetchGames(user.id);
  };

  const handleDeleteGame = async (id: string) => {
    if (confirm('Deseja realmente remover este registro da sua coleção?')) {
      const previousGames = [...games];
      setGames(current => current.filter(g => g.id !== id));
      
      try {
        const { error } = await supabase.from('games').delete().eq('id', id);
        if (error) throw error;
      } catch (err: any) {
        alert("Erro ao remover: " + err.message);
        setGames(previousGames);
      }
    }
  };

  const handleShareGame = async (game: Game) => {
    const shareText = `Acabei de zerar "${game.title}" no ${game.platform}! 🏆 Minha nota: ${game.rating}/10. ${game.is_platinum ? 'PLATINADO!' : ''} 🎉 #EuZerei`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'EuZerei! - Minha Vitória',
          text: shareText,
          url: window.location.href
        });
      } catch (err) {
        copyToClipboard(shareText);
      }
    } else {
      copyToClipboard(shareText);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copiado para compartilhar!');
    } catch (err) {
      alert('Erro ao copiar.');
    }
  };

  const processedGames = useMemo(() => {
    let result = [...games];

    if (searchQuery) {
      result = result.filter(g => 
        g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.platform.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterPlatform !== 'Todos') {
      result = result.filter(g => g.platform === filterPlatform);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc': return new Date(b.completion_date).getTime() - new Date(a.completion_date).getTime();
        case 'date-asc': return new Date(a.completion_date).getTime() - new Date(b.completion_date).getTime();
        case 'rating-desc': return b.rating - a.rating;
        case 'rating-asc': return a.rating - b.rating;
        case 'time-desc': return b.hours_played - a.hours_played;
        case 'time-asc': return a.hours_played - b.hours_played;
        default: return 0;
      }
    });

    return result;
  }, [games, searchQuery, filterPlatform, sortBy]);

  const handleDownloadPDF = () => {
    if (!user) return;
    
    const doc = new jsPDF();
    const tag = user.user_metadata.gamertag || 'Player';
    const totalHours = processedGames.reduce((acc, g) => acc + (g.hours_played || 0), 0);

    // Header Background
    doc.setFillColor(139, 92, 246); // Purple-600
    doc.rect(0, 0, 210, 45, 'F');
    
    // Header Content
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('EuZerei!', 15, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`COLEÇÃO COMPLETA DE ${tag.toUpperCase()}`, 15, 35);

    // Info Section
    doc.setTextColor(51, 65, 85); // Slate-700
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO DA JORNADA', 15, 60);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total de Jogos Zerados: ${processedGames.length}`, 15, 68);
    doc.text(`Tempo Total Investido: ${totalHours} Horas`, 15, 74);
    doc.text(`Relatório gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 15, 80);

    // Table
    const tableData = processedGames.map(g => [
      g.title,
      g.platform,
      new Date(g.completion_date).toLocaleDateString('pt-BR'),
      `${g.hours_played}h`,
      `${g.rating}/10`,
      g.is_platinum ? 'Sim' : 'Não'
    ]);

    (doc as any).autoTable({
      startY: 90,
      head: [['Título do Jogo', 'Plataforma', 'Conclusão', 'Tempo', 'Nota', 'Platina']],
      body: tableData,
      headStyles: { fillColor: [139, 92, 246], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 60 }, // Title
        1: { cellWidth: 25 }, // Platform
        2: { cellWidth: 25 }, // Date
        3: { cellWidth: 15 }, // Time
        4: { cellWidth: 15 }, // Rating
        5: { cellWidth: 20 }  // Platinum
      }
    });

    doc.save(`EuZerei_Minha_Colecao_${tag}.pdf`);
  };

  if (isLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="animate-spin text-purple-500" size={48} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/20">
        <div className="glass max-w-lg w-full p-8 rounded-[2rem] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-2xl">
          <div className="text-center">
            <div className="w-20 h-20 bg-purple-600/20 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
              <Gamepad2 className="text-purple-500" size={40} />
            </div>
            <h1 className="text-4xl font-black tracking-tight mb-2 uppercase italic">EuZerei<span className="text-purple-500">!</span></h1>
            <p className="text-slate-400">Registre sua jornada gamer.</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {!isLogin && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Gamertag</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type="text"
                      required
                      value={gamertag}
                      onChange={(e) => setGamertag(e.target.value)}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-white placeholder:text-slate-600"
                      placeholder="Ex: ProGamer_X"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Console Preferido</label>
                  <select
                    value={mainPlatform}
                    onChange={(e) => setMainPlatform(e.target.value as MainPlatform)}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-white font-bold"
                  >
                    <option value="PC">PC / Steam</option>
                    <option value="PlayStation">PlayStation</option>
                    <option value="Xbox">Xbox</option>
                    <option value="Nintendo">Nintendo</option>
                  </select>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-white placeholder:text-slate-600"
                  placeholder="exemplo@email.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-2xl pl-12 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-white placeholder:text-slate-600"
                  placeholder="••••••••"
                  minLength={6}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Confirmar Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-white placeholder:text-slate-600"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            <Button type="submit" isLoading={isAuthLoading} className="w-full py-4 text-lg rounded-2xl font-black uppercase tracking-tighter italic">
              {isLogin ? 'Entrar' : 'Cadastrar'} <ChevronRight size={20} className="ml-1" />
            </Button>
          </form>

          <div className="pt-4 text-center">
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setEmail('');
                setPassword('');
                setConfirmPassword('');
              }}
              className="text-xs text-slate-500 hover:text-purple-400 font-bold uppercase tracking-widest"
            >
              {isLogin ? 'Criar nova conta' : 'Já tenho conta'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-slate-950">
      <header className="sticky top-0 z-50 glass border-b border-white/5 px-4 md:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <Gamepad2 className="text-purple-500" size={28} />
              <h1 className="text-xl font-black uppercase italic tracking-tighter">EuZerei<span className="text-purple-500">!</span></h1>
            </div>
            <button onClick={handleLogout} className="sm:hidden p-2 text-slate-500"><LogOut size={18}/></button>
          </div>

          <div className="w-full sm:max-w-xs md:max-w-md">
            <div className="flex items-center gap-3 bg-slate-900/50 px-4 py-2 rounded-xl border border-white/5 focus-within:ring-2 focus-within:ring-purple-500/50 transition-all">
              <Search className="text-slate-500" size={16} />
              <input 
                type="text"
                placeholder="Pesquisar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none focus:outline-none w-full text-sm font-bold placeholder:text-slate-700 text-white"
              />
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4">
             <div className="text-right">
                <p className="text-[10px] font-black text-white leading-none uppercase italic">{user.user_metadata.gamertag || 'Player'}</p>
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{user.user_metadata.main_platform}</p>
             </div>
             <button onClick={handleLogout} className="p-2 bg-slate-900/50 rounded-xl text-slate-500 hover:text-red-400 transition-colors border border-white/5"><LogOut size={18}/></button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        {/* Google AdSense Area */}
        <div className="mb-8 w-full flex flex-col items-center animate-in fade-in duration-700">
          <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-700 mb-2">Publicidade</span>
          <div className="w-full glass rounded-2xl border border-white/5 bg-slate-900/10 flex items-center justify-center overflow-hidden min-h-[90px] md:min-h-[110px] relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.01] to-transparent animate-[shimmer_2s_infinite]"></div>
            <div className="text-slate-800 text-[11px] font-black uppercase italic tracking-widest opacity-40">
              Espaço Reservado para Google AdSense
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-500">
              <LayoutGrid size={20} />
            </div>
            <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter italic leading-none">Minha Coleção</h2>
                <p className="text-slate-500 text-[9px] font-bold mt-1 uppercase tracking-widest">{games.length} JOGOS FINALIZADOS</p>
            </div>
          </div>
          <Button onClick={() => { setEditingGame(null); setIsModalOpen(true); }} className="w-full sm:w-auto rounded-xl px-5 py-2.5 font-black uppercase tracking-tighter shadow-xl hover:scale-105 transition-all text-xs">
            <Plus size={18} className="mr-1" /> Adicionar Jogo
          </Button>
        </div>

        {/* Filtros e Ordenação */}
        <div className="flex flex-wrap items-center gap-3 mb-6 bg-slate-900/30 p-2.5 rounded-xl border border-white/5">
          <div className="flex items-center gap-2 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-white/5 min-w-[140px]">
            <Filter size={14} className="text-slate-500 shrink-0" />
            <select 
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value as Platform | 'Todos')}
              className="bg-transparent text-[10px] font-black uppercase text-slate-300 focus:outline-none cursor-pointer w-full"
            >
              <option value="Todos">Plataforma: Todas</option>
              <option value="PC">PC</option>
              <option value="PS5">PlayStation 5</option>
              <option value="Xbox">Xbox</option>
              <option value="Switch">Switch</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-white/5 min-w-[140px]">
            <ArrowUpDown size={14} className="text-slate-500 shrink-0" />
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-[10px] font-black uppercase text-slate-300 focus:outline-none cursor-pointer w-full"
            >
              <option value="date-desc">Data: Recente</option>
              <option value="date-asc">Data: Antigo</option>
              <option value="rating-desc">Nota: Maior</option>
              <option value="rating-asc">Nota: Menor</option>
              <option value="time-desc">Tempo: Mais Horas</option>
              <option value="time-asc">Tempo: Menos Horas</option>
            </select>
          </div>

          <button 
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 bg-slate-900/60 hover:bg-purple-600/20 px-4 py-1.5 rounded-lg border border-white/5 transition-all text-[10px] font-black uppercase text-slate-300 hover:text-purple-400 group focus:outline-none"
          >
            <Download size={14} className="group-hover:translate-y-[1px] transition-transform" />
            <span>Baixar PDF</span>
          </button>

          <div className="ml-auto text-[9px] font-black uppercase text-slate-600 tracking-widest hidden sm:block">
            {processedGames.length} resultados
          </div>
        </div>

        {processedGames.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {processedGames.map(game => (
              <GameCard 
                key={game.id} 
                game={game} 
                onEdit={(g) => { setEditingGame(g); setIsModalOpen(true); }}
                onDelete={handleDeleteGame}
                onShare={handleShareGame}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 glass rounded-[2rem] border-dashed border-white/10 px-8 max-md mx-auto">
            <Gamepad2 size={36} className="mx-auto mb-3 text-slate-800" />
            <h3 className="text-lg font-black uppercase italic tracking-tighter">Nada encontrado</h3>
            <p className="text-slate-500 mt-2 text-xs font-medium">Tente outros filtros.</p>
            <Button onClick={() => {setFilterPlatform('Todos'); setSearchQuery('');}} variant="ghost" className="mt-4 mx-auto text-[10px] uppercase font-black">Limpar Filtros</Button>
          </div>
        )}
      </main>

      {isModalOpen && (
        <GameForm 
          game={editingGame} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSaveGame} 
        />
      )}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default App;
