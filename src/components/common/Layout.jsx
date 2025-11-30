import PropTypes from 'prop-types';
import React from 'react';

import Footer from './Footer.jsx';
import Header from './Header.jsx';
import styles from './Layout.module.css';

/**
 * Main application layout component that includes header, main content area, and footer
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render in the main content area
 */
const Layout = ({ children }) => {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>{children}</main>
      <Footer />
    </div>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired
};

export default Layout;
