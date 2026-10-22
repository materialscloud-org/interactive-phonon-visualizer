import { HashModal } from "mc-react-library";

// Opened via a link to `#terms`, as in seekpath-web.
const TermsModal = () => (
  <HashModal hash="terms" title="Terms of service">
    <div>
      <p>
        Please read these Terms of Service ("Terms", "Terms of Service")
        carefully before using the Interactive phonon visualizer website (the
        "Service"). Your access to and use of the Service is conditioned on your
        acceptance of and compliance with these Terms. These Terms apply to all
        visitors, users and others who access or use the Service. By accessing
        or using the Service you agree to be bound by these Terms. If you
        disagree with any part of the terms then you may not access the Service.
      </p>

      <strong>Use of uploaded data</strong>
      <p>
        By using the Service, you agree that any data or files you decide to
        upload to the service may be stored anonymously for debugging purposes,
        statistical purposes and to improve the quality of the Service.
      </p>

      <strong>Termination</strong>
      <p>
        We may terminate or suspend access to our Service immediately, without
        prior notice or liability, for any reason whatsoever.
      </p>

      <strong>Links To Other Web Sites</strong>
      <p>
        Our Service may contain links to third­-party web sites or services that
        are not owned or controlled by us. We have no control over, and assumes
        no responsibility for, the content, privacy policies, or practices of
        any third party web sites or services. You further acknowledge and agree
        that we shall not be responsible or liable, directly or indirectly, for
        any damage or loss caused or alleged to be caused by or in connection
        with use of or reliance on any such content, goods or services available
        on or through any such web sites or services. We strongly advise you to
        read the terms and conditions and privacy policies of any third-­party
        web sites or services that you visit.
      </p>

      <strong>Changes</strong>
      <p>
        We reserve the right, at our sole discretion, to modify or replace these
        Terms at any time. By continuing to access or use our Service after
        those revisions become effective, you agree to be bound by the revised
        terms. If you do not agree to the new terms, please stop using the
        Service.
      </p>

      <strong>Contact Us</strong>
      <p>If you have any questions about these Terms, please contact us.</p>
    </div>
  </HashModal>
);

export default TermsModal;
