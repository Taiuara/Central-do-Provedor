import { useState } from 'react';

export default function NovoChamado() {
  const [formChamado, setFormChamado] = useState({
    provedor: '',
    nome: '',
    telefone: '',
    protocolo: '',
    data: '',
    valorAtendimento: '',
    descricao: '',
  });

  function handleChange(e) {
    setFormChamado({ ...formChamado, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    const {
      provedor,
      nome,
      telefone,
      protocolo,
      data,
      valorAtendimento,
      descricao,
    } = formChamado;

    if (
      !provedor ||
      !nome ||
      !telefone ||
      !protocolo ||
      !data ||
      !valorAtendimento ||
      !descricao
    ) {
      alert('Preencha todos os campos!');
      return;
    }

    // Aqui você pode mandar os dados pra API, armazenar no state global, etc.
    alert(`Chamado criado:\n
      Provedor: ${provedor}
      Nome: ${nome}
      Telefone: ${telefone}
      Protocolo: ${protocolo}
      Data: ${data}
      Valor do atendimento: R$ ${valorAtendimento}
      Descrição: ${descricao}
    `);

    setFormChamado({
      provedor: '',
      nome: '',
      telefone: '',
      protocolo: '',
      data: '',
      valorAtendimento: '',
      descricao: '',
    });
  }

  return (
    <div style={styles.container}>
      <h1>Novo Chamado 🚀</h1>
      <form onSubmit={handleSubmit} style={styles.form}>
        <select
          name="provedor"
          value={formChamado.provedor}
          onChange={handleChange}
          style={styles.input}
          required
        >
          <option value="">-- Selecione o Provedor --</option>
          <option value="Mynet">Mynet</option>
          <option value="Bkup">Bkup</option>
        </select>

        <input
          type="text"
          name="nome"
          placeholder="Nome"
          value={formChamado.nome}
          onChange={handleChange}
          style={styles.input}
          required
        />

        <input
          type="text"
          name="telefone"
          placeholder="Telefone"
          value={formChamado.telefone}
          onChange={handleChange}
          style={styles.input}
          required
        />

        <input
          type="text"
          name="protocolo"
          placeholder="Protocolo"
          value={formChamado.protocolo}
          onChange={handleChange}
          style={styles.input}
          required
        />

        <input
          type="date"
          name="data"
          value={formChamado.data}
          onChange={handleChange}
          style={styles.input}
          required
        />

        <select
          name="valorAtendimento"
          value={formChamado.valorAtendimento}
          onChange={handleChange}
          style={styles.input}
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
          name="descricao"
          placeholder="Descrição"
          value={formChamado.descricao}
          onChange={handleChange}
          style={styles.input}
          required
        />

        <button type="submit" style={styles.button}>Criar Chamado</button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    fontFamily: 'Segoe UI',
    maxWidth: 500,
    margin: '40px auto',
    padding: 20,
    border: '1px solid #ccc',
    borderRadius: 8,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  input: {
    padding: 10,
    fontSize: 16,
    borderRadius: 4,
    border: '1px solid #888',
  },
  button: {
    backgroundColor: '#182848',
    color: 'white',
    padding: '10px 15px',
    fontSize: 16,
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
  },
};
