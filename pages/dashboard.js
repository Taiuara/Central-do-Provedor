import { useState } from 'react';
import * as XLSX from 'xlsx';

function filtrarChamadosPorPeriodo(chamados, nomeProvedor, dataInicio, dataFim) {
  return chamados.filter(c => {
    if (c.provedor !== nomeProvedor) return false;
    const dataChamado = new Date(c.data);
    return dataChamado >= new Date(dataInicio) && dataChamado <= new Date(dataFim);
  });
}

function calcularValorNegociacao(chamados, nomeProvedor) {
  const n1 = chamados.filter(c => c.valorAtendimento === '3,50' || c.valorAtendimento === '5,50').length;
  const n2 = chamados.filter(c => c.valorAtendimento === '4,50' || c.valorAtendimento === '6,50').length;
  const venda = chamados.filter(c => [
    '99,90','109,90','119,90','129,90','139,90','149,90','159,90','199,90'
  ].includes(c.valorAtendimento)).length;
  const massivo = chamados.filter(c => c.valorAtendimento === '1,50').length;

  if (nomeProvedor === 'Mynet') {
    const fixo = 500;
    const valorVendaUnitario = 119.90;
    const valorTotal = fixo 
      + (n1 * 3.5) 
      + (n2 * 4.5) 
      + (venda * valorVendaUnitario * 0.3) 
      + (massivo * 1.5);
    return { fixo, n1, n2, venda, massivo, valorTotal };
  }

  if (nomeProvedor === 'Bkup') {
    const fixo = 1100;
    const franquia = 200;
    const chamadosCobranca = n1 + n2 + venda;
    const chamadosAcimaFranquia = Math.max(0, chamadosCobranca - franquia);
    const valorPorChamado = ((3.5 + 4.5) / 2);
    const valorVendaUnitario = 119.90;
    const valorTotal = fixo 
      + (chamadosAcimaFranquia * valorPorChamado) 
      + (venda * valorVendaUnitario) 
      + (massivo * 1.5);
    return { fixo, franquia, n1, n2, venda, massivo, chamadosAcimaFranquia, valorTotal };
  }

  return null;
}

const usuariosFake = [
  { email: 'colaborador@pingdesk.com', senha: 'ping1234', tipo: 'colaborador' },
  { email: 'mynet@provedor.com', senha: 'ping1234', tipo: 'provedor', nomeProvedor: 'Mynet' },
  { email: 'bkup@provedor.com', senha: 'ping1234', tipo: 'provedor', nomeProvedor: 'Bkup' },
];

const chamadosFakeIniciais = [
  { id: 1, provedor: 'Mynet', nome: 'Cliente A', telefone: '1234-5678', protocolo: '0001', data: '2025-07-01', valorAtendimento: '3,50', descricao: 'Internet instável' },
  { id: 2, provedor: 'Bkup', nome: 'Cliente B', telefone: '8765-4321', protocolo: '0002', data: '2025-06-30', valorAtendimento: '4,50', descricao: 'Roteador não conecta' },
  { id: 3, provedor: 'Mynet', nome: 'Cliente C', telefone: '1111-2222', protocolo: '0003', data: '2025-07-15', valorAtendimento: '119,90', descricao: 'Venda plano 100mb' },
  { id: 4, provedor: 'Bkup', nome: 'Cliente D', telefone: '3333-4444', protocolo: '0004', data: '2025-07-02', valorAtendimento: '1,50', descricao: 'Atualização em massa' },
];

export default function Dashboard() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [chamados, setChamados] = useState(chamadosFakeIniciais);

  const [formChamado, setFormChamado] = useState({
    provedor: '',
    nome: '',
    telefone: '',
    protocolo: '',
    data: '',
    valorAtendimento: '',
    descricao: '',
  });

  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const user = usuariosFake.find(u => u.email === email && u.senha === senha);
    if (user) {
      setUsuarioLogado(user);
      if (user.tipo === 'provedor') {
        const hoje = new Date();
        setDataInicio(new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0,10));
        setDataFim(new Date(hoje.getFullYear(), hoje.getMonth() +1, 0).toISOString().slice(0,10));
      }
    } else {
      setError('Credenciais inválidas. Tente de novo!');
    }
    setLoading(false);
  }

  function handleLogout() {
    setUsuarioLogado(null);
    setEmail('');
    setSenha('');
    setError('');
    setDataInicio('');
    setDataFim('');
  }

  function handleFormChange(e) {
    setFormChamado({ ...formChamado, [e.target.name]: e.target.value });
  }

  function handleSubmitChamado(e) {
    e.preventDefault();
    if (
      !formChamado.provedor ||
      !formChamado.nome ||
      !formChamado.telefone ||
      !formChamado.protocolo ||
      !formChamado.data ||
      !formChamado.valorAtendimento ||
      !formChamado.descricao
    ) {
      alert('Preencha todos os campos do chamado!');
      return;
    }
    const novoChamado = {
      id: chamados.length + 1,
      ...formChamado,
    };
    setChamados([novoChamado, ...chamados]);
    setFormChamado({
      provedor: '',
      nome: '',
      telefone: '',
      protocolo: '',
      data: '',
      valorAtendimento: '',
      descricao: '',
    });
    alert('Chamado criado com sucesso!');
  }

  function handleExcluirChamado(id) {
    if (confirm('Tem certeza que quer excluir este chamado?')) {
      setChamados(chamados.filter(c => c.id !== id));
    }
  }

  function chamadosFiltradosPorProvedor(provedor, dtInicio, dtFim) {
    if (!dtInicio || !dtFim) return chamados.filter(c => c.provedor === provedor);
    return chamados.filter(c => {
      if (c.provedor !== provedor) return false;
      const dataChamado = new Date(c.data);
      return dataChamado >= new Date(dtInicio) && dataChamado <= new Date(dtFim);
    });
  }

  function baixarPlanilhaProvedor(chamadosExport, negociacaoExport) {
    const wsChamados = XLSX.utils.json_to_sheet(chamadosExport.map(c => ({
      Provedor: c.provedor,
      Nome: c.nome,
      Telefone: c.telefone,
      Protocolo: c.protocolo,
      Data: c.data,
      ValorAtendimento: c.valorAtendimento,
      Descrição: c.descricao,
    })));

    const resumo = [
      { Descrição: 'Fixo', Valor: negociacaoExport.fixo ?? '-' },
      { Descrição: 'Franquia', Valor: negociacaoExport.franquia ?? '-' },
      { Descrição: 'Atendimentos N1', Valor: negociacaoExport.n1 ?? 0 },
      { Descrição: 'Atendimentos N2', Valor: negociacaoExport.n2 ?? 0 },
      { Descrição: 'Vendas', Valor: negociacaoExport.venda ?? 0 },
      { Descrição: 'Massivos', Valor: negociacaoExport.massivo ?? 0 },
      { Descrição: 'Chamados após franquia', Valor: negociacaoExport.chamadosAcimaFranquia ?? '-' },
      { Descrição: 'Valor total', Valor: negociacaoExport.valorTotal?.toFixed(2) ?? 0 },
    ];
    const wsResumo = XLSX.utils.json_to_sheet(resumo);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsChamados, 'Chamados');
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo Negociação');

    XLSX.writeFile(wb, `PingDesk_${usuarioLogado.nomeProvedor ?? 'Colaborador'}_${new Date().toISOString().slice(0,10)}.xlsx`);
  }

  if (!usuarioLogado) {
    return (
      <div style={styles.container}>
        <form onSubmit={handleLogin} style={styles.form}>
          <h1 style={styles.title}>Central PingDesk 🚀</h1>
          <input
            type="email"
            placeholder="Seu email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Sua senha"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            required
            style={styles.input}
          />
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    );
  }

  if (usuarioLogado.tipo === 'colaborador') {
    const numeros = {
      total: chamados.length,
      n1: chamados.filter(c => c.valorAtendimento === '3,50' || c.valorAtendimento === '5,50').length,
      n2: chamados.filter(c => c.valorAtendimento === '4,50' || c.valorAtendimento === '6,50').length,
      venda: chamados.filter(c => [
        '99,90','109,90','119,90','129,90','139,90','149,90','159,90','199,90'
      ].includes(c.valorAtendimento)).length,
      massivo: chamados.filter(c => c.valorAtendimento === '1,50').length,
    };

    return (
      <div style={{ padding: 20, fontFamily: 'Segoe UI', maxWidth: 900, margin: '0 auto' }}>
        <h1>Bem-vindo, {usuarioLogado.email} (Colaborador) 🚀</h1>
        <button onClick={handleLogout} style={styles.logoutButton}>Sair</button>

        <section style={styles.numerosSection}>
          <div style={styles.numeroBox}>
            <h3>{numeros.total}</h3>
            <p>Total de atendimentos</p>
          </div>
          <div style={styles.numeroBox}>
            <h3>{numeros.n1}</h3>
            <p>Atendimentos N1</p>
          </div>
          <div style={styles.numeroBox}>
            <h3>{numeros.n2}</h3>
            <p>Atendimentos N2</p>
          </div>
          <div style={styles.numeroBox}>
            <h3>{numeros.venda}</h3>
            <p>Vendas Instaladas</p>
          </div>
          <div style={styles.numeroBox}>
            <h3>{numeros.massivo}</h3>
            <p>Massivos</p>
          </div>
        </section>

        <section style={{ marginTop: 40 }}>
          <h2>Cadastrar novo chamado</h2>
          <form onSubmit={handleSubmitChamado} style={styles.formChamado}>
            <select
              name="provedor"
              value={formChamado.provedor}
              onChange={handleFormChange}
              style={styles.inputChamado}
              required
            >
              <option value="">-- Provedor --</option>
              <option value="Mynet">Mynet</option>
              <option value="Bkup">Bkup</option>
            </select>
            <input
              type="text"
              placeholder="Nome"
              name="nome"
              value={formChamado.nome}
              onChange={handleFormChange}
              style={styles.inputChamado}
              required
            />
            <input
              type="text"
              placeholder="Telefone"
              name="telefone"
              value={formChamado.telefone}
              onChange={handleFormChange}
              style={styles.inputChamado}
              required
            />
            <input
              type="text"
              placeholder="Protocolo"
              name="protocolo"
              value={formChamado.protocolo}
              onChange={handleFormChange}
              style={styles.inputChamado}
              required
            />
            <input
              type="date"
              name="data"
              value={formChamado.data}
              onChange={handleFormChange}
              style={styles.inputChamado}
              required
            />
            <select
              name="valorAtendimento"
              value={formChamado.valorAtendimento}
              onChange={handleFormChange}
              style={styles.inputChamado}
              required
            >
              <option value="">-- Valor do Atendimento --</option>
              <option value="1,50">R$ 1,50 (Massivo)</option>
              <option value="3,50">R$ 3,50 (N1)</option>
              <option value="4,50">R$ 4,50 (N2)</option>
              <option value="5,50">R$ 5,50 (N1)</option>
              <option value="6,50">R$ 6,50 (N2)</option>
              <option value="99,90">R$ 99,90 (Venda)</option>
              <option value="109,90">R$ 109,90 (Venda)</option>
              <option value="119,90">R$ 119,90 (Venda)</option>
              <option value="129,90">R$ 129,90 (Venda)</option>
              <option value="139,90">R$ 139,90 (Venda)</option>
              <option value="149,90">R$ 149,90 (Venda)</option>
              <option value="159,90">R$ 159,90 (Venda)</option>
              <option value="199,90">R$ 199,90 (Venda)</option>
            </select>
            <input
              type="text"
              placeholder="Descrição"
              name="descricao"
              value={formChamado.descricao}
              onChange={handleFormChange}
              style={styles.inputChamado}
              required
            />
            <button type="submit" style={styles.buttonChamado}>Cadastrar</button>
          </form>
        </section>

        <section style={{ marginTop: 40 }}>
          <h2>Chamados cadastrados</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#182848', color: 'white' }}>
                <th style={styles.th}>Provedor</th>
                <th style={styles.th}>Nome</th>
                <th style={styles.th}>Telefone</th>
                <th style={styles.th}>Protocolo</th>
                <th style={styles.th}>Data</th>
                <th style={styles.th}>Valor Atendimento</th>
                <th style={styles.th}>Descrição</th>
                <th style={styles.th}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {chamados.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #ccc' }}>
                  <td style={styles.td}>{c.provedor}</td>
                  <td style={styles.td}>{c.nome}</td>
                  <td style={styles.td}>{c.telefone}</td>
                  <td style={styles.td}>{c.protocolo}</td>
                  <td style={styles.td}>{c.data}</td>
                  <td style={styles.td}>{c.valorAtendimento}</td>
                  <td style={styles.td}>{c.descricao}</td>
                  <td style={styles.td}>
                    <button onClick={() => handleExcluirChamado(c.id)} style={styles.buttonExcluir}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    );
  }

  if (usuarioLogado.tipo === 'provedor') {
    const chamadosFiltrados = chamadosFiltradosPorProvedor(usuarioLogado.nomeProvedor, dataInicio, dataFim);
    const negociacao = calcularValorNegociacao(chamadosFiltrados, usuarioLogado.nomeProvedor);

    return (
      <div style={{ padding: 20, fontFamily: 'Segoe UI', maxWidth: 900, margin: '0 auto' }}>
        <h1>Bem-vindo, {usuarioLogado.nomeProvedor} (Provedor) 🚀</h1>
        <button onClick={handleLogout} style={styles.logoutButton}>Sair</button>

        <section style={{ marginTop: 20 }}>
          <label>
            Data início:{' '}
            <input
              type="date"
              value={dataInicio}
              onChange={e => setDataInicio(e.target.value)}
              style={styles.inputFiltro}
            />
          </label>
          <label style={{ marginLeft: 20 }}>
            Data fim:{' '}
            <input
              type="date"
              value={dataFim}
              onChange={e => setDataFim(e.target.value)}
              style={styles.inputFiltro}
            />
          </label>
        </section>

        <section style={{ marginTop: 20 }}>
          <h2>Resumo da Negociação</h2>
          <p>Fixo: R$ {negociacao?.fixo ?? '-'}</p>
          {negociacao?.franquia && <p>Franquia: {negociacao.franquia}</p>}
          <p>Atendimentos N1: {negociacao?.n1 ?? 0}</p>
          <p>Atendimentos N2: {negociacao?.n2 ?? 0}</p>
          <p>Vendas: {negociacao?.venda ?? 0}</p>
          <p>Massivos: {negociacao?.massivo ?? 0}</p>
          {negociacao?.chamadosAcimaFranquia !== undefined && (
            <p>Chamados após franquia: {negociacao.chamadosAcimaFranquia}</p>
          )}
          <p><strong>Valor total: R$ {negociacao?.valorTotal?.toFixed(2) ?? '0.00'}</strong></p>
        </section>

        <section style={{ marginTop: 20 }}>
          <button
            onClick={() => baixarPlanilhaProvedor(chamadosFiltrados, negociacao)}
            style={styles.button}
          >
            Exportar dados para Excel
          </button>
        </section>
      </div>
    );
  }

  return <div>Tipo de usuário desconhecido.</div>;
}

const styles = {
  container: {
    fontFamily: 'Segoe UI',
    maxWidth: 400,
    margin: '0 auto',
    padding: 20,
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    marginBottom: 20,
  },
  input: {
    marginBottom: 10,
    padding: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#182848',
    color: 'white',
    padding: '10px 15px',
    border: 'none',
    cursor: 'pointer',
  },
  error: {
    color: 'red',
  },
  logoutButton: {
    marginBottom: 20,
    backgroundColor: '#d9534f',
    color: 'white',
    padding: '8px 12px',
    border: 'none',
    cursor: 'pointer',
  },
  numerosSection: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  numeroBox: {
    textAlign: 'center',
  },
  formChamado: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
  },
  inputChamado: {
    flex: '1 1 150px',
    padding: 8,
    fontSize: 14,
  },
  buttonChamado: {
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    cursor: 'pointer',
  },
  th: {
    padding: 8,
  },
  td: {
    padding: 8,
  },
  buttonExcluir: {
    backgroundColor: '#d9534f',
    color: 'white',
    border: 'none',
    padding: '5px 10px',
    cursor: 'pointer',
  },
  filtroPeriodo: {
    marginTop: 20,
  },
  inputFiltro: {
    padding: 8,
    fontSize: 14,
  }
};
