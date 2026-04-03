// ─────────────────────────────────────────────────────────────
// Dashboard Service
// ─────────────────────────────────────────────────────────────
// handles the math for the dashboard widgets: summary numbers, 
// category pie charts, recent logs, and the 6-month trend chart.
// ─────────────────────────────────────────────────────────────

// grabbing PrismaClient dynamically so the IDE doesn't freak out about types
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/** what we get back from our custom SQL trend query */
interface MonthlyTrendRow {
  month: string;
  type: string;
  total: number | string;
}

/**
 * calculates the top-level stats: total in, total out, and what's left.
 */
export const getSummary = async () => {
  // run both queries at the same time to save a few milliseconds
  const [incomeResult, expenseResult]: [any, any] = await Promise.all([
    prisma.financialRecord.aggregate({
      where: { type: "INCOME", isDeleted: false },
      _sum: { amount: true },
    }),
    prisma.financialRecord.aggregate({
      where: { type: "EXPENSE", isDeleted: false },
      _sum: { amount: true },
    }),
  ]);

  // safe fallbacks in case there's no data yet
  const totalIncome = incomeResult._sum.amount ? Number(incomeResult._sum.amount) : 0;
  const totalExpenses = expenseResult._sum.amount ? Number(expenseResult._sum.amount) : 0;
  
  // simple math for net balance
  const netBalance = totalIncome - totalExpenses;

  return { totalIncome, totalExpenses, netBalance };
};

/**
 * adds up spending and income by category, perfect for a pie chart.
 */
export const getCategoryBreakdown = async () => {
  const breakdown: any[] = await prisma.financialRecord.groupBy({
    by: ["category", "type"],
    where: { isDeleted: false },
    _sum: { amount: true },
    orderBy: { category: "asc" },
  });

  // clean up Prisma's output into a nicer format for the frontend
  return breakdown.map((item: { category: string; type: string; _sum: { amount: unknown } }) => ({
    category: item.category,
    type: item.type,
    total: item._sum.amount ? Number(item._sum.amount) : 0,
  }));
};

/**
 * fetches the 10 most recent non-deleted records.
 */
export const getRecentRecords = async () => {
  return prisma.financialRecord.findMany({
    where: { isDeleted: false },
    orderBy: { date: "desc" },
    take: 10,
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });
};

/**
 * gets monthly totals for the last half-year.
 * 
 * writing raw SQL here because Prisma's built-in grouping 
 * can't handle truncating dates to just the month part easily.
 */
export const getMonthlyTrends = async () => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const trends: MonthlyTrendRow[] = await prisma.$queryRawUnsafe(
    `SELECT
      TO_CHAR(DATE_TRUNC('month', date), 'YYYY-MM') AS month,
      type,
      COALESCE(SUM(amount), 0) AS total
    FROM financial_records
    WHERE is_deleted = false
      AND date >= $1
    GROUP BY month, type
    ORDER BY month ASC, type ASC`,
    sixMonthsAgo
  );

  // we want to send back an array of { month, income, expense } 
  // so the frontend chart library doesn't have to work so hard
  const monthMap = new Map<string, { month: string; income: number; expense: number }>();

  for (const row of trends) {
    const key = row.month;
    if (!monthMap.has(key)) {
      monthMap.set(key, { month: key, income: 0, expense: 0 });
    }
    const entry = monthMap.get(key)!;
    if (row.type === "INCOME") entry.income = Number(row.total);
    if (row.type === "EXPENSE") entry.expense = Number(row.total);
  }

  return Array.from(monthMap.values());
};
