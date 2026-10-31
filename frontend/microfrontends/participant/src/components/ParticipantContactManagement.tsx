import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Folder, Loader2, MessageSquare, Plus, Star } from 'lucide-react';
import { DataGrid, type ColDef, type ICellRendererParams } from '../../../../shared/design-system/components/DataGrid';
import { toast } from '../../../../shared/toaster';
import { getApiErrorMessage } from '../../../../shared/api-client';
import {
  participantApi,
  ParticipantAddressDetail,
  ParticipantContactDetail,
} from '../../../../shared/api/participantApi';
import { ParticipantContactModal } from './ParticipantContactModal';

export interface ParticipantContactManagementProps {
  participantId: string;
  participantName: string;
  tenantId?: string;
  siteId?: string;
  onUpdated?: () => void;
}

interface ContactPersonRow {
  id: string;
  contactName: string;
  relationship: string;
  preferredMethod: string;
  preferred: boolean;
  archived: boolean;
  notes: string;
  methods: ParticipantContactDetail[];
}

export const groupContactMethods = (contacts: ParticipantContactDetail[]): ContactPersonRow[] => {
  const grouped = new Map<string, ParticipantContactDetail[]>();

  contacts.forEach((contact) => {
    // The current REST contract stores one method per row; common person fields identify legacy contact groups.
    const contactName = contact.contactName?.trim().toLocaleLowerCase() ?? '';
    const relationship = contact.relationship?.trim().toLocaleLowerCase() ?? '';
    const isSelfContact = relationship === 'self' || relationship === 'participant';
    const groupKey = contactName
      ? JSON.stringify([
        contactName,
        relationship,
        contact.notes ?? '',
        contact.canLeaveMessage,
        isSelfContact ? undefined : contact.primaryContact,
      ])
      : contact.id;
    grouped.set(groupKey, [...(grouped.get(groupKey) ?? []), contact]);
  });

  return Array.from(grouped.values()).map((methods) => {
    const activeMethods = methods.filter((method) => method.active);
    const preferredMethod = activeMethods.find((method) => method.isPreferred) ?? activeMethods[0];
    const representative = methods[0];
    return {
      id: representative.id,
      contactName: representative.contactName ?? '',
      relationship: representative.relationship ?? '',
      preferredMethod: preferredMethod?.contactValue ?? '',
      preferred: methods.some((method) => method.primaryContact),
      archived: activeMethods.length === 0,
      notes: representative.notes ?? '',
      methods,
    };
  });
};

export const getContactRelationshipLabel = (
  contactName: string,
  relationship: string,
  participantName: string,
): string => {
  const normalizedRelationship = relationship.trim().toLocaleLowerCase();
  if (normalizedRelationship === 'self' || normalizedRelationship === 'participant') return 'Participant';
  if (relationship.trim()) return relationship;
  return contactName.trim().toLocaleLowerCase() === participantName.trim().toLocaleLowerCase()
    ? 'Participant'
    : '';
};

export const ParticipantContactManagement: React.FC<ParticipantContactManagementProps> = ({
  participantId,
  participantName,
  tenantId,
  siteId,
  onUpdated,
}) => {
  const [contacts, setContacts] = useState<ParticipantContactDetail[]>([]);
  const [addresses, setAddresses] = useState<ParticipantAddressDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [editingMethods, setEditingMethods] = useState<ParticipantContactDetail[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const fetchContactDetails = useCallback(async () => {
    if (!participantId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [contactRecords, addressRecords] = await Promise.all([
        participantApi.getContacts(participantId, { tenantId, siteId }),
        participantApi.getAddresses(participantId, { tenantId, siteId }),
      ]);
      setContacts(contactRecords);
      setAddresses(addressRecords);
    } catch (requestError: unknown) {
      const message = getApiErrorMessage(requestError, 'Failed to load contact information');
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [participantId, tenantId, siteId]);

  useEffect(() => {
    void fetchContactDetails();
  }, [fetchContactDetails]);

  const allContactRows = useMemo(() => groupContactMethods(contacts), [contacts]);
  const sortedContactRows = useMemo(() => [...allContactRows].sort((a, b) => {
    if (a.archived !== b.archived) return Number(a.archived) - Number(b.archived);
    const aIsParticipant = getContactRelationshipLabel(a.contactName, a.relationship, participantName) === 'Participant';
    const bIsParticipant = getContactRelationshipLabel(b.contactName, b.relationship, participantName) === 'Participant';
    const aPriority = a.preferred ? 0 : (aIsParticipant ? 1 : 2);
    const bPriority = b.preferred ? 0 : (bIsParticipant ? 1 : 2);
    if (aPriority !== bPriority) return aPriority - bPriority;
    return a.contactName.localeCompare(b.contactName, undefined, { sensitivity: 'base' });
  }), [allContactRows]);
  const displayedContactRows = useMemo(
    () => showArchived ? sortedContactRows : sortedContactRows.filter((row) => !row.archived),
    [showArchived, sortedContactRows],
  );
  const hasArchivedContacts = allContactRows.some((row) => row.archived);

  const openNewContact = () => {
    setEditingMethods([]);
    setIsContactModalOpen(true);
  };

  const openEditContact = (row: ContactPersonRow) => {
    setEditingMethods(row.methods);
    setIsContactModalOpen(true);
  };

  const closeContactModal = () => {
    setIsContactModalOpen(false);
    setEditingMethods([]);
  };

  const columnDefs = useMemo<ColDef<ContactPersonRow>[]>(() => [
    {
      field: 'contactName',
      headerName: 'Name',
      flex: 1,
      minWidth: 140,
      cellRenderer: (params: ICellRendererParams<ContactPersonRow>) => (
        <button
          type="button"
          className="participant-contact-list__name"
          onClick={() => params.data && openEditContact(params.data)}
          aria-label={`Edit contact ${params.data?.contactName ?? ''}`}
        >
          {params.value || participantName}
        </button>
      ),
    },
    {
      field: 'relationship',
      headerName: 'Relationship',
      flex: 1,
      minWidth: 145,
      valueGetter: (params) => params.data
        ? getContactRelationshipLabel(params.data.contactName, params.data.relationship, participantName)
        : '',
    },
    {
      field: 'preferredMethod',
      headerName: 'Preferred Contact Method',
      flex: 1.5,
      minWidth: 200,
      cellRenderer: (params: ICellRendererParams<ContactPersonRow>) => (
        <div className="participant-contact-list__method">
          <span title={params.value ?? ''}>{params.value ?? ''}</span>
          {params.data?.notes && (
            <span
              className="custom-tooltip-btn participant-contact-list__note"
              data-tooltip={params.data.notes}
              aria-label="Contact notes"
              role="img"
              tabIndex={0}
              onClick={(event) => event.stopPropagation()}
            >
              <MessageSquare size={15} aria-hidden="true" />
            </span>
          )}
          {params.data?.preferred && (
            <span
              className="custom-tooltip-btn participant-contact-list__status"
              data-tooltip="Preferred Contact"
              aria-label="Preferred contact"
              role="img"
              tabIndex={0}
              onClick={(event) => event.stopPropagation()}
            >
              <Star size={15} fill="currentColor" aria-hidden="true" />
            </span>
          )}
          {params.data?.archived && (
            <span
              className="custom-tooltip-btn participant-contact-list__status"
              data-tooltip="Archived Contact"
              aria-label="Archived contact"
              role="img"
              tabIndex={0}
              onClick={(event) => event.stopPropagation()}
            >
              <Folder size={15} aria-hidden="true" />
            </span>
          )}
        </div>
      ),
    },
  ], [participantName]);

  return (
    <div className="space-y-6">
      <section className="card record-detail__panel participant-contact-list">
        <div className="card-header flex items-center justify-between">
          <h3>Contacts</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openNewContact}
              className="btn btn-sm btn-primary participant-contact-list__add custom-tooltip-btn"
              data-tooltip="Add Contact"
              aria-label="Add Contact"
              id="add-contact-person-btn"
            >
              <Plus size={18} />
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded((expanded) => !expanded)}
              className="btn btn-ghost btn-sm custom-tooltip-btn"
              data-tooltip={isExpanded ? 'Collapse Contacts' : 'Expand Contacts'}
              aria-label={isExpanded ? 'Collapse Contacts' : 'Expand Contacts'}
              aria-expanded={isExpanded}
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
        {isExpanded && <div className="record-detail__panel-content">
          {isLoading && contacts.length === 0 ? (
            <div className="p-6 text-center text-gray-500 flex items-center justify-center gap-2">
              <Loader2 size={18} className="animate-spin text-blue-600" />
              <span className="text-sm">Loading contacts...</span>
            </div>
          ) : error && contacts.length === 0 ? (
            <div className="p-4 text-sm text-red-600" role="alert">
              {error}
              <button type="button" className="ml-2 underline" onClick={() => void fetchContactDetails()}>
                Retry
              </button>
            </div>
          ) : displayedContactRows.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">
              {allContactRows.length > 0
                ? 'All contacts are archived. Use Show Archived Contacts to view them.'
                : 'No contacts recorded yet. Select + to add a contact.'}
            </div>
          ) : (
            <DataGrid<ContactPersonRow>
              rowData={displayedContactRows}
              columnDefs={columnDefs}
              getRowId={(params) => params.data.id}
              onRowClicked={(event) => {
                if (event.data) openEditContact(event.data);
              }}
              rowHeight={50}
              headerHeight={48}
              domLayout="autoHeight"
              pagination
              paginationPageSize={10}
              paginationPageSizeSelector={[5, 10, 20, 50]}
              animateRows
              suppressCellFocus
              suppressMovableColumns
              wrapperClassName="participant-contact-list__grid"
            />
          )}
          {hasArchivedContacts && (
            <div className="mt-3 text-right">
              <button
                type="button"
                onClick={() => setShowArchived((show) => !show)}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 underline"
              >
                {showArchived ? 'Hide Archived Contacts' : 'Show Archived Contacts'}
              </button>
            </div>
          )}
        </div>}
      </section>

      <ParticipantContactModal
        isOpen={isContactModalOpen}
        onClose={closeContactModal}
        participantId={participantId}
        participantName={participantName}
        contactToEdit={editingMethods[0] ?? null}
        contactMethods={editingMethods}
        addresses={addresses}
        tenantId={tenantId}
        siteId={siteId}
        onSaved={() => {
          void fetchContactDetails();
          onUpdated?.();
        }}
      />
    </div>
  );
};

export default ParticipantContactManagement;
