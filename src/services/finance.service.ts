// Finance Service - handles all finance & payout API calls
// Supports mock-first development with automatic real API switch

import { config } from '../config';
import { apiClient } from '../lib/api-client';
import type {
  FinanceOverview,
  EarningsSummary,
  Transaction,
  TransactionFilters,
  Payout,
  PayoutFilters,
  BankAccount,
  AddBankAccountRequest,
  VerifyBankAccountResponse,
  Bank,
  Dispute,
  CreateDisputeRequest,
  FinanceNotification,
  PaginatedResponse,
} from '../types/finance';
import {
  mockFinanceOverview,
  mockEarningsSummary,
  mockTransactions,
  mockPayouts,
  mockBankAccounts,
  mockBanks,
  mockDisputes,
  mockFinanceNotifications,
} from './mock/finance-data';

const delay = (ms: number = 400) => new Promise(resolve => setTimeout(resolve, ms));
const generateId = (prefix: string = 'id') =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ─── Overview & Earnings ─────────────────────────────────────────────────────

export async function getFinanceOverview(): Promise<FinanceOverview> {
  if (config.features.useMockData) {
    await delay(300);
    return { ...mockFinanceOverview };
  }
  return apiClient.get<FinanceOverview>('/finance/overview');
}

export async function getEarningsSummary(params?: {
  eventId?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<EarningsSummary> {
  if (config.features.useMockData) {
    await delay(400);
    if (params?.eventId) {
      // Filter transactions by event and recalculate
      const eventTxns = mockTransactions.filter(
        t => t.eventId === params.eventId && t.status === 'completed'
      );
      const breakdown = [
        { source: 'ticket' as const, label: 'Tickets', revenue: 0, count: 0 },
        { source: 'voting' as const, label: 'Voting', revenue: 0, count: 0 },
        { source: 'merch' as const, label: 'Merchandise', revenue: 0, count: 0 },
        { source: 'forms' as const, label: 'Forms', revenue: 0, count: 0 },
      ];
      for (const txn of eventTxns) {
        if (txn.source === 'refund') continue;
        const item = breakdown.find(b => b.source === txn.source);
        if (item) {
          item.revenue += txn.amount;
          item.count += 1;
        }
      }
      const totalRevenue = breakdown.reduce((s, b) => s + b.revenue, 0);
      const totalPlatformFees = eventTxns.reduce((s, t) => s + t.platformFee, 0);
      const totalGatewayFees = eventTxns.reduce((s, t) => s + t.gatewayFee, 0);
      return {
        breakdown,
        totalRevenue,
        totalPlatformFees,
        totalGatewayFees,
        netEarnings: totalRevenue - totalPlatformFees - totalGatewayFees,
      };
    }
    return { ...mockEarningsSummary };
  }
  return apiClient.get<EarningsSummary>('/finance/earnings', { params });
}

// ─── Transactions ────────────────────────────────────────────────────────────

export async function getTransactions(
  filters?: TransactionFilters
): Promise<PaginatedResponse<Transaction>> {
  if (config.features.useMockData) {
    await delay(400);
    let filtered = [...mockTransactions];

    if (filters?.eventId) {
      filtered = filtered.filter(t => t.eventId === filters.eventId);
    }
    if (filters?.source) {
      filtered = filtered.filter(t => t.source === filters.source);
    }
    if (filters?.status) {
      filtered = filtered.filter(t => t.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        t =>
          t.id.toLowerCase().includes(q) ||
          t.eventName.toLowerCase().includes(q) ||
          t.customerName.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }
    if (filters?.dateFrom) {
      filtered = filtered.filter(t => t.createdAt >= filters.dateFrom!);
    }
    if (filters?.dateTo) {
      filtered = filtered.filter(t => t.createdAt <= filters.dateTo!);
    }

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const start = (page - 1) * limit;

    return {
      data: filtered.slice(start, start + limit),
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit),
    };
  }
  return apiClient.get<PaginatedResponse<Transaction>>('/finance/transactions', {
    params: filters ? { ...filters } : undefined,
  });
}

export async function getTransaction(id: string): Promise<Transaction | null> {
  if (config.features.useMockData) {
    await delay(200);
    return mockTransactions.find(t => t.id === id) || null;
  }
  return apiClient.get<Transaction>(`/finance/transactions/${encodeURIComponent(id)}`);
}

// ─── Payouts ─────────────────────────────────────────────────────────────────

export async function getPayouts(
  filters?: PayoutFilters
): Promise<PaginatedResponse<Payout>> {
  if (config.features.useMockData) {
    await delay(400);
    let filtered = [...mockPayouts];

    if (filters?.status) {
      filtered = filtered.filter(p => p.status === filters.status);
    }
    if (filters?.dateFrom) {
      filtered = filtered.filter(p => p.scheduledDate >= filters.dateFrom!);
    }
    if (filters?.dateTo) {
      filtered = filtered.filter(p => p.scheduledDate <= filters.dateTo!);
    }

    filtered.sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const start = (page - 1) * limit;

    return {
      data: filtered.slice(start, start + limit),
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit),
    };
  }
  return apiClient.get<PaginatedResponse<Payout>>('/finance/payouts', { params: filters ? { ...filters } : undefined });
}

export async function getPayout(id: string): Promise<Payout | null> {
  if (config.features.useMockData) {
    await delay(200);
    return mockPayouts.find(p => p.id === id) || null;
  }
  return apiClient.get<Payout>(`/finance/payouts/${encodeURIComponent(id)}`);
}

// ─── Bank Accounts ───────────────────────────────────────────────────────────

export async function getBankAccounts(): Promise<BankAccount[]> {
  if (config.features.useMockData) {
    await delay(300);
    return [...mockBankAccounts];
  }
  return apiClient.get<BankAccount[]>('/finance/accounts');
}

export async function verifyBankAccount(
  accountNumber: string,
  bankCode: string
): Promise<VerifyBankAccountResponse> {
  if (config.features.useMockData) {
    await delay(800); // Simulate verification delay
    // Simulate a successful verification
    const bank = mockBanks.find(b => b.code === bankCode);
    return {
      accountName: 'John Doe',
      accountNumber,
      bankName: bank?.name || 'Unknown Bank',
      bankCode,
    };
  }
  return apiClient.post<VerifyBankAccountResponse>('/finance/accounts/verify', {
    account_number: accountNumber,
    bank_code: bankCode,
  });
}

export async function addBankAccount(
  data: AddBankAccountRequest
): Promise<BankAccount> {
  if (config.features.useMockData) {
    await delay(500);
    const newAccount: BankAccount = {
      id: generateId('ba'),
      bankName: data.bankName,
      bankCode: data.bankCode,
      accountNumber: data.accountNumber,
      accountName: 'John Doe',
      status: 'verified',
      isDefault: mockBankAccounts.length === 0,
      recipientCode: `RCP_${generateId('mock')}`,
      createdAt: new Date().toISOString(),
    };
    mockBankAccounts.push(newAccount);
    return newAccount;
  }
  return apiClient.post<BankAccount>('/finance/accounts', data);
}

export async function setDefaultAccount(accountId: string): Promise<BankAccount> {
  if (config.features.useMockData) {
    await delay(300);
    mockBankAccounts.forEach(a => (a.isDefault = a.id === accountId));
    const account = mockBankAccounts.find(a => a.id === accountId);
    if (!account) throw new Error('Account not found');
    return { ...account };
  }
  return apiClient.put<BankAccount>(`/finance/accounts/${encodeURIComponent(accountId)}/default`);
}

export async function deleteBankAccount(accountId: string): Promise<void> {
  if (config.features.useMockData) {
    await delay(300);
    const idx = mockBankAccounts.findIndex(a => a.id === accountId);
    if (idx === -1) throw new Error('Account not found');
    if (mockBankAccounts[idx].isDefault) {
      throw new Error('Cannot delete the default payout account');
    }
    // Check if used in a scheduled payout
    const scheduledPayout = mockPayouts.find(
      p => p.destinationAccountId === accountId && (p.status === 'scheduled' || p.status === 'processing')
    );
    if (scheduledPayout) {
      throw new Error('Cannot delete account used for a scheduled payout');
    }
    mockBankAccounts.splice(idx, 1);
    return;
  }
  return apiClient.delete(`/finance/accounts/${encodeURIComponent(accountId)}`);
}

export async function getBanks(): Promise<Bank[]> {
  if (config.features.useMockData) {
    await delay(200);
    return [...mockBanks];
  }
  return apiClient.get<Bank[]>('/finance/banks');
}

// ─── Disputes ────────────────────────────────────────────────────────────────

export async function getDisputes(): Promise<Dispute[]> {
  if (config.features.useMockData) {
    await delay(300);
    return [...mockDisputes].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  return apiClient.get<Dispute[]>('/finance/disputes');
}

export async function createDispute(
  data: CreateDisputeRequest
): Promise<Dispute> {
  if (config.features.useMockData) {
    await delay(600);
    const newDispute: Dispute = {
      id: `DSP-${String(mockDisputes.length + 1).padStart(3, '0')}`,
      payoutId: data.payoutId,
      type: data.type,
      message: data.message,
      attachments: [],
      status: 'open',
      resolution: null,
      resolvedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockDisputes.push(newDispute);
    return newDispute;
  }

  // For real API, use FormData to support file uploads
  const formData = new FormData();
  formData.append('payoutId', data.payoutId);
  formData.append('type', data.type);
  formData.append('message', data.message);
  if (data.attachments) {
    data.attachments.forEach(file => formData.append('attachments', file));
  }
  return apiClient.post<Dispute>('/finance/disputes', formData);
}

export async function getDispute(id: string): Promise<Dispute | null> {
  if (config.features.useMockData) {
    await delay(200);
    return mockDisputes.find(d => d.id === id) || null;
  }
  return apiClient.get<Dispute>(`/finance/disputes/${encodeURIComponent(id)}`);
}

// ─── Notifications ───────────────────────────────────────────────────────────

export async function getFinanceNotifications(): Promise<FinanceNotification[]> {
  if (config.features.useMockData) {
    await delay(200);
    return [...mockFinanceNotifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  return apiClient.get<FinanceNotification[]>('/finance/notifications');
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  if (config.features.useMockData) {
    await delay(100);
    const notification = mockFinanceNotifications.find(n => n.id === notificationId);
    if (notification) notification.read = true;
    return;
  }
  return apiClient.put(`/finance/notifications/${encodeURIComponent(notificationId)}/read`);
}
