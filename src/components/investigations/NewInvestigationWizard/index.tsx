import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Shield, ChevronRight, Check } from 'lucide-react'
import { useClients } from '@/hooks/useClients'
import { useClientStore } from '@/store/clientStore'
import { useAlertTemplates } from '@/hooks/useAlertTemplates'
import type { AlertCategory, AlertRule, Severity } from '@/types'
import { cn, categoryLabel, severityClass } from '@/lib/utils'

// Sub-components
import Step1ClientInfo from './Step1ClientInfo'
import Step2TemplateSelect from './Step2TemplateSelect'
import Step3FieldsDraft from './Step3FieldsDraft'
import ClientModal from '@/components/clients/ClientModal'

export default function NewInvestigationWizard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const urlClientId = searchParams.get('client')

  const { data: clients, isLoading: clientsLoading } = useClients()
  const { data: templates, isLoading: templatesLoading } = useAlertTemplates()
  const { activeClient, setActiveClient } = useClientStore()

  // Wizard State
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Step 1 State
  const [clientId, setClientId] = useState<string>(urlClientId || '')
  const [caseNumber, setCaseNumber] = useState('')
  const [alertName, setAlertName] = useState('')
  const [severity, setSeverity] = useState<Severity>('medium')
  
  const pad = (n: number) => String(n).padStart(2, '0')
  const d = new Date()
  const nowLocal = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  const [triggeredAt, setTriggeredAt] = useState(nowLocal)

  // Step 2 State
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null)

  useEffect(() => {
    if (clientId && clients) {
      const c = clients.find(x => x.id === clientId)
      if (c) setActiveClient(c)
    } else if (!clientId) {
      setActiveClient(null)
    }
  }, [clientId, clients, setActiveClient])

  // Validation
  const canGoToStep2 = clientId && caseNumber.trim() && alertName.trim()

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24">
      {/* Progress Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-foreground">New Investigation</h1>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <span className={cn('px-2.5 py-1 rounded-full', step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-surface border border-surface-border')}>1</span>
          <span className={step >= 1 ? 'text-foreground' : ''}>Details</span>
          <div className="w-8 h-px bg-surface-border mx-1" />
          <span className={cn('px-2.5 py-1 rounded-full', step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-surface border border-surface-border')}>2</span>
          <span className={step >= 2 ? 'text-foreground' : ''}>Template</span>
          <div className="w-8 h-px bg-surface-border mx-1" />
          <span className={cn('px-2.5 py-1 rounded-full', step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-surface border border-surface-border')}>3</span>
          <span className={step >= 3 ? 'text-foreground' : ''}>Draft</span>
        </div>
      </div>

      {clientsLoading || templatesLoading ? (
        <div className="h-64 skeleton rounded-xl" />
      ) : (
        <>
          {step === 1 && (
            <Step1ClientInfo
              clients={clients || []}
              clientId={clientId}
              setClientId={setClientId}
              caseNumber={caseNumber}
              setCaseNumber={setCaseNumber}
              alertName={alertName}
              setAlertName={setAlertName}
              severity={severity}
              setSeverity={setSeverity}
              triggeredAt={triggeredAt}
              setTriggeredAt={setTriggeredAt}
              onNext={() => setStep(2)}
              canNext={Boolean(canGoToStep2)}
              onAddClient={() => setIsModalOpen(true)}
            />
          )}

          {step === 2 && (
            <Step2TemplateSelect
              templates={templates || []}
              selectedRuleId={selectedRuleId}
              setSelectedRuleId={setSelectedRuleId}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}

          {step === 3 && activeClient && (
            <Step3FieldsDraft
              client={activeClient}
              caseNumber={caseNumber}
              alertName={alertName}
              severity={severity}
              triggeredAt={new Date(triggeredAt).toISOString()}
              ruleId={selectedRuleId}
              templates={templates || []}
              onBack={() => setStep(2)}
            />
          )}
        </>
      )}

      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}
