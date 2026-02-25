import React from "react";
import { Card } from "react-bootstrap";

import { DoiBadge } from "mc-react-library";

import HeaderProps from "./Header.models";
import styles from "./Header.module.scss";

const Header: React.FC<HeaderProps> = ({ title, subtitle, doi_ids, logo }) => (
  <Card id={styles.headerCard}>
    <Card.Body id={styles.headerCardBody}>
      <div id={styles.titleAndLogo}>
        <div id={styles.titleAndDoi}>
          <h1 id={styles.title}>{title}</h1>
          <div id={styles.subtitle}>{subtitle}</div>
          <div id={styles.doiContainer}>
            {doi_ids.map((doi_id: string) => (
              <DoiBadge doi_id={doi_id} key={doi_id} />
            ))}
          </div>
        </div>
        <img id={styles.logo} src={logo} alt="IPV logo" />
      </div>
    </Card.Body>
  </Card>
);

export default Header;
