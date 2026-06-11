import type { Contact, Lead } from '../types/pipelineTypes'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value)
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function getContactName(contact?: Contact | null) {
  if (!contact) {
    return 'Unassigned Contact'
  }

  return [contact.firstName, contact.lastName].filter(Boolean).join(' ')
}

function getLeadCompanyName(lead: Lead) {
  return (
    lead.company?.name ??
    lead.contact?.company?.name ??
    lead.owner?.name ??
    lead.owner?.email ??
    'No company'
  )
}

function getInitials(name: string) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return initials || 'L'
}

export {
  formatCurrency,
  formatLabel,
  getContactName,
  getInitials,
  getLeadCompanyName,
}
