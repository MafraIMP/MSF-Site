const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const app = express();
const PORT = 80;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = path.join(__dirname, 'data.json');

// Credenciais padronizadas em minúsculo para evitar conflitos de digitação
const VALID_USERS = {
    "admin": "1234",
    "mafrainf": "m1a2f3r4a5",
    "gears": "scp079"
};

// Inicializa o arquivo de dados se não existir
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

function getDatabase() {
    const raw = fs.readFileSync(DATA_FILE);
    try { return JSON.parse(raw); } catch (e) { return []; }
}

function saveDatabase(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ---------------- ENDPOINTS ----------------

// Autenticação Corrigida
app.post('/api/auth', (req, res) => {
    const { user, pass } = req.body;
    
    if (!user || !pass) {
        return res.status(400).json({ success: false, message: "Campos incompletos." });
    }

    // Converte o que o usuário digitou para minúsculo antes de verificar
    const normalizedUser = user.toLowerCase().trim();
    
    // Verifica se o usuário existe e se a senha bate perfeitamente
    if (VALID_USERS[normalizedUser] && VALID_USERS[normalizedUser] === pass) {
        console.log(`[ACESSO PERMITIDO] Operador: ${normalizedUser}`);
        return res.json({ success: true, token: "AUTH_VALID" });
    }
    
    console.log(`[ACESSO NEGADO] Tentativa inválida para o usuário: ${user}`);
    res.status(401).json({ success: false, message: "Credenciais inválidas." });
});

// Listar Documentos
app.get('/api/docs', (req, res) => {
    res.json(getDatabase());
});

// Criar Documento
app.post('/api/docs', (req, res) => {
    const { title, category, content, isIndigo, infoLevel, dangerLevel } = req.body;
    
    const newDoc = {
        id: crypto.randomUUID(),
        title: title || "SEM TÍTULO",
        category: category || "GERAL",
        content: content || "",
        isIndigo: isIndigo || false,
        infoLevel: infoLevel || "Agente",
        dangerLevel: dangerLevel || "Inrelevante",
        timestamp: new Date().toISOString(),
        dateFormatted: new Date().toLocaleDateString('pt-BR')
    };

    const db = getDatabase();
    db.push(newDoc);
    saveDatabase(db);

    res.json({ success: true, document: newDoc });
});

// Deletar Documento
app.delete('/api/docs/:id', (req, res) => {
    let db = getDatabase();
    db = db.filter(doc => doc.id !== req.params.id);
    saveDatabase(db);
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`[SISTEMA ATIVO] MSF DATABASE INICIADO NA PORTA ${PORT}`);
});