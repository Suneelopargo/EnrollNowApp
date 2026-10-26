// frontend/microfrontends/study/src/components/StudySettingsRequirements.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  studyApi,
  StudyRequirementsData,
  StudyMilestone,
  DemographicGroup,
  GenderGroup,
  StudyCustomVariable,
  StudyVariableGroup,
  StudyLayoutItem,
  ContactTaxonomy,
  VariableOption,
} from '../../../../shared/api/studyApi';
import { toast } from '../../../../shared/toaster';
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
  AlertTriangle,
  Loader2,
  X,
  Search,
  Globe,
  EyeOff,
  Edit2,
  FolderPlus,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  GripVertical,
  List,
  Lock,
  Unlock,
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
  const [isSavingOperation, setIsSavingOperation] = useState<boolean>(false);

  // Requirements Data State
  const [sampleSize, setSampleSize] = useState<number | ''>('');
  const [lastSavedSampleSize, setLastSavedSampleSize] = useState<number | ''>('');
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

  // Toggled categorical variable options view & assign group state
  const [expandedOptionsVarIds, setExpandedOptionsVarIds] = useState<Set<string>>(new Set());
  const [assignGroupVarId, setAssignGroupVarId] = useState<string | null>(null);

  const toggleOptions = (varId: string) => {
    setExpandedOptionsVarIds((prev) => {
      const next = new Set(prev);
      if (next.has(varId)) next.delete(varId);
      else next.add(varId);
      return next;
    });
  };

  // Toggled age range and gender sub-groups for demographic groups
  const [expandedAgeRangeIds, setExpandedAgeRangeIds] = useState<Set<string>>(new Set());
  const [expandedGenderGroupIds, setExpandedGenderGroupIds] = useState<Set<string>>(new Set());

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

  const [editingMilestone, setEditingMilestone] = useState<StudyMilestone | null>(null);
  const [editMilestoneDate, setEditMilestoneDate] = useState<string>('');
  const [editMilestoneTarget, setEditMilestoneTarget] = useState<string>('');
  const [editMilestoneDesc, setEditMilestoneDesc] = useState<string>('');

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

  // Uncommitted changes tracking and silent auto-save references
  const studyGroupsRef = useRef(studyGroups);
  const customVariablesRef = useRef(customVariables);
  const lastSavedStudyGroupsRef = useRef<string>('');
  const lastSavedCustomVarsRef = useRef<string>('');
  const isDirtyRef = useRef(false);
  const onDirtyChangeRef = useRef(onDirtyChange);

  useEffect(() => {
    studyGroupsRef.current = studyGroups;
  }, [studyGroups]);

  useEffect(() => {
    customVariablesRef.current = customVariables;
  }, [customVariables]);

  useEffect(() => {
    onDirtyChangeRef.current = onDirtyChange;
  }, [onDirtyChange]);

  // Operation-level persistence helper (replaces page-level dirty/save workflow)
  const persistPartial = useCallback(
    async (
      partial: Parameters<typeof studyApi.updateStudyRequirements>[1],
      successMsg?: string
    ): Promise<boolean> => {
      if (!canManageSettings || isArchived) return false;
      setIsSavingOperation(true);
      try {
        const updated = await studyApi.updateStudyRequirements(studyId, partial, {
          skipLoader: true,
          headers: { 'x-skip-loader': 'true' },
        } as any);
        if (partial.sampleSize !== undefined) {
          setSampleSize(updated.sampleSize ?? '');
          setLastSavedSampleSize(updated.sampleSize ?? '');
        }
        if (partial.studyGroups !== undefined) {
          setStudyGroups(updated.studyGroups || []);
          studyGroupsRef.current = updated.studyGroups || [];
          lastSavedStudyGroupsRef.current = JSON.stringify(updated.studyGroups || []);
        }
        if (partial.customVariables !== undefined) {
          setCustomVariables(updated.customVariables || []);
          customVariablesRef.current = updated.customVariables || [];
          lastSavedCustomVarsRef.current = JSON.stringify(updated.customVariables || []);
        }
        if (partial.variableGroups !== undefined) {
          setVariableGroups(updated.variableGroups || []);
        }
        if (partial.customVariableLayout !== undefined) {
          setLayout(updated.customVariableLayout || []);
        }
        if (partial.contactRelationships !== undefined) {
          setContactRelationships(updated.contactRelationships || []);
        }
        if (partial.contactOutcomes !== undefined) {
          setContactOutcomes(updated.contactOutcomes || []);
        }
        isDirtyRef.current = false;
        onDirtyChangeRef.current?.(false);
        if (successMsg) {
          toast.success(successMsg);
        }
        return true;
      } catch (err: any) {
        console.error('Failed to persist requirements operation:', err);
        toast.error(err?.response?.data?.message || err?.message || 'Failed to save changes.');
        return false;
      } finally {
        setIsSavingOperation(false);
      }
    },
    [studyId, canManageSettings, isArchived]
  );

  // Auto-save uncommitted groups/options when user navigates away or moves page
  useEffect(() => {
    return () => {
      if (isDirtyRef.current && canManageSettings && !isArchived) {
        studyApi
          .updateStudyRequirements(
            studyId,
            {
              studyGroups: studyGroupsRef.current,
              customVariables: customVariablesRef.current,
            },
            { skipLoader: true, headers: { 'x-skip-loader': 'true' } } as any
          )
          .then(() => {
            toast.success('Study requirements auto-saved.');
          })
          .catch((err) => {
            console.error('Auto-save on leave failed:', err);
          });
      }
    };
  }, [studyId, canManageSettings, isArchived]);

  // Fetch study requirements - ONLY re-fetches when studyId changes!
  const loadRequirements = useCallback(async () => {
    if (!studyId) return;
    setLoading(true);
    try {
      const data: StudyRequirementsData = await studyApi.getStudyRequirements(studyId, {
        skipLoader: true,
        headers: { 'x-skip-loader': 'true' },
      } as any);
      const sSize = data.sampleSize ?? '';
      setSampleSize(sSize);
      setLastSavedSampleSize(sSize);
      setMilestones(data.milestones || []);
      const groups = data.studyGroups || [];
      setStudyGroups(groups);
      studyGroupsRef.current = groups;
      lastSavedStudyGroupsRef.current = JSON.stringify(groups);
      const vars = data.customVariables || [];
      setCustomVariables(vars);
      customVariablesRef.current = vars;
      lastSavedCustomVarsRef.current = JSON.stringify(vars);
      setVariableGroups(data.variableGroups || []);
      setLayout(data.customVariableLayout || []);
      setContactRelationships(data.contactRelationships || []);
      setContactOutcomes(data.contactOutcomes || []);
      setGlobalVariables(data.globalVariables || []);
      setUnlockedVariableIds(new Set());
      isDirtyRef.current = false;
      onDirtyChangeRef.current?.(false);
    } catch (err: any) {
      console.error('Failed to load study requirements:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to load study requirements.');
    } finally {
      setLoading(false);
    }
  }, [studyId]);

  useEffect(() => {
    loadRequirements();
  }, [loadRequirements]);

  // Target Sample Size (N) - persists onBlur
  const handleBlurSampleSize = async () => {
    const val = sampleSize === '' ? null : Number(sampleSize);
    const prev = lastSavedSampleSize === '' ? null : Number(lastSavedSampleSize);
    if (val === prev) return;
    await persistPartial({ sampleSize: val }, 'Target study sample size (N) saved.');
  };

  // Group Quotas - persists onBlur of sampleSize / gender breakdown inputs ONLY when changed
  const handleBlurStudyGroups = async () => {
    const currentJson = JSON.stringify(studyGroups);
    if (currentJson === lastSavedStudyGroupsRef.current) {
      return;
    }
    const ok = await persistPartial({ studyGroups }, 'Demographic quota target saved.');
    if (ok) {
      lastSavedStudyGroupsRef.current = currentJson;
    }
  };

  // Milestone Actions
  const handleAddMilestone = async () => {
    if (!newMilestoneDate || !newMilestoneTarget) return;
    const target = parseInt(newMilestoneTarget, 10);
    if (isNaN(target) || target <= 0) {
      toast.error('Milestone target must be a positive integer.');
      return;
    }
    setIsSavingOperation(true);
    try {
      const newM = await studyApi.addStudyMilestone(studyId, {
        milestoneDate: newMilestoneDate,
        participantTarget: target,
        description: newMilestoneDesc.trim() || undefined,
      }, { skipLoader: true, headers: { 'x-skip-loader': 'true' } } as any);
      setMilestones((prev) => [...prev, newM].sort((a, b) => a.milestoneDate.localeCompare(b.milestoneDate)));
      setShowAddMilestoneModal(false);
      setNewMilestoneDate('');
      setNewMilestoneTarget('');
      setNewMilestoneDesc('');
      toast.success('Recruitment milestone added.');
      onStudyUpdated?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to add milestone.');
    } finally {
      setIsSavingOperation(false);
    }
  };

  const handleOpenEditMilestone = (m: StudyMilestone) => {
    setEditingMilestone(m);
    setEditMilestoneDate(m.milestoneDate);
    setEditMilestoneTarget(String(m.participantTarget));
    setEditMilestoneDesc(m.description || '');
  };

  const handleSaveEditedMilestone = async () => {
    if (!editingMilestone || !editingMilestone.id || !editMilestoneDate || !editMilestoneTarget) return;
    const target = parseInt(editMilestoneTarget, 10);
    if (isNaN(target) || target <= 0) {
      toast.error('Milestone target must be a positive integer.');
      return;
    }
    setIsSavingOperation(true);
    try {
      const updated = await studyApi.updateStudyMilestone(studyId, editingMilestone.id, {
        milestoneDate: editMilestoneDate,
        participantTarget: target,
        description: editMilestoneDesc.trim() || undefined,
      }, { skipLoader: true, headers: { 'x-skip-loader': 'true' } } as any);
      setMilestones((prev) =>
        prev
          .map((m) => (m.id === editingMilestone.id ? updated : m))
          .sort((a, b) => a.milestoneDate.localeCompare(b.milestoneDate))
      );
      setEditingMilestone(null);
      toast.success('Milestone updated.');
      onStudyUpdated?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update milestone.');
    } finally {
      setIsSavingOperation(false);
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    await handleDeleteMilestoneDirect(milestoneId);
  };

  const handleAddMilestoneInline = async () => {
    const today = new Date().toISOString().substring(0, 10);
    try {
      setIsSavingOperation(true);
      const newM = await studyApi.addStudyMilestone(studyId, {
        milestoneDate: today,
        participantTarget: 0,
      }, { skipLoader: true, headers: { 'x-skip-loader': 'true' } } as any);
      setMilestones((prev) => [...prev, newM].sort((a, b) => a.milestoneDate.localeCompare(b.milestoneDate)));
      toast.success('Recruitment milestone added.');
      onStudyUpdated?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to add milestone.');
    } finally {
      setIsSavingOperation(false);
    }
  };

  const handleUpdateMilestoneDirect = async (
    m: StudyMilestone,
    partialUpdate: { milestoneDate?: string; participantTarget?: number }
  ) => {
    if (!m.id) return;
    const newDate = partialUpdate.milestoneDate ?? m.milestoneDate;
    const newTarget = partialUpdate.participantTarget ?? m.participantTarget;
    try {
      setIsSavingOperation(true);
      const updated = await studyApi.updateStudyMilestone(studyId, m.id, {
        milestoneDate: newDate,
        participantTarget: newTarget,
        description: m.description,
      }, { skipLoader: true, headers: { 'x-skip-loader': 'true' } } as any);
      setMilestones((prev) =>
        prev
          .map((item) => (item.id === m.id ? updated : item))
          .sort((a, b) => a.milestoneDate.localeCompare(b.milestoneDate))
      );
      toast.success('Milestone updated.');
      onStudyUpdated?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update milestone.');
    } finally {
      setIsSavingOperation(false);
    }
  };

  const handleDeleteMilestoneDirect = async (milestoneId: string) => {
    try {
      setIsSavingOperation(true);
      await studyApi.deleteStudyMilestone(studyId, milestoneId, { skipLoader: true, headers: { 'x-skip-loader': 'true' } } as any);
      setMilestones((prev) => prev.filter((m) => m.id !== milestoneId));
      setConfirmDeleteModal(null);
      toast.success('Milestone deleted.');
      onStudyUpdated?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete milestone.');
    } finally {
      setIsSavingOperation(false);
    }
  };

  const getGroupVariableIds = useCallback((group: StudyVariableGroup): string[] => {
    return group.variableIds && group.variableIds.length > 0
      ? group.variableIds
      : group.members && group.members.length > 0
      ? group.members
      : [];
  }, []);

  // Age Groups
  const ageGroups = useMemo(() => {
    return studyGroups.filter((g) => g.defaultCategoryName === 'age');
  }, [studyGroups]);

  const handleAddAgeGroup = () => {
    const label = newAgeGroupName.trim();
    const newGroup: DemographicGroup = {
      id: 'grp_age_' + Date.now(),
      defaultCategoryName: 'age',
      label: label || '',
      sampleSize: newAgeGroupSample || '',
      ageRange: { min: 1, max: 1 },
    };
    const updated = [...studyGroups, newGroup];
    setStudyGroups(updated);
    studyGroupsRef.current = updated;
    isDirtyRef.current = true;

    if (showAddAgeGroupModal) {
      setShowAddAgeGroupModal(false);
      setNewAgeGroupName('');
      setNewAgeGroupSample('');
      persistPartial({ studyGroups: updated }, 'Age group added.');
    }
  };

  // Sex / Gender Groups
  const genderGroups = useMemo(() => {
    return studyGroups.filter((g) => g.defaultCategoryName === 'sex');
  }, [studyGroups]);

  const handleAddGenderGroup = () => {
    const label = newGenderName.trim();
    const newGroup: DemographicGroup = {
      id: 'grp_gen_' + Date.now(),
      defaultCategoryName: 'sex',
      label: label || '',
      sampleSize: newGenderSample || '',
    };
    const updated = [...studyGroups, newGroup];
    setStudyGroups(updated);
    studyGroupsRef.current = updated;
    isDirtyRef.current = true;

    if (showAddGenderModal) {
      setShowAddGenderModal(false);
      setNewGenderName('');
      setNewGenderSample('');
      persistPartial({ studyGroups: updated }, 'Gender group added.');
    }
  };

  // Ethnicity Groups
  const ethnicityGroups = useMemo(() => {
    return studyGroups.filter((g) => g.defaultCategoryName === 'ethnicity');
  }, [studyGroups]);

  const handleAddEthnicityGroup = () => {
    const label = newEthLabel.trim();
    const newGroup: DemographicGroup = {
      id: 'grp_eth_' + Date.now(),
      defaultCategoryName: 'ethnicity',
      label: label || '',
      sampleSize: newEthSample || '',
    };
    const updated = [...studyGroups, newGroup];
    setStudyGroups(updated);
    studyGroupsRef.current = updated;
    isDirtyRef.current = true;

    if (showAddEthnicityModal) {
      setShowAddEthnicityModal(false);
      setNewEthLabel('');
      setNewEthSample('');
      persistPartial({ studyGroups: updated }, 'Ethnicity category added.');
    }
  };

  // Race Groups
  const raceGroups = useMemo(() => {
    return studyGroups.filter((g) => g.defaultCategoryName === 'race');
  }, [studyGroups]);

  const handleAddRaceGroup = () => {
    const label = newRaceLabel.trim();
    const newGroup: DemographicGroup = {
      id: 'grp_race_' + Date.now(),
      defaultCategoryName: 'race',
      label: label || '',
      sampleSize: newRaceSample || '',
    };
    const updated = [...studyGroups, newGroup];
    setStudyGroups(updated);
    studyGroupsRef.current = updated;
    isDirtyRef.current = true;

    if (showAddRaceModal) {
      setShowAddRaceModal(false);
      setNewRaceLabel('');
      setNewRaceSample('');
      persistPartial({ studyGroups: updated }, 'Race category added.');
    }
  };

  const handleEnableAgeRange = (groupId: string) => {
    setExpandedAgeRangeIds((prev) => new Set(prev).add(groupId));
    const updated = studyGroups.map((g) =>
      g.id === groupId ? { ...g, ageRange: { min: 1, max: 1 } } : g
    );
    setStudyGroups(updated);
    studyGroupsRef.current = updated;
    isDirtyRef.current = true;
  };

  const handleAddNestedGender = (groupId: string) => {
    setExpandedGenderGroupIds((prev) => new Set(prev).add(groupId));
    const targetGroup = studyGroups.find((g) => g.id === groupId);
    const currentGenders = targetGroup?.genderGroups || [];
    const newNested: GenderGroup = {
      id: 'gen_' + Date.now(),
      gender: 'Male',
      participants: 0,
    };
    const updatedGroups = studyGroups.map((g) =>
      g.id === groupId ? { ...g, genderGroups: [...currentGenders, newNested] } : g
    );
    setStudyGroups(updatedGroups);
    studyGroupsRef.current = updatedGroups;
    isDirtyRef.current = true;
  };

  const handleUpdateGroupField = (groupId: string, updater: (group: DemographicGroup) => DemographicGroup) => {
    setStudyGroups((prev) => {
      const updated = prev.map((g) => (g.id === groupId ? updater(g) : g));
      studyGroupsRef.current = updated;
      return updated;
    });
    isDirtyRef.current = true;
  };

  const handleUpdateNestedGender = (
    groupId: string,
    nestedId: string,
    partialNested: Partial<GenderGroup>
  ) => {
    const updatedGroups = studyGroups.map((g) => {
      if (g.id !== groupId) return g;
      const currentGenders = g.genderGroups || [];
      const updatedGenders = currentGenders.map((gg) =>
        gg.id === nestedId ? { ...gg, ...partialNested } : gg
      );
      return { ...g, genderGroups: updatedGenders };
    });
    setStudyGroups(updatedGroups);
    studyGroupsRef.current = updatedGroups;
    isDirtyRef.current = true;
  };

  const handleDeleteNestedGender = async (groupId: string, nestedId: string) => {
    const updatedGroups = studyGroups.map((g) => {
      if (g.id !== groupId) return g;
      const currentGenders = g.genderGroups || [];
      return { ...g, genderGroups: currentGenders.filter((gg) => gg.id !== nestedId) };
    });
    setStudyGroups(updatedGroups);
    studyGroupsRef.current = updatedGroups;
    await persistPartial({ studyGroups: updatedGroups }, 'Gender quota removed.');
  };

  const handleUpdateGroupNestedGender = (groupId: string, gender: string, targetStr: string) => {
    const target = targetStr ? parseInt(targetStr, 10) : null;
    setStudyGroups((prev) => {
      const updated = prev.map((g) => {
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
      });
      studyGroupsRef.current = updated;
      return updated;
    });
    isDirtyRef.current = true;
  };

  const handleDeleteGroup = async (groupId: string) => {
    const updated = studyGroups.filter((g) => g.id !== groupId);
    const ok = await persistPartial({ studyGroups: updated }, 'Demographic group deleted.');
    if (ok) {
      setConfirmDeleteModal(null);
    }
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
    toast.success(`Unlocked global variable "${v.name}" for edits.`);
  };

  const handleAddCustomVariable = async () => {
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

    const updatedVars = [...customVariables, newVar];
    const updatedLayout: StudyLayoutItem[] = [
      ...layout,
      { id: 'lay_' + varId, type: 'variable' as const, refId: varId, rank: layout.length },
    ];
    const ok = await persistPartial(
      { customVariables: updatedVars, customVariableLayout: updatedLayout },
      `Custom variable "${newVar.name}" added.`
    );
    if (ok) {
      setShowAddCustomVarModal(false);
      setNewVarName('');
      setNewVarType('single');
      setNewVarIsGlobal(false);
      setNewVarIsBlind(false);
      setNewVarOptions(['Option 1', 'Option 2']);
    }
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

  const handleSaveEditedVariable = async () => {
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

    const updatedVars = customVariables.map((v) =>
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
    );

    const ok = await persistPartial(
      { customVariables: updatedVars },
      `Custom variable "${editVarName.trim()}" updated.`
    );
    if (ok) {
      setEditingVariable(null);
    }
  };

  const handleAddGlobalVariable = async (globalVar: StudyCustomVariable) => {
    if (!globalVar.id) return;
    setIsSavingOperation(true);
    try {
      const added = await studyApi.addGlobalVariableToStudy(studyId, globalVar.id, {
        skipLoader: true,
        headers: { 'x-skip-loader': 'true' },
      } as any);
      const updatedVars = [...customVariables, added];
      const updatedLayout: StudyLayoutItem[] = [
        ...layout,
        { id: 'lay_' + added.id, type: 'variable' as const, refId: added.id || '', rank: layout.length },
      ];
      await studyApi.updateStudyRequirements(
        studyId,
        { customVariableLayout: updatedLayout },
        { skipLoader: true, headers: { 'x-skip-loader': 'true' } } as any
      );
      setCustomVariables(updatedVars);
      customVariablesRef.current = updatedVars;
      setLayout(updatedLayout);
      setShowAddGlobalVarModal(false);
      toast.success(`Global variable "${added.name}" added to study.`);
      onStudyUpdated?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to add global variable.');
    } finally {
      setIsSavingOperation(false);
    }
  };

  const handleConvertToMulti = async (varId: string) => {
    const updatedVars = customVariables.map((v) =>
      v.id === varId && v.variableType === 'single' ? { ...v, variableType: 'multi' } : v
    );
    await persistPartial({ customVariables: updatedVars }, 'Variable converted to multi-select.');
  };

  const handleDeleteVariable = async (varId: string) => {
    const isGlobal = confirmDeleteModal?.isGlobal;
    const updatedVars = customVariables.filter((v) => v.id !== varId);
    const updatedGroups = variableGroups.map((vg) => {
      const remaining = getGroupVariableIds(vg).filter((id) => id !== varId);
      return { ...vg, variableIds: remaining, members: remaining };
    });
    const updatedLayout = layout.filter((item) => !(item.type === 'variable' && item.refId === varId));

    const ok = await persistPartial(
      {
        customVariables: updatedVars,
        variableGroups: updatedGroups,
        customVariableLayout: updatedLayout,
      },
      isGlobal ? 'Global variable unlinked from study.' : 'Custom variable deleted.'
    );
    if (ok) {
      setConfirmDeleteModal(null);
    }
  };

  const handleAddVariableGroup = async () => {
    if (!newGroupName.trim()) return;
    const groupId = 'vg_' + Date.now();
    const newGroup: StudyVariableGroup = {
      id: groupId,
      name: newGroupName.trim(),
      variableIds: [],
      members: [],
      rank: variableGroups.length,
    };
    const updatedGroups = [...variableGroups, newGroup];
    const updatedLayout: StudyLayoutItem[] = [
      ...layout,
      { id: 'lay_' + groupId, type: 'group' as const, refId: groupId, rank: layout.length },
    ];
    const ok = await persistPartial(
      { variableGroups: updatedGroups, customVariableLayout: updatedLayout },
      `Variable group "${newGroup.name}" created.`
    );
    if (ok) {
      setShowAddGroupModal(false);
      setNewGroupName('');
    }
  };

  const handleRenameGroup = async (groupId: string) => {
    if (!renameGroupValue.trim()) return;
    const updatedGroups = variableGroups.map((vg) =>
      vg.id === groupId ? { ...vg, name: renameGroupValue.trim() } : vg
    );
    const ok = await persistPartial({ variableGroups: updatedGroups }, 'Variable group renamed.');
    if (ok) {
      setRenamingGroupId(null);
      setRenameGroupValue('');
    }
  };

  const handleDeleteVariableGroup = async (groupId: string) => {
    const updatedGroups = variableGroups.filter((vg) => vg.id !== groupId);
    const updatedLayout = layout.filter((item) => !(item.type === 'group' && item.refId === groupId));
    const ok = await persistPartial(
      { variableGroups: updatedGroups, customVariableLayout: updatedLayout },
      'Variable group deleted. Assigned variables returned to ungrouped list.'
    );
    if (ok) {
      setConfirmDeleteModal(null);
    }
  };

  const handleAssignVariableToGroup = async (varId: string, targetGroupId: string | '') => {
    const updatedGroups = variableGroups.map((vg) => {
      const currentIds = getGroupVariableIds(vg);
      const without = currentIds.filter((id) => id !== varId);
      if (vg.id === targetGroupId) {
        const next = [...without, varId];
        return { ...vg, variableIds: next, members: next };
      }
      return { ...vg, variableIds: without, members: without };
    });
    await persistPartial({ variableGroups: updatedGroups }, 'Variable group assignment updated.');
  };

  // Layout reordering
  const handleMoveLayoutItem = async (index: number, direction: 'up' | 'down') => {
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
    await persistPartial({ customVariableLayout: reordered }, 'Layout order saved.');
  };

  const handleMoveGroupMember = async (groupId: string, memberIdx: number, direction: 'up' | 'down') => {
    const group = variableGroups.find((g) => g.id === groupId);
    if (!group) return;
    const memberIds = [...(group.members || group.variableIds || [])];
    const targetIdx = direction === 'up' ? memberIdx - 1 : memberIdx + 1;
    if (targetIdx < 0 || targetIdx >= memberIds.length) return;
    const temp = memberIds[memberIdx];
    memberIds[memberIdx] = memberIds[targetIdx];
    memberIds[targetIdx] = temp;
    const updatedGroups = variableGroups.map((g) =>
      g.id === groupId ? { ...g, members: memberIds, variableIds: memberIds } : g
    );
    setVariableGroups(updatedGroups);
    await persistPartial({ variableGroups: updatedGroups }, 'Group variable order saved.');
  };

  const handleUpdateVariableName = (varId: string, name: string) => {
    setCustomVariables((prev) => {
      const updated = prev.map((v) => (v.id === varId ? { ...v, name } : v));
      customVariablesRef.current = updated;
      return updated;
    });
    isDirtyRef.current = true;
  };

  const handleSaveVariableName = async (varId: string) => {
    const targetVar = customVariables.find((v) => v.id === varId);
    if (!targetVar || !targetVar.name.trim()) return;
    const currentJson = JSON.stringify(customVariables);
    if (currentJson === lastSavedCustomVarsRef.current) {
      return;
    }
    const ok = await persistPartial({ customVariables }, 'Variable name updated.');
    if (ok) {
      lastSavedCustomVarsRef.current = currentJson;
    }
  };

  const handleToggleGlobal = async (varId: string) => {
    const updated = customVariables.map((v) =>
      v.id === varId ? { ...v, isGlobal: !v.isGlobal } : v
    );
    setCustomVariables(updated);
    await persistPartial({ customVariables: updated }, 'Variable global setting updated.');
  };

  const handleToggleBlind = async (varId: string) => {
    const updated = customVariables.map((v) =>
      v.id === varId ? { ...v, isBlind: !v.isBlind } : v
    );
    setCustomVariables(updated);
    await persistPartial({ customVariables: updated }, 'Variable blind setting updated.');
  };

  const handleUpdateOptionLabel = (varId: string, optionIdx: number, newLabel: string) => {
    setCustomVariables((prev) => {
      const updated = prev.map((v) => {
        if (v.id !== varId) return v;
        const opts = [...(v.options || [])];
        if (opts[optionIdx]) {
          opts[optionIdx] = { ...opts[optionIdx], label: newLabel, value: newLabel };
        }
        return { ...v, options: opts };
      });
      customVariablesRef.current = updated;
      return updated;
    });
    isDirtyRef.current = true;
  };

  const handleSaveOption = async () => {
    const currentJson = JSON.stringify(customVariables);
    if (currentJson === lastSavedCustomVarsRef.current) {
      return;
    }
    const ok = await persistPartial({ customVariables }, 'Option updated.');
    if (ok) {
      lastSavedCustomVarsRef.current = currentJson;
    }
  };

  const handleAddOptionInline = (varId: string) => {
    const updated = customVariables.map((v) => {
      if (v.id !== varId) return v;
      const opts = [...(v.options || [])];
      const newIdx = opts.length + 1;
      opts.push({ label: `Option ${newIdx}`, value: `Option ${newIdx}` });
      return { ...v, options: opts };
    });
    setCustomVariables(updated);
    customVariablesRef.current = updated;
    isDirtyRef.current = true;
  };

  const handleDeleteOption = async (varId: string, optionIdx: number) => {
    const updated = customVariables.map((v) => {
      if (v.id !== varId) return v;
      const opts = (v.options || []).filter((_, idx) => idx !== optionIdx);
      return { ...v, options: opts };
    });
    setCustomVariables(updated);
    await persistPartial({ customVariables: updated }, 'Option deleted.');
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'multi':
        return 'Multi Select';
      case 'single':
        return 'Single Select';
      case 'short':
        return 'Short Text';
      case 'long':
        return 'Long Text';
      case 'number':
        return 'Number';
      case 'date':
        return 'Date';
      case 'dateTime':
        return 'Time & Date';
      default:
        return type || 'Short Text';
    }
  };

  // Contact Taxonomy
  const handleAddTaxonomy = async () => {
    if (!newTaxonomyName.trim() || !showAddTaxonomyModal) return;
    const newTax: ContactTaxonomy = {
      id: 'tax_' + Date.now(),
      name: newTaxonomyName.trim(),
      type: showAddTaxonomyModal,
    };
    if (showAddTaxonomyModal === 'relationship') {
      const updated = [...contactRelationships, newTax];
      const ok = await persistPartial({ contactRelationships: updated }, `Relationship "${newTax.name}" added.`);
      if (ok) {
        setShowAddTaxonomyModal(null);
        setNewTaxonomyName('');
      }
    } else {
      const updated = [...contactOutcomes, newTax];
      const ok = await persistPartial({ contactOutcomes: updated }, `Outcome "${newTax.name}" added.`);
      if (ok) {
        setShowAddTaxonomyModal(null);
        setNewTaxonomyName('');
      }
    }
  };

  const handleRenameTaxonomy = async (id: string, type: 'relationship' | 'outcome') => {
    if (!renameTaxonomyValue.trim()) return;
    if (type === 'relationship') {
      const updated = contactRelationships.map((r) =>
        (r.id || r.name) === id ? { ...r, name: renameTaxonomyValue.trim() } : r
      );
      const ok = await persistPartial({ contactRelationships: updated }, 'Contact relationship updated.');
      if (ok) {
        setRenamingTaxonomyId(null);
        setRenameTaxonomyValue('');
      }
    } else {
      const updated = contactOutcomes.map((o) =>
        (o.id || o.name) === id ? { ...o, name: renameTaxonomyValue.trim() } : o
      );
      const ok = await persistPartial({ contactOutcomes: updated }, 'Contact outcome updated.');
      if (ok) {
        setRenamingTaxonomyId(null);
        setRenameTaxonomyValue('');
      }
    }
  };

  const handleDeleteTaxonomy = async (id: string, type: 'relationship' | 'outcome') => {
    if (type === 'relationship') {
      const updated = contactRelationships.filter((t) => (t.id || t.name) !== id);
      const ok = await persistPartial({ contactRelationships: updated }, 'Contact relationship deleted.');
      if (ok) {
        setConfirmDeleteModal(null);
      }
    } else {
      const updated = contactOutcomes.filter((t) => (t.id || t.name) !== id);
      const ok = await persistPartial({ contactOutcomes: updated }, 'Contact outcome deleted.');
      if (ok) {
        setConfirmDeleteModal(null);
      }
    }
  };

  const renderCustomVariableCard = (
    variable: StudyCustomVariable,
    index: number,
    isInsideGroup = false,
    groupId?: string
  ) => {
    const locked = isVariableLocked(variable);
    const isOptionsOpen = expandedOptionsVarIds.has(variable.id || variable.name);

    return (
      <div key={variable.id || variable.name} className="cv-sortable-row">
        {/* Drag handle and move up/down arrow controls */}
        <div className="drag-handle-col">
          <div className="drag-handle-btn" title="Reorder">
            <GripVertical size={16} />
          </div>
          {canManageSettings && !isArchived && (
            <div className="order-actions">
              <button
                type="button"
                className="btn-move-arrow"
                disabled={index === 0}
                onClick={() => {
                  if (isInsideGroup && groupId) {
                    handleMoveGroupMember(groupId, index, 'up');
                  } else {
                    handleMoveLayoutItem(index, 'up');
                  }
                }}
                title="Move Up"
                aria-label={`Move ${variable.name} up`}
              >
                <ChevronUp size={12} />
              </button>
              <button
                type="button"
                className="btn-move-arrow"
                disabled={
                  isInsideGroup && groupId
                    ? index === (variableGroups.find((g) => g.id === groupId)?.members?.length ?? 1) - 1
                    : index === layout.length - 1
                }
                onClick={() => {
                  if (isInsideGroup && groupId) {
                    handleMoveGroupMember(groupId, index, 'down');
                  } else {
                    handleMoveLayoutItem(index, 'down');
                  }
                }}
                title="Move Down"
                aria-label={`Move ${variable.name} down`}
              >
                <ChevronDown size={12} />
              </button>
            </div>
          )}
        </div>

        {/* The Custom Variable Card */}
        <div className="cv-card custom-variable">
          {/* Top-left Assign to Group pin button with popover */}
          <div className="position-relative d-inline-block">
            <button
              type="button"
              className="cv-move-pin"
              title={variableGroups.length > 0 ? 'Assign to group' : 'Create a group first'}
              onClick={() =>
                setAssignGroupVarId(
                  assignGroupVarId === (variable.id || variable.name) ? null : (variable.id || variable.name)
                )
              }
              aria-label="Assign to group"
            >
              <FolderPlus size={13} />
            </button>
            {assignGroupVarId === (variable.id || variable.name) && (
              <div
                style={{
                  position: 'absolute',
                  top: '24px',
                  left: '10px',
                  zIndex: 100,
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '10px',
                  minWidth: '200px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                  Assign to Group:
                </div>
                {variableGroups.length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#64748b' }}>No groups created yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {variableGroups.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        style={{
                          padding: '6px 10px',
                          fontSize: '13px',
                          textAlign: 'left',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: '#1e293b',
                        }}
                        onClick={() => {
                          handleAssignVariableToGroup(variable.id!, g.id!);
                          setAssignGroupVarId(null);
                        }}
                      >
                        {g.name}
                      </button>
                    ))}
                    {isInsideGroup && (
                      <button
                        type="button"
                        style={{
                          padding: '6px 10px',
                          fontSize: '12px',
                          textAlign: 'left',
                          background: '#fee2e2',
                          border: '1px solid #fca5a5',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: '#991b1b',
                          marginTop: '4px',
                        }}
                        onClick={() => {
                          handleAssignVariableToGroup(variable.id!, '');
                          setAssignGroupVarId(null);
                        }}
                      >
                        Remove from group
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card Header: Variable Name input and Red Trash button */}
          <div className="cv-header">
            <div className="cv-title">
              <input
                type="text"
                className="custom-variable-input"
                placeholder="Enter Custom Variable Name"
                value={variable.name}
                onChange={(e) => handleUpdateVariableName(variable.id!, e.target.value)}
                onBlur={() => handleSaveVariableName(variable.id!)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveVariableName(variable.id!);
                }}
                disabled={locked || !canManageSettings || isArchived}
                aria-label={`Custom variable name for ${variable.name}`}
              />
            </div>

            <div className="cv-toolbar">
              {canManageSettings && !isArchived && (
                <button
                  type="button"
                  className="btn-trash"
                  onClick={() =>
                    setConfirmDeleteModal({
                      type: 'variable',
                      id: variable.id!,
                      name: variable.name,
                      isGlobal: variable.isGlobal,
                    })
                  }
                  disabled={locked}
                  aria-label={`Delete custom variable ${variable.name}`}
                  title={locked ? 'Unlock to delete' : 'Delete custom variable'}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Card Typebar: Type badge, Convert button, Unlock button, Checkboxes, Options toggle */}
          <div className="cv-typebar">
            <span className="badge-type">{getTypeName(variable.variableType)}</span>

            {variable.variableType === 'single' && canManageSettings && !isArchived && (
              <button
                type="button"
                className="btn-convert"
                onClick={() => handleConvertToMulti(variable.id!)}
                disabled={locked}
                title={locked ? 'Unlock variable to convert' : 'Convert single select to multi-select'}
              >
                <List size={12} /> Convert
              </button>
            )}

            {variable.isGlobal && locked && canManageSettings && !isArchived && (
              <button
                type="button"
                className="btn-unlock"
                onClick={() => setUnlockPromptVariable(variable)}
                title="Unlock to make changes across all studies"
              >
                <Lock size={12} /> Unlock
              </button>
            )}

            <label className="toggle-checkbox">
              <input
                type="checkbox"
                checked={!!variable.isGlobal}
                onChange={() => handleToggleGlobal(variable.id!)}
                disabled={locked || !canManageSettings || isArchived}
              />
              Global
            </label>

            <label className="toggle-checkbox">
              <input
                type="checkbox"
                checked={!!variable.isBlind}
                onChange={() => handleToggleBlind(variable.id!)}
                disabled={locked || !canManageSettings || isArchived}
              />
              Blind
            </label>

            {(variable.variableType === 'single' || variable.variableType === 'multi') && (
              <button
                type="button"
                className={`cv-options-toggle ${isOptionsOpen ? 'is-open' : ''}`}
                onClick={() => toggleOptions(variable.id || variable.name)}
                aria-label="Toggle options"
              >
                {isOptionsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                Options
              </button>
            )}
          </div>

          {/* Options details (Categorical Input) */}
          {(variable.variableType === 'single' || variable.variableType === 'multi') && isOptionsOpen && (
            <div className="cv-options-container">
              {variable.options && variable.options.length > 0 ? (
                variable.options.map((opt, optIdx) => (
                  <div key={opt.value || optIdx} className="option-row">
                    <input
                      type="text"
                      className="option-input"
                      value={opt.label}
                      onChange={(e) => handleUpdateOptionLabel(variable.id!, optIdx, e.target.value)}
                      onBlur={handleSaveOption}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveOption();
                      }}
                      disabled={locked || !canManageSettings || isArchived}
                      placeholder={`Option ${optIdx + 1}`}
                    />
                    {!locked && canManageSettings && !isArchived && (
                      <button
                        type="button"
                        className="btn-option-delete"
                        onClick={() => handleDeleteOption(variable.id!, optIdx)}
                        title="Delete option"
                        aria-label={`Delete option ${opt.label}`}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                  No options defined yet.
                </div>
              )}

              {!locked && canManageSettings && !isArchived && (
                <div
                  className="btn-add-item"
                  style={{ marginTop: '6px', marginBottom: 0 }}
                  onClick={() => handleAddOptionInline(variable.id!)}
                >
                  Add option
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
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
    <div className="study-requirements-page study-settings-requirements" data-testid="study-settings-requirements">
      <h3 className="settings-header">Edit Participant Requirements</h3>

      {/* ========================================================================= */}
      {/* 1. GENERAL SAMPLE REQUIREMENTS */}
      {/* ========================================================================= */}
      <div>
        <div
          className="sub-heading underlined"
          onClick={() => toggleSection('sample')}
          role="button"
          tabIndex={0}
          aria-expanded={!collapsedSections.sample}
        >
          <span>General Sample Requirements</span>
          <div className="toggle-section">
            {collapsedSections.sample ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>

        {!collapsedSections.sample && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '60px', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div className="req-field">
              <label className="field-label">Sample Size (N)</label>
              <input
                type="number"
                min="0"
                className="group-input sample-size-input"
                style={{ width: '160px' }}
                value={sampleSize}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                  setSampleSize(isNaN(val as number) ? '' : val);
                }}
                onBlur={handleBlurSampleSize}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                }}
                disabled={!canManageSettings || isArchived}
              />
            </div>

            <div style={{ flex: 1, minWidth: '320px' }}>
              <div className="field-label" style={{ marginBottom: '8px' }}>
                Milestone
              </div>
              {milestones.map((m) => (
                <div key={m.id || m.milestoneDate} className="req-row" style={{ marginBottom: '8px' }}>
                  <input
                    type="date"
                    className="date-input"
                    value={m.milestoneDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMilestones((prev) =>
                        prev.map((item) => (item.id === m.id ? { ...item, milestoneDate: val } : item))
                      );
                    }}
                    onBlur={(e) => handleUpdateMilestoneDirect(m, { milestoneDate: e.target.value })}
                    disabled={!canManageSettings || isArchived}
                  />
                  <div className="req-field">
                    <input
                      type="number"
                      min="0"
                      className="number-input"
                      style={{ width: '85px' }}
                      placeholder="Participants"
                      value={m.participantTarget || ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0;
                        setMilestones((prev) =>
                          prev.map((item) => (item.id === m.id ? { ...item, participantTarget: val } : item))
                        );
                      }}
                      onBlur={(e) =>
                        handleUpdateMilestoneDirect(m, { participantTarget: parseInt(e.target.value, 10) || 0 })
                      }
                      disabled={!canManageSettings || isArchived}
                    />
                    <label className="field-label">Participants</label>
                  </div>
                  {canManageSettings && !isArchived && m.id && (
                    <button
                      type="button"
                      className="btn-trash ms-auto"
                      title="Delete milestone"
                      onClick={() => handleDeleteMilestoneDirect(m.id!)}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}

              {canManageSettings && !isArchived && (
                <div className="btn-add-item" onClick={handleAddMilestoneInline}>
                  Add milestone
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. AGE REQUIREMENTS */}
      {/* ========================================================================= */}
      <div>
        <div
          className="sub-heading underlined"
          onClick={() => toggleSection('age')}
          role="button"
          tabIndex={0}
          aria-expanded={!collapsedSections.age}
          id="age-req-heading"
        >
          <span>Age Requirements</span>
          <div className="toggle-section">
            {collapsedSections.age ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>

        {!collapsedSections.age && (
          <div>
            {ageGroups.map((grp) => (
              <div key={grp.id} className="req-row">
                <div className="req-field">
                  <label className="field-label">Group</label>
                  <input
                    type="text"
                    className="group-input"
                    placeholder="Group"
                    value={grp.label}
                    onChange={(e) => handleUpdateGroupField(grp.id!, (g) => ({ ...g, label: e.target.value }))}
                    onBlur={handleBlurStudyGroups}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.currentTarget.blur();
                    }}
                    disabled={!canManageSettings || isArchived}
                    aria-label={`Group name for ${grp.label || 'group'}`}
                  />
                </div>

                <div className="req-field">
                  <label className="field-label">Sample Size</label>
                  <input
                    type="text"
                    className="sample-size-input"
                    placeholder="Sample Size"
                    value={grp.sampleSize}
                    onChange={(e) => handleUpdateGroupField(grp.id!, (g) => ({ ...g, sampleSize: e.target.value }))}
                    onBlur={handleBlurStudyGroups}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.currentTarget.blur();
                    }}
                    disabled={!canManageSettings || isArchived}
                    aria-label={`Sample size for ${grp.label || 'group'}`}
                  />
                </div>

                <div className="req-field">
                  <label className="field-label">Age Range</label>
                  <input
                    type="number"
                    min="0"
                    className="number-input"
                    placeholder="1"
                    value={grp.ageRange?.min ?? ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                      handleUpdateGroupField(grp.id!, (g) => ({
                        ...g,
                        ageRange: { ...g.ageRange, min: val, max: g.ageRange?.max ?? null },
                      }));
                    }}
                    onBlur={handleBlurStudyGroups}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.currentTarget.blur();
                    }}
                    disabled={!canManageSettings || isArchived}
                    aria-label={`Minimum age for ${grp.label || 'group'}`}
                  />
                  <span className="range-separator">to</span>
                  <input
                    type="number"
                    min="0"
                    className="number-input"
                    placeholder="1"
                    value={grp.ageRange?.max ?? ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                      handleUpdateGroupField(grp.id!, (g) => ({
                        ...g,
                        ageRange: { ...g.ageRange, min: g.ageRange?.min ?? null, max: val },
                      }));
                    }}
                    onBlur={handleBlurStudyGroups}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.currentTarget.blur();
                    }}
                    disabled={!canManageSettings || isArchived}
                    aria-label={`Maximum age for ${grp.label || 'group'}`}
                  />
                </div>

                {canManageSettings && !isArchived && grp.id && (
                  <div className="ms-auto" style={{ marginLeft: 'auto' }}>
                    <button
                      type="button"
                      className="btn-trash"
                      onClick={() =>
                        setConfirmDeleteModal({
                          type: 'group',
                          id: grp.id!,
                          name: `Age Group "${grp.label}"`,
                        })
                      }
                      aria-label={`Delete age group ${grp.label}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {canManageSettings && !isArchived && (
              <div className="btn-add-item marginbottom40" onClick={handleAddAgeGroup}>
                Add age group
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. SEX / GENDER REQUIREMENTS */}
      {/* ========================================================================= */}
      <div>
        <div
          className="sub-heading underlined"
          onClick={() => toggleSection('gender')}
          role="button"
          tabIndex={0}
          aria-expanded={!collapsedSections.gender}
          id="sex-gender-heading"
        >
          <span>Sex/Gender</span>
          <div className="toggle-section">
            {collapsedSections.gender ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>

        {!collapsedSections.gender && (
          <div>
            {genderGroups.map((grp) => {
              const hasAgeRange =
                expandedAgeRangeIds.has(grp.id ?? '') ||
                (grp.ageRange && (grp.ageRange.min != null || grp.ageRange.max != null));

              return (
                <div key={grp.id} className="req-row">
                  <div className="req-field">
                    <label className="field-label">Group</label>
                    <input
                      type="text"
                      className="group-input"
                      placeholder="Group"
                      value={grp.label}
                      onChange={(e) => handleUpdateGroupField(grp.id!, (g) => ({ ...g, label: e.target.value }))}
                      onBlur={handleBlurStudyGroups}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.currentTarget.blur();
                      }}
                      disabled={!canManageSettings || isArchived}
                      aria-label={`Group name for ${grp.label || 'group'}`}
                    />
                  </div>

                  <div className="req-field">
                    <label className="field-label">Sample Size</label>
                    <input
                      type="text"
                      className="sample-size-input"
                      placeholder="Sample Size"
                      value={grp.sampleSize}
                      onChange={(e) => handleUpdateGroupField(grp.id!, (g) => ({ ...g, sampleSize: e.target.value }))}
                      onBlur={handleBlurStudyGroups}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.currentTarget.blur();
                      }}
                      disabled={!canManageSettings || isArchived}
                      aria-label={`Sample size for ${grp.label || 'group'}`}
                    />
                  </div>

                  <div>
                    {!hasAgeRange ? (
                      canManageSettings && !isArchived && (
                        <div
                          className="btn-add-item"
                          style={{ marginBottom: 0 }}
                          onClick={() => grp.id && handleEnableAgeRange(grp.id)}
                        >
                          Add Age Range
                        </div>
                      )
                    ) : (
                      <div className="req-field">
                        <label className="field-label">Age Range</label>
                        <input
                          type="number"
                          min="0"
                          className="number-input"
                          placeholder="1"
                          value={grp.ageRange?.min ?? ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                            handleUpdateGroupField(grp.id!, (g) => ({
                              ...g,
                              ageRange: { ...g.ageRange, min: val, max: g.ageRange?.max ?? null },
                            }));
                          }}
                          onBlur={handleBlurStudyGroups}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.currentTarget.blur();
                          }}
                          disabled={!canManageSettings || isArchived}
                          aria-label={`Minimum age for ${grp.label || 'group'}`}
                        />
                        <span className="range-separator">to</span>
                        <input
                          type="number"
                          min="0"
                          className="number-input"
                          placeholder="1"
                          value={grp.ageRange?.max ?? ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                            handleUpdateGroupField(grp.id!, (g) => ({
                              ...g,
                              ageRange: { ...g.ageRange, min: g.ageRange?.min ?? null, max: val },
                            }));
                          }}
                          onBlur={handleBlurStudyGroups}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.currentTarget.blur();
                          }}
                          disabled={!canManageSettings || isArchived}
                          aria-label={`Maximum age for ${grp.label || 'group'}`}
                        />
                      </div>
                    )}
                  </div>

                  {canManageSettings && !isArchived && grp.id && (
                    <div className="ms-auto" style={{ marginLeft: 'auto' }}>
                      <button
                        type="button"
                        className="btn-trash"
                        onClick={() =>
                          setConfirmDeleteModal({
                            type: 'group',
                            id: grp.id!,
                            name: `Sex/Gender Group "${grp.label}"`,
                          })
                        }
                        aria-label={`Delete sex group ${grp.label}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {canManageSettings && !isArchived && (
              <div className="btn-add-item marginbottom40" onClick={handleAddGenderGroup}>
                Add gender group
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4 & 5. ETHNIC & RACIAL CATEGORIES (*US CENSUS/NIH CLASSIFICATION) */}
      {/* ========================================================================= */}
      <div>
        <div
          className="sub-heading underlined"
          onClick={() => {
            const isAllCollapsed = collapsedSections.ethnicity && collapsedSections.race;
            const nextVal = !isAllCollapsed;
            setCollapsedSections((prev) => ({ ...prev, ethnicity: nextVal, race: nextVal }));
          }}
          role="button"
          tabIndex={0}
          aria-expanded={!(collapsedSections.ethnicity && collapsedSections.race)}
          id="ethnic-racial-heading"
        >
          <span>Ethnic &amp; Racial Categories (*US Census/NIH Classification)</span>
          <div className="toggle-section">
            {collapsedSections.ethnicity && collapsedSections.race ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
          </div>
        </div>

        {!(collapsedSections.ethnicity && collapsedSections.race) && (
          <div>
            {/* Ethnicity Category Rows */}
            {ethnicityGroups.map((grp) => {
              const hasAgeRange =
                expandedAgeRangeIds.has(grp.id ?? '') ||
                (grp.ageRange && (grp.ageRange.min != null || grp.ageRange.max != null));

              return (
                <div key={grp.id} className="req-row">
                  <div className="req-field">
                    <label className="field-label">Group</label>
                    <input
                      type="text"
                      className="group-input"
                      placeholder="Group"
                      value={grp.label}
                      onChange={(e) => handleUpdateGroupField(grp.id!, (g) => ({ ...g, label: e.target.value }))}
                      onBlur={handleBlurStudyGroups}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.currentTarget.blur();
                      }}
                      disabled={!canManageSettings || isArchived}
                      aria-label={`Ethnicity Category Name for ${grp.label || 'group'}`}
                    />
                  </div>

                  <div className="req-field">
                    <label className="field-label">Sample Size</label>
                    <input
                      type="text"
                      className="sample-size-input"
                      placeholder="Sample Size"
                      value={grp.sampleSize}
                      onChange={(e) => handleUpdateGroupField(grp.id!, (g) => ({ ...g, sampleSize: e.target.value }))}
                      onBlur={handleBlurStudyGroups}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.currentTarget.blur();
                      }}
                      disabled={!canManageSettings || isArchived}
                      aria-label={`Sample target for ${grp.label || 'group'}`}
                    />
                  </div>

                  <div>
                    {!hasAgeRange ? (
                      canManageSettings && !isArchived && (
                        <div
                          className="btn-add-item"
                          style={{ marginBottom: 0 }}
                          onClick={() => grp.id && handleEnableAgeRange(grp.id)}
                        >
                          Add Age Range
                        </div>
                      )
                    ) : (
                      <div className="req-field">
                        <label className="field-label">Age Range</label>
                        <input
                          type="number"
                          min="0"
                          className="number-input"
                          placeholder="1"
                          value={grp.ageRange?.min ?? ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                            handleUpdateGroupField(grp.id!, (g) => ({
                              ...g,
                              ageRange: { ...g.ageRange, min: val, max: g.ageRange?.max ?? null },
                            }));
                          }}
                          onBlur={handleBlurStudyGroups}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.currentTarget.blur();
                          }}
                          disabled={!canManageSettings || isArchived}
                          aria-label={`Minimum age for ${grp.label || 'group'}`}
                        />
                        <span className="range-separator">to</span>
                        <input
                          type="number"
                          min="0"
                          className="number-input"
                          placeholder="1"
                          value={grp.ageRange?.max ?? ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                            handleUpdateGroupField(grp.id!, (g) => ({
                              ...g,
                              ageRange: { ...g.ageRange, min: g.ageRange?.min ?? null, max: val },
                            }));
                          }}
                          onBlur={handleBlurStudyGroups}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.currentTarget.blur();
                          }}
                          disabled={!canManageSettings || isArchived}
                          aria-label={`Maximum age for ${grp.label || 'group'}`}
                        />
                      </div>
                    )}
                  </div>

                  {/* Gender group inputs */}
                  <div>
                    {grp.genderGroups && grp.genderGroups.length > 0 ? (
                      <div className="nested-gender-list" style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px' }}>
                        {grp.genderGroups.map((gg) => (
                          <div key={gg.id || gg.gender} className="nested-gender-row" style={{ marginBottom: 0 }}>
                            <select
                              className="select-gender"
                              value={gg.gender}
                              onChange={(e) =>
                                grp.id &&
                                gg.id &&
                                handleUpdateNestedGender(grp.id, gg.id, { gender: e.target.value })
                              }
                              onBlur={handleBlurStudyGroups}
                              disabled={!canManageSettings || isArchived}
                              aria-label="Select gender"
                            >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                            <input
                              type="number"
                              min="0"
                              className="number-input"
                              placeholder="0"
                              value={gg.participants || ''}
                              onChange={(e) =>
                                grp.id &&
                                gg.id &&
                                handleUpdateNestedGender(grp.id, gg.id, {
                                  participants: parseInt(e.target.value, 10) || 0,
                                })
                              }
                              onBlur={handleBlurStudyGroups}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') e.currentTarget.blur();
                              }}
                              disabled={!canManageSettings || isArchived}
                            />
                            <span className="field-label" style={{ margin: 0 }}>Participants</span>
                            {canManageSettings && !isArchived && grp.id && gg.id && (
                              <button
                                type="button"
                                className="btn-trash"
                                style={{ width: '22px', height: '22px', padding: 0 }}
                                onClick={() => handleDeleteNestedGender(grp.id!, gg.id!)}
                                aria-label={`Delete nested gender ${gg.gender}`}
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                        ))}
                        {canManageSettings && !isArchived && grp.id && (
                          <div
                            className="btn-add-item"
                            style={{ marginBottom: 0, marginTop: '2px' }}
                            onClick={() => handleAddNestedGender(grp.id!)}
                          >
                            Add gender group
                          </div>
                        )}
                      </div>
                    ) : (
                      canManageSettings && !isArchived && grp.id && (
                        <div
                          className="btn-add-item"
                          style={{ marginBottom: 0 }}
                          onClick={() => handleAddNestedGender(grp.id!)}
                        >
                          Add gender group
                        </div>
                      )
                    )}
                  </div>

                  {canManageSettings && !isArchived && grp.id && (
                    <div className="ms-auto" style={{ marginLeft: 'auto' }}>
                      <button
                        type="button"
                        className="btn-trash"
                        onClick={() =>
                          setConfirmDeleteModal({
                            type: 'group',
                            id: grp.id!,
                            name: `Ethnicity Category "${grp.label}"`,
                          })
                        }
                        aria-label={`Delete ethnicity group ${grp.label}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {canManageSettings && !isArchived && (
              <div className="btn-add-item marginbottom40" onClick={handleAddEthnicityGroup}>
                Add ethnicity
              </div>
            )}

            {/* Sub-heading divider between Ethnicity and Race */}
            <div className="sub-heading underlined" style={{ marginTop: '20px', marginBottom: '20px' }} />

            {/* Race Category Rows */}
            {raceGroups.map((grp) => {
              const hasAgeRange =
                expandedAgeRangeIds.has(grp.id ?? '') ||
                (grp.ageRange && (grp.ageRange.min != null || grp.ageRange.max != null));

              return (
                <div key={grp.id} className="req-row">
                  <div className="req-field">
                    <label className="field-label">Group</label>
                    <input
                      type="text"
                      className="group-input"
                      placeholder="Group"
                      value={grp.label}
                      onChange={(e) => handleUpdateGroupField(grp.id!, (g) => ({ ...g, label: e.target.value }))}
                      onBlur={handleBlurStudyGroups}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.currentTarget.blur();
                      }}
                      disabled={!canManageSettings || isArchived}
                      aria-label={`Race Category Name for ${grp.label || 'group'}`}
                    />
                  </div>

                  <div className="req-field">
                    <label className="field-label">Sample Size</label>
                    <input
                      type="text"
                      className="sample-size-input"
                      placeholder="Sample Size"
                      value={grp.sampleSize}
                      onChange={(e) => handleUpdateGroupField(grp.id!, (g) => ({ ...g, sampleSize: e.target.value }))}
                      onBlur={handleBlurStudyGroups}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.currentTarget.blur();
                      }}
                      disabled={!canManageSettings || isArchived}
                      aria-label={`Sample target for ${grp.label || 'group'}`}
                    />
                  </div>

                  <div>
                    {!hasAgeRange ? (
                      canManageSettings && !isArchived && (
                        <div
                          className="btn-add-item"
                          style={{ marginBottom: 0 }}
                          onClick={() => grp.id && handleEnableAgeRange(grp.id)}
                        >
                          Add Age Range
                        </div>
                      )
                    ) : (
                      <div className="req-field">
                        <label className="field-label">Age Range</label>
                        <input
                          type="number"
                          min="0"
                          className="number-input"
                          placeholder="1"
                          value={grp.ageRange?.min ?? ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                            handleUpdateGroupField(grp.id!, (g) => ({
                              ...g,
                              ageRange: { ...g.ageRange, min: val, max: g.ageRange?.max ?? null },
                            }));
                          }}
                          onBlur={handleBlurStudyGroups}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.currentTarget.blur();
                          }}
                          disabled={!canManageSettings || isArchived}
                          aria-label={`Minimum age for ${grp.label || 'group'}`}
                        />
                        <span className="range-separator">to</span>
                        <input
                          type="number"
                          min="0"
                          className="number-input"
                          placeholder="1"
                          value={grp.ageRange?.max ?? ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                            handleUpdateGroupField(grp.id!, (g) => ({
                              ...g,
                              ageRange: { ...g.ageRange, min: g.ageRange?.min ?? null, max: val },
                            }));
                          }}
                          onBlur={handleBlurStudyGroups}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.currentTarget.blur();
                          }}
                          disabled={!canManageSettings || isArchived}
                          aria-label={`Maximum age for ${grp.label || 'group'}`}
                        />
                      </div>
                    )}
                  </div>

                  {/* Gender group inputs */}
                  <div>
                    {grp.genderGroups && grp.genderGroups.length > 0 ? (
                      <div className="nested-gender-list" style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px' }}>
                        {grp.genderGroups.map((gg) => (
                          <div key={gg.id || gg.gender} className="nested-gender-row" style={{ marginBottom: 0 }}>
                            <select
                              className="select-gender"
                              value={gg.gender}
                              onChange={(e) =>
                                grp.id &&
                                gg.id &&
                                handleUpdateNestedGender(grp.id, gg.id, { gender: e.target.value })
                              }
                              onBlur={handleBlurStudyGroups}
                              disabled={!canManageSettings || isArchived}
                              aria-label="Select gender"
                            >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                            <input
                              type="number"
                              min="0"
                              className="number-input"
                              placeholder="0"
                              value={gg.participants || ''}
                              onChange={(e) =>
                                grp.id &&
                                gg.id &&
                                handleUpdateNestedGender(grp.id, gg.id, {
                                  participants: parseInt(e.target.value, 10) || 0,
                                })
                              }
                              onBlur={handleBlurStudyGroups}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') e.currentTarget.blur();
                              }}
                              disabled={!canManageSettings || isArchived}
                            />
                            <span className="field-label" style={{ margin: 0 }}>Participants</span>
                            {canManageSettings && !isArchived && grp.id && gg.id && (
                              <button
                                type="button"
                                className="btn-trash"
                                style={{ width: '22px', height: '22px', padding: 0 }}
                                onClick={() => handleDeleteNestedGender(grp.id!, gg.id!)}
                                aria-label={`Delete nested gender ${gg.gender}`}
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                        ))}
                        {canManageSettings && !isArchived && grp.id && (
                          <div
                            className="btn-add-item"
                            style={{ marginBottom: 0, marginTop: '2px' }}
                            onClick={() => handleAddNestedGender(grp.id!)}
                          >
                            Add gender group
                          </div>
                        )}
                      </div>
                    ) : (
                      canManageSettings && !isArchived && grp.id && (
                        <div
                          className="btn-add-item"
                          style={{ marginBottom: 0 }}
                          onClick={() => handleAddNestedGender(grp.id!)}
                        >
                          Add gender group
                        </div>
                      )
                    )}
                  </div>

                  {canManageSettings && !isArchived && grp.id && (
                    <div className="ms-auto" style={{ marginLeft: 'auto' }}>
                      <button
                        type="button"
                        className="btn-trash"
                        onClick={() =>
                          setConfirmDeleteModal({
                            type: 'group',
                            id: grp.id!,
                            name: `Race Category "${grp.label}"`,
                          })
                        }
                        aria-label={`Delete race group ${grp.label}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {canManageSettings && !isArchived && (
              <div className="btn-add-item marginbottom40" onClick={handleAddRaceGroup}>
                Add race
              </div>
            )}
          </div>
        )}
      </div>

      {/* Helper function to render a custom variable card matching legacy Ripple UI */}
      {(() => null)()}

      {/* ========================================================================= */}
      {/* 6. CUSTOM PROTOCOL VARIABLES & VARIABLE GROUPS */}
      {/* ========================================================================= */}
      <div>
        <div
          className="sub-heading underlined"
          onClick={() => toggleSection('customVars')}
          role="button"
          tabIndex={0}
          aria-expanded={!collapsedSections.customVars}
          id="heading-custom-vars"
        >
          <span>Custom Variables</span>
          <div className="toggle-section">
            {collapsedSections.customVars ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>

        {!collapsedSections.customVars && (
          <div>
            {/* Top Action & Search Bar */}
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
              <div className="search-input-container">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    style={{ width: '240px', borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                    placeholder="Search by name..."
                    value={variableSearch}
                    onChange={(e) => setVariableSearch(e.target.value)}
                    aria-label="Filter custom variables"
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    style={{
                      backgroundColor: '#1f5fd0',
                      borderColor: '#1f5fd0',
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                    }}
                    title="Search"
                  >
                    <Search size={14} />
                  </button>
                </div>
              </div>

              {canManageSettings && !isArchived && (
                <div>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    style={{
                      backgroundColor: '#1f5fd0',
                      borderColor: '#1f5fd0',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                    onClick={() => setShowAddGroupModal(true)}
                  >
                    <FolderPlus size={14} /> New Group
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
                      getGroupVariableIds(group).includes(v.id || '')
                    );

                    return (
                      <div key={item.id || group.id} className="cv-sortable-row">
                        <div className="drag-handle-col">
                          <div className="drag-handle-btn" title="Reorder">
                            <GripVertical size={16} />
                          </div>
                          {canManageSettings && !isArchived && (
                            <div className="order-actions">
                              <button
                                type="button"
                                className="btn-move-arrow"
                                disabled={index === 0}
                                onClick={() => handleMoveLayoutItem(index, 'up')}
                                title="Move Group Up"
                                aria-label={`Move group ${group.name} up`}
                              >
                                <ChevronUp size={12} />
                              </button>
                              <button
                                type="button"
                                className="btn-move-arrow"
                                disabled={index === layout.length - 1}
                                onClick={() => handleMoveLayoutItem(index, 'down')}
                                title="Move Group Down"
                                aria-label={`Move group ${group.name} down`}
                              >
                                <ChevronDown size={12} />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="variable-group-block">
                          <div className="variable-group-header">
                            <ChevronDown size={14} />
                            {renamingGroupId === group.id ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <input
                                  type="text"
                                  className="group-name-input"
                                  value={renameGroupValue}
                                  onChange={(e) => setRenameGroupValue(e.target.value)}
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary"
                                  style={{ padding: '2px 8px', fontSize: '12px' }}
                                  onClick={() => handleRenameGroup(group.id!)}
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-light"
                                  style={{ padding: '2px 8px', fontSize: '12px' }}
                                  onClick={() => setRenamingGroupId(null)}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <span>{group.name}</span>
                            )}

                            <span className="group-count-badge">
                              {groupVars.length} {groupVars.length === 1 ? 'variable' : 'variables'}
                            </span>

                            {canManageSettings && !isArchived && (
                              <div className="group-actions">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-light"
                                  style={{ padding: '2px 8px', fontSize: '12px', border: '1px solid #cbd5e1' }}
                                  onClick={() => {
                                    setRenamingGroupId(group.id!);
                                    setRenameGroupValue(group.name);
                                  }}
                                  title="Rename Group"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button
                                  type="button"
                                  className="btn-trash"
                                  style={{ width: '24px', height: '24px', padding: 0 }}
                                  onClick={() =>
                                    setConfirmDeleteModal({
                                      type: 'variableGroup',
                                      id: group.id!,
                                      name: `Variable Group "${group.name}"`,
                                    })
                                  }
                                  title="Delete Group"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Member variables of this group */}
                          <div className="variable-group-items">
                            {groupVars.length === 0 ? (
                              <p style={{ margin: '8px 0', fontSize: '13px', color: '#64748b' }}>
                                No variables in this group yet. Use the pin button on variables to assign them.
                              </p>
                            ) : (
                              groupVars.map((v, vIdx) =>
                                renderCustomVariableCard(v, vIdx, true, group.id)
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Ungrouped Variable
                  const variable = filteredVariables.find((v) => v.id === item.refId);
                  if (!variable) return null;

                  // Check if variable is already assigned into any group
                  const isAssignedToAnyGroup = variableGroups.some((vg) =>
                    getGroupVariableIds(vg).includes(variable.id || '')
                  );
                  if (isAssignedToAnyGroup) return null;

                  return renderCustomVariableCard(variable, index, false);
                })}
              </div>
            )}

            {/* Bottom Actions: Create a New Custom Variable & Add an Existing Global Variable */}
            {canManageSettings && !isArchived && (
              <div className="d-flex align-items-center gap-3 mt-3 mb-4">
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{
                    backgroundColor: '#1f5fd0',
                    borderColor: '#1f5fd0',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 500,
                  }}
                  onClick={() => setShowAddCustomVarModal(true)}
                >
                  <Plus size={14} /> Create a New Custom Variable
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{
                    backgroundColor: '#1f5fd0',
                    borderColor: '#1f5fd0',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 500,
                  }}
                  onClick={() => setShowAddGlobalVarModal(true)}
                >
                  <Plus size={14} /> Add an Existing Global Variable
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 7. CONTACT RELATIONSHIPS */}
      {/* ========================================================================= */}
      <div>
        <div
          className="sub-heading underlined"
          onClick={() => toggleSection('relationships')}
          role="button"
          tabIndex={0}
          aria-expanded={!collapsedSections.relationships}
          id="heading-contact-rel"
        >
          <span>Contact Relationships</span>
          <div className="toggle-section">
            {collapsedSections.relationships ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>

        {!collapsedSections.relationships && (
          <div>
            {contactRelationships.map((r) => {
              const itemId = r.id || r.name;
              return (
                <div key={itemId} className="req-row">
                  <div className="req-field">
                    <label className="field-label">Relationship</label>
                    <input
                      type="text"
                      className="group-input"
                      value={r.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setContactRelationships((prev) =>
                          prev.map((item) => ((item.id || item.name) === itemId ? { ...item, name: val } : item))
                        );
                      }}
                      onBlur={() => {
                        const current = contactRelationships.find((item) => (item.id || item.name) === itemId);
                        if (current && current.name !== r.name) {
                          handleRenameTaxonomy(itemId, 'relationship');
                        }
                      }}
                      disabled={!canManageSettings || isArchived}
                      aria-label={`Relationship name for ${r.name}`}
                    />
                  </div>
                  {canManageSettings && !isArchived && r.name !== 'Other' && (
                    <div className="ms-auto" style={{ marginLeft: 'auto' }}>
                      <button
                        type="button"
                        className="btn-trash"
                        onClick={() =>
                          setConfirmDeleteModal({
                            type: 'taxonomy',
                            id: itemId,
                            name: `Relationship "${r.name}"`,
                          })
                        }
                        aria-label={`Delete relationship ${r.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {canManageSettings && !isArchived && (
              <div
                className="btn-add-item marginbottom40"
                onClick={() => setShowAddTaxonomyModal('relationship')}
              >
                Add relationship
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 8. CONTACT OUTCOMES */}
      {/* ========================================================================= */}
      <div>
        <div
          className="sub-heading underlined"
          onClick={() => toggleSection('outcomes')}
          role="button"
          tabIndex={0}
          aria-expanded={!collapsedSections.outcomes}
          id="heading-contact-outcomes"
        >
          <span>Contact Outcomes</span>
          <div className="toggle-section">
            {collapsedSections.outcomes ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>

        {!collapsedSections.outcomes && (
          <div>
            {contactOutcomes.map((o) => {
              const itemId = o.id || o.name;
              return (
                <div key={itemId} className="req-row">
                  <div className="req-field">
                    <label className="field-label">Outcome</label>
                    <input
                      type="text"
                      className="group-input"
                      value={o.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setContactOutcomes((prev) =>
                          prev.map((item) => ((item.id || item.name) === itemId ? { ...item, name: val } : item))
                        );
                      }}
                      onBlur={() => {
                        const current = contactOutcomes.find((item) => (item.id || item.name) === itemId);
                        if (current && current.name !== o.name) {
                          handleRenameTaxonomy(itemId, 'outcome');
                        }
                      }}
                      disabled={!canManageSettings || isArchived}
                      aria-label={`Outcome name for ${o.name}`}
                    />
                  </div>
                  {canManageSettings && !isArchived && o.name !== 'Other' && (
                    <div className="ms-auto" style={{ marginLeft: 'auto' }}>
                      <button
                        type="button"
                        className="btn-trash"
                        onClick={() =>
                          setConfirmDeleteModal({
                            type: 'taxonomy',
                            id: itemId,
                            name: `Outcome "${o.name}"`,
                          })
                        }
                        aria-label={`Delete outcome ${o.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {canManageSettings && !isArchived && (
              <div
                className="btn-add-item marginbottom40"
                onClick={() => setShowAddTaxonomyModal('outcome')}
              >
                Add outcome
              </div>
            )}
          </div>
        )}
      </div>

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

      {/* Edit Milestone Modal */}
      {editingMilestone && (
        <div className="study-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-edit-milestone-title">
          <div className="study-modal study-modal--sm">
            <div className="study-modal__header">
              <h3 id="modal-edit-milestone-title">Edit Recruitment Milestone</h3>
              <button
                type="button"
                className="study-modal__close"
                onClick={() => setEditingMilestone(null)}
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
                  value={editMilestoneDate}
                  onChange={(e) => setEditMilestoneDate(e.target.value)}
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
                  value={editMilestoneTarget}
                  onChange={(e) => setEditMilestoneTarget(e.target.value)}
                  required
                />
              </div>
              <div className="study-form-group">
                <label className="study-form-label">Description (Optional)</label>
                <input
                  type="text"
                  className="study-form-input"
                  placeholder="e.g. Phase 1 Cohort Enrollment Target"
                  value={editMilestoneDesc}
                  onChange={(e) => setEditMilestoneDesc(e.target.value)}
                />
              </div>
            </div>
            <div className="study-modal__footer">
              <button
                type="button"
                className="study-settings-btn study-settings-btn--outline-secondary"
                onClick={() => setEditingMilestone(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="study-settings-btn study-settings-btn--primary"
                onClick={handleSaveEditedMilestone}
                disabled={!editMilestoneDate || !editMilestoneTarget}
              >
                Save Milestone
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
