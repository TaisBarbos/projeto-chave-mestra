const express = require('express');
const session = require('express-session');
const {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} = require('@simplewebauthn/server');

const app = express();
app.use(express.json());
app.use(express.static('public'));

app.use(session({
    secret: 'chave-mestra-advocacia-segura',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 5 * 60 * 1000 } // Sessão expira em 5 minutos
}));

// Banco de dados em memória para demonstração
const usersDB = {}; 

// --- CONFIGURAÇÃO DINÂMICA DE DOMÍNIO (LOCAL x RENDER) ---
const EXPECTED_ORIGIN = process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000';
// Extrai apenas o hostname (ex: 'chave-mestra.onrender.com' ou 'localhost')
const RP_ID = new URL(EXPECTED_ORIGIN).hostname;

// --- 1. REGISTRO DO DISPOSITIVO (CADASTRO) ---
app.post('/api/register-options', async (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Usuário é obrigatório' });

    if (!usersDB[username]) {
        usersDB[username] = { id: Buffer.from(username).toString('base64'), devices: [] };
    }

    const options = await generateRegistrationOptions({
        rpName: 'Cofre Digital Advocacia',
        rpID: RP_ID,
        userID: usersDB[username].id,
        userName: username,
        authenticatorSelection: {
            authenticatorAttachment: 'platform', // Força o uso do SO local (Windows Hello/Android)
            userVerification: 'required',        // Exige PIN / Desenho / Biometria
            residentKey: 'discouraged',          // Força o uso do PIN local em vez da nuvem do Google
        },
    });

    req.session.currentChallenge = options.challenge;
    req.session.username = username;
    res.json(options);
});

app.post('/api/register-verify', async (req, res) => {
    const { body } = req;
    const username = req.session.username;
    const expectedChallenge = req.session.currentChallenge;

    try {
        const verification = await verifyRegistrationResponse({
            response: body,
            expectedChallenge,
            expectedOrigin: EXPECTED_ORIGIN,
            expectedRPID: RP_ID,
        });

        if (verification.verified && verification.registrationInfo) {
            const { credentialPublicKey, credentialID, counter } = verification.registrationInfo;
            
            // Converte Uint8Array para Base64/Hex seguro para armazenar
            usersDB[username].devices.push({
                credentialID: Buffer.from(credentialID).toString('base64url'),
                credentialPublicKey: Buffer.from(credentialPublicKey).toString('base64url'),
                counter,
            });

            return res.json({ success: true, message: 'Dispositivo cadastrado com sucesso!' });
        }
    } catch (error) {
        console.error(error);
        return res.status(400).json({ error: 'Falha na verificação do dispositivo' });
    }
});

// --- 2. LOGIN SEM SENHA (ACESSO AO COFRE) ---
app.post('/api/login-options', async (req, res) => {
    const { username } = req.body;
    const user = usersDB[username];

    if (!user || user.devices.length === 0) {
        return res.status(400).json({ error: 'Usuário ou dispositivo não cadastrado.' });
    }

    const options = await generateAuthenticationOptions({
        rpID: RP_ID,
        userVerification: 'required', // Exige confirmação de PIN/Biometria no login
        allowCredentials: user.devices.map(dev => ({
            id: Buffer.from(dev.credentialID, 'base64url'),
            type: 'public-key',
        })),
    });

    req.session.currentChallenge = options.challenge;
    req.session.username = username;
    res.json(options);
});

app.post('/api/login-verify', async (req, res) => {
    const { body } = req;
    const username = req.session.username;
    const user = usersDB[username];
    const expectedChallenge = req.session.currentChallenge;

    const dbAuthenticator = user.devices.find(
        dev => dev.credentialID === body.id
    );

    if (!dbAuthenticator) {
        return res.status(400).json({ error: 'Dispositivo não reconhecido' });
    }

    try {
        const verification = await verifyAuthenticationResponse({
            response: body,
            expectedChallenge,
            expectedOrigin: EXPECTED_ORIGIN,
            expectedRPID: RP_ID,
            authenticator: {
                credentialPublicKey: Buffer.from(dbAuthenticator.credentialPublicKey, 'base64url'),
                credentialID: Buffer.from(dbAuthenticator.credentialID, 'base64url'),
                counter: dbAuthenticator.counter,
            },
        });

        if (verification.verified) {
            req.session.authenticated = true;
            return res.json({ success: true, message: 'Acesso liberado ao Cofre!' });
        }
    } catch (error) {
        console.error(error);
        return res.status(400).json({ error: 'Falha na autenticação do PIN/SO' });
    }
});

// --- INICIALIZAÇÃO DO SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🔐 Servidor "Chave Mestra" rodando na porta ${PORT}`);
    console.log(`🌐 Origem configurada: ${EXPECTED_ORIGIN}`);
    console.log(`🆔 RP_ID configurado: ${RP_ID}`);
});