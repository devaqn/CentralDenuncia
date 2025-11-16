// 1. Importar as bibliotecas
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const multer = require('multer');

const app = express();
const PORT = 3000;


app.use(cors());


//  Configuração do Banco de Dados
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'canalDenuncia',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};


const pool = mysql.createPool(dbConfig);

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Limite de 10MB (igual ao frontend)
});


app.post('/api/denuncias', upload.single('evidencia'), async (req, res) => {
  

  const {
    tipo_relato,
    id_tipo_fk,
    descricao_ocorrencia,
    local_ocorrencia,
    data_hora_ocorrencia,
    nome_completo,
    email,
    telefone
  } = req.body;

  const arquivoBuffer = req.file ? req.file.buffer : null; 

  // Validação básica no backend
  if (!tipo_relato || !id_tipo_fk || !descricao_ocorrencia || !local_ocorrencia) {
    return res.status(400).json({ message: 'Campos obrigatórios estão faltando.' });
  }

  const protocolo = `DEN-${Date.now()}`;

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const sqlDenuncia = `
      INSERT INTO denuncia
      (tipoDenuncia, descOcorrencia, localOcorrencia, dataOcorrencia, tipoCRIME, protocolo, arquivoProva)
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `;
    const dataOcorrencia = data_hora_ocorrencia ? data_hora_ocorrencia : null;
    
    const [denunciaResult] = await connection.execute(sqlDenuncia, [
      tipo_relato,
      descricao_ocorrencia,
      local_ocorrencia,
      dataOcorrencia,
      id_tipo_fk,
      protocolo,
      arquivoBuffer 
    ]);
    
    const newDenunciaId = denunciaResult.insertId;

    let newDenuncianteId = null;

    if (tipo_relato === 'identificado') {
      if (!email) {
        await connection.rollback();
        return res.status(400).json({ message: 'Email é obrigatório para denúncia identificada.' });
      }

      const sqlDenunciante = `
        INSERT INTO denunciante (nomeDenunciante, telefone, email)
        VALUES (?, ?, ?);
      `;
      const [denuncianteResult] = await connection.execute(sqlDenunciante, [
        nome_completo || null,
        telefone || null,
        email
      ]);
      newDenuncianteId = denuncianteResult.insertId;
    }


    const sqlLink = `
      INSERT INTO denuncia_denunciante (denunciaId, denuncianteId)
      VALUES (?, ?);
    `;
    await connection.execute(sqlLink, [newDenunciaId, newDenuncianteId]);


    await connection.commit();

    res.status(201).json({
      message: 'Denúncia registrada com sucesso.',
      protocolo: protocolo
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Erro ao salvar denúncia:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });

  } finally {
    if (connection) {
      connection.release();
    }
  }
});


app.listen(PORT, () => {
  console.log(`🚀 Servidor backend rodando em http://localhost:${PORT}`);
});