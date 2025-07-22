import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

const usuarios = {
  colaborador: { email: 'colaborador@pingdesk.com', senha: 'ping1234', tipo: 'colaborador' },
  colaborador2: { email: 'colaborador2@pingdesk.com', senha: 'ping1234', tipo: 'colaborador2' },
  mynet: { email: 'mynet@provedor.com', senha: 'Myn3T@MF25', tipo: 'provedor', provedor: 'Mynet' },
  bkup: { email: 'bkup@provedor.com', senha: 'Bkup@2025', tipo: 'provedor', provedor: 'Bkup' },
};

const opcoesValores = [
  { valor: 3.5, label: 'R$ 3,50 (N1)' },
  { valor: 4.5, label: 'R$ 4,50 (N2)' },
  { valor: 5.5, label: 'R$ 5,50 (N1)' },
  { valor: 6.5, label: 'R$ 6,50 (N2)' },
  { valor: 99.9, label: 'R$ 99,90 (Venda)' },
  { valor: 109.9, label: 'R$ 109,90 (Venda)' },
  { valor: 119.9, label: 'R$ 119,90 (Venda)' },
  { valor: 129.9, label: 'R$ 129,90 (Venda)' },
  { valor: 139.9, label: 'R$ 139,90 (Venda)' },
  { valor: 149.9, label: 'R$ 149,90 (Venda)' },
  { valor: 159.9, label: 'R$ 159,90 (Venda)' },
  { valor: 199.9, label: 'R$ 199,90 (Venda)' },
];

// Adicione as opções específicas para o novo colaborador (colaborador2)
const opcoesValoresColaborador2 = [
  { valor: 1.5, label: 'Massivo' },
  { valor: 3.5, label: 'N1' },
  { valor: 4.5, label: 'N2' },
  { valor: 99.9, label: '500Mbps' },
  { valor: 109.9, label: '650Mbps' },
  { valor: 119.9, label: '850Mbps' },
  { valor: 129.9, label: '1000Mbps' },
  { valor: 199.9, label: 'Plano Gamer' },
  { valor: 30.0, label: 'Roteador Adicional' },
];

// Função para formatar data para yyyy-mm-dd (input date compatível)
const formatarDataInput = (date) => {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
};

export default function CentralProvedor() {
  // login
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [user, setUser] = useState(null);

  // chamados
  const [chamados, setChamados] = useState(() => {
    const saved = localStorage.getItem('chamados');
    return saved ? JSON.parse(saved) : [];
  });

  // filtro data para provedores
  const [filtroInicio, setFiltroInicio] = useState('');
  const [filtroFim, setFiltroFim] = useState('');

  // formulário de chamado para criar/editar
  const [form, setForm] = useState({
    id: null,
    provedor: 'Mynet',
    nome: '',
    telefone: '',
    protocolo: '',
    data: formatarDataInput(new Date()),
    valor: 3.5,
    descricao: '',
  });

  // salvar chamados no localStorage toda vez que alterar
  useEffect(() => {
    localStorage.setItem('chamados', JSON.stringify(chamados));
  }, [chamados]);

  // Corrige datas antigas para yyyy-mm-dd
  useEffect(() => {
    setChamados((old) =>
      old.map((c) => ({
        ...c,
        data: /^\d{4}-\d{2}-\d{2}$/.test(c.data)
          ? c.data
          : formatarDataInput(new Date(c.data.split('-').reverse().join('-')))
      }))
    );
    // eslint-disable-next-line
  }, []);

  // Login handler
  function handleLogin(e) {
    e.preventDefault();
    const found = Object.values(usuarios).find(
      (u) => u.email === email && u.senha === senha
    );
    if (found) {
      setUser(found);
      setEmail('');
      setSenha('');
    } else {
      alert('Usuário ou senha incorretos!');
    }
  }

  // Logout
  function logout() {
    setUser(null);
  }

  // Criar ou editar chamado
  function handleSalvarChamado(e) {
    e.preventDefault();
    if (!form.nome || !form.telefone || !form.protocolo || !form.descricao) {
      alert('Preencha todos os campos!');
      return;
    }

    if (form.id !== null) {
      // editar
      setChamados((old) =>
        old.map((c) => (c.id === form.id ? { ...form, id: form.id } : c))
      );
    } else {
      // novo chamado
      setChamados((old) => [
        ...old,
        { ...form, id: Date.now() },
      ]);
    }

    setForm({
      id: null,
      provedor: 'Mynet',
      nome: '',
      telefone: '',
      protocolo: '',
      data: formatarDataInput(new Date()),
      valor: 3.5,
      descricao: '',
    });
  }

  // Editar chamado
  function editarChamado(id) {
    const c = chamados.find((c) => c.id === id);
    if (c) setForm(c);
  }

  // Excluir chamado
  function excluirChamado(id) {
    if (window.confirm('Confirma exclusão do chamado?')) {
      setChamados((old) => old.filter((c) => c.id !== id));
    }
  }

  // Filtro de chamados para provedores (apenas chamados do provedor logado)
  function chamadosFiltrados() {
    if (!user) return [];

    let list = chamados;
    if (user.tipo === 'provedor') {
      list = list.filter((c) => c.provedor === user.provedor);
    }

    if (filtroInicio) {
      list = list.filter((c) => new Date(c.data) >= new Date(filtroInicio));
    }
    if (filtroFim) {
      list = list.filter((c) => new Date(c.data) <= new Date(filtroFim));
    }

    return list;
  }

  // Função para pegar todos os chamados do provedor logado (sem filtro de data)
  function chamadosDoProvedor() {
    if (!user) return [];
    let list = chamados;
    if (user.tipo === 'provedor') {
      list = list.filter((c) => c.provedor === user.provedor);
    }
    return list;
  }

  // Dashboard cálculo de totais (Colaborador vê tudo, provedores só o seu, SEM filtro de data)
  const periodoVigente = user && user.tipo === 'provedor' ? getPeriodoVigente() : null;
  const chamadosDash = chamadosDoProvedor().filter((c) => {
    if (!periodoVigente) return true;
    const dataChamado = new Date(c.data);
    return dataChamado >= periodoVigente.inicio && dataChamado <= periodoVigente.fim;
  });

  const totalMassivo = chamadosDash.filter((c) => c.valor === 1.5).length;
  const atendimentosN1 = chamadosDash.filter(
    (c) => c.valor === 3.5 || c.valor === 5.5
  ).length;
  const atendimentosN2 = chamadosDash.filter(
    (c) => c.valor === 4.5 || c.valor === 6.5
  ).length;
  const vendasInstaladas = chamadosDash.filter((c) => c.valor >= 99.9).length;

  // Soma valores pequenos para o dashboard provedor
  const somaN1 = chamadosDash
    .filter((c) => c.valor === 3.5 || c.valor === 5.5)
    .reduce((acc, c) => acc + c.valor, 0);

  const somaN2 = chamadosDash
    .filter((c) => c.valor === 4.5 || c.valor === 6.5)
    .reduce((acc, c) => acc + c.valor, 0);

  const somaVendas = chamadosDash
    .filter((c) => c.valor >= 99.9)
    .reduce((acc, c) => acc + c.valor * 0.3, 0); // 30% fixo para simplificar

  const somaMassivos = chamadosDash
    .filter((c) => c.valor === 1.5)
    .reduce((acc, c) => acc + c.valor, 0);

  // Adicione aqui, no topo do componente:
  function getPeriodoVigente() {
    const hoje = new Date();
    if (user.provedor === 'Mynet') {
      let ano = hoje.getFullYear();
      let mes = hoje.getMonth() + 1;
      const ultimoDia = new Date(ano, mes, 0).getDate();
      const fimMes = new Date(ano, mes - 1, ultimoDia);
      if (hoje > fimMes) {
        mes += 1;
        if (mes > 12) {
          mes = 1;
          ano += 1;
        }
      }
      const inicio = new Date(ano, mes - 1, 1);
      const fim = new Date(ano, mes - 1, new Date(ano, mes, 0).getDate());
      return { inicio, fim };
    }
    if (user.provedor === 'Bkup') {
      let ano = hoje.getFullYear();
      let mes = hoje.getMonth() + 1;
      let inicio = new Date(ano, mes - 1, 28);
      let fim = new Date(ano, mes, 28);
      if (hoje > fim) {
        inicio = new Date(ano, mes, 28);
        fim = new Date(ano, mes + 1, 28);
      }
      return { inicio, fim };
    }
    return null;
  }

  function exportarExcel() {
    // Exporta apenas os chamados filtrados
    const ws = XLSX.utils.json_to_sheet(chamadosFiltrados().map(({ id, ...rest }) => rest));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Chamados');
    XLSX.writeFile(wb, 'chamados.xlsx');
  }

  // Logo antes do return, calcule o total a receber do colaborador:
  const totalColaborador = chamadosDash.reduce((acc, c) => acc + c.valor, 0);

  // Função para calcular dashboard de cada provedor
  function getDashboardProvedor(provedor) {
    // Filtra chamados do colaborador para o provedor
    const chamadosProvedor = chamados.filter((c) => c.provedor === provedor);

    // Calcula período vigente
    const hoje = new Date();
    let periodo = '';
    let inicio, fim;

    if (provedor === 'Mynet') {
      let ano = hoje.getFullYear();
      let mes = hoje.getMonth() + 1;
      const ultimoDia = new Date(ano, mes, 0).getDate();
      const fimMes = new Date(ano, mes - 1, ultimoDia);
      if (hoje > fimMes) {
        mes += 1;
        if (mes > 12) {
          mes = 1;
          ano += 1;
        }
      }
      inicio = new Date(ano, mes - 1, 1);
      fim = new Date(ano, mes - 1, new Date(ano, mes, 0).getDate());
      periodo = `Período: 01/${mes.toString().padStart(2, '0')}/${ano} a ${fim.getDate().toString().padStart(2, '0')}/${mes.toString().padStart(2, '0')}/${ano}`;
    } else if (provedor === 'Bkup') {
      let ano = hoje.getFullYear();
      let mes = hoje.getMonth() + 1;
      inicio = new Date(ano, mes - 1, 28);
      fim = new Date(ano, mes, 28);
      if (hoje > fim) {
        inicio = new Date(ano, mes, 28);
        fim = new Date(ano, mes + 1, 28);
      }
      periodo = `Período: ${inicio.toLocaleDateString()} a ${fim.toLocaleDateString()}`;
    }

    // Filtra chamados do período vigente
    const chamadosPeriodo = chamadosProvedor.filter((c) => {
      const dataChamado = new Date(c.data);
      return dataChamado >= inicio && dataChamado <= fim;
    });

    // Cálculos iguais ao dashboard do provedor
    const atendimentosN1 = chamadosPeriodo.filter((c) => c.valor === 3.5 || c.valor === 5.5).length;
    const atendimentosN2 = chamadosPeriodo.filter((c) => c.valor === 4.5 || c.valor === 6.5).length;
    const vendasInstaladas = chamadosPeriodo.filter((c) => c.valor >= 99.9).length;
    const totalMassivo = chamadosPeriodo.filter((c) => c.valor === 1.5).length;

    const somaN1 = chamadosPeriodo.filter((c) => c.valor === 3.5 || c.valor === 5.5).reduce((acc, c) => acc + c.valor, 0);
    const somaN2 = chamadosPeriodo.filter((c) => c.valor === 4.5 || c.valor === 6.5).reduce((acc, c) => acc + c.valor, 0);
    const somaVendas = chamadosPeriodo.filter((c) => c.valor >= 99.9).reduce((acc, c) => acc + c.valor * 0.3, 0);
    const somaMassivos = chamadosPeriodo.filter((c) => c.valor === 1.5).reduce((acc, c) => acc + c.valor, 0);

    // Cálculo do total a receber igual ao provedor
    let total = 0;
    if (provedor === 'Mynet') {
      total += 500;
      total += somaN1;
      total += somaN2;
      total += somaVendas;
      total += somaMassivos;
    }
    if (provedor === 'Bkup') {
      total += 1100;
      const totalChamados = atendimentosN1 + atendimentosN2;
      if (totalChamados > 200) {
        const extras = totalChamados - 200;
        const proporcaoN1 = atendimentosN1 / totalChamados;
        const proporcaoN2 = atendimentosN2 / totalChamados;
        const extraN1 = Math.round(extras * proporcaoN1);
        const extraN2 = extras - extraN1;
        total += extraN1 * 3.5;
        total += extraN2 * 4.5;
      }
      total += somaVendas;
      total += somaMassivos;
    }

    return {
      periodo,
      atendimentosN1,
      atendimentosN2,
      vendasInstaladas,
      totalMassivo,
      somaN1,
      somaN2,
      somaVendas,
      somaMassivos,
      total,
    };
  }

  return (
    <div
      style={{
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        background: 'linear-gradient(135deg, #4b0082 0%, #7c3aed 100%)',
        minHeight: '100vh',
        color: '#fff', // <-- texto branco para toda a aplicação
        padding: 20,
      }}
    >
      {!user && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
          }}
        >
          <form
            onSubmit={handleLogin}
            style={{
              maxWidth: 320,
              margin: '0 auto',
              backgroundColor: '#4b0082',
              padding: 30,
              borderRadius: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <img
              src="/Logo_Sem_Fundo.png"
              alt="Logo PingDesk"
              style={{ height: 100, marginBottom: 20 }} // aumente o valor de height aqui
            />
            <h2 style={{ marginBottom: 20, textAlign: 'center', color: '#fff' }}>Login</h2>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                marginBottom: 10,
                padding: 8,
                borderRadius: 4,
                border: 'none',
                outline: 'none',
                fontSize: 16,
              }}
              required
            />
            <input
              type="password"
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              style={{
                width: '100%',
                marginBottom: 20,
                padding: 8,
                borderRadius: 4,
                border: 'none',
                outline: 'none',
                fontSize: 16,
              }}
              required
            />
            <button
              type="submit"
              style={{
                width: '100%',
                padding: 10,
                borderRadius: 4,
                border: 'none',
                backgroundColor: '#720026',
                color: '#fff', // branco
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: 16,
              }}
            >
              Entrar
            </button>
          </form>
        </div>
      )}

      {user && (
        <>
          <header
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
              padding: '0 20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img
                src="/Logo_Sem_Fundo.png"
                alt="Logo PingDesk"
                style={{ height: 40 }}
              />
              <h1 style={{ color: '#fff' }}>Central do Provedor - {user.tipo.toUpperCase()}</h1>
            </div>

            <button
              onClick={logout}
              style={{
                background: 'transparent',
                border: '1px solid white',
                color: 'white',
                borderRadius: 4,
                padding: '5px 12px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Sair
            </button>
          </header>

          {/* Dashboard do provedor */}
          <section
            style={{
              marginBottom: 20,
              padding: 20,
              backgroundColor: '#2d0074',
              borderRadius: 8,
            }}
          >
            <h2 style={{ color: '#fff' }}>Dashboard</h2>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-around',
                flexWrap: 'wrap',
                gap: 20,
              }}
            >
              <div
                style={{
                  backgroundColor: '#46008b',
                  padding: 15,
                  borderRadius: 8,
                  flex: '1 1 150px',
                  textAlign: 'center',
                }}
              >
                <h3>Atendimentos N1</h3>
                <p style={{ fontSize: 24, fontWeight: 'bold' }}>
                  {atendimentosN1}
                </p>
                {user.tipo === 'provedor' && (
                  <small>R$ {somaN1.toFixed(2)}</small>
                )}
              </div>
              <div
                style={{
                  backgroundColor: '#46008b',
                  padding: 15,
                  borderRadius: 8,
                  flex: '1 1 150px',
                  textAlign: 'center',
                }}
              >
                <h3>Atendimentos N2</h3>
                <p style={{ fontSize: 24, fontWeight: 'bold' }}>
                  {atendimentosN2}
                </p>
                {user.tipo === 'provedor' && (
                  <small>R$ {somaN2.toFixed(2)}</small>
                )}
              </div>
              <div
                style={{
                  backgroundColor: '#46008b',
                  padding: 15,
                  borderRadius: 8,
                  flex: '1 1 150px',
                  textAlign: 'center',
                }}
              >
                <h3>Vendas Instaladas</h3>
                <p style={{ fontSize: 24, fontWeight: 'bold' }}>
                  {vendasInstaladas}
                </p>
                {user.tipo === 'provedor' && (
                  <small>R$ {somaVendas.toFixed(2)}</small>
                )}
              </div>
              <div
                style={{
                  backgroundColor: '#46008b',
                  padding: 15,
                  borderRadius: 8,
                  flex: '1 1 150px',
                  textAlign: 'center',
                }}
              >
                <h3>Massivos</h3>
                <p style={{ fontSize: 24, fontWeight: 'bold' }}>{totalMassivo}</p>
                {user.tipo === 'provedor' && (
                  <small>R$ {somaMassivos.toFixed(2)}</small>
                )}
              </div>
              {user.tipo === 'provedor' && (
                <div
                  style={{
                    backgroundColor: '#008b46',
                    padding: 15,
                    borderRadius: 8,
                    marginTop: 20,
                    textAlign: 'center',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: 18,
                    minWidth: 150,
                    marginBottom: 0,
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  {(() => {
                    let total = 0;
                    let periodo = '';

                    const hoje = new Date();

                    if (user.provedor === 'Mynet') {
                      total += 500;
                      total += somaN1;
                      total += somaN2;
                      total += somaVendas;
                      total += somaMassivos;

                      // Calcular período do mês vigente ou próximo mês se já passou
                      let ano = hoje.getFullYear();
                      let mes = hoje.getMonth() + 1;
                      const ultimoDia = new Date(ano, mes, 0).getDate();
                      const fimMes = new Date(ano, mes - 1, ultimoDia);

                      if (hoje > fimMes) {
                        // Próximo mês
                        mes += 1;
                        if (mes > 12) {
                          mes = 1;
                          ano += 1;
                        }
                      }
                      const ultimoDiaNovo = new Date(ano, mes, 0).getDate();
                      periodo = `Período: 01/${mes.toString().padStart(2, '0')}/${ano} a ${ultimoDiaNovo.toString().padStart(2, '0')}/${mes.toString().padStart(2, '0')}/${ano}`;
                    }

                    if (user.provedor === 'Bkup') {
                      total += 1100;
                      const totalChamados = atendimentosN1 + atendimentosN2;
                      if (totalChamados > 200) {
                        const extras = totalChamados - 200;
                        const proporcaoN1 = atendimentosN1 / totalChamados;
                        const proporcaoN2 = atendimentosN2 / totalChamados;
                        const extraN1 = Math.round(extras * proporcaoN1);
                        const extraN2 = extras - extraN1;
                        total += extraN1 * 3.5;
                        total += extraN2 * 4.5;
                      }
                      total += somaVendas;
                      total += somaMassivos;

                      // Calcular ciclo 28 a 28 vigente ou próximo ciclo se já passou
                      let ano = hoje.getFullYear();
                      let mes = hoje.getMonth() + 1;
                      let inicio = new Date(ano, mes - 1, 28);
                      let fim = new Date(ano, mes, 28);

                      if (hoje > fim) {
                        // Próximo ciclo
                        inicio = new Date(ano, mes, 28);
                        fim = new Date(ano, mes + 1, 28);
                      }
                      periodo = `Período: ${inicio.toLocaleDateString()} a ${fim.toLocaleDateString()}`;
                    }

                    return (
                      <div>
                        <div style={{ textAlign: 'center', marginBottom: 8, color: '#fff' }}>{periodo}</div>
                        <div style={{ textAlign: 'center', color: '#fff' }}>Total a Receber: R$ {total.toFixed(2)}</div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Dashboard dos provedores para colaborador */}
              {user.tipo === 'colaborador' && (
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', width: '100%' }}>
                  {['Mynet', 'Bkup'].map((provedor) => {
                    const dash = getDashboardProvedor(provedor);
                    return (
                      <div
                        key={provedor}
                        style={{
                          backgroundColor: '#2d0074',
                          padding: 20,
                          borderRadius: 8,
                          minWidth: 320,
                          flex: '1 1 320px',
                          marginBottom: 20,
                        }}
                      >
                        <h2 style={{ color: '#fff', textAlign: 'center' }}>{provedor}</h2>
                        <div style={{ color: '#fff', marginBottom: 8, textAlign: 'center' }}>{dash.periodo}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-around', gap: 10, flexWrap: 'wrap' }}>
                          <div style={{ backgroundColor: '#46008b', padding: 10, borderRadius: 8, minWidth: 120, textAlign: 'center' }}>
                            <div>Atendimentos N1</div>
                            <div style={{ fontWeight: 'bold', fontSize: 20 }}>{dash.atendimentosN1}</div>
                            <small>R$ {dash.somaN1.toFixed(2)}</small>
                          </div>
                          <div style={{ backgroundColor: '#46008b', padding: 10, borderRadius: 8, minWidth: 120, textAlign: 'center' }}>
                            <div>Atendimentos N2</div>
                            <div style={{ fontWeight: 'bold', fontSize: 20 }}>{dash.atendimentosN2}</div>
                            <small>R$ {dash.somaN2.toFixed(2)}</small>
                          </div>
                          <div style={{ backgroundColor: '#46008b', padding: 10, borderRadius: 8, minWidth: 120, textAlign: 'center' }}>
                            <div>Vendas Instaladas</div>
                            <div style={{ fontWeight: 'bold', fontSize: 20 }}>{dash.vendasInstaladas}</div>
                            <small>R$ {dash.somaVendas.toFixed(2)}</small>
                          </div>
                          <div style={{ backgroundColor: '#46008b', padding: 10, borderRadius: 8, minWidth: 120, textAlign: 'center' }}>
                            <div>Massivos</div>
                            <div style={{ fontWeight: 'bold', fontSize: 20 }}>{dash.totalMassivo}</div>
                            <small>R$ {dash.somaMassivos.toFixed(2)}</small>
                          </div>
                        </div>
                        <div
                          style={{
                            backgroundColor: '#008b46',
                            padding: 15,
                            borderRadius: 8,
                            textAlign: 'center',
                            marginTop: 16,
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: 18,
                          }}
                        >
                          Total a Receber: R$ {dash.total.toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Formulário de chamado para colaborador e colaborador2 */}
          {(user.tipo === 'colaborador' || user.tipo === 'colaborador2') && (
            <section
              style={{
                marginBottom: 20,
                padding: 20,
                backgroundColor: '#2d0074',
                borderRadius: 8,
              }}
            >
              <h2 style={{ color: '#fff' }}>{form.id ? 'Editar Chamado' : 'Novo Chamado'}</h2>
              <form onSubmit={handleSalvarChamado}>
                <label style={{ color: '#fff' }}>
                  Provedor:
                  <select
                    value={form.provedor}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, provedor: e.target.value }))
                    }
                    required
                    style={{ marginLeft: 10, padding: 5, borderRadius: 4 }}
                  >
                    <option value="Mynet">Mynet</option>
                    <option value="Bkup">Bkup</option>
                  </select>
                </label>
                <br />
                <label style={{ color: '#fff' }}>
                  Nome:
                  <input
                    type="text"
                    value={form.nome}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, nome: e.target.value }))
                    }
                    required
                    style={{
                      marginLeft: 10,
                      padding: 5,
                      borderRadius: 4,
                      width: '60%',
                    }}
                  />
                </label>
                <br />
                <label style={{ color: '#fff' }}>
                  Telefone:
                  <input
                    type="tel"
                    value={form.telefone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, telefone: e.target.value }))
                    }
                    required
                    style={{
                      marginLeft: 10,
                      padding: 5,
                      borderRadius: 4,
                      width: '40%',
                    }}
                  />
                </label>
                <br />
                <label style={{ color: '#fff' }}>
                  Protocolo:
                  <input
                    type="text"
                    value={form.protocolo}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, protocolo: e.target.value }))
                    }
                    required
                    style={{
                      marginLeft: 10,
                      padding: 5,
                      borderRadius: 4,
                      width: '40%',
                    }}
                  />
                </label>
                <br />
                <label style={{ color: '#fff' }}>
                  Data:
                  <input
                    type="date"
                    value={form.data}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, data: e.target.value }))
                    }
                    required
                    style={{ marginLeft: 10, padding: 5, borderRadius: 4 }}
                  />
                </label>
                <br />
                <label style={{ color: '#fff' }}>
                  Valor do Atendimento:
                  <select
                    value={form.valor}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, valor: parseFloat(e.target.value) }))
                    }
                    required
                    style={{ marginLeft: 10, padding: 5, borderRadius: 4 }}
                  >
                    {(user.tipo === 'colaborador2' ? opcoesValoresColaborador2 : opcoesValores).map((opt) => (
                      <option key={opt.valor} value={opt.valor}>
                        {opt.label}
                      </option>
                    ))}
                    {user.tipo !== 'colaborador2' && (
                      <option value={1.5}>R$ 1,50 (Massivo)</option>
                    )}
                  </select>
                </label>
                <br />
                <label style={{ color: '#fff' }}>
                  Descrição:
                  <textarea
                    value={form.descricao}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, descricao: e.target.value }))
                    }
                    required
                    rows={3}
                    style={{ width: '100%', marginTop: 8, borderRadius: 4, padding: 5 }}
                  />
                </label>
                <br />
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#720026',
                    color: '#fff',
                    padding: '10px 20px',
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    marginTop: 10,
                    fontWeight: 'bold',
                  }}
                >
                  {form.id ? 'Salvar Alterações' : 'Criar Chamado'}
                </button>
                {form.id && (
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        id: null,
                        provedor: 'Mynet',
                        nome: '',
                        telefone: '',
                        protocolo: '',
                        data: formatarDataInput(new Date()),
                        valor: 3.5,
                        descricao: '',
                      })
                    }
                    style={{
                      marginLeft: 10,
                      padding: '10px 20px',
                      borderRadius: 6,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Cancelar
                  </button>
                )}
              </form>
            </section>
          )}

          {/* Tabela de chamados */}
          <section
            style={{
              padding: 20,
              backgroundColor: '#2d0074',
              borderRadius: 8,
              overflowX: 'auto',
            }}
          >
            <h2 style={{ color: '#fff' }}>Chamados</h2>
            <div style={{ marginBottom: 10 }}>
              {(user.tipo === 'provedor' || user.tipo === 'colaborador') && (
                <>
                  <label style={{ color: '#fff' }}>
                    Filtrar Data Início:
                    <input
                      type="date"
                      value={filtroInicio}
                      onChange={(e) => setFiltroInicio(e.target.value)}
                      style={{ marginLeft: 10, borderRadius: 4, padding: 5 }}
                    />
                  </label>
                  <label style={{ marginLeft: 20, color: '#fff' }}>
                    Filtrar Data Fim:
                    <input
                      type="date"
                      value={filtroFim}
                      onChange={(e) => setFiltroFim(e.target.value)}
                      style={{ marginLeft: 10, borderRadius: 4, padding: 5 }}
                    />
                  </label>
                </>
              )}
              <button
                onClick={exportarExcel}
                style={{
                  marginLeft: 20,
                  padding: '8px 15px',
                  borderRadius: 4,
                  border: 'none',
                  backgroundColor: '#720026',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                Exportar Excel
              </button>
            </div>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                color: '#fff', // branco
              }}
            >
              <thead>
                <tr>
                  <th style={{ borderBottom: '1px solid white', padding: 8, color: '#fff' }}>
                    Provedor
                  </th>
                  <th style={{ borderBottom: '1px solid white', padding: 8, color: '#fff' }}>
                    Nome
                  </th>
                  <th style={{ borderBottom: '1px solid white', padding: 8, color: '#fff' }}>
                    Telefone
                  </th>
                  <th style={{ borderBottom: '1px solid white', padding: 8, color: '#fff' }}>
                    Protocolo
                  </th>
                  <th style={{ borderBottom: '1px solid white', padding: 8, color: '#fff' }}>
                    Data
                  </th>
                  <th style={{ borderBottom: '1px solid white', padding: 8, color: '#fff' }}>
                    Valor
                  </th>
                  <th style={{ borderBottom: '1px solid white', padding: 8, color: '#fff' }}>
                    Descrição
                  </th>
                  {user.tipo === 'colaborador' && (
                    <th style={{ borderBottom: '1px solid white', padding: 8, color: '#fff' }}>
                      Ações
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {chamadosFiltrados().map((c) => (
                  <tr key={c.id}>
                    <td style={{ borderBottom: '1px solid white', padding: 8, color: '#fff' }}>
                      {c.provedor}
                    </td>
                    <td style={{ borderBottom: '1px solid white', padding: 8, color: '#fff' }}>
                      {c.nome}
                    </td>
                    <td style={{ borderBottom: '1px solid white', padding: 8, color: '#fff' }}>
                      {c.telefone}
                    </td>
                    <td style={{ borderBottom: '1px solid white', padding: 8, color: '#fff' }}>
                      {c.protocolo}
                    </td>
                    <td style={{ borderBottom: '1px solid white', padding: 8, color: '#fff' }}>
                      {c.data}
                    </td>
                    <td style={{ borderBottom: '1px solid white', padding: 8, color: '#fff' }}>
                      {user.tipo === 'colaborador2' ? '' : `R$ ${c.valor.toFixed(2)}`}
                    </td>
                    <td style={{ borderBottom: '1px solid white', padding: 8, color: '#fff' }}>
                      {c.descricao}
                    </td>
                    {user.tipo === 'colaborador' && (
                      <td style={{ borderBottom: '1px solid white', padding: 8 }}>
                        <button
                          onClick={() => editarChamado(c.id)}
                          style={{
                            marginRight: 10,
                            padding: '5px 10px',
                            borderRadius: 4,
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: '#480061',
                            color: 'white',
                          }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => excluirChamado(c.id)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: 4,
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: '#8b0000',
                            color: 'white',
                          }}
                        >
                          Excluir
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}
