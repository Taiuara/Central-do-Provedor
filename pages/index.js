import { useState } from 'react';
import * as XLSX from 'xlsx';

// Funções para cálculo da negociação com período customizável
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
    const chamadosCobranca = n1 + n2 + venda; // massivo não conta na franquia
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

// Usuários fake
const usuariosFake = [
  { email: 'colaborador@pingdesk.com', senha: 'ping1234', tipo: 'colaborador' },
  { email: 'mynet@provedor.com', senha: 'Myn3T@MF25', tipo: 'provedor', nomeProvedor: 'Mynet' },
  { email: 'bkup@provedor.com', senha: 'Bkup@2025', tipo: 'provedor', nomeProvedor: 'Bkup' },
];


export default function PingDesk() {
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

    XLSX.writeFile(wb, `PingDesk_${usuarioLogado.nomeProvedor}_${new Date().toISOString().slice(0,10)}.xlsx`);
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

    const valorVendaUnitario = 119.90;
    const valorVendaPercentual = usuarioLogado.nomeProvedor === 'Mynet' ? 0.3 : 1;
    const vendasCount = negociacao?.venda ?? 0;
    const vendasValor = vendasCount * valorVendaUnitario * valorVendaPercentual;

    return (
      <div style={{ padding: 20, fontFamily: 'Segoe UI', maxWidth: 900, margin: '0 auto' }}>
        <h1>Bem-vindo, {usuarioLogado.nomeProvedor} (Provedor) 🚀</h1>
        <button onClick={handleLogout} style={styles.logoutButton}>Sair</button>

        <section style={styles.filtroPeriodo}>
          <label>
            Data início:{' '}
            <input
              type="date"
              value={dataInicio}
              onChange={e => setDataInicio(e.target.value)}
              style={styles.inputData}
            />
          </label>
          <label style={{ marginLeft: 20 }}>
            Data fim:{' '}
            <input
              type="date"
              value={dataFim}
              onChange={e => setDataFim(e.target.value)}
              style={styles.inputData}
            />
          </label>
          <button
            onClick={() => {
              if (!dataInicio || !dataFim) alert('Selecione as datas para filtrar.');
            }}
            style={{ marginLeft: 20, padding: '6px 12px' }}
          >
            Filtrar
          </button>
          <button
            onClick={() => baixarPlanilhaProvedor(chamadosFiltrados, negociacao)}
            style={{ marginLeft: 20, padding: '6px 12px' }}
          >
            Exportar Excel
          </button>
        </section>

        <section style={styles.numerosSection}>
          <div style={styles.numeroBox}>
            <h3>{chamadosFiltrados.length}</h3>
            <p>Total de atendimentos</p>
          </div>
          <div style={styles.numeroBox}>
            <h3>{negociacao?.n1 ?? 0}</h3>
            <p>Atendimentos N1</p>
          </div>
          <div style={styles.numeroBox}>
            <h3>{negociacao?.n2 ?? 0}</h3>
            <p>Atendimentos N2</p>
          </div>
          <div style={styles.numeroBox}>
            <h3>{vendasCount}</h3>
            <p>Vendas</p>
            <small>~R$ {vendasValor.toFixed(2)}</small>
          </div>
          <div style={styles.numeroBox}>
            <h3>{negociacao?.massivo ?? 0}</h3>
            <p>Massivos</p>
          </div>
          <div style={styles.numeroBox}>
            <h3>R$ {negociacao?.valorTotal?.toFixed(2) ?? '0.00'}</h3>
            <p>Valor total negociado</p>
          </div>
        </section>

        <section style={{ marginTop: 40 }}>
          <h2>Chamados no período</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#182848', color: 'white' }}>
                <th style={styles.th}>Nome</th>
                <th style={styles.th}>Telefone</th>
                <th style={styles.th}>Protocolo</th>
                <th style={styles.th}>Data</th>
                <th style={styles.th}>Valor Atendimento</th>
                <th style={styles.th}>Descrição</th>
              </tr>
            </thead>
            <tbody>
              {chamadosFiltrados.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #ccc' }}>
                  <td style={styles.td}>{c.nome}</td>
                  <td style={styles.td}>{c.telefone}</td>
                  <td style={styles.td}>{c.protocolo}</td>
                  <td style={styles.td}>{c.data}</td>
                  <td style={styles.td}>{c.valorAtendimento}</td>
                  <td style={styles.td}>{c.descricao}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    );
  }

  return null;
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    justifyContent: 'center',
    alignItems: 'center',
    background:
      'linear-gradient(90deg, #0f2027, #203a43, #2c5364)',
  },
  form: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 8,
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    width: 320,
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
    color: '#182848',
  },
  input: {
    marginBottom: 15,
    padding: 10,
    fontSize: 16,
    borderRadius: 4,
    border: '1px solid #ccc',
  },
  button: {
    padding: 12,
    backgroundColor: '#182848',
    color: 'white',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
  },
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#d63031',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: 5,
    cursor: 'pointer',
    marginBottom: 20,
    float: 'right',
  },
  numerosSection: {
    display: 'flex',
    gap: 15,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  numeroBox: {
    backgroundColor: '#182848',
    color: 'white',
    borderRadius: 8,
    padding: 20,
    minWidth: 120,
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
  formChamado: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginTop: 10,
  },
  inputChamado: {
    padding: 10,
    fontSize: 16,
    borderRadius: 4,
    border: '1px solid #ccc',
  },
  buttonChamado: {
    padding: 12,
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
  },
  buttonExcluir: {
    padding: '6px 10px',
    backgroundColor: '#d63031',
    color: 'white',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
  },
  filtroPeriodo: {
    marginBottom: 20,
    display: 'flex',
    alignItems: 'center',
  },
  inputData: {
    padding: 6,
    fontSize: 16,
    borderRadius: 4,
    border: '1px solid #ccc',
  },
  th: {
    padding: 8,
    borderBottom: '2px solid white',
    textAlign: 'left',
  },
  td: {
    padding: 8,
    borderBottom: '1px solid #ccc',
  },
};
