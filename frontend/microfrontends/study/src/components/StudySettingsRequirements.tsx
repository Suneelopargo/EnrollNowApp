// frontend/microfrontends/study/src/components/StudySettingsRequirements.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  studyApi,
  StudyRequirementsData,
  StudyMilestone,
  DemographicGroup,
  StudyCustomVariable,
  StudyVariableGroup,
  StudyLayoutItem,
  ContactTaxonomy,
  VariableOption,
} from '../../../../shared/api/studyApi';
import {
  Users,
  Calendar,
  Layers,
  Tag,
  PhoneCall,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  X,
  Search,
  Globe,
  EyeOff,
  Edit2,
  FolderPlus,
  Save,
  Check,
  ChevronDown,
  ChevronRight,
  Lock,
  Unlock,
  RotateCcw,
} from 'lucide-react';

export interface StudySettingsRequirementsProps {
  studyId: string;
  studyName?: string;
  isArchived?: boolean;
  canManageSettings?: boolean;
  onStudyUpdated?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

export const StudySettingsRequirements: React.FC<StudySettingsRequirementsProps> = ({
  studyId,
  studyName,
  isArchived = false,
  canManageSettings = true,
  onStudyUpdated,
  onDirtyChange,
}) => {
  // Loading & Action states
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Requirements Data State
  const [sampleSize, setSampleSize] = useState<number | ''>('');
  const [milestones, setMilestones] = useState<StudyMilestone[]>([]);
  const [studyGroups, setStudyGroups] = useState<DemographicGroup[]>([]);
  const [customVariables, setCustomVariables] = useState<StudyCustomVariable[]>([]);
  const [variableGroups, setVariableGroups] = useState<StudyVariableGroup[]>([]);
  const [layout, setLayout] = useState<StudyLayoutItem[]>([]);
  const [contactRelationships, setContactRelationships] = useState<ContactTaxonomy[]>([]);
  const [contactOutcomes, setContactOutcomes] = useState<ContactTaxonomy[]>([]);
  const [globalVariables, setGlobalVariables] = useState<StudyCustomVariable[]>([]);

  // Lock State for Global Custom Variables (Global variables are locked by default in UI)
  const [unlockedVariableIds, setUnlockedVariableIds] = useState<Set<string>>(new Set());

  // Search filter for custom variables
  const [variableSearch, setVariableSearch] = useState<string>('');

  // Accordion collapsed state for 8 sections
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    sample: false,
    age: false,
    gender: false,
    ethnicity: false,
    race: false,
    customVars: false,
    relationships: false,
    outcomes: false,
  });

  const toggleSection = (sectionKey: string) => {
    setCollapsedSections((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  const expandAllSections = () => {
    setCollapsedSections({
      sample: false,
      age: false,
      gender: false,
      ethnicity: false,
      race: false,
      customVars: false,
      relationships: false,
      outcomes: false,
    });
  };

  const collapseAllSections = () => {
    setCollapsedSections({
      sample: true,
      age: true,
      gender: true,
      ethnicity: true,
      race: true,
      customVars: true,
      relationships: true,
      outcomes: true,
    });
  };

  // Modals & Inline forms
  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState<boolean>(false);
  const [newMilestoneDate, setNewMilestoneDate] = useState<string>('');
  const [newMilestoneTarget, setNewMilestoneTarget] = useState<string>('');
  const [newMilestoneDesc, setNewMilestoneDesc] = useState<string>('');

  const [showAddAgeGroupModal, setShowAddAgeGroupModal] = useState<boolean>(false);
  const [newAgeGroupName, setNewAgeGroupName] = useState<string>('');
  const [newAgeGroupSample, setNewAgeGroupSample] = useState<string>('');
  const [newAgeMin, setNewAgeMin] = useState<string>('');
  const [newAgeMax, setNewAgeMax] = useState<string>('');

  const [showAddGenderModal, setShowAddGenderModal] = useState<boolean>(false);
  const [newGenderName, setNewGenderName] = useState<string>('');
  const [newGenderSample, setNewGenderSample] = useState<string>('');

  const [showAddEthnicityModal, setShowAddEthnicityModal] = useState<boolean>(false);
  const [newEthLabel, setNewEthLabel] = useState<string>('');
  const [newEthSample, setNewEthSample] = useState<string>('');

  const [showAddRaceModal, setShowAddRaceModal] = useState<boolean>(false);
  const [newRaceLabel, setNewRaceLabel] = useState<string>('');
  const [newRaceSample, setNewRaceSample] = useState<string>('');

  const [showAddCustomVarModal, setShowAddCustomVarModal] = useState<boolean>(false);
  const [newVarName, setNewVarName] = useState<string>('');
  const [newVarType, setNewVarType] = useState<string>('single');
  const [newVarIsGlobal, setNewVarIsGlobal] = useState<boolean>(false);
  const [newVarIsBlind, setNewVarIsBlind] = useState<boolean>(false);
  const [newVarOptions, setNewVarOptions] = useState<string[]>(['Option 1', 'Option 2']);

  // Edit Custom Variable Modal
  const [editingVariable, setEditingVariable] = useState<StudyCustomVariable | null>(null);
  const [editVarName, setEditVarName] = useState<string>('');
  const [editVarType, setEditVarType] = useState<string>('single');
  const [editVarIsGlobal, setEditVarIsGlobal] = useState<boolean>(false);
  const [editVarIsBlind, setEditVarIsBlind] = useState<boolean>(false);
  const [editVarOptions, setEditVarOptions] = useState<VariableOption[]>([]);

  // Unlock Global Variable Confirmation Modal
  const [unlockPromptVariable, setUnlockPromptVariable] = useState<StudyCustomVariable | null>(null);

  const [showAddGlobalVarModal, setShowAddGlobalVarModal] = useState<boolean>(false);

  const [showAddGroupModal, setShowAddGroupModal] = useState<boolean>(false);
  const [newGroupName, setNewGroupName] = useState<string>('');

  const [renamingGroupId, setRenamingGroupId] = useState<string | null>(null);
  const [renameGroupValue, setRenameGroupValue] = useState<string>('');

  const [showAddTaxonomyModal, setShowAddTaxonomyModal] = useState<'relationship' | 'outcome' | null>(null);
  const [newTaxonomyName, setNewTaxonomyName] = useState<string>('');

  const [renamingTaxonomyId, setRenamingTaxonomyId] = useState<string | null>(null);
  const [renameTaxonomyValue, setRenameTaxonomyValue] = useState<string>('');

  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    type: 'milestone' | 'group' | 'variable' | 'variableGroup' | 'taxonomy';
    id: string;
    name: string;
    isGlobal?: boolean;
  } | null>(null);

  // Notify parent of dirty state
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const markDirty = useCallback(() => {
    setIsDirty(true);
  }, []);

  // Fetch study requirements
  const loadRequirements = useCallback(async () => {
    if (!studyId) return;
    setLoading(true);
    setError(null);
    try {
      const data: StudyRequirementsData = await studyApi.getStudyRequirements(studyId);
      setSampleSize(data.sampleSize ?? '');
      setMilestones(data.milestones || []);
      setStudyGroups(data.studyGroups || []);
      setCustomVariables(data.customVariables || []);
      setVariableGroups(data.variableGroups || []);
      setLayout(data.customVariableLayout || []);
      setContactRelationships(data.contactRelationships || []);
      setContactOutcomes(data.contactOutcomes || []);
      setGlobalVariables(data.globalVariables || []);
      setUnlockedVariableIds(new Set());
      setIsDirty(false);
    } catch (err: any) {
      console.error('Failed to load study requirements:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load study requirements.');
    } finally {
      setLoading(false);
    }
  }, [studyId]);

  useEffect(() => {
    loadRequirements();
  }, [loadRequirements]);

  // Save all requirements
  const handleSaveRequirements = async () => {
    if (!canManageSettings || isArchived) return;
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    const payload = {
      sampleSize: typeof sampleSize === 'number' ? sampleSize : null,
      studyGroups,
      customVariables,
      variableGroups,
      customVariableLayout: layout,
      contactRelationships,
      contactOutcomes,
    };

    try {
      const updated = await studyApi.updateStudyRequirements(studyId, payload);
      setSampleSize(updated.sampleSize ?? '');
      setMilestones(updated.milestones || []);
      setStudyGroups(updated.studyGroups || []);
      setCustomVariables(updated.customVariables || []);
      setVariableGroups(updated.variableGroups || []);
      setLayout(updated.customVariableLayout || []);
      setContactRelationships(updated.contactRelationships || []);
      setContactOutcomes(updated.contactOutcomes || []);
      setIsDirty(false);
      setSuccessMessage('Study requirements updated and persisted successfully.');
      onStudyUpdated?.();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to update study requirements:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to save study requirements.');
    } finally {
      setSaving(false);
    }
  };

  // Milestone Actions
  const handleAddMilestone = async () => {
    if (!newMilestoneDate || !newMilestoneTarget) return;
    const target = parseInt(newMilestoneTarget, 10);
    if (isNaN(target) || target <= 0) {
      setError('Milestone target must be a positive integer.');
      return;
    }
    try {
      const newM = await studyApi.addStudyMilestone(studyId, {
        milestoneDate: newMilestoneDate,
        participantTarget: target,
        description: newMilestoneDesc.trim() || undefined,
      });
      setMilestones((prev) => [...prev, newM].sort((a, b) => a.milestoneDate.localeCompare(b.milestoneDate)));
      setShowAddMilestoneModal(false);
      setNewMilestoneDate('');
      setNewMilestoneTarget('');
      setNewMilestoneDesc('');
      setSuccessMessage('Recruitment milestone added.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to add milestone.');
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    try {
      await studyApi.deleteStudyMilestone(studyId, milestoneId);
      setMilestones((prev) => prev.filter((m) => m.id !== milestoneId));
      setConfirmDeleteModal(null);
      setSuccessMessage('Milestone deleted.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to delete milestone.');
    }
  };

  // Age Groups
  const ageGroups = useMemo(() => {
    return studyGroups.filter((g) => g.defaultCategoryName === 'age');
  }, [studyGroups]);

  const handleAddAgeGroup = () => {
    if (!newAgeGroupName.trim()) return;
    const min = newAgeMin ? parseInt(newAgeMin, 10) : null;
    const max = newAgeMax ? parseInt(newAgeMax, 10) : null;
    if (min !== null && max !== null && min > max) {
      setError('Minimum age cannot be greater than maximum age.');
      return;
    }
    const newGroup: DemographicGroup = {
      id: 'grp_age_' + Date.now(),
      defaultCategoryName: 'age',
      label: newAgeGroupName.trim(),
      sampleSize: newAgeGroupSample.trim(),
      ageRange: { min, max },
    };
    setStudyGroups((prev) => [...prev, newGroup]);
    setShowAddAgeGroupModal(false);
    setNewAgeGroupName('');
    setNewAgeGroupSample('');
    setNewAgeMin('');
    setNewAgeMax('');
    markDirty();
  };

  // Sex / Gender Groups
  const genderGroups = useMemo(() => {
    return studyGroups.filter((g) => g.defaultCategoryName === 'sex');
  }, [studyGroups]);

  const handleAddGenderGroup = () => {
    if (!newGenderName.trim()) return;
    const newGroup: DemographicGroup = {
      id: 'grp_gen_' + Date.now(),
      defaultCategoryName: 'sex',
      label: newGenderName.trim(),
      sampleSize: newGenderSample.trim(),
    };
    setStudyGroups((prev) => [...prev, newGroup]);
    setShowAddGenderModal(false);
    setNewGenderName('');
    setNewGenderSample('');
    markDirty();
  };

  // Ethnicity Groups
  const ethnicityGroups = useMemo(() => {
    return studyGroups.filter((g) => g.defaultCategoryName === 'ethnicity');
  }, [studyGroups]);

  const handleAddEthnicityGroup = () => {
    if (!newEthLabel.trim()) return;
    const newGroup: DemographicGroup = {
      id: 'grp_eth_' + Date.now(),
      defaultCategoryName: 'ethnicity',
      label: newEthLabel.trim(),
      sampleSize: newEthSample.trim(),
      genderGroups: [
        { id: 'gen_m_' + Date.now(), gender: 'Male', participants: null },
        { id: 'gen_f_' + Date.now(), gender: 'Female', participants: null },
        { id: 'gen_o_' + Date.now(), gender: 'Other', participants: null },
      ],
    };
    setStudyGroups((prev) => [...prev, newGroup]);
    setShowAddEthnicityModal(false);
    setNewEthLabel('');
    setNewEthSample('');
    markDirty();
  };

  // Race Groups
  const raceGroups = useMemo(() => {
    return studyGroups.filter((g) => g.defaultCategoryName === 'race');
  }, [studyGroups]);

  const handleAddRaceGroup = () => {
    if (!newRaceLabel.trim()) return;
    const newGroup: DemographicGroup = {
      id: 'grp_race_' + Date.now(),
      defaultCategoryName: 'race',
      label: newRaceLabel.trim(),
      sampleSize: newRaceSample.trim(),
      genderGroups: [
        { id: 'gen_m_' + Date.now(), gender: 'Male', participants: null },
        { id: 'gen_f_' + Date.now(), gender: 'Female', participants: null },
        { id: 'gen_o_' + Date.now(), gender: 'Other', participants: null },
      ],
    };
    setStudyGroups((prev) => [...prev, newGroup]);
    setShowAddRaceModal(false);
    setNewRaceLabel('');
    setNewRaceSample('');
    markDirty();
  };

  const handleUpdateGroupNestedGender = (groupId: string, gender: string, targetStr: string) => {
    const target = targetStr ? parseInt(targetStr, 10) : null;
    setStudyGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const currentGenders = g.genderGroups || [];
        const existingIdx = currentGenders.findIndex((item) => item.gender.toLowerCase() === gender.toLowerCase());
        let updatedGenders = [...currentGenders];
        if (existingIdx >= 0) {
          updatedGenders[existingIdx] = { ...updatedGenders[existingIdx], participants: target };
        } else {
          updatedGenders.push({ id: 'gen_' + Date.now(), gender, participants: target });
        }
        return { ...g, genderGroups: updatedGenders };
      })
    );
    markDirty();
  };

  const handleDeleteGroup = (groupId: string) => {
    setStudyGroups((prev) => prev.filter((g) => g.id !== groupId));
    setConfirmDeleteModal(null);
    markDirty();
  };

  // Custom Variables
  const filteredVariables = useMemo(() => {
    if (!variableSearch.trim()) return customVariables;
    const q = variableSearch.toLowerCase().trim();
    return customVariables.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.variableType.toLowerCase().includes(q) ||
        (v.options && v.options.some((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)))
    );
  }, [customVariables, variableSearch]);

  const isVariableLocked = useCallback(
    (v: StudyCustomVariable) => {
      return Boolean(v.isGlobal && !unlockedVariableIds.has(v.id || v.name));
    },
    [unlockedVariableIds]
  );

  const handleUnlockVariable = (v: StudyCustomVariable) => {
    setUnlockedVariableIds((prev) => {
      const next = new Set(prev);
      next.add(v.id || v.name);
      return next;
    });
    setUnlockPromptVariable(null);
    setSuccessMessage(`Unlocked global variable "${v.name}" for edits.`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleAddCustomVariable = () => {
    if (!newVarName.trim()) return;
    const varId = 'var_' + Date.now();
    const options: VariableOption[] =
      newVarType === 'single' || newVarType === 'multi'
        ? newVarOptions
            .filter((o) => o.trim().length > 0)
            .map((opt, idx) => ({
              label: opt.trim(),
              value: opt.trim().toLowerCase().replace(/\s+/g, '_'),
              order: idx,
            }))
        : [];

    const newVar: StudyCustomVariable = {
      id: varId,
      name: newVarName.trim(),
      variableType: newVarType,
      options,
      isGlobal: newVarIsGlobal,
      isBlind: newVarIsBlind,
      rank: customVariables.length,
    };

    setCustomVariables((prev) => [...prev, newVar]);
    setLayout((prev) => [...prev, { id: 'lay_' + varId, type: 'variable', refId: varId, rank: prev.length }]);
    setShowAddCustomVarModal(false);
    setNewVarName('');
    setNewVarType('single');
    setNewVarIsGlobal(false);
    setNewVarIsBlind(false);
    setNewVarOptions(['Option 1', 'Option 2']);
    markDirty();
  };

  const handleOpenEditVariable = (v: StudyCustomVariable) => {
    setEditingVariable(v);
    setEditVarName(v.name);
    setEditVarType(v.variableType);
    setEditVarIsGlobal(Boolean(v.isGlobal));
    setEditVarIsBlind(Boolean(v.isBlind));
    setEditVarOptions(
      v.options && v.options.length > 0
        ? v.options.map((o) => ({ ...o }))
        : [
            { label: 'Option 1', value: 'option_1', order: 0 },
            { label: 'Option 2', value: 'option_2', order: 1 },
          ]
    );
  };

  const handleSaveEditedVariable = () => {
    if (!editingVariable || !editVarName.trim()) return;
    const varId = editingVariable.id;
    const finalOptions =
      editVarType === 'single' || editVarType === 'multi'
        ? editVarOptions
            .filter((o) => o.label.trim().length > 0)
            .map((opt, idx) => ({
              label: opt.label.trim(),
              value: opt.value ? opt.value : opt.label.trim().toLowerCase().replace(/\s+/g, '_'),
              order: idx,
            }))
        : [];

    setCustomVariables((prev) =>
      prev.map((v) =>
        v.id === varId
          ? {
              ...v,
              name: editVarName.trim(),
              variableType: editVarType,
              options: finalOptions,
              isGlobal: editVarIsGlobal,
              isBlind: editVarIsBlind,
            }
          : v
      )
    );
    setEditingVariable(null);
    markDirty();
  };

  const handleAddGlobalVariable = async (globalVar: StudyCustomVariable) => {
    if (!globalVar.id) return;
    try {
      const added = await studyApi.addGlobalVariableToStudy(studyId, globalVar.id);
      setCustomVariables((prev) => [...prev, added]);
      setLayout((prev) => [
        ...prev,
        { id: 'lay_' + added.id, type: 'variable', refId: added.id || '', rank: prev.length },
      ]);
      setShowAddGlobalVarModal(false);
      markDirty();
      setSuccessMessage(`Global variable "${added.name}" added to study.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to add global variable.');
    }
  };

  const handleConvertToMulti = (varId: string) => {
    setCustomVariables((prev) =>
      prev.map((v) => (v.id === varId && v.variableType === 'single' ? { ...v, variableType: 'multi' } : v))
    );
    markDirty();
  };

  const handleDeleteVariable = (varId: string) => {
    setCustomVariables((prev) => prev.filter((v) => v.id !== varId));
    setVariableGroups((prev) =>
      prev.map((vg) => ({
        ...vg,
        variableIds: (vg.variableIds || []).filter((id) => id !== varId),
      }))
    );
    setLayout((prev) => prev.filter((item) => !(item.type === 'variable' && item.refId === varId)));
    setConfirmDeleteModal(null);
    markDirty();
  };

  const handleAddVariableGroup = () => {
    if (!newGroupName.trim()) return;
    const groupId = 'vg_' + Date.now();
    const newGroup: StudyVariableGroup = {
      id: groupId,
      name: newGroupName.trim(),
      variableIds: [],
      rank: variableGroups.length,
    };
    setVariableGroups((prev) => [...prev, newGroup]);
    setLayout((prev) => [...prev, { id: 'lay_' + groupId, type: 'group', refId: groupId, rank: prev.length }]);
    setShowAddGroupModal(false);
    setNewGroupName('');
    markDirty();
  };

  const handleRenameGroup = (groupId: string) => {
    if (!renameGroupValue.trim()) return;
    setVariableGroups((prev) =>
      prev.map((vg) => (vg.id === groupId ? { ...vg, name: renameGroupValue.trim() } : vg))
    );
    setRenamingGroupId(null);
    setRenameGroupValue('');
    markDirty();
  };

  const handleDeleteVariableGroup = (groupId: string) => {
    setVariableGroups((prev) => prev.filter((vg) => vg.id !== groupId));
    setLayout((prev) => prev.filter((item) => !(item.type === 'group' && item.refId === groupId)));
    setConfirmDeleteModal(null);
    markDirty();
  };

  const handleAssignVariableToGroup = (varId: string, targetGroupId: string | '') => {
    setVariableGroups((prev) =>
      prev.map((vg) => {
        const without = (vg.variableIds || []).filter((id) => id !== varId);
        if (vg.id === targetGroupId) {
          return { ...vg, variableIds: [...without, varId] };
        }
        return { ...vg, variableIds: without };
      })
    );
    markDirty();
  };

  // Layout reordering
  const handleMoveLayoutItem = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= layout.length) return;
    const reordered = [...layout];
    const temp = reordered[index];
    reordered[index] = reordered[targetIdx];
    reordered[targetIdx] = temp;
    reordered.forEach((item, idx) => {
      item.rank = idx;
    });
    setLayout(reordered);
    markDirty();
  };

  // Contact Taxonomy
  const handleAddTaxonomy = () => {
    if (!newTaxonomyName.trim() || !showAddTaxonomyModal) return;
    const newTax: ContactTaxonomy = {
      id: 'tax_' + Date.now(),
      name: newTaxonomyName.trim(),
      type: showAddTaxonomyModal,
    };
    if (showAddTaxonomyModal === 'relationship') {
      setContactRelationships((prev) => [...prev, newTax]);
    } else {
      setContactOutcomes((prev) => [...prev, newTax]);
    }
    setShowAddTaxonomyModal(null);
    setNewTaxonomyName('');
    markDirty();
  };

  const handleRenameTaxonomy = (id: string, type: 'relationship' | 'outcome') => {
    if (!renameTaxonomyValue.trim()) return;
    if (type === 'relationship') {
      setContactRelationships((prev) =>
        prev.map((r) => ((r.id || r.name) === id ? { ...r, name: renameTaxonomyValue.trim() } : r))
      );
    } else {
      setContactOutcomes((prev) =>
        prev.map((o) => ((o.id || o.name) === id ? { ...o, name: renameTaxonomyValue.trim() } : o))
      );
    }
    setRenamingTaxonomyId(null);
    setRenameTaxonomyValue('');
    markDirty();
  };

  const handleDeleteTaxonomy = (id: string, type: 'relationship' | 'outcome') => {
    if (type === 'relationship') {
      setContactRelationships((prev) => prev.filter((t) => (t.id || t.name) !== id));
    } else {
      setContactOutcomes((prev) => prev.filter((t) => (t.id || t.name) !== id));
    }
    setConfirmDeleteModal(null);
    markDirty();
  };

  if (loading) {
    return (
      <div className="study-settings-requirements__loading" role="status" aria-live="polite">
        <Loader2 className="study-spinner" size={28} />
        <p>Loading study requirements...</p>
      </div>
    );
  }

  return (
    <div className="study-settings-requirements" data-testid="study-settings-requirements">
      {/* Header */}
      <div className="study-settings-requirements__header">
        <div>
          <h2 className="study-settings-requirements__title">Participant Requirements</h2>
          <p className="study-settings-requirements__subtitle">
            Configure participant sample targets, demographic quotas, custom protocol variables, and contact taxonomies.
          </p>
        </div>
        <div className="study-header-controls">
          <button
            type="button"
            className="study-settings-btn study-settings-btn--outline-secondary study-settings-btn--sm"
            onClick={expandAllSections}
            title="Expand all requirement sections"
          >
            Expand All
          </button>
          <button
            type="button"
            className="study-settings-btn study-settings-btn--outline-secondary study-settings-btn--sm"
            onClick={collapseAllSections}
            title="Collapse all requirement sections"
          >
            Collapse All
          </button>
          {isDirty && (
            <button
              type="button"
              className="study-settings-btn study-settings-btn--outline-secondary study-settings-btn--sm"
              onClick={loadRequirements}
              disabled={saving}
              title="Discard unsaved changes and reload from server"
            >
              <RotateCcw size={14} /> Discard
            </button>
          )}
          {canManageSettings && !isArchived && (
            <button
              type="button"
              className="study-settings-btn study-settings-btn--primary"
              onClick={handleSaveRequirements}
              disabled={saving || !isDirty}
              aria-label="Save requirements"
            >
              {saving ? <Loader2 className="study-spinner" size={16} /> : <Save size={16} />}
              <span>{saving ? 'Saving...' : 'Save Requirements'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="study-alert study-alert--error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss error">
            <X size={14} />
          </button>
        </div>
      )}
      {successMessage && (
        <div className="study-alert study-alert--success" role="status">
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
          <button type="button" onClick={() => setSuccessMessage(null)} aria-label="Dismiss success">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. GENERAL SAMPLE REQUIREMENTS & MILESTONES */}
      {/* ========================================================================= */}
      <section className="study-requirements-section" aria-labelledby="heading-sample-reqs">
        <button
          type="button"
          className="study-requirements-section__toggle-header"
          onClick={() => toggleSection('sample')}
          aria-expanded={!collapsedSections.sample}
          aria-controls="section-content-sample"
        >
          <div className="study-requirements-section__header-left">
            <Users size={18} className="study-requirements-section__icon" />
            <h3 id="heading-sample-reqs">General Sample Requirements & Milestones</h3>
            <span className="study-badge study-badge--neutral">
              Target: {sampleSize !== '' ? sampleSize : 'Not set'} | {milestones.length} Milestones
            </span>
          </div>
          <div className="study-requirements-section__header-right">
            {collapsedSections.sample ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
          </div>
        </button>

        {!collapsedSections.sample && (
          <div id="section-content-sample" className="study-requirements-section__content">
            <div className="study-requirements-grid">
              {/* Sample Size (N) */}
              <div className="study-card study-requirements-card">
                <h4 className="study-card__title">Total Study Sample Size (N)</h4>
                <p className="study-card__description">
                  Set the target total recruitment participant count for this study protocol.
                </p>
                <div className="study-form-group">
                  <label htmlFor="sample-size-input" className="study-form-label">
                    Target Participants
                  </label>
                  <input
                    id="sample-size-input"
                    type="number"
                    min="0"
                    step="1"
                    className="study-form-input"
                    placeholder="e.g. 150"
                    value={sampleSize}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                      setSampleSize(isNaN(val as number) ? '' : val);
                      markDirty();
                    }}
                    disabled={!canManageSettings || isArchived}
                  />
                </div>
              </div>

              {/* Study Milestones */}
              <div className="study-card study-requirements-card">
                <div className="study-card__header-flex">
                  <div>
                    <h4 className="study-card__title">Recruitment Milestones</h4>
                    <p className="study-card__description">
                      Track date-based recruitment milestones across study timeline.
                    </p>
                  </div>
                  {canManageSettings && !isArchived && (
                    <button
                      type="button"
                      className="study-settings-btn study-settings-btn--outline-primary study-settings-btn--sm"
                      onClick={() => setShowAddMilestoneModal(true)}
                      aria-label="Add Milestone"
                    >
                      <Plus size={14} />
                      <span>Add Milestone</span>
                    </button>
                  )}
                </div>

                {milestones.length === 0 ? (
                  <div className="study-empty-state-card">
                    <Calendar size={24} className="study-empty-icon" />
                    <p>No recruitment milestones scheduled yet.</p>
                  </div>
                ) : (
                  <div className="study-table-container">
                    <table className="study-table" aria-label="Recruitment Milestones">
                      <thead>
                        <tr>
                          <th>Milestone Date</th>
                          <th>Target Participants</th>
                          <th>Description</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {milestones.map((m) => (
                          <tr key={m.id || m.milestoneDate}>
                            <td>
                              <strong>{m.milestoneDate}</strong>
                            </td>
                            <td>{m.participantTarget} participants</td>
                            <td>{m.description || '—'}</td>
                            <td className="text-right">
                              {canManageSettings && !isArchived && m.id && (
                                <button
                                  type="button"
                                  className="study-action-btn study-action-btn--danger"
                                  onClick={() =>
                                    setConfirmDeleteModal({
                                      type: 'milestone',
                                      id: m.id!,
                                      name: `Milestone ${m.milestoneDate} (${m.participantTarget} participants)`,
                                    })
                                  }
                                  title="Delete Milestone"
                                  aria-label={`Delete milestone ${m.milestoneDate}`}
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 2. AGE REQUIREMENTS */}
      {/* ========================================================================= */}
      <section className="study-requirements-section" aria-labelledby="heading-age-reqs">
        <button
          type="button"
          className="study-requirements-section__toggle-header"
          onClick={() => toggleSection('age')}
          aria-expanded={!collapsedSections.age}
          aria-controls="section-content-age"
        >
          <div className="study-requirements-section__header-left">
            <Calendar size={18} className="study-requirements-section__icon" />
            <h3 id="heading-age-reqs">Age Requirements</h3>
            <span className="study-badge study-badge--neutral">{ageGroups.length} Groups</span>
          </div>
          <div className="study-requirements-section__header-right">
            {canManageSettings && !isArchived && (
              <button
                type="button"
                className="study-settings-btn study-settings-btn--outline-primary study-settings-btn--xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddAgeGroupModal(true);
                }}
                aria-label="Add Age Group"
              >
                <Plus size={13} /> Add Group
              </button>
            )}
            {collapsedSections.age ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
          </div>
        </button>

        {!collapsedSections.age && (
          <div id="section-content-age" className="study-requirements-section__content">
            {ageGroups.length === 0 ? (
              <div className="study-empty-state-card">
                <p>No age requirements defined. Recruitment is open to all ages.</p>
              </div>
            ) : (
              <div className="study-table-container">
                <table className="study-table" aria-label="Age Groups">
                  <thead>
                    <tr>
                      <th>Group Name</th>
                      <th>Sample Target (N)</th>
                      <th>Age Range (Years)</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ageGroups.map((grp) => (
                      <tr key={grp.id}>
                        <td>
                          <strong>{grp.label}</strong>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="study-form-input study-form-input--inline"
                            value={grp.sampleSize}
                            onChange={(e) => {
                              const val = e.target.value;
                              setStudyGroups((prev) =>
                                prev.map((g) => (g.id === grp.id ? { ...g, sampleSize: val } : g))
                              );
                              markDirty();
                            }}
                            disabled={!canManageSettings || isArchived}
                            aria-label={`Sample target for ${grp.label}`}
                          />
                        </td>
                        <td>
                          {grp.ageRange?.min ?? 0} to {grp.ageRange?.max ?? 'Any'} years
                        </td>
                        <td className="text-right">
                          {canManageSettings && !isArchived && grp.id && (
                            <button
                              type="button"
                              className="study-action-btn study-action-btn--danger"
                              onClick={() =>
                                setConfirmDeleteModal({
                                  type: 'group',
                                  id: grp.id!,
                                  name: `Age Group "${grp.label}"`,
                                })
                              }
                              aria-label={`Delete age group ${grp.label}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 3. SEX / GENDER REQUIREMENTS */}
      {/* ========================================================================= */}
      <section className="study-requirements-section" aria-labelledby="heading-sex-reqs">
        <button
          type="button"
          className="study-requirements-section__toggle-header"
          onClick={() => toggleSection('gender')}
          aria-expanded={!collapsedSections.gender}
          aria-controls="section-content-gender"
        >
          <div className="study-requirements-section__header-left">
            <Users size={18} className="study-requirements-section__icon" />
            <h3 id="heading-sex-reqs">Sex / Gender Requirements</h3>
            <span className="study-badge study-badge--neutral">{genderGroups.length} Groups</span>
          </div>
          <div className="study-requirements-section__header-right">
            {canManageSettings && !isArchived && (
              <button
                type="button"
                className="study-settings-btn study-settings-btn--outline-primary study-settings-btn--xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddGenderModal(true);
                }}
                aria-label="Add Sex/Gender Group"
              >
                <Plus size={13} /> Add Group
              </button>
            )}
            {collapsedSections.gender ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
          </div>
        </button>

        {!collapsedSections.gender && (
          <div id="section-content-gender" className="study-requirements-section__content">
            {genderGroups.length === 0 ? (
              <div className="study-empty-state-card">
                <p>No specific sex or gender quotas set.</p>
              </div>
            ) : (
              <div className="study-table-container">
                <table className="study-table" aria-label="Sex and Gender Groups">
                  <thead>
                    <tr>
                      <th>Sex / Gender Category</th>
                      <th>Target Sample Size (N)</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {genderGroups.map((grp) => (
                      <tr key={grp.id}>
                        <td>
                          <strong>{grp.label}</strong>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="study-form-input study-form-input--inline"
                            value={grp.sampleSize}
                            onChange={(e) => {
                              const val = e.target.value;
                              setStudyGroups((prev) =>
                                prev.map((g) => (g.id === grp.id ? { ...g, sampleSize: val } : g))
                              );
                              markDirty();
                            }}
                            disabled={!canManageSettings || isArchived}
                            aria-label={`Sample target for ${grp.label}`}
                          />
                        </td>
                        <td className="text-right">
                          {canManageSettings && !isArchived && grp.id && (
                            <button
                              type="button"
                              className="study-action-btn study-action-btn--danger"
                              onClick={() =>
                                setConfirmDeleteModal({
                                  type: 'group',
                                  id: grp.id!,
                                  name: `Sex/Gender Group "${grp.label}"`,
                                })
                              }
                              aria-label={`Delete sex group ${grp.label}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 4. ETHNICITY REQUIREMENTS */}
      {/* ========================================================================= */}
      <section className="study-requirements-section" aria-labelledby="heading-ethnic-reqs">
        <button
          type="button"
          className="study-requirements-section__toggle-header"
          onClick={() => toggleSection('ethnicity')}
          aria-expanded={!collapsedSections.ethnicity}
          aria-controls="section-content-ethnicity"
        >
          <div className="study-requirements-section__header-left">
            <Layers size={18} className="study-requirements-section__icon" />
            <h3 id="heading-ethnic-reqs">Ethnicity Requirements</h3>
            <span className="study-badge study-badge--neutral">{ethnicityGroups.length} Categories</span>
          </div>
          <div className="study-requirements-section__header-right">
            {canManageSettings && !isArchived && (
              <button
                type="button"
                className="study-settings-btn study-settings-btn--outline-primary study-settings-btn--xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddEthnicityModal(true);
                }}
                aria-label="Add Ethnicity Group"
              >
                <Plus size={13} /> Add Category
              </button>
            )}
            {collapsedSections.ethnicity ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
          </div>
        </button>

        {!collapsedSections.ethnicity && (
          <div id="section-content-ethnicity" className="study-requirements-section__content">
            {ethnicityGroups.length === 0 ? (
              <div className="study-empty-state-card">
                <p>No ethnicity distribution requirements specified.</p>
              </div>
            ) : (
              <div className="study-demographic-cards">
                {ethnicityGroups.map((grp) => (
                  <div key={grp.id} className="study-card study-demo-group-card">
                    <div className="study-card__header-flex">
                      <div>
                        <span className="study-badge study-badge--info">Ethnicity</span>
                        <h4 className="study-card__title" style={{ marginTop: '4px' }}>
                          {grp.label}
                        </h4>
                      </div>
                      <div className="study-card__actions">
                        {canManageSettings && !isArchived && grp.id && (
                          <button
                            type="button"
                            className="study-action-btn study-action-btn--danger"
                            onClick={() =>
                              setConfirmDeleteModal({
                                type: 'group',
                                id: grp.id!,
                                name: `Ethnicity category "${grp.label}"`,
                              })
                            }
                            aria-label={`Delete ethnicity group ${grp.label}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="study-form-group" style={{ maxWidth: '240px', marginTop: '10px' }}>
                      <label className="study-form-label">Total Category Target (N)</label>
                      <input
                        type="text"
                        className="study-form-input"
                        value={grp.sampleSize}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStudyGroups((prev) =>
                            prev.map((g) => (g.id === grp.id ? { ...g, sampleSize: val } : g))
                          );
                          markDirty();
                        }}
                        disabled={!canManageSettings || isArchived}
                      />
                    </div>

                    {/* Nested Gender Breakdown */}
                    <div className="study-demo-gender-breakdown">
                      <h5 className="study-demo-gender-breakdown__title">Gender Sub-Targets</h5>
                      <div className="study-demo-gender-grid">
                        {['Male', 'Female', 'Other'].map((gender) => {
                          const currentVal =
                            grp.genderGroups?.find((g) => g.gender.toLowerCase() === gender.toLowerCase())
                              ?.participants ?? '';
                          return (
                            <div key={gender} className="study-demo-gender-item">
                              <label className="study-form-label">{gender}</label>
                              <input
                                type="number"
                                min="0"
                                className="study-form-input study-form-input--sm"
                                placeholder="Target"
                                value={currentVal}
                                onChange={(e) =>
                                  handleUpdateGroupNestedGender(grp.id!, gender, e.target.value)
                                }
                                disabled={!canManageSettings || isArchived}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 5. RACE REQUIREMENTS */}
      {/* ========================================================================= */}
      <section className="study-requirements-section" aria-labelledby="heading-race-reqs">
        <button
          type="button"
          className="study-requirements-section__toggle-header"
          onClick={() => toggleSection('race')}
          aria-expanded={!collapsedSections.race}
          aria-controls="section-content-race"
        >
          <div className="study-requirements-section__header-left">
            <Layers size={18} className="study-requirements-section__icon" />
            <h3 id="heading-race-reqs">Race Requirements</h3>
            <span className="study-badge study-badge--neutral">{raceGroups.length} Categories</span>
          </div>
          <div className="study-requirements-section__header-right">
            {canManageSettings && !isArchived && (
              <button
                type="button"
                className="study-settings-btn study-settings-btn--outline-primary study-settings-btn--xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddRaceModal(true);
                }}
                aria-label="Add Race Category"
              >
                <Plus size={13} /> Add Category
              </button>
            )}
            {collapsedSections.race ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
          </div>
        </button>

        {!collapsedSections.race && (
          <div id="section-content-race" className="study-requirements-section__content">
            {raceGroups.length === 0 ? (
              <div className="study-empty-state-card">
                <p>No race distribution requirements specified.</p>
              </div>
            ) : (
              <div className="study-demographic-cards">
                {raceGroups.map((grp) => (
                  <div key={grp.id} className="study-card study-demo-group-card">
                    <div className="study-card__header-flex">
                      <div>
                        <span className="study-badge study-badge--info">Race</span>
                        <h4 className="study-card__title" style={{ marginTop: '4px' }}>
                          {grp.label}
                        </h4>
                      </div>
                      <div className="study-card__actions">
                        {canManageSettings && !isArchived && grp.id && (
                          <button
                            type="button"
                            className="study-action-btn study-action-btn--danger"
                            onClick={() =>
                              setConfirmDeleteModal({
                                type: 'group',
                                id: grp.id!,
                                name: `Race category "${grp.label}"`,
                              })
                            }
                            aria-label={`Delete race group ${grp.label}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="study-form-group" style={{ maxWidth: '240px', marginTop: '10px' }}>
                      <label className="study-form-label">Total Category Target (N)</label>
                      <input
                        type="text"
                        className="study-form-input"
                        value={grp.sampleSize}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStudyGroups((prev) =>
                            prev.map((g) => (g.id === grp.id ? { ...g, sampleSize: val } : g))
                          );
                          markDirty();
                        }}
                        disabled={!canManageSettings || isArchived}
                      />
                    </div>

                    {/* Nested Gender Breakdown */}
                    <div className="study-demo-gender-breakdown">
                      <h5 className="study-demo-gender-breakdown__title">Gender Sub-Targets</h5>
                      <div className="study-demo-gender-grid">
                        {['Male', 'Female', 'Other'].map((gender) => {
                          const currentVal =
                            grp.genderGroups?.find((g) => g.gender.toLowerCase() === gender.toLowerCase())
                              ?.participants ?? '';
                          return (
                            <div key={gender} className="study-demo-gender-item">
                              <label className="study-form-label">{gender}</label>
                              <input
                                type="number"
                                min="0"
                                className="study-form-input study-form-input--sm"
                                placeholder="Target"
                                value={currentVal}
                                onChange={(e) =>
                                  handleUpdateGroupNestedGender(grp.id!, gender, e.target.value)
                                }
                                disabled={!canManageSettings || isArchived}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 6. CUSTOM PROTOCOL VARIABLES & VARIABLE GROUPS */}
      {/* ========================================================================= */}
      <section className="study-requirements-section" aria-labelledby="heading-custom-vars">
        <button
          type="button"
          className="study-requirements-section__toggle-header"
          onClick={() => toggleSection('customVars')}
          aria-expanded={!collapsedSections.customVars}
          aria-controls="section-content-customvars"
        >
          <div className="study-requirements-section__header-left">
            <Tag size={18} className="study-requirements-section__icon" />
            <h3 id="heading-custom-vars">Custom Protocol Variables & Groups</h3>
            <span className="study-badge study-badge--neutral">
              {customVariables.length} Variables | {variableGroups.length} Groups
            </span>
          </div>
          <div className="study-requirements-section__header-right">
            {collapsedSections.customVars ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
          </div>
        </button>

        {!collapsedSections.customVars && (
          <div id="section-content-customvars" className="study-requirements-section__content">
            {/* Top Action & Search Bar */}
            <div className="study-search-filter-bar">
              <div className="study-search-wrap">
                <Search size={16} className="study-search-icon" />
                <input
                  type="text"
                  className="study-search-input"
                  placeholder="Filter variables by name, type, or option..."
                  value={variableSearch}
                  onChange={(e) => setVariableSearch(e.target.value)}
                  aria-label="Filter custom variables"
                />
              </div>

              {canManageSettings && !isArchived && (
                <div className="study-requirements-section__header-actions">
                  <button
                    type="button"
                    className="study-settings-btn study-settings-btn--outline-secondary study-settings-btn--sm"
                    onClick={() => setShowAddGlobalVarModal(true)}
                    aria-label="Add Global Variable"
                  >
                    <Globe size={14} />
                    <span>Add Global Variable</span>
                  </button>
                  <button
                    type="button"
                    className="study-settings-btn study-settings-btn--outline-secondary study-settings-btn--sm"
                    onClick={() => setShowAddGroupModal(true)}
                    aria-label="Add Variable Group"
                  >
                    <FolderPlus size={14} />
                    <span>Add Group</span>
                  </button>
                  <button
                    type="button"
                    className="study-settings-btn study-settings-btn--outline-primary study-settings-btn--sm"
                    onClick={() => setShowAddCustomVarModal(true)}
                    aria-label="Add Custom Variable"
                  >
                    <Plus size={14} />
                    <span>Add Variable</span>
                  </button>
                </div>
              )}
            </div>

            {/* Variable Groups & Variables Display */}
            {layout.length === 0 && customVariables.length === 0 ? (
              <div className="study-empty-state-card">
                <p>No custom variables configured for this study protocol.</p>
              </div>
            ) : (
              <div className="study-variable-layout-list" role="list" aria-label="Custom Variables and Groups">
                {layout.map((item, index) => {
                  if (item.type === 'group') {
                    const group = variableGroups.find((g) => g.id === item.refId);
                    if (!group) return null;
                    const groupVars = customVariables.filter((v) =>
                      (group.variableIds || []).includes(v.id || '')
                    );

                    return (
                      <div key={item.id || group.id} className="study-variable-group-card" role="listitem">
                        <div className="study-variable-group-card__header">
                          <div className="study-variable-group-card__title-wrap">
                            {renamingGroupId === group.id ? (
                              <div className="study-inline-rename-wrap">
                                <input
                                  type="text"
                                  className="study-form-input study-form-input--sm"
                                  value={renameGroupValue}
                                  onChange={(e) => setRenameGroupValue(e.target.value)}
                                  aria-label="Rename Group"
                                />
                                <button
                                  type="button"
                                  className="study-action-btn study-action-btn--primary"
                                  onClick={() => handleRenameGroup(group.id!)}
                                  title="Save Group Name"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="study-action-btn"
                                  onClick={() => setRenamingGroupId(null)}
                                  title="Cancel Rename"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <>
                                <h4 className="study-variable-group-card__name">{group.name}</h4>
                                <span className="study-badge study-badge--neutral">
                                  {groupVars.length} variables
                                </span>
                              </>
                            )}
                          </div>

                          <div className="study-variable-group-card__controls">
                            {canManageSettings && !isArchived && (
                              <>
                                <button
                                  type="button"
                                  className="study-action-btn"
                                  disabled={index === 0}
                                  onClick={() => handleMoveLayoutItem(index, 'up')}
                                  title="Move Group Up"
                                  aria-label={`Move group ${group.name} up`}
                                >
                                  <ArrowUp size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="study-action-btn"
                                  disabled={index === layout.length - 1}
                                  onClick={() => handleMoveLayoutItem(index, 'down')}
                                  title="Move Group Down"
                                  aria-label={`Move group ${group.name} down`}
                                >
                                  <ArrowDown size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="study-action-btn"
                                  onClick={() => {
                                    setRenamingGroupId(group.id!);
                                    setRenameGroupValue(group.name);
                                  }}
                                  title="Rename Group"
                                  aria-label={`Rename group ${group.name}`}
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="study-action-btn study-action-btn--danger"
                                  onClick={() =>
                                    setConfirmDeleteModal({
                                      type: 'variableGroup',
                                      id: group.id!,
                                      name: `Variable Group "${group.name}"`,
                                    })
                                  }
                                  title="Delete Group"
                                  aria-label={`Delete group ${group.name}`}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Group Variables */}
                        <div className="study-variable-group-card__body">
                          {groupVars.length === 0 ? (
                            <p className="study-variable-group-card__empty">
                              No variables assigned to this group. Use the dropdown on ungrouped variables to assign.
                            </p>
                          ) : (
                            <div className="study-variable-chips">
                              {groupVars.map((v) => (
                                <div key={v.id} className="study-variable-chip">
                                  <span className="study-variable-chip__name">{v.name}</span>
                                  <span className="study-badge study-badge--sm">{v.variableType}</span>
                                  {v.isGlobal && (
                                    <span className="study-badge study-badge--global study-badge--sm" title="Global Variable">
                                      <Globe size={10} />
                                    </span>
                                  )}
                                  {v.isBlind && (
                                    <span className="study-badge study-badge--blind study-badge--sm" title="Double Blind">
                                      <EyeOff size={10} />
                                    </span>
                                  )}
                                  {canManageSettings && !isArchived && (
                                    <button
                                      type="button"
                                      className="study-variable-chip__remove"
                                      onClick={() => handleAssignVariableToGroup(v.id!, '')}
                                      title="Remove from group"
                                      aria-label={`Remove ${v.name} from group`}
                                    >
                                      <X size={12} />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Ungrouped Variable
                  const variable = filteredVariables.find((v) => v.id === item.refId);
                  if (!variable) return null;

                  // Check if variable is already assigned into any group
                  const isAssignedToAnyGroup = variableGroups.some((vg) =>
                    (vg.variableIds || []).includes(variable.id || '')
                  );
                  if (isAssignedToAnyGroup) return null;

                  const locked = isVariableLocked(variable);

                  return (
                    <div key={item.id || variable.id} className="study-variable-item-card" role="listitem">
                      <div className="study-variable-item-card__main">
                        <div className="study-variable-item-card__header-line">
                          <strong className="study-variable-item-card__title">{variable.name}</strong>
                          <span className="study-badge study-badge--info">{variable.variableType}</span>
                          {variable.isGlobal && (
                            <span className="study-badge study-badge--global" title="Global Variable across tenant">
                              <Globe size={11} /> Global
                            </span>
                          )}
                          {variable.isBlind && (
                            <span className="study-badge study-badge--blind" title="Double Blind Masked">
                              <EyeOff size={11} /> Blind
                            </span>
                          )}
                          {variable.isGlobal && locked && (
                            <span className="study-badge study-badge--locked" title="Locked Global Variable">
                              <Lock size={11} /> Locked
                            </span>
                          )}
                        </div>

                        {/* Options Preview for Single/Multi */}
                        {variable.options && variable.options.length > 0 && (
                          <div className="study-variable-item-card__options">
                            <span className="study-variable-options-label">Options:</span>
                            {variable.options.map((opt) => (
                              <span key={opt.value || opt.label} className="study-variable-option-pill">
                                {opt.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions & Reordering */}
                      <div className="study-variable-item-card__actions">
                        {/* Lock / Unlock Toggle for Global Variables */}
                        {variable.isGlobal && locked && canManageSettings && !isArchived && (
                          <button
                            type="button"
                            className="study-settings-btn study-settings-btn--outline-secondary study-settings-btn--xs"
                            onClick={() => setUnlockPromptVariable(variable)}
                            title="Unlock to make changes across all studies"
                            aria-label={`Unlock global variable ${variable.name}`}
                          >
                            <Unlock size={12} /> Unlock
                          </button>
                        )}

                        {/* Edit Variable Button */}
                        {canManageSettings && !isArchived && (
                          <button
                            type="button"
                            className="study-action-btn"
                            disabled={locked}
                            onClick={() => handleOpenEditVariable(variable)}
                            title={locked ? 'Unlock variable to edit' : 'Edit Variable & Options'}
                            aria-label={`Edit ${variable.name}`}
                          >
                            <Edit2 size={14} />
                          </button>
                        )}

                        {/* Convert to Multi-Select (for Single Select variables) */}
                        {canManageSettings && !isArchived && variable.variableType === 'single' && (
                          <button
                            type="button"
                            className="study-settings-btn study-settings-btn--outline-secondary study-settings-btn--xs"
                            disabled={locked}
                            onClick={() => handleConvertToMulti(variable.id!)}
                            title={locked ? 'Unlock variable to convert' : 'Convert single select to multi-select'}
                          >
                            Convert to Multi
                          </button>
                        )}

                        {/* Group Assignment Selector */}
                        {canManageSettings && !isArchived && variableGroups.length > 0 && (
                          <select
                            className="study-form-select study-form-select--xs"
                            onChange={(e) => handleAssignVariableToGroup(variable.id!, e.target.value)}
                            defaultValue=""
                            aria-label={`Assign ${variable.name} to group`}
                          >
                            <option value="" disabled>
                              Assign to group...
                            </option>
                            {variableGroups.map((vg) => (
                              <option key={vg.id} value={vg.id}>
                                {vg.name}
                              </option>
                            ))}
                          </select>
                        )}

                        {canManageSettings && !isArchived && (
                          <>
                            <button
                              type="button"
                              className="study-action-btn"
                              disabled={index === 0}
                              onClick={() => handleMoveLayoutItem(index, 'up')}
                              title="Move Up"
                              aria-label={`Move variable ${variable.name} up`}
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              type="button"
                              className="study-action-btn"
                              disabled={index === layout.length - 1}
                              onClick={() => handleMoveLayoutItem(index, 'down')}
                              title="Move Down"
                              aria-label={`Move variable ${variable.name} down`}
                            >
                              <ArrowDown size={14} />
                            </button>
                            <button
                              type="button"
                              className="study-action-btn study-action-btn--danger"
                              disabled={locked}
                              onClick={() =>
                                setConfirmDeleteModal({
                                  type: 'variable',
                                  id: variable.id!,
                                  name: variable.name,
                                  isGlobal: variable.isGlobal,
                                })
                              }
                              title={locked ? 'Unlock variable to remove' : 'Delete or Remove Variable'}
                              aria-label={`Delete custom variable ${variable.name}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 7. CONTACT RELATIONSHIPS */}
      {/* ========================================================================= */}
      <section className="study-requirements-section" aria-labelledby="heading-contact-rel">
        <button
          type="button"
          className="study-requirements-section__toggle-header"
          onClick={() => toggleSection('relationships')}
          aria-expanded={!collapsedSections.relationships}
          aria-controls="section-content-relationships"
        >
          <div className="study-requirements-section__header-left">
            <PhoneCall size={18} className="study-requirements-section__icon" />
            <h3 id="heading-contact-rel">Contact Relationships</h3>
            <span className="study-badge study-badge--neutral">{contactRelationships.length} Options</span>
          </div>
          <div className="study-requirements-section__header-right">
            {canManageSettings && !isArchived && (
              <button
                type="button"
                className="study-settings-btn study-settings-btn--outline-primary study-settings-btn--xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddTaxonomyModal('relationship');
                }}
                aria-label="Add Contact Relationship"
              >
                <Plus size={13} /> Add Relationship
              </button>
            )}
            {collapsedSections.relationships ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
          </div>
        </button>

        {!collapsedSections.relationships && (
          <div id="section-content-relationships" className="study-requirements-section__content">
            <p className="study-card__description">
              Taxonomy options for participant contact relationships (e.g., Mother, Father, Guardian, Spouse, Self).
            </p>
            {contactRelationships.length === 0 ? (
              <div className="study-empty-state-card">
                <p>No contact relationships configured.</p>
              </div>
            ) : (
              <div className="study-taxonomy-list">
                {contactRelationships.map((r) => {
                  const itemId = r.id || r.name;
                  const isRenaming = renamingTaxonomyId === itemId;
                  return (
                    <div key={itemId} className="study-taxonomy-item">
                      {isRenaming ? (
                        <div className="study-inline-rename-wrap" style={{ flex: 1, marginRight: '10px' }}>
                          <input
                            type="text"
                            className="study-form-input study-form-input--sm"
                            value={renameTaxonomyValue}
                            onChange={(e) => setRenameTaxonomyValue(e.target.value)}
                            aria-label="Edit Relationship Title"
                          />
                          <button
                            type="button"
                            className="study-action-btn study-action-btn--primary"
                            onClick={() => handleRenameTaxonomy(itemId, 'relationship')}
                            title="Save Title"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            type="button"
                            className="study-action-btn"
                            onClick={() => setRenamingTaxonomyId(null)}
                            title="Cancel"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <span>{r.name}</span>
                      )}

                      {!isRenaming && canManageSettings && !isArchived && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            type="button"
                            className="study-action-btn"
                            onClick={() => {
                              setRenamingTaxonomyId(itemId);
                              setRenameTaxonomyValue(r.name);
                            }}
                            title="Edit Relationship"
                            aria-label={`Edit ${r.name}`}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            className="study-action-btn study-action-btn--danger"
                            onClick={() =>
                              setConfirmDeleteModal({
                                type: 'taxonomy',
                                id: itemId,
                                name: `Relationship "${r.name}"`,
                              })
                            }
                            title="Delete Relationship"
                            aria-label={`Delete relationship ${r.name}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 8. CONTACT OUTCOMES */}
      {/* ========================================================================= */}
      <section className="study-requirements-section" aria-labelledby="heading-contact-outcomes">
        <button
          type="button"
          className="study-requirements-section__toggle-header"
          onClick={() => toggleSection('outcomes')}
          aria-expanded={!collapsedSections.outcomes}
          aria-controls="section-content-outcomes"
        >
          <div className="study-requirements-section__header-left">
            <PhoneCall size={18} className="study-requirements-section__icon" />
            <h3 id="heading-contact-outcomes">Contact Outcomes</h3>
            <span className="study-badge study-badge--neutral">{contactOutcomes.length} Options</span>
          </div>
          <div className="study-requirements-section__header-right">
            {canManageSettings && !isArchived && (
              <button
                type="button"
                className="study-settings-btn study-settings-btn--outline-primary study-settings-btn--xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddTaxonomyModal('outcome');
                }}
                aria-label="Add Contact Outcome"
              >
                <Plus size={13} /> Add Outcome
              </button>
            )}
            {collapsedSections.outcomes ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
          </div>
        </button>

        {!collapsedSections.outcomes && (
          <div id="section-content-outcomes" className="study-requirements-section__content">
            <p className="study-card__description">
              Taxonomy options for logging contact call and message outcomes (e.g., Call Completed, Voicemail Left, Participant Added).
            </p>
            {contactOutcomes.length === 0 ? (
              <div className="study-empty-state-card">
                <p>No contact outcomes configured.</p>
              </div>
            ) : (
              <div className="study-taxonomy-list">
                {contactOutcomes.map((o) => {
                  const itemId = o.id || o.name;
                  const isRenaming = renamingTaxonomyId === itemId;
                  return (
                    <div key={itemId} className="study-taxonomy-item">
                      {isRenaming ? (
                        <div className="study-inline-rename-wrap" style={{ flex: 1, marginRight: '10px' }}>
                          <input
                            type="text"
                            className="study-form-input study-form-input--sm"
                            value={renameTaxonomyValue}
                            onChange={(e) => setRenameTaxonomyValue(e.target.value)}
                            aria-label="Edit Outcome Title"
                          />
                          <button
                            type="button"
                            className="study-action-btn study-action-btn--primary"
                            onClick={() => handleRenameTaxonomy(itemId, 'outcome')}
                            title="Save Title"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            type="button"
                            className="study-action-btn"
                            onClick={() => setRenamingTaxonomyId(null)}
                            title="Cancel"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <span>{o.name}</span>
                      )}

                      {!isRenaming && canManageSettings && !isArchived && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            type="button"
                            className="study-action-btn"
                            onClick={() => {
                              setRenamingTaxonomyId(itemId);
                              setRenameTaxonomyValue(o.name);
                            }}
                            title="Edit Outcome"
                            aria-label={`Edit ${o.name}`}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            className="study-action-btn study-action-btn--danger"
                            onClick={() =>
                              setConfirmDeleteModal({
                                type: 'taxonomy',
                                id: itemId,
                                name: `Outcome "${o.name}"`,
                              })
                            }
                            title="Delete Outcome"
                            aria-label={`Delete outcome ${o.name}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Add Milestone Modal */}
      {showAddMilestoneModal && (
        <div className="study-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-milestone-title">
          <div className="study-modal study-modal--sm">
            <div className="study-modal__header">
              <h3 id="modal-milestone-title">Add Recruitment Milestone</h3>
              <button
                type="button"
                className="study-modal__close"
                onClick={() => setShowAddMilestoneModal(false)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="study-modal__body">
              <div className="study-form-group">
                <label className="study-form-label">Milestone Date (YYYY-MM-DD)</label>
                <input
                  type="date"
                  className="study-form-input"
                  value={newMilestoneDate}
                  onChange={(e) => setNewMilestoneDate(e.target.value)}
                  required
                />
              </div>
              <div className="study-form-group">
                <label className="study-form-label">Target Participants</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="study-form-input"
                  placeholder="e.g. 50"
                  value={newMilestoneTarget}
                  onChange={(e) => setNewMilestoneTarget(e.target.value)}
                  required
                />
              </div>
              <div className="study-form-group">
                <label className="study-form-label">Description (Optional)</label>
                <input
                  type="text"
                  className="study-form-input"
                  placeholder="e.g. Phase 1 Cohort Enrollment Target"
                  value={newMilestoneDesc}
                  onChange={(e) => setNewMilestoneDesc(e.target.value)}
                />
              </div>
            </div>
            <div className="study-modal__footer">
              <button
                type="button"
                className="study-settings-btn study-settings-btn--outline-secondary"
                onClick={() => setShowAddMilestoneModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="study-settings-btn study-settings-btn--primary"
                onClick={handleAddMilestone}
                disabled={!newMilestoneDate || !newMilestoneTarget}
              >
                Add Milestone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Age Group Modal */}
      {showAddAgeGroupModal && (
        <div className="study-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-age-title">
          <div className="study-modal study-modal--sm">
            <div className="study-modal__header">
              <h3 id="modal-age-title">Add Age Group</h3>
              <button
                type="button"
                className="study-modal__close"
                onClick={() => setShowAddAgeGroupModal(false)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="study-modal__body">
              <div className="study-form-group">
                <label className="study-form-label">Group Name</label>
                <input
                  type="text"
                  className="study-form-input"
                  placeholder="e.g. Pediatric (1-12 yrs)"
                  value={newAgeGroupName}
                  onChange={(e) => setNewAgeGroupName(e.target.value)}
                  required
                />
              </div>
              <div className="study-form-group">
                <label className="study-form-label">Sample Target (N)</label>
                <input
                  type="number"
                  min="0"
                  className="study-form-input"
                  placeholder="e.g. 50"
                  value={newAgeGroupSample}
                  onChange={(e) => setNewAgeGroupSample(e.target.value)}
                />
              </div>
              <div className="study-form-row">
                <div className="study-form-group">
                  <label className="study-form-label">Min Age (Years)</label>
                  <input
                    type="number"
                    min="0"
                    className="study-form-input"
                    placeholder="Min"
                    value={newAgeMin}
                    onChange={(e) => setNewAgeMin(e.target.value)}
                  />
                </div>
                <div className="study-form-group">
                  <label className="study-form-label">Max Age (Years)</label>
                  <input
                    type="number"
                    min="0"
                    className="study-form-input"
                    placeholder="Max"
                    value={newAgeMax}
                    onChange={(e) => setNewAgeMax(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="study-modal__footer">
              <button
                type="button"
                className="study-settings-btn study-settings-btn--outline-secondary"
                onClick={() => setShowAddAgeGroupModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="study-settings-btn study-settings-btn--primary"
                onClick={handleAddAgeGroup}
                disabled={!newAgeGroupName.trim()}
              >
                Add Age Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Sex/Gender Modal */}
      {showAddGenderModal && (
        <div className="study-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-gender-title">
          <div className="study-modal study-modal--sm">
            <div className="study-modal__header">
              <h3 id="modal-gender-title">Add Sex/Gender Group</h3>
              <button
                type="button"
                className="study-modal__close"
                onClick={() => setShowAddGenderModal(false)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="study-modal__body">
              <div className="study-form-group">
                <label className="study-form-label">Sex / Gender Label</label>
                <input
                  type="text"
                  className="study-form-input"
                  placeholder="e.g. Female, Male, Non-binary"
                  value={newGenderName}
                  onChange={(e) => setNewGenderName(e.target.value)}
                  required
                />
              </div>
              <div className="study-form-group">
                <label className="study-form-label">Sample Target (N)</label>
                <input
                  type="number"
                  min="0"
                  className="study-form-input"
                  placeholder="e.g. 75"
                  value={newGenderSample}
                  onChange={(e) => setNewGenderSample(e.target.value)}
                />
              </div>
            </div>
            <div className="study-modal__footer">
              <button
                type="button"
                className="study-settings-btn study-settings-btn--outline-secondary"
                onClick={() => setShowAddGenderModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="study-settings-btn study-settings-btn--primary"
                onClick={handleAddGenderGroup}
                disabled={!newGenderName.trim()}
              >
                Add Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Ethnicity Modal */}
      {showAddEthnicityModal && (
        <div className="study-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-eth-title">
          <div className="study-modal study-modal--sm">
            <div className="study-modal__header">
              <h3 id="modal-eth-title">Add Ethnicity Category</h3>
              <button
                type="button"
                className="study-modal__close"
                onClick={() => setShowAddEthnicityModal(false)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="study-modal__body">
              <div className="study-form-group">
                <label className="study-form-label">Ethnicity Category Label</label>
                <input
                  type="text"
                  className="study-form-input"
                  placeholder="e.g. Hispanic or Latino, Not Hispanic or Latino"
                  value={newEthLabel}
                  onChange={(e) => setNewEthLabel(e.target.value)}
                  required
                />
              </div>
              <div className="study-form-group">
                <label className="study-form-label">Sample Target (N)</label>
                <input
                  type="number"
                  min="0"
                  className="study-form-input"
                  placeholder="e.g. 50"
                  value={newEthSample}
                  onChange={(e) => setNewEthSample(e.target.value)}
                />
              </div>
            </div>
            <div className="study-modal__footer">
              <button
                type="button"
                className="study-settings-btn study-settings-btn--outline-secondary"
                onClick={() => setShowAddEthnicityModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="study-settings-btn study-settings-btn--primary"
                onClick={handleAddEthnicityGroup}
                disabled={!newEthLabel.trim()}
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Race Modal */}
      {showAddRaceModal && (
        <div className="study-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-race-title">
          <div className="study-modal study-modal--sm">
            <div className="study-modal__header">
              <h3 id="modal-race-title">Add Race Category</h3>
              <button
                type="button"
                className="study-modal__close"
                onClick={() => setShowAddRaceModal(false)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="study-modal__body">
              <div className="study-form-group">
                <label className="study-form-label">Race Category Label</label>
                <input
                  type="text"
                  className="study-form-input"
                  placeholder="e.g. Asian, Black / African American, White"
                  value={newRaceLabel}
                  onChange={(e) => setNewRaceLabel(e.target.value)}
                  required
                />
              </div>
              <div className="study-form-group">
                <label className="study-form-label">Sample Target (N)</label>
                <input
                  type="number"
                  min="0"
                  className="study-form-input"
                  placeholder="e.g. 50"
                  value={newRaceSample}
                  onChange={(e) => setNewRaceSample(e.target.value)}
                />
              </div>
            </div>
            <div className="study-modal__footer">
              <button
                type="button"
                className="study-settings-btn study-settings-btn--outline-secondary"
                onClick={() => setShowAddRaceModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="study-settings-btn study-settings-btn--primary"
                onClick={handleAddRaceGroup}
                disabled={!newRaceLabel.trim()}
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Variable Modal */}
      {showAddCustomVarModal && (
        <div className="study-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-var-title">
          <div className="study-modal study-modal--md">
            <div className="study-modal__header">
              <h3 id="modal-var-title">Add Custom Variable</h3>
              <button
                type="button"
                className="study-modal__close"
                onClick={() => setShowAddCustomVarModal(false)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="study-modal__body">
              <div className="study-form-group">
                <label className="study-form-label">Variable Name</label>
                <input
                  type="text"
                  className="study-form-input"
                  placeholder="e.g. Handedness, Blood Pressure, Cohort Batch"
                  value={newVarName}
                  onChange={(e) => setNewVarName(e.target.value)}
                  required
                />
              </div>

              <div className="study-form-group">
                <label className="study-form-label">Variable Type</label>
                <select
                  className="study-form-select"
                  value={newVarType}
                  onChange={(e) => setNewVarType(e.target.value)}
                >
                  <option value="single">Single Select Dropdown</option>
                  <option value="multi">Multi Select</option>
                  <option value="short">Short Text (Single Line)</option>
                  <option value="long">Long Text (Multi Line)</option>
                  <option value="number">Number</option>
                  <option value="date">Date (YYYY-MM-DD)</option>
                  <option value="dateTime">Date and Time</option>
                </select>
              </div>

              {/* Options builder for Single & Multi */}
              {(newVarType === 'single' || newVarType === 'multi') && (
                <div className="study-form-group">
                  <label className="study-form-label">Selectable Options</label>
                  <div className="study-options-editor">
                    {newVarOptions.map((opt, idx) => (
                      <div key={idx} className="study-options-editor__row">
                        <input
                          type="text"
                          className="study-form-input study-form-input--sm"
                          value={opt}
                          onChange={(e) => {
                            const updated = [...newVarOptions];
                            updated[idx] = e.target.value;
                            setNewVarOptions(updated);
                          }}
                          placeholder={`Option ${idx + 1}`}
                        />
                        {newVarOptions.length > 1 && (
                          <button
                            type="button"
                            className="study-action-btn study-action-btn--danger"
                            onClick={() => setNewVarOptions(newVarOptions.filter((_, i) => i !== idx))}
                            aria-label={`Remove option ${idx + 1}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      className="study-settings-btn study-settings-btn--outline-secondary study-settings-btn--xs"
                      onClick={() => setNewVarOptions([...newVarOptions, `Option ${newVarOptions.length + 1}`])}
                    >
                      <Plus size={12} /> Add Option
                    </button>
                  </div>
                </div>
              )}

              {/* Flags */}
              <div className="study-checkbox-group">
                <label className="study-checkbox-label">
                  <input
                    type="checkbox"
                    checked={newVarIsGlobal}
                    onChange={(e) => setNewVarIsGlobal(e.target.checked)}
                  />
                  <span>Make Global (Available across all tenant studies in Registry)</span>
                </label>
                <label className="study-checkbox-label">
                  <input
                    type="checkbox"
                    checked={newVarIsBlind}
                    onChange={(e) => setNewVarIsBlind(e.target.checked)}
                  />
                  <span>Double Blind (Masked from study coordinators without unblind permissions)</span>
                </label>
              </div>
            </div>
            <div className="study-modal__footer">
              <button
                type="button"
                className="study-settings-btn study-settings-btn--outline-secondary"
                onClick={() => setShowAddCustomVarModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="study-settings-btn study-settings-btn--primary"
                onClick={handleAddCustomVariable}
                disabled={!newVarName.trim()}
              >
                Add Variable
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Custom Variable Modal */}
      {editingVariable && (
        <div className="study-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-edit-var-title">
          <div className="study-modal study-modal--md">
            <div className="study-modal__header">
              <h3 id="modal-edit-var-title">Edit Custom Variable: {editingVariable.name}</h3>
              <button
                type="button"
                className="study-modal__close"
                onClick={() => setEditingVariable(null)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="study-modal__body">
              <div className="study-form-group">
                <label className="study-form-label">Variable Name</label>
                <input
                  type="text"
                  className="study-form-input"
                  value={editVarName}
                  onChange={(e) => setEditVarName(e.target.value)}
                  required
                />
              </div>

              <div className="study-form-group">
                <label className="study-form-label">Variable Type</label>
                <select
                  className="study-form-select"
                  value={editVarType}
                  onChange={(e) => setEditVarType(e.target.value)}
                >
                  <option value="single">Single Select Dropdown</option>
                  <option value="multi">Multi Select</option>
                  <option value="short">Short Text (Single Line)</option>
                  <option value="long">Long Text (Multi Line)</option>
                  <option value="number">Number</option>
                  <option value="date">Date (YYYY-MM-DD)</option>
                  <option value="dateTime">Date and Time</option>
                </select>
              </div>

              {/* Options Editor for Categorical types */}
              {(editVarType === 'single' || editVarType === 'multi') && (
                <div className="study-form-group">
                  <label className="study-form-label">Selectable Options & Order</label>
                  <div className="study-options-manager">
                    <table className="study-options-manager__table" aria-label="Option List">
                      <thead>
                        <tr>
                          <th>Order</th>
                          <th>Option Label</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {editVarOptions.map((opt, idx) => (
                          <tr key={opt.value || idx}>
                            <td style={{ width: '60px' }}>
                              <div style={{ display: 'flex', gap: '2px' }}>
                                <button
                                  type="button"
                                  className="study-action-btn"
                                  disabled={idx === 0}
                                  onClick={() => {
                                    const next = [...editVarOptions];
                                    const temp = next[idx];
                                    next[idx] = next[idx - 1];
                                    next[idx - 1] = temp;
                                    setEditVarOptions(next);
                                  }}
                                  title="Move Option Up"
                                >
                                  <ArrowUp size={12} />
                                </button>
                                <button
                                  type="button"
                                  className="study-action-btn"
                                  disabled={idx === editVarOptions.length - 1}
                                  onClick={() => {
                                    const next = [...editVarOptions];
                                    const temp = next[idx];
                                    next[idx] = next[idx + 1];
                                    next[idx + 1] = temp;
                                    setEditVarOptions(next);
                                  }}
                                  title="Move Option Down"
                                >
                                  <ArrowDown size={12} />
                                </button>
                              </div>
                            </td>
                            <td>
                              <input
                                type="text"
                                className="study-form-input study-form-input--sm"
                                value={opt.label}
                                onChange={(e) => {
                                  const updated = [...editVarOptions];
                                  updated[idx] = { ...updated[idx], label: e.target.value };
                                  setEditVarOptions(updated);
                                }}
                                placeholder={`Option ${idx + 1}`}
                              />
                            </td>
                            <td className="text-right">
                              {editVarOptions.length > 1 && (
                                <button
                                  type="button"
                                  className="study-action-btn study-action-btn--danger"
                                  onClick={() => setEditVarOptions(editVarOptions.filter((_, i) => i !== idx))}
                                  title="Delete Option"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button
                      type="button"
                      className="study-settings-btn study-settings-btn--outline-secondary study-settings-btn--xs"
                      onClick={() =>
                        setEditVarOptions([
                          ...editVarOptions,
                          {
                            label: `Option ${editVarOptions.length + 1}`,
                            value: `option_${editVarOptions.length + 1}`,
                            order: editVarOptions.length,
                          },
                        ])
                      }
                    >
                      <Plus size={12} /> Add Option
                    </button>
                  </div>
                </div>
              )}

              {/* Flags */}
              <div className="study-checkbox-group">
                <label className="study-checkbox-label">
                  <input
                    type="checkbox"
                    checked={editVarIsGlobal}
                    onChange={(e) => setEditVarIsGlobal(e.target.checked)}
                  />
                  <span>Make Global (Available across all tenant studies in Registry)</span>
                </label>
                <label className="study-checkbox-label">
                  <input
                    type="checkbox"
                    checked={editVarIsBlind}
                    onChange={(e) => setEditVarIsBlind(e.target.checked)}
                  />
                  <span>Double Blind (Masked from study coordinators without unblind permissions)</span>
                </label>
              </div>
            </div>
            <div className="study-modal__footer">
              <button
                type="button"
                className="study-settings-btn study-settings-btn--outline-secondary"
                onClick={() => setEditingVariable(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="study-settings-btn study-settings-btn--primary"
                onClick={handleSaveEditedVariable}
                disabled={!editVarName.trim()}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unlock Global Variable Confirmation Modal */}
      {unlockPromptVariable && (
        <div className="study-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-unlock-title">
          <div className="study-modal study-modal--sm">
            <div className="study-modal__header">
              <Lock size={18} className="study-requirements-section__icon" />
              <h3 id="modal-unlock-title">Unlock to Make Edits?</h3>
              <button
                type="button"
                className="study-modal__close"
                onClick={() => setUnlockPromptVariable(null)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="study-modal__body">
              <p>
                You requested to make changes to the Global Variable <strong>{unlockPromptVariable.name}</strong>.
              </p>
              <p className="study-warning-text">
                Once made, changes to global variables apply across all studies that use this variable. Are you sure you want to unlock this variable for edits?
              </p>
            </div>
            <div className="study-modal__footer">
              <button
                type="button"
                className="study-settings-btn study-settings-btn--outline-secondary"
                onClick={() => setUnlockPromptVariable(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="study-settings-btn study-settings-btn--primary"
                onClick={() => handleUnlockVariable(unlockPromptVariable)}
              >
                Unlock Variable
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Global Variable Modal */}
      {showAddGlobalVarModal && (
        <div className="study-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-global-title">
          <div className="study-modal study-modal--md">
            <div className="study-modal__header">
              <h3 id="modal-global-title">Add Global Custom Variable</h3>
              <button
                type="button"
                className="study-modal__close"
                onClick={() => setShowAddGlobalVarModal(false)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="study-modal__body">
              <p className="study-modal__description">
                Select a global variable defined in this tenant to include in this study's protocol.
              </p>
              {globalVariables.length === 0 ? (
                <div className="study-empty-state-card">
                  <p>No global variables found in this tenant.</p>
                </div>
              ) : (
                <div className="study-global-var-list">
                  {globalVariables.map((gv) => {
                    const alreadyAdded = customVariables.some((v) => v.name.toLowerCase() === gv.name.toLowerCase());
                    return (
                      <div key={gv.id || gv.name} className="study-global-var-item">
                        <div>
                          <strong>{gv.name}</strong>
                          <span className="study-badge study-badge--sm" style={{ marginLeft: '8px' }}>
                            {gv.variableType}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="study-settings-btn study-settings-btn--outline-primary study-settings-btn--xs"
                          disabled={alreadyAdded}
                          onClick={() => handleAddGlobalVariable(gv)}
                        >
                          {alreadyAdded ? 'Added' : 'Add to Study'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="study-modal__footer">
              <button
                type="button"
                className="study-settings-btn study-settings-btn--outline-secondary"
                onClick={() => setShowAddGlobalVarModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Variable Group Modal */}
      {showAddGroupModal && (
        <div className="study-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-group-title">
          <div className="study-modal study-modal--sm">
            <div className="study-modal__header">
              <h3 id="modal-group-title">Add Variable Group</h3>
              <button
                type="button"
                className="study-modal__close"
                onClick={() => setShowAddGroupModal(false)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="study-modal__body">
              <div className="study-form-group">
                <label className="study-form-label">Group Name</label>
                <input
                  type="text"
                  className="study-form-input"
                  placeholder="e.g. Neurological Battery, Baseline Vitals"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="study-modal__footer">
              <button
                type="button"
                className="study-settings-btn study-settings-btn--outline-secondary"
                onClick={() => setShowAddGroupModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="study-settings-btn study-settings-btn--primary"
                onClick={handleAddVariableGroup}
                disabled={!newGroupName.trim()}
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Taxonomy Modal (Relationship or Outcome) */}
      {showAddTaxonomyModal && (
        <div className="study-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-tax-title">
          <div className="study-modal study-modal--sm">
            <div className="study-modal__header">
              <h3 id="modal-tax-title">
                Add Contact {showAddTaxonomyModal === 'relationship' ? 'Relationship' : 'Outcome'}
              </h3>
              <button
                type="button"
                className="study-modal__close"
                onClick={() => setShowAddTaxonomyModal(null)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="study-modal__body">
              <div className="study-form-group">
                <label className="study-form-label">
                  {showAddTaxonomyModal === 'relationship' ? 'Relationship Title' : 'Outcome Title'}
                </label>
                <input
                  type="text"
                  className="study-form-input"
                  placeholder={
                    showAddTaxonomyModal === 'relationship'
                      ? 'e.g. Sibling, Grandparent'
                      : 'e.g. Appointment Rescheduled'
                  }
                  value={newTaxonomyName}
                  onChange={(e) => setNewTaxonomyName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="study-modal__footer">
              <button
                type="button"
                className="study-settings-btn study-settings-btn--outline-secondary"
                onClick={() => setShowAddTaxonomyModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="study-settings-btn study-settings-btn--primary"
                onClick={handleAddTaxonomy}
                disabled={!newTaxonomyName.trim()}
              >
                Add Option
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Safeguard Modal for Deletions */}
      {confirmDeleteModal && (
        <div className="study-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-delete-title">
          <div className="study-modal study-modal--sm">
            <div className="study-modal__header study-modal__header--danger">
              <AlertTriangle size={20} className="study-modal-icon--danger" />
              <h3 id="modal-delete-title">
                {confirmDeleteModal.type === 'variable' && confirmDeleteModal.isGlobal
                  ? 'Remove Global Variable from Study'
                  : 'Confirm Deletion'}
              </h3>
              <button
                type="button"
                className="study-modal__close"
                onClick={() => setConfirmDeleteModal(null)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="study-modal__body">
              {confirmDeleteModal.type === 'variable' && confirmDeleteModal.isGlobal ? (
                <div>
                  <p>
                    Are you sure you want to remove <strong>{confirmDeleteModal.name}</strong> from this study?
                  </p>
                  <p className="study-info-text">
                    This variable is being used in other studies. If you continue, the variable will be removed from this study only but will continue to be available in other studies.
                  </p>
                </div>
              ) : (
                <p>
                  Are you sure you want to permanently remove <strong>{confirmDeleteModal.name}</strong>?
                </p>
              )}
              {confirmDeleteModal.type === 'variable' && !confirmDeleteModal.isGlobal && (
                <p className="study-warning-text">
                  Any existing participant responses stored for this variable will no longer be visible or editable.
                </p>
              )}
              {confirmDeleteModal.type === 'variableGroup' && (
                <p className="study-info-text">
                  Variables inside this group will not be deleted; they will simply be returned to ungrouped status.
                </p>
              )}
            </div>
            <div className="study-modal__footer">
              <button
                type="button"
                className="study-settings-btn study-settings-btn--outline-secondary"
                onClick={() => setConfirmDeleteModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="study-settings-btn study-settings-btn--danger"
                onClick={() => {
                  if (confirmDeleteModal.type === 'milestone') {
                    handleDeleteMilestone(confirmDeleteModal.id);
                  } else if (confirmDeleteModal.type === 'group') {
                    handleDeleteGroup(confirmDeleteModal.id);
                  } else if (confirmDeleteModal.type === 'variable') {
                    handleDeleteVariable(confirmDeleteModal.id);
                  } else if (confirmDeleteModal.type === 'variableGroup') {
                    handleDeleteVariableGroup(confirmDeleteModal.id);
                  } else if (confirmDeleteModal.type === 'taxonomy') {
                    handleDeleteTaxonomy(
                      confirmDeleteModal.id,
                      contactRelationships.some((r) => (r.id || r.name) === confirmDeleteModal.id)
                        ? 'relationship'
                        : 'outcome'
                    );
                  }
                }}
              >
                {confirmDeleteModal.type === 'variable' && confirmDeleteModal.isGlobal ? 'Remove from Study' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudySettingsRequirements;
