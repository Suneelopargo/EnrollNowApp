import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
} from '@mui/material';
import {
  LayoutDashboard,
  Shield,
  BookOpen,
  Users,
  Database,
  ClipboardList,
  BarChart2,
  Settings,
} from 'lucide-react';

const DRAWER_WIDTH = 260;

interface NavItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  role?: string;
}

const navItems: NavItem[] = [
  {
    title: 'Overview',
    path: '/dashboard',
    icon: <LayoutDashboard size={20} />,
  },
  {
    title: 'Administration',
    path: '/admin',
    icon: <Shield size={20} />,
    adminOnly: true,
  },
  {
    title: 'Studies (Step 2)',
    path: '/studies',
    icon: <BookOpen size={20} />,
    role: 'ROLE_STUDY_USER',
  },
  {
    title: 'Participants (Step 3)',
    path: '/participants',
    icon: <Users size={20} />,
    role: 'ROLE_STUDY_USER',
  },
  {
    title: 'Registry (Step 4)',
    path: '/registry',
    icon: <Database size={20} />,
    role: 'ROLE_REGISTRY_USER',
  },
  {
    title: 'Surveys (Step 5)',
    path: '/surveys',
    icon: <ClipboardList size={20} />,
    role: 'ROLE_STUDY_USER',
  },
  {
    title: 'Analytics & Reports',
    path: '/reports',
    icon: <BarChart2 size={20} />,
    role: 'ROLE_STUDY_USER',
  },
];

export const AppSidebar: React.FC = () => {
  const { isAdmin, hasRole } = useAuth();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          backgroundColor: '#0f172a',
          color: '#e2e8f0',
          borderRight: 'none',
        },
      }}
    >
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1,
            backgroundColor: '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
          }}
        >
          EN
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff', letterSpacing: 0.5 }}>
          EnrollNow
        </Typography>
      </Box>

      <Divider sx={{ borderColor: '#334155' }} />

      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
          Navigation
        </Typography>
      </Box>

      <List sx={{ px: 1 }}>
        {navItems.map((item) => {
          if (item.adminOnly && !isAdmin) return null;
          if (item.role && !hasRole(item.role) && !isAdmin) return null;

          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={NavLink}
                to={item.path}
                sx={{
                  borderRadius: 1.5,
                  py: 1.2,
                  px: 2,
                  color: '#94a3b8',
                  '&.active': {
                    backgroundColor: '#1e293b',
                    color: '#38bdf8',
                    fontWeight: 600,
                    '& .MuiListItemIcon-root': {
                      color: '#38bdf8',
                    },
                  },
                  '&:hover': {
                    backgroundColor: '#1e293b',
                    color: '#f8fafc',
                  },
                }}
              >
                <ListItemIcon sx={{ color: '#94a3b8', minWidth: 36 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.title}
                  primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
};
