import { HTMLAttributes } from "react";

import "./Card.css";

type DivProps = HTMLAttributes<HTMLDivElement>;

const join = (...classes: (string | undefined)[]) =>
  classes.filter(Boolean).join(" ");

const Card = ({ className, ...rest }: DivProps) => (
  <div className={join("pv-card", className)} {...rest} />
);

Card.Header = ({ className, ...rest }: DivProps) => (
  <div className={join("pv-card-header", className)} {...rest} />
);

Card.Body = ({ className, ...rest }: DivProps) => (
  <div className={join("pv-card-body", className)} {...rest} />
);

export default Card;
