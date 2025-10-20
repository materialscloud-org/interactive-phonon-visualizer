const AcknowledgePanel = () => {
  return (
    <>
      <p>
        This tool is based on the{" "}
        <a
          href="https://henriquemiranda.github.io/phononwebsite/"
          target="_blank"
        >
          phonon visualizer
        </a>{" "}
        by Henrique Miranda.
      </p>
      <p>
        You can find a full list of contributors in the{" "}
        <a href="https://github.com/materialscloud-org/tools-phonon-dispersion">
          README of the GitHub repository
        </a>
        .
      </p>

      <p>
        We acknowledge financial support by the{" "}
        <a href="http://nccr-marvel.ch/" target="_blank">
          MARVEL NCCR
        </a>
        , the{" "}
        <a href="http://www.max-centre.eu/" target="_blank">
          H2020 MaX Centre of Excellence
        </a>{" "}
        and the{" "}
        <a
          href="https://www.materialscloud.org/swissuniversities"
          target="_blank"
        >
          swissuniversities P-5 project "Materials Cloud"
        </a>{" "}
        for the implementation of this tool.
      </p>
    </>
  );
};

export default AcknowledgePanel;
