import React, { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import * as authService from '../services/authService'
import * as groupService from '../services/groupService'
import * as reportService from '../services/reportService'
import * as expenseService from '../services/expenseService'
import MonthlySummary from '../components/reports/MonthlySummary'
import CategoryBreakdown from '../components/reports/CategoryBreakdown'
import SpendingChart from '../components/reports/SpendingChart'
import { formatCurrency } from '../utils/currency'
import Loader from '../components/common/Loader'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function Reports() {
  const auth = useContext(AuthContext)

  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth())
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())
  const [selectedGroup, setSelectedGroup] = useState('')

  const [groups, setGroups] = useState([])
  const [monthlyReport, setMonthlyReport] = useState(null)
  const [spendingTrend, setSpendingTrend] = useState([])
  const [monthlyExpenses, setMonthlyExpenses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadData() {
      setLoading(true)
      try {
        const currentUser = auth?.user || (await authService.getCurrentUser())
        const userId = currentUser?.id

        if (userId) {
          const userGroups = await groupService.getUserGroups(userId)
          if (mounted) setGroups(userGroups || [])

          const report = await reportService.getMonthlyReport(
            userId,
            selectedYear,
            selectedMonth,
            selectedGroup || undefined
          )
          if (mounted) setMonthlyReport(report)

          const trend = await reportService.getSpendingTrend(userId)
          if (mounted) setSpendingTrend(trend || [])

          // Load expenses for the selected group or across all groups for the month
          if (selectedGroup) {
            const expenses = await expenseService.getExpensesByMonth(
              selectedGroup,
              selectedYear,
              selectedMonth
            )
            if (mounted) setMonthlyExpenses(expenses || [])
          } else if (userGroups && userGroups.length > 0) {
            const seenIds = new Set()
            const allExp = []
            for (const grp of userGroups) {
              const grpExpenses = await expenseService.getExpensesByMonth(
                grp.id,
                selectedYear,
                selectedMonth
              )
              if (Array.isArray(grpExpenses)) {
                for (const exp of grpExpenses) {
                  if (exp?.id && !seenIds.has(exp.id)) {
                    seenIds.add(exp.id)
                    allExp.push(exp)
                  }
                }
              }
            }
            allExp.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
            if (mounted) setMonthlyExpenses(allExp)
          } else {
            if (mounted) setMonthlyExpenses([])
          }
        }
      } catch (err) {
        console.error('Failed to load reports data:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadData()

    return () => {
      mounted = false
    }
  }, [auth?.user, selectedYear, selectedMonth, selectedGroup])

  const categoryData = monthlyReport?.categoryBreakdown
    ? Object.entries(monthlyReport.categoryBreakdown).map(([category, amount]) => {
        const total = monthlyReport.totalSpending || 1
        const percentage = Math.round((amount / total) * 100)
        return { category, amount, percentage }
      })
    : []

  if (loading && !monthlyReport) {
    return <Loader fullPage text="Loading Financial Reports..." />
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Financial Reports</h2>
          <p className="page-description">
            Track and analyze your monthly expenditure trends, top categories, and group spending.
          </p>
        </div>
      </div>

      {/* Controls Row */}
      <div
        className="card"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--space-md, 16px)',
          marginBottom: 'var(--space-lg, 24px)',
          padding: 'var(--space-md, 16px)',
        }}
      >
        <div className="input-group" style={{ margin: 0 }}>
          <label htmlFor="select-month" className="input-label">
            Select Month
          </label>
          <select
            id="select-month"
            className="input"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {MONTH_NAMES.map((name, idx) => (
              <option key={idx} value={idx}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="input-group" style={{ margin: 0 }}>
          <label htmlFor="select-year" className="input-label">
            Select Year
          </label>
          <select
            id="select-year"
            className="input"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {[2024, 2025, 2026, 2027].map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>

        <div className="input-group" style={{ margin: 0 }}>
          <label htmlFor="select-group" className="input-label">
            Select Group
          </label>
          <select
            id="select-group"
            className="input"
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
          >
            <option value="">All Groups</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <MonthlySummary
        totalSpending={monthlyReport?.totalSpending || 0}
        expenseCount={monthlyReport?.expenseCount || 0}
        highestCategory={monthlyReport?.highestCategory || 'None'}
        avgPerExpense={monthlyReport?.avgPerExpense || 0}
      />

      {/* Charts Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-lg, 24px)',
          marginTop: 'var(--space-lg, 24px)',
        }}
      >
        <SpendingChart data={spendingTrend} />
        <CategoryBreakdown data={categoryData} />
      </div>

      {/* Expenses This Month */}
      <div className="card" style={{ marginTop: 'var(--space-xl, 32px)' }}>
        <div className="card-header">
          <h3 className="card-title">Expenses This Month</h3>
          <span className="badge badge-info">{monthlyExpenses.length} records</span>
        </div>

        {monthlyExpenses.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', padding: 'var(--space-md) 0', margin: 0 }}>
            No expenses found for this month.
          </p>
        ) : (
          <div style={{ marginTop: 'var(--space-md, 16px)' }}>
            {monthlyExpenses.map((exp) => (
              <div key={exp.id} className="expense-row">
                <div className="expense-left">
                  <div className="expense-icon">🧾</div>
                  <div className="expense-info">
                    <span className="expense-title">{exp.description}</span>
                    <span className="expense-meta">
                      {exp.category} • {new Date(exp.date || exp.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="expense-right">
                  <span className="expense-amount">{formatCurrency(exp.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
