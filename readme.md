# 🛡️ Cofre Digital - Autenticação Passwordless com WebAuthn (FIDO2)

O **Cofre Digital** é uma aplicação web desenvolvida para escritórios de advocacia que implementa autenticação **Passwordless (sem senha)** utilizando o padrão internacional **WebAuthn (FIDO2)**.

A aplicação elimina o uso de senhas tradicionais, reduzindo significativamente riscos de phishing, vazamentos de credenciais e reutilização de senhas. A autenticação ocorre utilizando recursos nativos do dispositivo do usuário, como:

- 🔐 Windows Hello (PIN)
- 👆 Touch ID

- 😊 Reconhecimento facial
- 📱 Smartphone (QR Code/Bluetooth)
- 🔑 Chaves de segurança compatíveis com FIDO2

---

# 📚 Sumário

- [Visão Geral](#-visão-geral)
- [Arquitetura](#-arquitetura)
- [Fluxo de Funcionamento](#-fluxo-de-funcionamento)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Descrição dos Arquivos](#-descrição-dos-arquivos)
- [Segurança](#-segurança)
- [LGPD](#-lgpd)
- [Como Executar](#-como-executar-o-projeto)
- [Melhorias Futuras](#-melhorias-futuras)

---

# 📖 Visão Geral

O projeto demonstra uma implementação prática do protocolo **WebAuthn**, permitindo autenticação baseada em criptografia assimétrica sem necessidade de armazenar senhas.

Durante o cadastro, uma chave criptográfica é criada no dispositivo do usuário.

O servidor recebe apenas a **chave pública**, enquanto a **chave privada permanece protegida no hardware do usuário**, nunca sendo transmitida pela internet.

---

# 🏗 Arquitetura

```text
                 +----------------------+
                 |     Navegador        |
                 |  HTML/CSS/JavaScript |
                 +----------+-----------+
                            |
             navigator.credentials.create()
             navigator.credentials.get()
                            |
                            ▼
                 +----------------------+
                 |   API Node.js        |
                 |      Express         |
                 +----------+-----------+
                            |
             @simplewebauthn/server
                            |
                            ▼
                Validação Criptográfica
                            |
                            ▼
              Armazenamento da Chave Pública
```

---

# 🔒 Fluxo de Funcionamento

## 1️⃣ Cadastro do Dispositivo

O usuário informa seu e-mail.

O servidor gera um **challenge** criptográfico.

O navegador chama:

```javascript
navigator.credentials.create()
```

O sistema operacional solicita autenticação local:

- PIN
- Biometria
- Face ID
- Touch ID

Após a validação local:

- gera-se um par de chaves;
- a chave pública é enviada ao servidor;
- a chave privada permanece protegida no hardware.

---

## 2️⃣ Login

O usuário clica em **Entrar no Cofre**.

O servidor cria um novo challenge.

O navegador executa:

```javascript
navigator.credentials.get()
```

O dispositivo assina digitalmente o desafio utilizando sua chave privada.

O servidor valida a assinatura utilizando a chave pública cadastrada.

Se a assinatura for válida:

✅ acesso autorizado.

---

# 🛠 Tecnologias Utilizadas

| Camada | Tecnologia |
|---------|------------|
| Backend | Node.js |
| Framework | Express |
| Segurança | @simplewebauthn/server |
| Sessões | express-session |
| Frontend | HTML5 |
| Estilo | CSS3 |
| Cliente | JavaScript |
| Hospedagem | Render |
| Versionamento | GitHub |

---

# 📂 Estrutura do Projeto

```text
projeto-chave-mestra/
│
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
│
├── server.js
├── package.json
├── package-lock.json
└── README.md
```

---

# 📄 Descrição dos Arquivos

## server.js

Servidor principal da aplicação.

Responsabilidades:

- configuração do Express;
- gerenciamento de sessões;
- geração dos desafios WebAuthn;
- verificação criptográfica;
- configuração dinâmica do RP_ID e Origin.

Rotas implementadas:

```
POST /generate-registration-options

POST /verify-registration

POST /generate-authentication-options

POST /verify-authentication
```

---

## public/index.html

Interface principal do sistema.

Possui:

- campo de identificação do usuário;
- botão de cadastro;
- botão de autenticação;
- mensagens de status;
- informações sobre LGPD.

---

## public/style.css

Responsável pela aparência do sistema.

Características:

- Dark Mode;
- Layout responsivo;
- Interface moderna;
- Feedback visual para erros e sucesso.

---

## public/app.js

Responsável pela comunicação entre navegador e servidor.

Funções:

- consumo da API;
- conversão Base64URL ⇄ ArrayBuffer;
- chamada das APIs WebAuthn;
- envio das respostas criptográficas ao backend.

---

## package.json

Gerencia as dependências da aplicação.

Principais bibliotecas:

```json
express
@simplewebauthn/server
express-session
```

Scripts:

```bash
npm start
```

---

# 🔐 Segurança

A aplicação segue o padrão internacional **FIDO2/WebAuthn**.

## ✔ Não existe armazenamento de senha

Nenhuma senha é salva no banco.

---

## ✔ Biometria nunca sai do dispositivo

Toda validação ocorre localmente.

O servidor nunca recebe:

- PIN
- Impressão digital
- Face ID
- Senhas

---

## ✔ Criptografia Assimétrica

Durante o cadastro:

```
Chave Pública
        ↓
Servidor

Chave Privada
        ↓
Hardware do Usuário
```

Mesmo que o servidor seja comprometido, não é possível autenticar um usuário utilizando apenas a chave pública.

---

## ✔ Proteção contra Replay Attack

Cada autenticação utiliza um challenge exclusivo.

Os desafios possuem uso único.

Isso impede reutilização de respostas antigas.

---

# ⚖ LGPD

O projeto segue os princípios da **Lei Geral de Proteção de Dados (Lei nº 13.709/2018)**.

Boas práticas adotadas:

- Privacy by Design;
- minimização de dados;
- autenticação sem armazenamento de senha;
- redução de dados pessoais sensíveis;
- uso de criptografia assimétrica.

---

# 🚀 Como Executar o Projeto

## Pré-requisitos

- Node.js 18+
- Google Chrome
- Microsoft Edge
- Mozilla Firefox
- Safari

---

## Clone o repositório

```bash
git clone https://github.com/TaisBarbos/projeto-chave-mestra.git
```

Entre na pasta:

```bash
cd projeto-chave-mestra
```

---

## Instale as dependências

```bash
npm install
```

---

## Execute

```bash
npm start
```

---

## Acesse

```
http://localhost:3000
```

---

# 📸 Funcionamento

Fluxo da autenticação:

```
Usuário
    │
    ▼
Digita e-mail
    │
    ▼
Cadastrar dispositivo
    │
    ▼
Windows Hello
Touch ID
Face ID
PIN
    │
    ▼
Servidor salva apenas a chave pública
    │
    ▼
Login
    │
    ▼
Assinatura do challenge
    │
    ▼
Validação
    │
    ▼
Acesso ao Cofre
```

---

# 🚀 Melhorias Futuras

- Banco de dados PostgreSQL
- Cadastro de múltiplos dispositivos
- Revogação de credenciais
- Painel administrativo
- Auditoria de acessos
- Tokens JWT
- Docker
- HTTPS com certificado próprio
- Deploy automatizado via GitHub Actions

---

# 👩‍💻 Autora

**Taís Barbosa**

Projeto desenvolvido para estudo e implementação de autenticação **Passwordless utilizando WebAuthn (FIDO2)**, demonstrando práticas modernas de segurança para aplicações web voltadas ao setor jurídico.

---

## 📄 Licença

Este projeto é distribuído para fins acadêmicos e de estudo.

Sinta-se à vontade para utilizar como base em projetos de pesquisa e aprendizado sobre autenticação Passwordless e WebAuthn.
