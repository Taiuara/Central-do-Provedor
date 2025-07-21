import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

const usuarios = {
  colaborador: { email: 'colaborador@pingdesk.com', senha: 'ping1234', tipo: 'colaborador' },
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

  // Exportar Excel
  function exportarExcel() {
    const list = chamadosFiltrados();
    const ws = XLSX.utils.json_to_sheet(list.map(({ id, ...rest }) => rest));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Chamados');
    XLSX.writeFile(wb, 'chamados.xlsx');
  }

  // Dashboard cálculo de totais (Colaborador vê tudo, provedores só o seu)
  const chamadosDash = chamadosFiltrados();

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

  return (
    <div
      style={{
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        background:
          'linear-gradient(135deg, #3a0ca3, #720026)', // azul roxo tech vibes
        minHeight: '100vh',
        color: 'white',
        padding: 20,
      }}
    >
      {!user && (
        <form
          onSubmit={handleLogin}
          style={{
            maxWidth: 320,
            margin: '100px auto',
            backgroundColor: '#4b0082',
            padding: 30,
            borderRadius: 8,
          }}
        >
          <h2 style={{ marginBottom: 20, textAlign: 'center' }}>Login</h2>
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
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            Entrar
          </button>
        </form>
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
              <h1>Central do Provedor - {user.tipo.toUpperCase()}</h1>
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

          <section
            style={{
              marginBottom: 20,
              padding: 20,
              backgroundColor: '#2d0074',
              borderRadius: 8,
            }}
          >
            <h2>Dashboard</h2>
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
            </div>
          </section>

          {user.tipo === 'colaborador' && (
            <section
              style={{
                marginBottom: 20,
                padding: 20,
                backgroundColor: '#2d0074',
                borderRadius: 8,
              }}
            >
              <h2>{form.id ? 'Editar Chamado' : 'Novo Chamado'}</h2>
              <form onSubmit={handleSalvarChamado}>
                <label>
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
                <label>
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
                <label>
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
                <label>
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
                <label>
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
                <label>
                  Valor do Atendimento:
                  <select
                    value={form.valor}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, valor: parseFloat(e.target.value) }))
                    }
                    required
                    style={{ marginLeft: 10, padding: 5, borderRadius: 4 }}
                  >
                    {opcoesValores.map((opt) => (
                      <option key={opt.valor} value={opt.valor}>
                        {opt.label}
                      </option>
                    ))}
                    <option value={1.5}>R$ 1,50 (Massivo)</option>
                  </select>
                </label>
                <br />
                <label>
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
                    color: 'white',
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

          <section
            style={{
              padding: 20,
              backgroundColor: '#2d0074',
              borderRadius: 8,
              overflowX: 'auto',
            }}
          >
            <h2>Chamados</h2>
            <div style={{ marginBottom: 10 }}>
              {(user.tipo === 'provedor' || user.tipo === 'colaborador') && (
                <>
                  <label>
                    Filtrar Data Início:
                    <input
                      type="date"
                      value={filtroInicio}
                      onChange={(e) => setFiltroInicio(e.target.value)}
                      style={{ marginLeft: 10, borderRadius: 4, padding: 5 }}
                    />
                  </label>
                  <label style={{ marginLeft: 20 }}>
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
                color: 'white',
              }}
            >
              <thead>
                <tr>
                  <th style={{ borderBottom: '1px solid white', padding: 8 }}>
                    Provedor
                  </th>
                  <th style={{ borderBottom: '1px solid white', padding: 8 }}>
                    Nome
                  </th>
                  <th style={{ borderBottom: '1px solid white', padding: 8 }}>
                    Telefone
                  </th>
                  <th style={{ borderBottom: '1px solid white', padding: 8 }}>
                    Protocolo
                  </th>
                  <th style={{ borderBottom: '1px solid white', padding: 8 }}>
                    Data
                  </th>
                  <th style={{ borderBottom: '1px solid white', padding: 8 }}>
                    Valor
                  </th>
                  <th style={{ borderBottom: '1px solid white', padding: 8 }}>
                    Descrição
                  </th>
                  {user.tipo === 'colaborador' && (
                    <th style={{ borderBottom: '1px solid white', padding: 8 }}>
                      Ações
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {chamadosFiltrados().map((c) => (
                  <tr key={c.id}>
                    <td style={{ borderBottom: '1px solid white', padding: 8 }}>
                      {c.provedor}
                    </td>
                    <td style={{ borderBottom: '1px solid white', padding: 8 }}>
                      {c.nome}
                    </td>
                    <td style={{ borderBottom: '1px solid white', padding: 8 }}>
                      {c.telefone}
                    </td>
                    <td style={{ borderBottom: '1px solid white', padding: 8 }}>
                      {c.protocolo}
                    </td>
                    <td style={{ borderBottom: '1px solid white', padding: 8 }}>
                      {c.data}
                    </td>
                    <td style={{ borderBottom: '1px solid white', padding: 8 }}>
                      R$ {c.valor.toFixed(2)}
                    </td>
                    <td style={{ borderBottom: '1px solid white', padding: 8 }}>
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
