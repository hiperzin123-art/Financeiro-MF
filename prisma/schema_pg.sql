-- Tabela Account
CREATE TABLE IF NOT EXISTS "Account" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'CHECKING',
  "color" TEXT DEFAULT '#10b981',
  "initialBalance" INTEGER NOT NULL DEFAULT 0,
  "currentBalance" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela CreditCard
CREATE TABLE IF NOT EXISTS "CreditCard" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "brand" TEXT NOT NULL DEFAULT 'OUTRO',
  "color" TEXT DEFAULT '#6366f1',
  "creditLimit" INTEGER NOT NULL DEFAULT 0,
  "closingDay" INTEGER NOT NULL DEFAULT 1,
  "dueDay" INTEGER NOT NULL DEFAULT 10,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela Category
CREATE TABLE IF NOT EXISTS "Category" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT UNIQUE NOT NULL,
  "color" TEXT DEFAULT '#6b7280',
  "icon" TEXT DEFAULT 'Tag',
  "isIncome" BOOLEAN NOT NULL DEFAULT false,
  "isExpense" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela Invoice
CREATE TABLE IF NOT EXISTS "Invoice" (
  "id" TEXT PRIMARY KEY,
  "creditCardId" TEXT NOT NULL REFERENCES "CreditCard"("id") ON DELETE CASCADE,
  "month" INTEGER NOT NULL,
  "year" INTEGER NOT NULL,
  "closingDate" TIMESTAMP(3) NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "totalAmount" INTEGER NOT NULL DEFAULT 0,
  "paidAmount" INTEGER NOT NULL DEFAULT 0,
  "isPaid" BOOLEAN NOT NULL DEFAULT false,
  "importedFile" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Invoice_creditCardId_month_year_key" UNIQUE ("creditCardId", "month", "year")
);

-- Tabela InstallmentPlan
CREATE TABLE IF NOT EXISTS "InstallmentPlan" (
  "id" TEXT PRIMARY KEY,
  "description" TEXT NOT NULL,
  "totalAmount" INTEGER NOT NULL,
  "installmentCount" INTEGER NOT NULL,
  "amountPerInstallment" INTEGER NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "categoryName" TEXT,
  "creditCardName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela Transaction
CREATE TABLE IF NOT EXISTS "Transaction" (
  "id" TEXT PRIMARY KEY,
  "description" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'COMPLETED',
  "paymentMethod" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "accountId" TEXT REFERENCES "Account"("id") ON DELETE SET NULL,
  "destinationAccountId" TEXT REFERENCES "Account"("id") ON DELETE SET NULL,
  "creditCardId" TEXT REFERENCES "CreditCard"("id") ON DELETE SET NULL,
  "invoiceId" TEXT REFERENCES "Invoice"("id") ON DELETE SET NULL,
  "categoryId" TEXT REFERENCES "Category"("id") ON DELETE SET NULL,
  "installmentPlanId" TEXT REFERENCES "InstallmentPlan"("id") ON DELETE SET NULL,
  "currentInstallment" INTEGER,
  "totalInstallments" INTEGER,
  "relatedPerson" TEXT
);

-- Tabela Bill
CREATE TABLE IF NOT EXISTS "Bill" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "type" TEXT NOT NULL,
  "isFixed" BOOLEAN NOT NULL DEFAULT false,
  "recurrence" TEXT NOT NULL DEFAULT 'NONE',
  "isPaid" BOOLEAN NOT NULL DEFAULT false,
  "paidAt" TIMESTAMP(3),
  "notes" TEXT,
  "relatedPerson" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "categoryId" TEXT REFERENCES "Category"("id") ON DELETE SET NULL,
  "accountId" TEXT REFERENCES "Account"("id") ON DELETE SET NULL
);

-- Tabela DebtLoan
CREATE TABLE IF NOT EXISTS "DebtLoan" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "personName" TEXT NOT NULL,
  "isToReceive" BOOLEAN NOT NULL,
  "originalAmount" INTEGER NOT NULL,
  "remainingAmount" INTEGER NOT NULL,
  "interestAmount" INTEGER NOT NULL DEFAULT 0,
  "dueDate" TIMESTAMP(3),
  "isSettled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela Budget
CREATE TABLE IF NOT EXISTS "Budget" (
  "id" TEXT PRIMARY KEY,
  "month" INTEGER NOT NULL,
  "year" INTEGER NOT NULL,
  "amountLimit" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "categoryId" TEXT NOT NULL REFERENCES "Category"("id") ON DELETE CASCADE,
  CONSTRAINT "Budget_categoryId_month_year_key" UNIQUE ("categoryId", "month", "year")
);

-- Tabela FinancialGoal
CREATE TABLE IF NOT EXISTS "FinancialGoal" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL,
  "targetAmount" INTEGER NOT NULL,
  "currentAmount" INTEGER NOT NULL DEFAULT 0,
  "deadline" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela User
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY,
  "username" TEXT UNIQUE NOT NULL,
  "name" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'ADMIN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
