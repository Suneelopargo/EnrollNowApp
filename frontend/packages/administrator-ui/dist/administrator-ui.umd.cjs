const React = require('react');

const AdministratorContext = React.createContext(null);

const useAdministrator = () => {
  const ctx = React.useContext(AdministratorContext);
  if (!ctx) {
    throw new Error('useAdministrator must be used within an AdministratorProvider');
  }
  return ctx;
};

const AdministratorProvider = ({ api, auth, config = {}, children }) => {
  return React.createElement(
    AdministratorContext.Provider,
    { value: { api, auth, config } },
    children
  );
};

const Administrator = ({ initialTab = 0 }) => {
  return React.createElement('div', { className: 'admin-console-wrapper' }, 'EnrollNow Administration Console');
};

module.exports = {
  Administrator,
  AdministratorProvider,
  useAdministrator,
};
