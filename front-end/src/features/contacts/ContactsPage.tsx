import { useState } from 'react'
import { UsersRound } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EntityPageHeader } from '@/shared/components/EntityPageHeader'
import { EntityTableToolbar } from '@/shared/components/EntityTableToolbar'
import { InitialAvatar } from '@/shared/components/InitialAvatar'

import { ContactRowActions } from './components/ContactRowActions'
import { CreateContactDialog } from './components/CreateContactDialog'
import { useContacts } from './hooks/useContacts'

function ContactsPage() {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const contactsQuery = useContacts({ page, limit: perPage, search })
  const contacts = contactsQuery.data?.items ?? []
  const meta = contactsQuery.data?.meta
  const total = meta?.total ?? 0
  const totalPages = meta?.totalPages ?? 0

  function handlePerPageChange(nextPerPage: number) {
    setPerPage(nextPerPage)
    setPage(1)
  }

  function handleSearchSubmit() {
    setSearch(searchInput.trim())
    setPage(1)
  }

  const errorMessage =
    contactsQuery.error instanceof Error
      ? contactsQuery.error.message
      : 'Unable to load contacts.'

  return (
    <section className="min-h-[calc(100svh-66px)] bg-[#f4f7fb] p-4 md:p-6">
      <EntityPageHeader
        breadcrumbs={['Dashboard', 'Contacts', 'Persons']}
        title="Persons"
        actions={
          <>
            <Button
              type="button"
              variant="ghost"
              className="h-9 px-3 font-bold text-[#42526b]"
            >
              Export
            </Button>
            <CreateContactDialog />
          </>
        }
      />

      <div className="mt-4 overflow-hidden rounded-lg border border-[#d8e0ea] bg-white shadow-sm">
        <EntityTableToolbar
          searchValue={searchInput}
          page={page}
          perPage={perPage}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
          onPerPageChange={handlePerPageChange}
          onSearchChange={setSearchInput}
          onSearchSubmit={handleSearchSubmit}
        />

        {contactsQuery.isLoading ? (
          <div className="grid h-48 place-items-center text-sm font-semibold text-[#42526b]">
            Loading contacts
          </div>
        ) : contactsQuery.isError ? (
          <div className="grid h-48 place-items-center px-4 text-center">
            <div>
              <p className="text-sm font-semibold text-rose-700">
                {errorMessage}
              </p>
              <Button
                type="button"
                onClick={() => void contactsQuery.refetch()}
                className="mt-4 bg-sky-600 text-white hover:bg-sky-700"
              >
                Retry
              </Button>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-white hover:bg-white">
                <TableHead className="w-12 px-4">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-[#8a98aa]"
                    aria-label="Select all contacts"
                  />
                </TableHead>
                <TableHead className="w-20 text-[#42526b]">ID</TableHead>
                <TableHead className="min-w-[260px] text-[#42526b]">
                  Name
                </TableHead>
                <TableHead className="min-w-[260px] text-[#42526b]">
                  Emails
                </TableHead>
                <TableHead className="min-w-[220px] text-[#42526b]">
                  Contact Numbers
                </TableHead>
                <TableHead className="min-w-[260px] text-[#42526b]">
                  Organization Name
                </TableHead>
                <TableHead className="w-32 text-right text-[#42526b]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.length > 0 ? (
                contacts.map((contact, index) => {
                  const contactName = `${contact.firstName} ${contact.lastName}`

                  return (
                    <TableRow key={contact.id} className="h-[58px] bg-white">
                      <TableCell className="px-4">
                        <input
                          type="checkbox"
                          className="size-4 rounded border-[#8a98aa]"
                          aria-label={`Select ${contactName}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-[#172033]">
                        {(page - 1) * perPage + index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <InitialAvatar label={contactName} />
                          <span className="font-medium text-[#172033]">
                            {contactName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[#172033]">
                        {contact.email ?? '-'}
                      </TableCell>
                      <TableCell className="text-[#172033]">
                        {contact.phone ?? '-'}
                      </TableCell>
                      <TableCell className="text-[#172033]">
                        {contact.company?.name ?? '-'}
                      </TableCell>
                      <TableCell>
                        <ContactRowActions contact={contact} />
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center">
                    <div className="grid place-items-center gap-2 text-[#8a98aa]">
                      <UsersRound className="size-8" aria-hidden="true" />
                      <span className="font-semibold">No contacts found</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </section>
  )
}

export { ContactsPage }
