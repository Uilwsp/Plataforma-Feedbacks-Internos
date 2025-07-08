const express = require('express');// Importa o framework Express
const path = require('path');// Importa o módulo path para manipulação de caminhos de arquivos
const cors = require('cors');// Permite requisições de outros domínios
const db = require('./db'); // conexão com o banco SQLite

const app = express();// Cria uma instância do Express
const PORT = 3000;// Define a porta onde o servidor irá rodar

// Middleware necessário para interpretar JSON e formulários

app.use(cors());// Permite que outros domínios acessem sua API
app.use(express.json());// Permite receber dados em JSON no corpo das requisições
app.use(express.urlencoded({ extended: true }));//Permite receber dados de formulários

// Serve arquivos HTML, CSS e JS da pasta frontend
app.use(express.static(path.join(__dirname, 'frontend')));// Configura o Express para servir arquivos estáticos da pasta 'frontend'

// Rota principal que abre a tela home.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/index.html'));// Envia o arquivo home.html quando a rota raiz é acessada
});

// -------------------- ROTAS DE FEEDBACK --------------------

// Enviar novo feedback
app.post('/feedbacks', (req, res) => {
  const { from, to, message } = req.body;// Obtém os dados do feedback do corpo da requisição

  const query = `INSERT INTO feedbacks (from_user, to_user, message) VALUES (?, ?, ?)`;// Prepara a consulta SQL para inserir o feedback
  db.run(query, [from, to, message], function (err) {
    if (err) {
      console.error(err);// Loga o erro no console
      return res.status(500).json({ error: 'Erro ao salvar o feedback.' });// Se houver um erro, retorna um erro 500
    }
    res.status(201).json({ id: this.lastID });// Retorna o ID do feedback recém-criado
  });
});

// Listar feedbacks
app.get('/feedbacks', (req, res) => {
  db.all(`SELECT * FROM feedbacks`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar feedbacks.' });
    }
    const feedbacks = rows.map(row => ({
      id: row.id,
      from: row.from_user,
      to: row.to_user,
      message: row.message
    }));
    res.json(feedbacks);
  });
});

// Atualizar feedback
app.put('/feedbacks/:id', (req, res) => {
  const { id } = req.params;
  const { from, to, message } = req.body;

  const query = `UPDATE feedbacks SET from_user = ?, to_user = ?, message = ? WHERE id = ?`;
  db.run(query, [from, to, message, id], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao atualizar feedback.' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Feedback não encontrado.' });
    }
    res.json({ success: true });
  });
});

// Deletar feedback
app.delete('/feedbacks/:id', (req, res) => {
  const { id } = req.params;

  const query = `DELETE FROM feedbacks WHERE id = ?`;
  db.run(query, [id], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao deletar feedback.' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Feedback não encontrado.' });
    }
    res.json({ success: true });
  });
});

// -------------------- ROTAS DE USUÁRIOS --------------------

// Cadastro de novo usuário
app.post('/cadastro', (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ error: 'Preencha todos os campos.' });
  }

  const query = `INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)`;

  db.run(query, [nome, email, senha], function (err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(400).json({ error: 'Email já cadastrado.' });
      }
      return res.status(500).json({ error: 'Erro ao cadastrar usuário.' });
    }

    res.status(201).json({ success: true });
  });
});

// Login de usuário
app.post('/login', (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });// Verifica se email e senha foram.
  }

  const query = `SELECT * FROM usuarios WHERE email = ?`;// Consulta o banco de dados para encontrar o usuário.

  db.get(query, [email], (err, user) => {
    if (err) {
      console.error(err);// Loga o erro no console
      return res.status(500).json({ error: 'Erro no banco de dados.' });// Se houver um erro no banco de dados, retorna um erro 500.
    }

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado.' });// Se o usuário não for encontrado, retorna.
    }

    if (senha !== user.senha) {
      return res.status(401).json({ error: 'Senha incorreta.' });// Verifica se a senha está correta.
    }

    // Login com sucesso
    res.json({ nome: user.nome });
  });
});

// Rota para buscar usuário pelo email (retorna o ID)
app.get('/usuarios/email/:email', (req, res) => {
  const email = req.params.email;

  db.get('SELECT id FROM usuarios WHERE email = ?', [email], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar usuário.' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    res.json(row);
  });
});


// Rota para deletar usuário pelo ID
app.delete('/usuarios/:id', (req, res) => {
  const id = req.params.id;

  const query = `DELETE FROM usuarios WHERE id = ?`;

  db.run(query, [id], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro ao deletar usuário.' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    res.json({ success: true, message: 'Usuário excluído com sucesso.' });
  });
});

// -------------------- INICIA O SERVIDOR --------------------
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
