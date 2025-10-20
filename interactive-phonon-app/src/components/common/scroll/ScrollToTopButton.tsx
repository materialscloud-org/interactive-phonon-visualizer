import { useState, useEffect } from "react";

import "./ScrollToTopButton.scss";

const ScrollToTopButton = ({ threshold = 200 }: { threshold?: number }) => {
  const [showScroll, setShowScroll] = useState(false);

  useEffect(() => {
    const checkScrollTop = () => {
      if (!showScroll && window.scrollY > threshold) {
        setShowScroll(true);
      } else if (showScroll && window.scrollY <= threshold) {
        setShowScroll(false);
      }
    };
    window.addEventListener("scroll", checkScrollTop);
    return () => window.removeEventListener("scroll", checkScrollTop);
  }, [showScroll, threshold]);

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    showScroll && (
      <div className="scroll-top">
        <button className="btn btn-primary" onClick={scrollTop}>
          <i className="bi bi-arrow-up" />
        </button>
      </div>
    )
  );
};

export default ScrollToTopButton;
