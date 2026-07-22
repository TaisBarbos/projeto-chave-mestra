async function cadastrarDispositivo() {
    const username = document.getElementById('username').value;
    const status = document.getElementById('status-msg');

    if (!username) {
        alert("Por favor, digite seu nome de usuário.");
        return;
    }

    // Acessa a biblioteca de forma segura
    const SimpleWebAuthn = window.SimpleWebAuthnBrowser;
    if (!SimpleWebAuthn) {
        alert("Erro: A biblioteca WebAuthn ainda não carregou. Verifique sua conexão com a internet.");
        return;
    }

    status.style.color = '#38bdf8';
    status.textContent = 'Solicitando autenticação do Sistema Operacional...';

    try {
        // 1. Busca opções no backend
        const res = await fetch('/api/register-options', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });
        const options = await res.json();

        // 2. O navegador chama o Windows Hello / PIN do Android
        const attResp = await SimpleWebAuthn.startRegistration(options);

        // 3. Envia a assinatura para o servidor registrar
        const verifyRes = await fetch('/api/register-verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(attResp)
        });

        const result = await verifyRes.json();
        if (result.success) {
            status.style.color = '#10b981';
            status.textContent = '✅ Dispositivo e PIN cadastrados com sucesso!';
        } else {
            status.style.color = '#ef4444';
            status.textContent = result.error;
        }
    } catch (err) {
        console.error("Erro detalhado:", err);
        status.style.color = '#ef4444';
        status.textContent = 'Cancelado ou erro no cadastro.';
    }
}

async function acessarCofre() {
    const username = document.getElementById('username').value;
    const status = document.getElementById('status-msg');

    if (!username) {
        alert("Por favor, digite seu nome de usuário.");
        return;
    }

    const SimpleWebAuthn = window.SimpleWebAuthnBrowser;

    status.style.color = '#38bdf8';
    status.textContent = 'Aguardando validação do PIN do seu aparelho...';

    try {
        // 1. Busca desafio de login
        const res = await fetch('/api/login-options', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });
        const options = await res.json();

        if (options.error) {
            status.style.color = '#ef4444';
            status.textContent = options.error;
            return;
        }

        // 2. Abre a tela nativa do SO pedindo o PIN
        const asseResp = await SimpleWebAuthn.startAuthentication(options);

        // 3. Valida no backend
        const verifyRes = await fetch('/api/login-verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(asseResp)
        });

        const result = await verifyRes.json();

        if (result.success) {
            status.textContent = '';
            document.getElementById('auth-area').style.display = 'none';
            document.getElementById('cofre-area').style.display = 'block';
        } else {
            status.style.color = '#ef4444';
            status.textContent = result.error;
        }
    } catch (err) {
        console.error("Erro detalhado:", err);
        status.style.color = '#ef4444';
        status.textContent = 'Falha na verificação do PIN.';
    }
}