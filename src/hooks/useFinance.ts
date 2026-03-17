// Finance hooks - manage finance state and service calls
import { useState, useEffect, useCallback } from 'react';
import type {
  FinanceOverview,
  EarningsSummary,
  Transaction,
  TransactionFilters,
  Payout,
  PayoutFilters,
  BankAccount,
  AddBankAccountRequest,
  Bank,
  Dispute,
  CreateDisputeRequest,
  FinanceNotification,
  PaginatedResponse,
} from '../types/finance';
import * as financeService from '../services/finance.service';

// ─── useFinanceOverview ──────────────────────────────────────────────────────

export function useFinanceOverview() {
  const [overview, setOverview] = useState<FinanceOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await financeService.getFinanceOverview();
      setOverview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load finance overview');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  return { overview, isLoading, error, refetch: fetchOverview };
}

// ─── useEarnings ─────────────────────────────────────────────────────────────

export function useEarnings(params?: { eventId?: string; dateFrom?: string; dateTo?: string }) {
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEarnings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await financeService.getEarningsSummary(params);
      setEarnings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load earnings');
    } finally {
      setIsLoading(false);
    }
  }, [params?.eventId, params?.dateFrom, params?.dateTo]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  return { earnings, isLoading, error, refetch: fetchEarnings };
}

// ─── useTransactions ─────────────────────────────────────────────────────────

export function useTransactions(initialFilters?: TransactionFilters) {
  const [result, setResult] = useState<PaginatedResponse<Transaction>>({
    data: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<TransactionFilters>(initialFilters || {});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async (f?: TransactionFilters) => {
    const activeFilters = f || filters;
    setIsLoading(true);
    setError(null);
    try {
      const data = await financeService.getTransactions(activeFilters);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const updateFilters = useCallback((newFilters: Partial<TransactionFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: newFilters.page ?? 1 }));
  }, []);

  const goToPage = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  return {
    transactions: result.data,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
    filters,
    isLoading,
    error,
    updateFilters,
    goToPage,
    refetch: fetchTransactions,
  };
}

// ─── usePayouts ──────────────────────────────────────────────────────────────

export function usePayouts(initialFilters?: PayoutFilters) {
  const [result, setResult] = useState<PaginatedResponse<Payout>>({
    data: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<PayoutFilters>(initialFilters || {});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayouts = useCallback(async (f?: PayoutFilters) => {
    const activeFilters = f || filters;
    setIsLoading(true);
    setError(null);
    try {
      const data = await financeService.getPayouts(activeFilters);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payouts');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const updateFilters = useCallback((newFilters: Partial<PayoutFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: newFilters.page ?? 1 }));
  }, []);

  return {
    payouts: result.data,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
    filters,
    isLoading,
    error,
    updateFilters,
    refetch: fetchPayouts,
  };
}

// ─── useBankAccounts ─────────────────────────────────────────────────────────

export function useBankAccounts() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [accountsData, banksData] = await Promise.all([
        financeService.getBankAccounts(),
        financeService.getBanks(),
      ]);
      setAccounts(accountsData);
      setBanks(banksData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bank accounts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const addAccount = useCallback(async (data: AddBankAccountRequest) => {
    const newAccount = await financeService.addBankAccount(data);
    setAccounts(prev => [...prev, newAccount]);
    return newAccount;
  }, []);

  const setDefault = useCallback(async (accountId: string) => {
    const updated = await financeService.setDefaultAccount(accountId);
    setAccounts(prev =>
      prev.map(a => ({ ...a, isDefault: a.id === accountId }))
    );
    return updated;
  }, []);

  const removeAccount = useCallback(async (accountId: string) => {
    await financeService.deleteBankAccount(accountId);
    setAccounts(prev => prev.filter(a => a.id !== accountId));
  }, []);

  const verifyAccount = useCallback(
    async (accountNumber: string, bankCode: string) => {
      return financeService.verifyBankAccount(accountNumber, bankCode);
    },
    []
  );

  return {
    accounts,
    banks,
    isLoading,
    error,
    addAccount,
    setDefault,
    removeAccount,
    verifyAccount,
    refetch: fetchAccounts,
  };
}

// ─── useDisputes ─────────────────────────────────────────────────────────────

export function useDisputes() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDisputes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await financeService.getDisputes();
      setDisputes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load disputes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const submitDispute = useCallback(async (data: CreateDisputeRequest) => {
    const newDispute = await financeService.createDispute(data);
    setDisputes(prev => [newDispute, ...prev]);
    return newDispute;
  }, []);

  return { disputes, isLoading, error, submitDispute, refetch: fetchDisputes };
}

// ─── useFinanceNotifications ─────────────────────────────────────────────────

export function useFinanceNotifications() {
  const [notifications, setNotifications] = useState<FinanceNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await financeService.getFinanceNotifications();
      setNotifications(data);
    } catch {
      // Notifications are non-critical, fail silently
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markRead = useCallback(async (id: string) => {
    await financeService.markNotificationRead(id);
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, isLoading, markRead, refetch: fetchNotifications };
}
