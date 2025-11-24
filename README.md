# 🔐 SecureHub - Ferramenta de Segurança Unificada

Uma plataforma web moderna e completa que unifica múltiplas ferramentas de segurança em uma interface elegante e intuitiva.

![SecureHub](https://img.shields.io/badge/Security-Tools-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Privacy](https://img.shields.io/badge/privacy-first-orange)

## ✨ Funcionalidades

### 🔐 Gerador de Senhas
- Geração de senhas seguras e customizáveis
- Opções de comprimento (8-64 caracteres)
- Controle de tipos de caracteres (maiúsculas, minúsculas, números, símbolos)
- Cálculo de entropia e força da senha
- Histórico de senhas geradas
- Evitar caracteres ambíguos

### 💪 Verificador de Força de Senha
- Análise em tempo real da força da senha
- Verificação contra senhas comuns
- Detecção de padrões sequenciais
- Sugestões de melhoria
- Visualização com barra de progresso colorida
- Score detalhado (0-100)

### 🔍 Scanner de URLs
- Análise de segurança de URLs
- Detecção de phishing
- Verificação de protocolo HTTPS
- Identificação de padrões suspeitos
- Análise de domínio e subdomínio
- Alertas de risco

### 🔢 Verificador de Hash
- Geração de hashes (SHA-256, SHA-512, SHA-1)
- Verificação de integridade de arquivos
- Comparação de checksums
- Suporte a múltiplos algoritmos

### 🔒 Criptografia de Texto
- Criptografia/descriptografia AES-256-GCM
- Processamento 100% client-side
- Codificação/decodificação Base64
- Geração de chaves seguras
- Proteção com senha

### 🎫 Gerador de Tokens
- Tokens aleatórios personalizáveis
- UUID v4 (RFC 4122)
- API Keys com prefixos
- JWT simulados
- Tokens hexadecimais
- Histórico de tokens gerados

### 🚨 Verificador de Vazamentos
- Verificação de exposição de dados
- Base de conhecimento de vazamentos
- Recomendações de segurança
- Informações educacionais
- Privacidade garantida (verificação local)

### 🛡️ Scanner de Vulnerabilidades
- Análise de cabeçalhos HTTP de segurança
- Verificação de HTTPS/SSL
- Score de segurança (A-D)
- Recomendações detalhadas
- Verificação de práticas recomendadas

## 🎨 Design

- **Interface Moderna**: Design premium com glassmorphism e gradientes vibrantes
- **Dark Mode**: Tema escuro/claro com transições suaves
- **Responsivo**: Funciona perfeitamente em desktop, tablet e mobile
- **Animações**: Micro-animações para melhor UX
- **Acessível**: Seguindo práticas de acessibilidade web

## 🔒 Privacidade e Segurança

- ✅ **100% Client-Side**: Todos os dados são processados localmente no navegador
- ✅ **Sem Servidores**: Nenhum dado é enviado para servidores externos
- ✅ **Open Source**: Código transparente e auditável
- ✅ **Sem Tracking**: Sem analytics ou rastreamento
- ✅ **Criptografia Forte**: AES-256-GCM para proteção de dados

## 🚀 Como Usar

1. **Abrir o arquivo**: Simplesmente abra o `index.html` em qualquer navegador moderno
2. **Sem instalação**: Não requer instalação ou dependências
3. **Offline**: Funciona completamente offline após o primeiro carregamento

### Navegadores Suportados

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Opera 76+

## 📁 Estrutura do Projeto

```
SecureHub/
├── index.html              # Página principal
├── styles.css              # Estilos e design system
├── app.js                  # Lógica principal e utilitários
├── modules/
│   ├── password-generator.js      # Gerador de senhas
│   ├── password-strength.js       # Verificador de força
│   ├── url-scanner.js             # Scanner de URLs
│   ├── hash-verifier.js           # Verificador de hash
│   ├── encryption.js              # Criptografia
│   ├── token-generator.js         # Gerador de tokens
│   ├── breach-checker.js          # Verificador de vazamentos
│   └── vulnerability-scanner.js   # Scanner de vulnerabilidades
└── README.md               # Documentação
```

## 🛠️ Tecnologias

- **HTML5**: Estrutura semântica
- **CSS3**: Design moderno com variáveis CSS e animações
- **JavaScript ES6+**: Lógica client-side
- **Web Crypto API**: Criptografia nativa do navegador
- **Google Fonts**: Tipografia Inter

## 🎯 Casos de Uso

- **Desenvolvedores**: Gerar API keys, tokens e verificar hashes
- **Usuários**: Criar senhas seguras e verificar links suspeitos
- **Administradores**: Analisar segurança de sites e configurações
- **Educação**: Aprender sobre segurança digital

## ⚠️ Avisos Importantes

- Esta ferramenta é para fins educacionais e de uso pessoal
- Para análises de segurança profissionais, use ferramentas especializadas
- Sempre mantenha backups de dados importantes
- Nunca compartilhe senhas ou chaves de criptografia

## 📝 Licença

Este projeto é de código aberto e está disponível sob a licença MIT.

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

- Reportar bugs
- Sugerir novas funcionalidades
- Melhorar a documentação
- Enviar pull requests

## 📧 Suporte

Para questões e suporte, abra uma issue no repositório do projeto.

## 🌟 Agradecimentos

Desenvolvido com ❤️ para tornar a segurança digital mais acessível.

---

**Nota**: Esta ferramenta processa todos os dados localmente no seu navegador. Seus dados nunca são enviados para servidores externos, garantindo máxima privacidade e segurança.
