
// Importa o módulo sqlite3
const sqlite3 = require('sqlite3').verbose();


// Cria ou abre o banco de dados chamado feedbacks.db
const db = new sqlite3.Database('./feedbacks.db');

// Cria a tabela  feedbacks se ela ainda não existir
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS feedbacks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user TEXT NOT NULL,
      to_user TEXT NOT NULL,
      message TEXT NOT NULL
    )
  `);
});

// Cria a tabela de usuários se ela ainda não existir
db.run(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL
  )
`);

module.exports = db;

