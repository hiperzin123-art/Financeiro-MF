# Financeiro Master — Sistema de Gestão Financeira Pessoal

Sistema completo, moderno e profissional de gestão financeira pessoal e familiar desenvolvido com Next.js 14, TypeScript, Tailwind CSS, Prisma ORM e SQLite local integrado.

---

## 🚀 Como Executar no Windows

### Pré-requisitos
- Node.js (v18 ou superior instalado)

### Instalação e Execução
1. Abra o terminal na pasta do projeto (`d:\Finanças`).
2. O banco de dados e as dependências já estão configurados e populados.
3. Para iniciar a aplicação em modo desenvolvimento:
   ```powershell
   npm run dev
   ```
4. Acesse no navegador:
   **[http://localhost:3000](http://localhost:3000)**

---

## 💎 Funcionalidades Implementadas

1. **Dashboard Completo com 12 Indicadores Conectados ao Banco Real:**
   - Saldo total nas contas.
   - Dinheiro em espécie (carteira física).
   - Saldo disponível (descontados compromissos do ciclo).
   - Saldo comprometido (faturas abertas + contas a pagar).
   - Entradas do mês e Despesas de consumo reconhecidas.
   - Resultado líquido (superávit/déficit).
   - Faturas de cartões em aberto.
   - Parcelamentos futuros a vencer.
   - Dívidas pendentes a quitar.
   - Valores a receber (empréstimos concedidos e créditos).
   - Patrimônio líquido completo.

2. **Motor Financeiro Central (`src/lib/financialEngine.ts`):**
   - Todos os cálculos monetários são processados em **centavos inteiros** (evitando imprecisões de ponto flutuante do JavaScript).
   - Regras de competência: compra no cartão é despesa de consumo imediata; o pagamento da fatura liquida o passivo sem duplicar despesa.
   - Transferências entre contas próprias não afetam receitas e despesas.

3. **Assistente em Linguagem Natural Local (`src/lib/nlpParser.ts`):**
   - Interpreta frases em português brasileiro diretamente no computador sem APIs pagas externas.
   - Suporte a comandos de voz (Web Speech API) ou digitação direta.
   - Exibe resumo antes de gravar no banco de dados.

4. **Importador Inteligente de Faturas (`src/lib/invoiceParser.ts`):**
   - Suporta arquivos PDF de faturas bancárias ou inserção de texto.
   - Identifica parcelas (ex: "02/05"), datas e valores em BRL.
   - Permite conferência dos itens antes da efetivação no cartão de crédito.

5. **Modal Global de Lançamento Rápido:**
   - Acesso em qualquer aba pelo botão "+ Lançamento" ou "+ Novo Registro".
   - Tipos suportados: Despesa, Receita, Cartão de Crédito, Transferência e Pagamento de Fatura.
