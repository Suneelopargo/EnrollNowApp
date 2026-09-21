export interface NavigationLink {
  id: number;
  moduleId: number;
  linkCode: string;
  title: string;
  path: string;
  icon?: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  canView?: boolean;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canExport?: boolean;
}

export interface NavigationModule {
  id: number;
  moduleCode: string;
  title: string;
  shortTitle?: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
  links: NavigationLink[];
}
