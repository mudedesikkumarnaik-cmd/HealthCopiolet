import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Users } from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'
import { Badge } from '@/components/common/Badge'
import { Card } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeading } from '@/components/common/PageHeading'
import { SearchInput } from '@/components/common/PageHeading'
import { usePracticePatients } from '@/hooks/usePracticePatients'
import { ageFromISO, formatDate } from '@/utils/formatters'

export function DoctorPatientsPage() {
  const patients = usePracticePatients()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return patients
    return patients.filter((patient) =>
      [patient.fullName, patient.conditions.join(' '), patient.bloodType, patient.primaryPhysician]
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [patients, query])

  return (
    <PageContainer>
      <PageHeading
        title="Patients"
        eyebrow="Doctor portal"
        description="Everyone in your practice, with their current conditions and latest visit."
      />

      {patients.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={<Users aria-hidden="true" className="size-6" />}
          title="No patients yet"
          description="Patients added to this practice will appear here with their records, medicines and visit history."
        />
      ) : (
        <>
          <div className="mt-5 max-w-sm">
            <SearchInput
              id="doctor-patient-search"
              label="Search patients"
              placeholder="Search by name, condition or blood type…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.length === 0 ? (
              <p className="col-span-full py-10 text-center text-sm text-muted">
                No patients match “{query}”.
              </p>
            ) : (
              filtered.map((patient) => (
                <Link key={patient.id} to={`/doctor/patients/${patient.id}`} className="group">
                  <Card className="h-full p-4 transition-colors group-hover:border-line-strong">
                    <div className="flex items-start gap-3">
                      <Avatar name={patient.fullName} color={patient.avatarColor} size="lg" />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 font-semibold text-ink">
                          <span className="truncate">{patient.fullName}</span>
                          <ChevronRight
                            aria-hidden="true"
                            className="size-4 shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100"
                          />
                        </p>
                        <p className="text-xs text-muted">
                          {ageFromISO(patient.dateOfBirth)} yrs · Blood {patient.bloodType}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {patient.conditions.slice(0, 2).map((condition) => (
                            <Badge key={condition} tone="neutral">
                              {condition}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 border-t border-line pt-3 text-xs text-muted">
                      Last visit {formatDate(patient.lastVisit, { month: 'short', day: 'numeric', year: 'numeric' })}{' '}
                      · {patient.appointments.length} appointments on file
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </>
      )}
    </PageContainer>
  )
}