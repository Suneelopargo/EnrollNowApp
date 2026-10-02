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

// Re-export ES module implementation in CommonJS format
const esmModule = require('./administrator-ui.js');

module.exports = {
  AdministratorContext: esmModule.AdministratorContext || AdministratorContext,
  useAdministrator: esmModule.useAdministrator || useAdministrator,
  AdministratorProvider: esmModule.AdministratorProvider || AdministratorProvider,
  Administrator: esmModule.Administrator || esmModule.default,
  default: esmModule.Administrator || esmModule.default,
};
