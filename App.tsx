
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
  Download,
  Trophy,
  Clock,
  TrendingUp,
  Star,
  X
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
  const [showAd, setShowAd] = useState(true);
  
  const [filterPlatform, setFilterPlatform] = useState<Platform | 'Todos'>('Todos');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gamertag, setGamertag] = useState('');
  const [mainPlatform, setMainPlatform] = useState<MainPlatform>('PC');
  const [showPassword, setShowPassword] = useState(false);

  const fetchGames = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
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
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user as any);
        fetchGames(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user as any);
        fetchGames(session.user.id);
      } else {
        setUser(null);
        setGames([]);
        setIsLoading(false);
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
          if (!data.session) {
            alert("Cadastro realizado! Por favor, verifique seu e-mail para confirmar a conta antes de entrar.");
            setIsLogin(true);
          } else {
            setUser(data.user as any);
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
    
    try {
      if (gameData.id) {
        const { error } = await supabase.from('games').update(gameToSave).eq('id', gameData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('games').insert(gameToSave);
        if (error) throw error;
      }
      fetchGames(user.id);
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    }
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

  const stats = useMemo(() => {
    const totalHours = games.reduce((acc, g) => acc + (g.hours_played || 0), 0);
    const avgRating = games.length > 0 ? (games.reduce((acc, g) => acc + g.rating, 0) / games.length).toFixed(1) : 0;
    const platinums = games.filter(g => g.is_platinum).length;
    
    return {
      total: games.length,
      hours: totalHours,
      avg: avgRating,
      platinums
    };
  }, [games]);

  const handleDownloadPDF = () => {
    if (!user) return;
    
    const doc = new jsPDF();
    const tag = user.user_metadata.gamertag || 'Player';

    doc.setFillColor(139, 92, 246); 
    doc.rect(0, 0, 210, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('EuZerei!', 15, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`COLEÇÃO COMPLETA DE ${tag.toUpperCase()}`, 15, 35);

    doc.setTextColor(51, 65, 85); 
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO DA JORNADA', 15, 60);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total de Jogos Zerados: ${stats.total}`, 15, 68);
    doc.text(`Tempo Total Investido: ${stats.hours} Horas`, 15, 74);
    doc.text(`Relatório gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 15, 80);

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
        0: { cellWidth: 60 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 15 },
        4: { cellWidth: 15 },
        5: { cellWidth: 20 }
      }
    });

    doc.save(`EuZerei_Minha_Colecao_${tag}.pdf`);
  };

  if (isLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-purple-500" size={48} />
          <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Carregando Vitórias...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/20">
        <div className="glass max-w-lg w-full p-8 rounded-[2.5rem] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-2xl relative overflow-hidden border border-white/10">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/10 blur-[100px] rounded-full"></div>
          
          <div className="text-center relative z-10">
            <div className="w-20 h-20 bg-purple-600/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-purple-500/30 shadow-[0_0_30px_rgba(139,92,246,0.2)]">
              <Gamepad2 className="text-purple-500" size={40} />
            </div>
            <h1 className="text-4xl font-black tracking-tighter mb-2 uppercase italic">EuZerei<span className="text-purple-500">!</span></h1>
            <p className="text-slate-400 font-medium">Sua estante virtual de conquistas.</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5 relative z-10">
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
                      className="w-full bg-slate-900/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-white placeholder:text-slate-600 font-bold"
                      placeholder="Ex: ProGamer_X"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Console Principal</label>
                  <select
                    value={mainPlatform}
                    onChange={(e) => setMainPlatform(e.target.value as MainPlatform)}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-white font-bold appearance-none cursor-pointer"
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
                  className="w-full bg-slate-900/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-white placeholder:text-slate-600 font-bold"
                  placeholder="seu@email.com"
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
                  className="w-full bg-slate-900/50 border border-white/10 rounded-2xl pl-12 pr-12 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-white placeholder:text-slate-600 font-bold"
                  placeholder="••••••••"
                  minLength={6}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
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
                    className="w-full bg-slate-900/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-white placeholder:text-slate-600 font-bold"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            <Button type="submit" isLoading={isAuthLoading} className="w-full py-4 text-xl rounded-2xl font-black uppercase tracking-tighter italic">
              {isLogin ? 'Entrar Agora' : 'Criar Perfil'} <ChevronRight size={22} className="ml-1" />
            </Button>
          </form>

          <div className="pt-4 text-center relative z-10">
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setEmail('');
                setPassword('');
                setConfirmPassword('');
              }}
              className="text-[10px] text-slate-500 hover:text-purple-400 font-black uppercase tracking-[0.2em] transition-colors"
            >
              {isLogin ? 'Não tem conta? Registre-se' : 'Já é um campeão? Faça login'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-slate-950 text-white selection:bg-purple-500 selection:text-white">
      <header className="sticky top-0 z-40 glass border-b border-white/5 px-4 md:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
              <div className="p-2 bg-purple-600/10 rounded-xl border border-purple-500/20 group-hover:bg-purple-600/20 transition-all">
                <Gamepad2 className="text-purple-500" size={24} />
              </div>
              <h1 className="text-xl font-black uppercase italic tracking-tighter">EuZerei<span className="text-purple-500">!</span></h1>
            </div>
            <button onClick={handleLogout} className="sm:hidden p-2 text-slate-500 hover:text-red-400 transition-colors bg-slate-900/50 rounded-lg"><LogOut size={18}/></button>
          </div>

          <div className="w-full sm:max-w-xs md:max-w-md">
            <div className="flex items-center gap-3 bg-slate-900/50 px-4 py-2.5 rounded-2xl border border-white/10 focus-within:ring-2 focus-within:ring-purple-500/50 transition-all group">
              <Search className="text-slate-600 group-focus-within:text-purple-500" size={18} />
              <input 
                type="text"
                placeholder="Qual jogo você zerou hoje?..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none focus:outline-none w-full text-sm font-bold placeholder:text-slate-700 text-white"
              />
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4">
             <div className="text-right">
                <p className="text-xs font-black text-white leading-none uppercase italic">{user.user_metadata.gamertag || 'Player'}</p>
                <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em] mt-1">{user.user_metadata.main_platform}</p>
             </div>
             <button onClick={handleLogout} className="p-2.5 bg-slate-900/50 rounded-xl text-slate-500 hover:text-red-400 transition-colors border border-white/5 hover:bg-red-500/5"><LogOut size={20}/></button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 animate-in fade-in duration-500">
        
        {/* AdSense Section */}
        {showAd && (
          <div className="mb-10 w-full flex flex-col items-center animate-in zoom-in duration-700">
            <div className="w-full flex justify-between items-center mb-1.5 px-2">
              <button onClick={() => setShowAd(false)} className="text-slate-700 hover:text-white transition-colors" title="Fechar anúncio">
              </button>
            </div>
            <div className="w-full glass rounded-[2rem] border border-white/5 bg-slate-900/20 flex items-center justify-center overflow-hidden min-h-[100px] md:min-h-[120px] relative group shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/[0.02] to-transparent animate-[shimmer_4s_infinite]"></div>
              
              {/* Placeholder Content that looks like a real Ad slot container */}
              <div className="flex flex-col items-center gap-2 relative z-10 opacity-30 group-hover:opacity-50 transition-opacity">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-slate-800 rounded flex items-center justify-center border border-white/5">
                    <TrendingUp size={16} />
                  </div>
                  <div className="space-y-1">
                    <div className="h-2 w-32 bg-slate-800 rounded"></div>
                    <div className="h-2 w-20 bg-slate-800 rounded"></div>
                  </div>
                </div>
                <div className="text-slate-400 text-[10px] font-black uppercase italic tracking-widest text-center">
                  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8784674889395340"
                    crossorigin="anonymous"></script>
                </div>
              </div>

              {/* Real AdSense Script Integration point comment:
                  Insert <ins class="adsbygoogle" ...> here 
              */}
            </div>
          </div>
        )}

        {/* Stats Section */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="glass p-5 rounded-[2rem] border border-white/5 flex flex-col justify-between hover:border-purple-500/20 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-500 group-hover:scale-110 transition-transform">
                <Trophy size={20} />
              </div>
              <TrendingUp size={14} className="text-green-500" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Zerados</p>
              <h3 className="text-3xl font-black italic">{stats.total}</h3>
            </div>
          </div>

          <div className="glass p-5 rounded-[2rem] border border-white/5 flex flex-col justify-between hover:border-blue-500/20 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-500 group-hover:scale-110 transition-transform">
                <Clock size={20} />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Horas de Jogo</p>
              <h3 className="text-3xl font-black italic">{stats.hours}h</h3>
            </div>
          </div>

          <div className="glass p-5 rounded-[2rem] border border-white/5 flex flex-col justify-between hover:border-amber-500/20 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500 group-hover:scale-110 transition-transform">
                <Star size={20} />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Média de Nota</p>
              <h3 className="text-3xl font-black italic">{stats.avg}</h3>
            </div>
          </div>

          <div className="glass p-5 rounded-[2rem] border border-white/5 flex flex-col justify-between hover:border-yellow-500/20 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-yellow-500/10 rounded-xl text-yellow-500 group-hover:scale-110 transition-transform">
                <Trophy size={20} fill="currentColor" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Platinas</p>
              <h3 className="text-3xl font-black italic">{stats.platinums}</h3>
            </div>
          </div>
        </section>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/5 rounded-2xl">
              <LayoutGrid size={24} className="text-slate-400" />
            </div>
            <div>
                <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Minha Coleção</h2>
                <p className="text-slate-500 text-[10px] font-black mt-1.5 uppercase tracking-widest">Organizada por suas vitórias recentes</p>
            </div>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button onClick={handleDownloadPDF} variant="secondary" className="flex-1 sm:flex-none rounded-2xl px-6 font-black uppercase tracking-tighter text-xs">
              <Download size={18} className="mr-1" /> PDF
            </Button>
            <Button onClick={() => { setEditingGame(null); setIsModalOpen(true); }} className="flex-1 sm:flex-none rounded-2xl px-8 py-3.5 font-black uppercase tracking-tighter shadow-[0_10px_30px_rgba(139,92,246,0.3)] hover:scale-105 transition-all text-sm">
              <Plus size={20} className="mr-1" /> Novo Jogo
            </Button>
          </div>
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-3 mb-8 bg-slate-900/30 p-3 rounded-2xl border border-white/5">
          <div className="flex items-center gap-2 bg-slate-900/60 px-4 py-2 rounded-xl border border-white/5 min-w-[160px] flex-1 sm:flex-none">
            <Filter size={16} className="text-slate-600 shrink-0" />
            <select 
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value as Platform | 'Todos')}
              className="bg-transparent text-[11px] font-black uppercase text-slate-300 focus:outline-none cursor-pointer w-full"
            >
              <option value="Todos">Todas Plataformas</option>
              <option value="PC">PC / Steam</option>
              <option value="PS5">PlayStation 5</option>
              <option value="Xbox">Xbox Series X/S</option>
              <option value="Switch">Nintendo Switch</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/60 px-4 py-2 rounded-xl border border-white/5 min-w-[160px] flex-1 sm:flex-none">
            <ArrowUpDown size={16} className="text-slate-600 shrink-0" />
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-[11px] font-black uppercase text-slate-300 focus:outline-none cursor-pointer w-full"
            >
              <option value="date-desc">Recentes Primeiro</option>
              <option value="date-asc">Antigos Primeiro</option>
              <option value="rating-desc">Melhor Avaliados</option>
              <option value="rating-asc">Pior Avaliados</option>
              <option value="time-desc">Mais Horas</option>
              <option value="time-asc">Menos Horas</option>
            </select>
          </div>

          <div className="ml-auto text-[10px] font-black uppercase text-slate-700 tracking-[0.2em] hidden lg:block">
            {processedGames.length} Jogos na Visão Atual
          </div>
        </div>

        {processedGames.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
          <div className="text-center py-32 glass rounded-[3rem] border-dashed border-white/10 px-8 max-w-lg mx-auto border-2">
            <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-inner">
              <Gamepad2 size={40} className="text-slate-800" />
            </div>
            <h3 className="text-2xl font-black uppercase italic tracking-tighter">Coleção de Fantasma</h3>
            <p className="text-slate-500 mt-3 text-sm font-medium leading-relaxed">Você ainda não registrou nenhuma vitória ou os filtros não encontraram nada.</p>
            <div className="mt-8 flex gap-3 justify-center">
              <Button onClick={() => {setFilterPlatform('Todos'); setSearchQuery('');}} variant="secondary" className="text-[10px] uppercase font-black px-6">Limpar Busca</Button>
              <Button onClick={() => setIsModalOpen(true)} className="text-[10px] uppercase font-black px-6">Adicionar Agora</Button>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Floating Action Button */}
      <button 
        onClick={() => { setEditingGame(null); setIsModalOpen(true); }}
        className="fixed bottom-8 right-8 sm:hidden w-16 h-16 bg-purple-600 rounded-full shadow-[0_15px_30px_rgba(139,92,246,0.4)] flex items-center justify-center z-40 active:scale-90 transition-transform border border-purple-400/30"
      >
        <Plus size={32} className="text-white" />
      </button>

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
